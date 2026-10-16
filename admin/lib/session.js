import {getIronSession} from 'iron-session';
import {cookies} from 'next/headers';
import {validateSession} from './accounts';
const options={cookieName:'mediqit_admin',password:process.env.ADMIN_SESSION_SECRET||'configuration-missing-configuration-missing',ttl:43200,cookieOptions:{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/'}};
export async function getAdminSession(){return getIronSession(await cookies(),options)}
export async function getValidAdminSession(){return validateSession(await getAdminSession())}
export function publicSession(session){return session?.authenticated?{username:session.username,displayName:session.displayName,role:session.role,workspaceId:session.workspaceId}:null}
