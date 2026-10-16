import { getValidAdminSession } from '../../lib/session';
import {redirect} from 'next/navigation';
import {canAccess,firstDashboardPath} from '../../lib/access';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(){
  const session=await getValidAdminSession();if(!session?.authenticated)redirect('/sign-in');if(!canAccess(session,'research'))redirect(firstDashboardPath(session));
  const html=await readFile(path.join(process.cwd(),'secure','responses.html'),'utf8');
  return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'private, no-store, max-age=0','X-Robots-Tag':'noindex, nofollow','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"}});
}
