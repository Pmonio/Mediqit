// Paste into Extensions > Apps Script in the Mediqit response spreadsheet.
const RESPONSE_SHEET_ID = '1tAF-UxYkuAfXL1tZY_cuJL2sql0CuWvRbyaQtmOWqGg';
function setupResponseSync() {
  const properties = PropertiesService.getScriptProperties();
  let secret = properties.getProperty('WEBHOOK_SECRET');
  if (!secret) { secret = Utilities.getUuid() + Utilities.getUuid(); properties.setProperty('WEBHOOK_SECRET', secret); }
  SpreadsheetApp.openById(RESPONSE_SHEET_ID); // Request spreadsheet authorization.
  SpreadsheetApp.getUi().alert('Keep this private. Add it as GOOGLE_SHEETS_WEBHOOK_SECRET in Vercel Production environment variables:\n\n' + secret);
}
function jsonResponse(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
function doPost(event) {
  let payload;
  try { payload = JSON.parse(event.postData.contents); } catch (_) { return jsonResponse({ok:false}); }
  const secret = PropertiesService.getScriptProperties().getProperty('WEBHOOK_SECRET');
  if (!secret || payload.secret !== secret) return jsonResponse({ok:false});
  const configs = {launch:{name:'Launch list',width:7},survey:{name:'Student survey',width:13}};
  const config = configs[payload.kind];
  if (!config || !Array.isArray(payload.row) || payload.row.length !== config.width ||
      typeof payload.row[0] !== 'string' || !/^(waitlist|student-surveys)\/[a-f0-9-]+\.json$/.test(payload.row[0]) ||
      payload.row.some(value => !['string','number','boolean'].includes(typeof value) || String(value).length > 10000)) return jsonResponse({ok:false});
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return jsonResponse({ok:false});
  try {
    const sheet = SpreadsheetApp.openById(RESPONSE_SHEET_ID).getSheetByName(config.name);
    if (!sheet || sheet.getRange(1,1).getValue() !== 'Response ID') return jsonResponse({ok:false});
    const lastRow = sheet.getLastRow();
    if (lastRow > 1 && sheet.getRange(2,1,lastRow-1,1).createTextFinder(payload.row[0]).matchEntireCell(true).useRegularExpression(false).findNext()) return jsonResponse({ok:true,duplicate:true});
    // Escape user text so spreadsheet formulas cannot execute.
    const row = payload.row.map(value => typeof value === 'string' && /^[=+@-]/.test(value) ? "'" + value : value);
    sheet.getRange(lastRow+1,1,1,row.length).setValues([row]);
    SpreadsheetApp.flush();
    return jsonResponse({ok:true});
  } catch (_) { return jsonResponse({ok:false}); }
  finally { lock.releaseLock(); }
}
