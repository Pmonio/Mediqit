import {getValidAdminSession} from '../../../lib/session';import {filterForWorkspace} from '../../../lib/accounts';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store, max-age=0','X-Robots-Tag':'noindex, nofollow','Vary':'Cookie'};
export async function GET(request){
  const session=await getValidAdminSession();if(!session?.authenticated)return Response.json({error:'Unauthorised.'},{status:401,headers});
  if(!process.env.ADMIN_RESPONSES_SECRET)return Response.json({error:'Responses are not configured.'},{status:503,headers});
  const query=new URL(request.url).searchParams;
  const kind=query.get('kind');const cursor=query.get('cursor');
  if(!['waitlist','students'].includes(kind)|| (cursor && cursor.length>4096))return Response.json({error:'Invalid request.'},{status:400,headers});
  const target=new URL('https://mediqit.com/api/admin-responses');
  target.searchParams.set('kind',kind);if(cursor)target.searchParams.set('cursor',cursor);
  try{
    const upstream=await fetch(target,{headers:{Authorization:`Bearer ${process.env.ADMIN_RESPONSES_SECRET}`},cache:'no-store',redirect:'error',signal:AbortSignal.timeout(45000)});
    if(!upstream.ok)throw Error('Read failed');
    const data=await upstream.json();data.rows=filterForWorkspace(Array.isArray(data.rows)?data.rows:[],session,kind);return Response.json(data,{headers});
  }catch{return Response.json({error:'Unable to load responses. Please try again.'},{status:503,headers});}
}
