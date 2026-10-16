const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const wait=async condition=>{for(let i=0;i<100;i++){if(condition())return;await new Promise(r=>setTimeout(r,5));}throw Error('UI did not settle');};
test('response interface, filtering, safe detail rendering, complete CSV and failure handling',async()=>{
 const dom=new JSDOM(read('secure/responses.html'),{runScripts:'outside-only',url:'https://admin.mediqit.com/responses'});const w=dom.window,d=w.document;
 const fixtures={waitlist:[{email:'owner@example.org',studentInterest:true,updatesConsent:false,launchConsent:true,consentedAt:'2026-10-16T10:00:00Z'},{email:'check@example.test',studentInterest:false}],students:[{institution:'University A',course:'Other',otherCourse:'Radiography',equipment:['Stethoscope','Other'],equipmentOther:'<img src=x onerror=alert(1)>',findingChallenge:['None'],buyingChallenge:['Prices are too high','Other'],buyingChallengeOther:'=HYPERLINK("example")',consentedAt:'2026-10-16T11:00:00Z'},{institution:'University B',course:'Physiology',equipment:'Legacy equipment answer',findingChallenge:'Legacy challenge',buyingChallenge:'Legacy buying'}]};
 let fail=false,exported,downloadName;
 w.fetch=async url=>({ok:!fail,status:fail?503:200,json:async()=>({rows:fixtures[new URL(url,w.location).searchParams.get('kind')],hasMore:false})});
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 w.Blob=Blob;w.URL.createObjectURL=blob=>{exported=blob;return 'blob:synthetic';};w.URL.revokeObjectURL=()=>{};w.HTMLAnchorElement.prototype.click=function(){downloadName=this.download;};
 const utils=read('public/response-utils.js').replaceAll('export ','');const script=read('public/responses.js').replace(/^import[^\n]+\n/,'');w.eval(utils+'\n'+script);
 await wait(()=>d.getElementById('waitlist-count').textContent==='1');
 assert.equal(d.getElementById('students-count').textContent,'2');assert.equal(d.querySelectorAll('#table-body tr').length,1);
 d.getElementById('include-test').click();assert.equal(d.querySelectorAll('#table-body tr').length,2);d.getElementById('include-test').click();
 d.getElementById('tab-students').click();assert.equal(d.querySelectorAll('#table-head th').length,4);assert.equal(d.querySelectorAll('#response-cards article').length,2);
 d.querySelector('#table-body .view-button').click();assert.equal(d.getElementById('detail').open,true);assert.equal(d.querySelectorAll('#detail-answers .answer').length,5);assert.ok(d.getElementById('detail-answers').textContent.includes('Other: Radiography'));assert.ok(d.getElementById('detail-answers').textContent.includes('<img src=x onerror=alert(1)>'));assert.equal(d.querySelector('#detail-answers img'),null);
 d.getElementById('close-detail').click();assert.equal(d.getElementById('detail').open,false);
 const search=d.getElementById('search');search.value='legacy';search.dispatchEvent(new w.Event('input'));assert.equal(d.querySelectorAll('#table-body tr').length,1);d.querySelector('#table-body .view-button').click();assert.ok(d.getElementById('detail-answers').textContent.includes('Legacy equipment answer'));d.getElementById('close-detail').click();
 search.value='';search.dispatchEvent(new w.Event('input'));d.getElementById('export').click();const csv=await exported.text();assert.ok(csv.includes("'=HYPERLINK"));assert.ok(csv.includes('University A'));assert.ok(csv.includes('University B'));assert.ok(downloadName.startsWith('mediqit-students-'));
 fail=true;d.getElementById('refresh').click();await wait(()=>d.getElementById('status').className==='error');assert.equal(d.querySelectorAll('#table-body tr').length,0);assert.equal(d.getElementById('export').disabled,true);assert.equal(d.getElementById('waitlist-count').textContent,'—');dom.window.close();
});
test('CSV formulas and control prefixes are neutralised',async()=>{
 const source=read('public/response-utils.js');const u=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 for(const value of ['=1+1',' \t+cmd','@SUM(A1)','-cmd','\r=cmd'])assert.ok(u.csvCell(value).startsWith('"\''));
 assert.equal(u.csvCell('a"b'),'"a""b"');assert.equal(u.csvCell('ordinary'),'"ordinary"');
});
test('staff access fails closed for signed-out, unlisted and unverified accounts',async()=>{
 let source=read('lib/staff.js').replace("import { auth, currentUser } from '@clerk/nextjs/server';",'const auth=async()=>globalThis.testSession;const currentUser=async()=>globalThis.testUser;');
 const {isStaff}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 const previous=process.env.ADMIN_EMAILS;
 try{process.env.ADMIN_EMAILS='owner@example.org';globalThis.testSession={userId:null};assert.equal(await isStaff(),false);globalThis.testSession={userId:'test'};
 for(const [email,status,allowed]of [['other@example.org','verified',false],['owner@example.org','unverified',false],['OWNER@example.org','verified',true]]){globalThis.testUser={emailAddresses:[{emailAddress:email,verification:{status}}]};assert.equal(await isStaff(),allowed);}
 process.env.ADMIN_EMAILS='';assert.equal(await isStaff(),false);
 }finally{if(previous===undefined)delete process.env.ADMIN_EMAILS;else process.env.ADMIN_EMAILS=previous;delete globalThis.testSession;delete globalThis.testUser;}
});
