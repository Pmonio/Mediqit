import { list, get } from '@vercel/blob';
import { timingSafeEqual } from 'node:crypto';

const fields = {
  waitlist: ['email','launchConsent','updatesConsent','studentInterest','consentedAt','consentVersion'],
  students: ['institution','course','otherCourse','equipment','equipmentOther','findingChallenge','findingChallengeOther','buyingChallenge','buyingChallengeOther','consentedAt','consentVersion','surveyVersion']
};
export function createResponsesHandler({ enumerate = list, read = get, secret = () => process.env.ADMIN_RESPONSES_SECRET } = {}) {
  return async (req, res) => {
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.setHeader('Vary', 'Authorization');
    if (req.method !== 'GET') return res.status(405).json({error:'Method not allowed.'});
    const expected = secret();
    if (!expected) return res.status(503).json({error:'Responses are not configured.'});
    const supplied = String(req.headers.authorization || '');
    const wanted = `Bearer ${expected}`;
    if (Buffer.byteLength(supplied) !== Buffer.byteLength(wanted) || !timingSafeEqual(Buffer.from(supplied), Buffer.from(wanted))) return res.status(401).json({error:'Unauthorized.'});
    const {kind, cursor} = req.query || {};
    if (!Object.hasOwn(fields, kind) || (cursor !== undefined && (typeof cursor !== 'string' || cursor.length > 4096))) return res.status(400).json({error:'Invalid request.'});
    const prefix = kind === 'waitlist' ? 'waitlist/' : 'student-surveys/';
    try {
      const page = await enumerate({prefix,limit:50,...(cursor ? {cursor} : {})});
      const rows = [];
      // Bound concurrent private reads. Fail the page if any record cannot be read.
      for (let i=0;i<page.blobs.length;i+=5) {
        rows.push(...await Promise.all(page.blobs.slice(i,i+5).map(async blob => {
          if (!blob.pathname.startsWith(prefix) || !blob.pathname.endsWith('.json')) throw Error('Unexpected record');
          const result = await read(blob.pathname,{access:'private',useCache:false});
          if (!result || result.statusCode !== 200 || !result.stream) throw Error('Missing record');
          const data = await new Response(result.stream).json();
          const row = {id:blob.pathname.slice(prefix.length,-5)};
          for (const key of fields[kind]) if (Object.hasOwn(data,key)) row[key]=data[key];
          return row;
        })));
      }
      return res.status(200).json({rows,cursor:page.hasMore ? page.cursor : null,hasMore:page.hasMore});
    } catch {
      console.error('Admin response read failed');
      return res.status(503).json({error:'Unable to load responses. Please try again.'});
    }
  };
}
export default createResponsesHandler();
