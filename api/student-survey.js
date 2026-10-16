import { put } from '@vercel/blob';
import { randomUUID } from 'node:crypto';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WINDOW_MS = 60_000;
const attempts = new Map();

// Instance-local defence in depth, not a distributed quota. A platform-level
// rate limit should be configured before opening signup to paid traffic.
export function createSurveyHandler({ save = put, now = Date.now, limits = attempts } = {}) {
  return async function handler(request, response) {
    response.setHeader('Cache-Control', 'no-store');
    if (request.method !== 'POST') {
      response.setHeader('Allow', 'POST');
      return response.status(405).json({ error: 'Method not allowed.' });
    }
    if (!String(request.headers['content-type'] || '').toLowerCase().startsWith('application/json')) {
      return response.status(415).json({ error: 'Send your signup as JSON.' });
    }
    if (!request.body || typeof request.body !== 'object' || Array.isArray(request.body)) {
      return response.status(400).json({ error: 'Enter a valid signup.' });
    }
    const time = now();
    // Expire unused buckets and bound memory on warm serverless instances.
    for (const [key, times] of limits) {
      if (time - times[times.length - 1] >= WINDOW_MS) limits.delete(key);
    }
    const ip = String(request.headers['x-forwarded-for'] || request.socket?.remoteAddress || 'unknown').split(',')[0].trim();
    const recent = (limits.get(ip) || []).filter(t => time - t < WINDOW_MS);
    if (recent.length >= 5) {
      response.setHeader('Retry-After', '60');
      return response.status(429).json({ error: 'Too many attempts. Please wait a minute and try again.' });
    }
    if (limits.size >= 10_000 && !limits.has(ip)) limits.delete(limits.keys().next().value);
    recent.push(time);
    limits.set(ip, recent);
    const fields=["institution","course","equipment","findingChallenge","buyingChallenge"];
    const data=request.body;
    if(data.surveyConsent!==true||fields.some(k=>typeof data[k]!=="string"||!data[k].trim()||data[k].length>(k==="institution"?180:k==="course"?120:1000))||(data.course==="Other"&&(typeof data.otherCourse!=="string"||!data.otherCourse.trim()||data.otherCourse.length>120))){
      return response.status(400).json({error:"Complete all five answers and confirm your consent."});
    }
    const record=Object.fromEntries(fields.map(k=>[k,data[k].trim()]));
    if(data.course==="Other")record.otherCourse=data.otherCourse.trim();
    record.consentedAt=new Date(time).toISOString();record.consentVersion="2026-10-16";
    try{await save(`student-surveys/${randomUUID()}.json`,JSON.stringify(record),{access:"private",addRandomSuffix:false,allowOverwrite:false,contentType:"application/json"});return response.status(200).json({ok:true});}
    catch{console.error("Student survey persistence failed");return response.status(503).json({error:"We couldn’t save your response. Please try again shortly."});}
  };
}
export default createSurveyHandler();
