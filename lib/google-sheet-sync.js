// Server-only. Never expose the receiver secret to browser code.
export async function syncResponse(kind, id, record, { env = process.env, send = fetch } = {}) {
  const url = env.GOOGLE_SHEETS_WEBHOOK_URL, secret = env.GOOGLE_SHEETS_WEBHOOK_SECRET;
  if (!url || !secret) return { status: 'not_configured' };
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url)) return { status: 'failed' };
  const list = value => Array.isArray(value) ? value.join('; ') : value || '';
  const row = kind === 'launch' ?
    [id, record.consentedAt, record.email, record.launchConsent, record.studentInterest, record.updatesConsent, record.consentVersion] :
    [id, record.consentedAt, record.institution, record.course, record.otherCourse || '', list(record.equipment), record.equipmentOther || '', list(record.findingChallenge), record.findingChallengeOther || '', list(record.buyingChallenge), record.buyingChallengeOther || '', record.consentVersion, record.surveyVersion || 1];
  if (!['launch', 'survey'].includes(kind)) return { status: 'failed' };
  try {
    const response = await send(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ secret, kind, row }), signal: AbortSignal.timeout(6000) });
    const result = await response.json();
    return { status: response.ok && result.ok === true ? 'synced' : 'failed' };
  } catch { return { status: 'failed' }; }
}
