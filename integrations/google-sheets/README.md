# Google Sheets response integration

Destination: https://docs.google.com/spreadsheets/d/1tAF-UxYkuAfXL1tZY_cuJL2sql0CuWvRbyaQtmOWqGg/edit

## Activation (Google account owner)
1. Open the response spreadsheet. Choose Extensions > Apps Script.
2. Replace Code.gs with the contents of Code.gs in this folder and save.
3. Select setupResponseSync and click Run. Authorize the script to edit spreadsheets.
4. The setup dialog displays a private key. Copy it directly into the Mediqit Vercel project's Production environment variable GOOGLE_SHEETS_WEBHOOK_SECRET (Secret). Do not put this key in chat, code, a URL, the spreadsheet cells or a screenshot.
5. In Apps Script choose Deploy > New deployment > Web app. Execute as Me, access Anyone. The endpoint accepts writes only with the private key and never returns spreadsheet rows. Keep the spreadsheet itself Restricted.
6. Copy the deployed /exec URL into the Vercel Production variable GOOGLE_SHEETS_WEBHOOK_URL.
7. Merge/redeploy the integration commit. Test one launch signup and one student response, then confirm one matching row in each tab. Retry the same response ID to confirm no duplicate row.
8. Import existing responses with the backfill script in a trusted environment with BLOB_READ_WRITE_TOKEN and both Google variables configured. Run node scripts/sync-existing-to-sheets.mjs. It skips clearly marked test records and is safe to rerun. It reports counts without personal data.

## Operation
- Private Blob records remain authoritative. Save happens before Sheets sync.
- If Google is slow or unavailable, the visitor's successful signup remains successful. Logs record only a generic pending-sync message. The backfill script can recover missing rows.
- This is a secondary reporting copy. There is no automatic retry schedule yet; rerun backfill after sync failures.
- Column A is the stable response ID, used for deduplication under a Google script lock. Do not edit IDs or header names.
- Multiple selections are joined with semicolons for readability. Earlier free-text survey versions are preserved.
- Receiver escapes formula-like user text. Google Ads never receives these rows.
- Both Blob and Sheets copies must be removed when fulfilling a valid deletion request.
- The website is not connected to Sheets until the receiver is authorized/deployed, variables are saved and the integration deployment is live.
