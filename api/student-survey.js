import { syncResponse } from '../lib/google-sheet-sync.js';
import { put } from '@vercel/blob';
import { randomUUID } from 'node:crypto';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WINDOW_MS = 60_000;
const attempts = new Map();

// Instance-local defence in depth, not a distributed quota. A platform-level
// rate limit should be configured before opening signup to paid traffic.
export function createSurveyHandler({ save = put, now = Date.now, limits = attempts, sync = syncResponse } = {}) {
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
    const groups = {"equipment":["Stethoscope","Manual blood-pressure set","Digital blood-pressure monitor","Thermometer","Pulse oximeter","Pen torch","Examination tools","Lab coat or scrubs","Gloves and other consumables","Complete clinical starter kit","Not sure yet","Other"],"findingChallenge":["Unsure which equipment my department requires","Difficult to find the correct brand or model","Unsure which sellers or products to trust","Not enough product specifications","Items are unavailable nearby","Difficult to compare products","None","Other"],"buyingChallenge":["Prices are too high","Delivery costs are too high","Delivery takes too long","Items are out of stock","Worried about counterfeit or poor-quality items","Unclear warranty or return terms","Cannot get all required items from one seller","None","Other"]};
    const data = request.body;
    const validText = (value, max) => typeof value === "string" && value.trim().length > 0 && value.length <= max;
    if (!validText(data.institution, 180) || !validText(data.course, 120) || data.surveyConsent !== true ||
        (data.course === "Other" && !validText(data.otherCourse, 120))) {
      return response.status(400).json({ error: "Complete your institution, course and consent." });
    }
    const record = { institution: data.institution.trim(), course: data.course.trim() };
    if (data.course === "Other") record.otherCourse = data.otherCourse.trim();
    for (const [name, allowed] of Object.entries(groups)) {
      const values = data[name];
      if (!Array.isArray(values) || !values.length || values.length > allowed.length ||
          new Set(values).size !== values.length || values.some(v => !allowed.includes(v)) ||
          (values.some(v => v === "None" || v === "Not sure yet") && values.length !== 1) ||
          (values.includes("Other") && !validText(data[name + "Other"], 500))) {
        return response.status(400).json({ error: "Choose valid answers and specify any Other selection." });
      }
      record[name] = values;
      if (values.includes("Other")) record[name + "Other"] = data[name + "Other"].trim();
    }
    record.consentedAt = new Date(time).toISOString();
    record.consentVersion = "2026-10-16-options2";
    record.surveyVersion = 2;
    const pathname = `student-surveys/${randomUUID()}.json`;
    try{await save(pathname,JSON.stringify(record),{access:"private",addRandomSuffix:false,allowOverwrite:false,contentType:"application/json"});try { const result = await sync('survey', pathname, record); if (result.status === 'failed') console.error('Google Sheets sync pending'); } catch { console.error('Google Sheets sync pending'); } return response.status(200).json({ok:true});}
    catch{console.error("Student survey persistence failed");return response.status(503).json({error:"We couldn’t save your response. Please try again shortly."});}
  };
}
export default createSurveyHandler();
