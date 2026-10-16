export const waitlistColumns=[['email','Email'],['consentedAt','Joined'],['studentInterest','Student kits'],['updatesConsent','Product updates'],['launchConsent','Launch consent']];
export const studentColumns=[['institution','Institution'],['course','Course'],['consentedAt','Submitted'],['equipment','Equipment needed'],['findingChallenge','Finding equipment'],['buyingChallenge','Buying equipment']];
export const isTest=row=>String(row.email||'').toLowerCase().endsWith('@example.test') || /^TEST ONLY\b/i.test(row.institution||'');
export function values(row,key){
  let value=row[key];
  if(key==='course' && value==='Other' && row.otherCourse)value=`Other: ${row.otherCourse}`;
  if(Array.isArray(value))return value.map(x=>x==='Other' && row[key+'Other'] ? `Other: ${row[key+'Other']}`:String(x));
  return value===undefined || value===null ? []:[String(value)];
}
// Neutralise spreadsheet formulas, including values prefixed by controls/whitespace.
export function csvCell(value){let text=String(value??'');if(/^[\s\u0000-\u001f]*[=+@-]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';}
export function toCSV(rows,kind){const keys=kind==='waitlist'?['id','email','consentedAt','launchConsent','studentInterest','updatesConsent','consentVersion']:['id','consentedAt','institution','course','otherCourse','equipment','equipmentOther','findingChallenge','findingChallengeOther','buyingChallenge','buyingChallengeOther','consentVersion','surveyVersion'];return '\uFEFF'+[keys,...rows.map(row=>keys.map(k=>Array.isArray(row[k])?row[k].join('; '):row[k]))].map(line=>line.map(csvCell).join(',')).join('\r\n');}
