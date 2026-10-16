const tagPattern = /^AW-\d+$/;
const labelPattern = /^[A-Za-z0-9_-]+$/;

export default function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Method not allowed.' });
  }

  const tagId = String(process.env.GOOGLE_ADS_TAG_ID || '').trim();
  const signupLabel = String(process.env.GOOGLE_ADS_SIGNUP_LABEL || '').trim();
  return response.status(200).json({
    enabled: tagPattern.test(tagId) && labelPattern.test(signupLabel),
    tagId: tagPattern.test(tagId) ? tagId : null,
    signupLabel: labelPattern.test(signupLabel) ? signupLabel : null,
  });
}
