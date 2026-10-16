import assert from 'node:assert/strict';
const { createWaitlistHandler } = await import(process.cwd()+'/api/waitlist.js');
function response(){return {headers:{},setHeader(k,v){this.headers[k]=v},status(n){this.code=n;return this},json(v){this.body=v;return this}};}
const saved=[];const handler=createWaitlistHandler({save:async(...args)=>saved.push(args),limits:new Map()});
const send=async(body,ip='1',method='POST',h=handler)=>{const r=response();await h({method,headers:{'content-type':'application/json','x-forwarded-for':ip},body},r);return r;};
const valid={email:' Person+launch@Example.com ',launchConsent:true};
assert.equal((await send(valid)).code,200);assert.equal(saved.length,2);assert.equal(JSON.parse(saved[0][1]).email,'person+launch@example.com');assert.equal(saved[0][2].access,'private');
await send({...valid,updatesConsent:true});assert.notEqual(saved[0][0],saved[2][0]);assert.equal(saved[1][0],saved[3][0]);
assert.equal((await send({...valid,launchConsent:false},'2')).code,400);
assert.equal((await send({...valid,email:'bad'},'2')).code,400);
assert.equal((await send({...valid,updatesConsent:'false'},'2')).code,400);
assert.equal((await send(valid,'3','GET')).code,405);
const before=saved.length;assert.equal((await send({...valid,company:'spam'},'4')).code,200);assert.equal(saved.length,before);
for(let i=0;i<5;i++)assert.equal((await send(valid,'5')).code,200);
const limited=await send(valid,'5');assert.equal(limited.code,429);assert.equal(limited.headers['Retry-After'],'60');
for(const failOn of [1,2]){let calls=0;const failed=createWaitlistHandler({limits:new Map(),save:async()=>{if(++calls===failOn)throw Error('PRIVATE secret');}});const r=await send(valid,'6','POST',failed);assert.equal(r.code,503);assert.equal(r.headers['Cache-Control'],'no-store');assert.ok(!JSON.stringify(r.body).includes('PRIVATE'));}
console.log('PASS: plus emails, validation, consent history, private storage, dedupe summary, honeypot, rate limit, save failures.');
