import { isStaff } from '../../lib/staff';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(){
  if(!await isStaff())return new Response('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Access restricted · Mediqit</title><link rel="stylesheet" href="/responses.css"></head><body><main><img src="/assets/mediqit-wordmark-small.webp" width="174" height="58" alt="Mediqit"><h1>Access is restricted</h1><p>This account does not have permission to view Mediqit responses.</p><p><a href="/sign-out">Sign out and use your authorised account →</a></p></main></body></html>',{status:403,headers:{'Cache-Control':'private, no-store','Content-Type':'text/html; charset=utf-8','X-Robots-Tag':'noindex,nofollow','X-Frame-Options':'DENY','Content-Security-Policy':"default-src 'self'; style-src 'self'; img-src 'self'; frame-ancestors 'none'; base-uri 'self'"}});
  const html=await readFile(path.join(process.cwd(),'secure','responses.html'),'utf8');
  return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'private, no-store, max-age=0','X-Robots-Tag':'noindex, nofollow','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"}});
}
