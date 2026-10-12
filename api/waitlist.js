import { put } from '@vercel/blob';
import { createHash } from 'node:crypto';
const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const attempts=globalThis.mediqitWaitlistAttempts||(globalThis.mediqitWaitlistAttempts=new Map());
export default async function handler(request,response){
  if(request.method!=='POST')return response.status(405).json({error:'Method not allowed.'});
  const ip=String(request.headers['x-forwarded-for']||request.socket?.remoteAddress||'unknown').split(',')[0].trim();
  const now=Date.now();
  const recent=(attempts.get(ip)||[]).filter(time=>now-time<60000);
  if(recent.length>=5)return response.status(429).json({error:'Too many attempts. Please wait a minute and try again.'});
  recent.push(now);attempts.set(ip,recent);
  const {email,launchConsent,updatesConsent=false,studentInterest=false,company=''}=request.body||{};
  if(company)return response.status(200).json({ok:true});
  const normalized=String(email||'').trim().toLowerCase();
  if(!emailPattern.test(normalized)||normalized.length>254)return response.status(400).json({error:'Enter a valid email address.'});
  if(launchConsent!==true)return response.status(400).json({error:'Please confirm that we may send you launch emails.'});
  const id=createHash('sha256').update(normalized).digest('hex');
  const record={email:normalized,launchConsent:true,updatesConsent:updatesConsent===true,studentInterest:studentInterest===true,consentedAt:new Date().toISOString(),consentVersion:'2026-10-12'};
  await put(`waitlist/${id}.json`,JSON.stringify(record),{access:'private',addRandomSuffix:false,allowOverwrite:true,contentType:'application/json'});
  response.setHeader('Cache-Control','no-store');
  return response.status(200).json({ok:true});
}
