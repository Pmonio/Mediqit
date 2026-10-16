import { list, get } from '@vercel/blob';
import { syncResponse } from '../lib/google-sheet-sync.js';
if (!process.env.GOOGLE_SHEETS_WEBHOOK_URL || !process.env.GOOGLE_SHEETS_WEBHOOK_SECRET || !process.env.BLOB_READ_WRITE_TOKEN) throw Error('Set server-only Google Sheets and Blob environment variables before running.');
let synced=0,failed=0,excludedTests=0;
for (const [prefix, kind] of [['waitlist/','launch'],['student-surveys/','survey']]) {
  let cursor;
  do {
    const page=await list({prefix,cursor,limit:100});
    for (const blob of page.blobs) {
      const value=await get(blob.url,{access:'private',useCache:false});
      if (!value?.stream) { failed++; continue; }
      const record=await new Response(value.stream).json();
      if (String(record.institution||'').startsWith('TEST ONLY') || String(record.email||'').endsWith('@example.test')) {excludedTests++;continue;}
      const result=await syncResponse(kind,blob.pathname,record);
      if(result.status==='synced')synced++;else failed++;
    }
    cursor=page.hasMore?page.cursor:undefined;
  } while(cursor);
}
console.log(JSON.stringify({synced,failed,excludedTests}));
if(failed)process.exitCode=1;
