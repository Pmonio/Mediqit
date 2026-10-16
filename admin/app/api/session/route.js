import {getAdminSession,publicSession} from '../../../lib/session';export const dynamic='force-dynamic';
export async function GET(){const session=publicSession(await getAdminSession()),headers={'Cache-Control':'private, no-store'};return session?Response.json(session,{headers}):Response.json({error:'Unauthorised'},{status:401,headers})}
