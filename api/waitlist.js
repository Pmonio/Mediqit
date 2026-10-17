import { put, head } from '@vercel/blob';
import { createHash } from 'node:crypto';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WINDOW_MS = 60_000;
const attempts = new Map();

export async function syncBrevoContact(record, {
  apiKey = process.env.BREVO_API_KEY,
  listId = process.env.BREVO_WAITLIST_LIST_ID,
  request = fetch,
} = {}) {
  if (!apiKey || !listId || !/^\d+$/.test(String(listId))) {
    throw new Error('Brevo waitlist integration is not configured.');
  }
  const result = await request('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: { 'api-key': apiKey, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      email: record.email,
      listIds: [Number(listId)],
      updateEnabled: true,
    }),
    signal: AbortSignal.timeout(8_000),
  });
  if (!result.ok) throw new Error(`Brevo contact sync failed (${result.status}).`);
}

// Instance-local defence in depth, not a distributed quota. A platform-level
// rate limit should be configured before opening signup to paid traffic.
export function createWaitlistHandler({ save = put, lookup = head, syncContact = syncBrevoContact, now = Date.now, limits = attempts } = {}) {
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
    const { email, launchConsent, updatesConsent = false, studentInterest = false, company = '' } = request.body;
    if (company) return response.status(200).json({ ok: true });
    if (typeof email !== 'string' || email.length > 254 || !emailPattern.test(email.trim())) {
      return response.status(400).json({ error: 'Enter a valid email address.' });
    }
    if (launchConsent !== true || typeof updatesConsent !== 'boolean' || typeof studentInterest !== 'boolean') {
      return response.status(400).json({ error: 'Please confirm your email preferences.' });
    }
    const normalized = email.trim().toLowerCase();
    const id = createHash('sha256').update(normalized).digest('hex');
    const record = { email: normalized, launchConsent: true, updatesConsent, studentInterest,
      consentedAt: new Date(time).toISOString(), consentVersion: '2026-10-12' };
    const options = { access: 'private', addRandomSuffix: false, contentType: 'application/json' };
    // Create once at a normalized email key. Storage rejects simultaneous duplicates.
    const pathname = `waitlist/${id}.json`;
    try {
      // Sync first so an unavailable email provider cannot leave a successful
      // signup stranded only in storage. Brevo's updateEnabled makes retries safe.
      await syncContact(record);
      await save(pathname, JSON.stringify(record), { ...options, allowOverwrite: false });
      return response.status(200).json({ ok: true, status: 'joined' });
    } catch (error) {
      // An existing record proves this address is already subscribed. Never overwrite it.
      try {
        await lookup(pathname);
        return response.status(409).json({ ok: false, status: 'already_joined', message: 'You have already joined the launch list. Stay tuned for more information.' });
      } catch {
        console.error('Waitlist signup failed', error instanceof Error ? error.message : 'unknown error');
        return response.status(503).json({ error: 'We couldn’t save your signup. Please try again shortly.' });
      }
    }
  };
}
export default createWaitlistHandler();
