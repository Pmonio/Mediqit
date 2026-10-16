import assert from 'node:assert/strict';
import {createResponsesHandler} from '../api/admin-responses.js';
const response=()=>({headers:{},setHeader(k,v){this.headers[k]=v},status(n){this.code=n;return this},json(body){this.body=body;return this}});
let reads=0;
const handler=createResponsesHandler({secret:()=> 'test-only-secret',enumerate:async({prefix,limit,cursor})=>{assert.equal(prefix,'waitlist/');assert.equal(limit,50);return {blobs:[{pathname:'waitlist/abc.json'}],hasMore:true,cursor:'next'};},read:async(path,opts)=>{reads++;assert.equal(path,'waitlist/abc.json');assert.equal(opts.access,'private');return {statusCode:200,stream:new Response(JSON.stringify({email:'test@example.test',launchConsent:true,secretField:'must not leak'})).body};}});
async function send(headers={},query={kind:'waitlist'},method='GET',h=handler){const r=response();await h({method,headers,query},r);return r;}
assert.equal((await send()).code,401);assert.equal((await send({authorization:'Bearer wrong'})).code,401);assert.equal(reads,0);
const authorization='Bearer test-only-secret';
assert.equal((await send({authorization},{kind:'../other'})).code,400);
assert.equal((await send({authorization},{kind:'waitlist',cursor:['bad']})).code,400);
assert.equal((await send({authorization},{kind:'waitlist'},'POST')).code,405);
const result=await send({authorization});assert.equal(result.code,200);assert.equal(result.headers['Cache-Control'],'private, no-store, max-age=0');assert.deepEqual(result.body,{rows:[{id:'abc',email:'test@example.test',launchConsent:true}],hasMore:true,cursor:'next'});
const failure=createResponsesHandler({secret:()=> 'test-only-secret',enumerate:async()=>{throw Error('do not expose secret')}});assert.equal((await send({authorization},{kind:'waitlist'},'GET',failure)).code,503);
console.log('PASS: unauthorised requests never read storage; scope validation, private reads, pagination, field allowlist and storage errors.');
