import { isStaff } from '../../../lib/staff';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store, max-age=0','X-Robots-Tag':'noindex, nofollow','Vary':'Cookie'};
export async function GET(request){
  if(!await isStaff())return Response.json({error:'This account does not have admin access.'},{status:403,headers});
  if(!process.env.ADMIN_RESPONSES_SECRET)return Response.json({error:'Responses are not configured.'},{status:503,headers});
  const query=new URL(request.url).searchParams;
  const kind=query.get('kind');const cursor=query.get('cursor');
  if(!['waitlist','students'].includes(kind)|| (cursor && cursor.length>4096))return Response.json({error:'Invalid request.'},{status:400,headers});
  const target=new URL('https://www.mediqit.com/api/admin-responses');
  target.searchParams.set('kind',kind);if(cursor)target.searchParams.set('cursor',cursor);
  try{
    const upstream=await fetch(target,{headers:{Authorization:`Bearer ${process.env.ADMIN_RESPONSES_SECRET}`},cache:'no-store',signal:AbortSignal.timeout(45000)});
    if(!upstream.ok)throw Error('Read failed');
    return Response.json(await upstream.json(),{headers});
  }catch{return Response.json({error:'Unable to load responses. Please try again.'},{status:503,headers});}
}
