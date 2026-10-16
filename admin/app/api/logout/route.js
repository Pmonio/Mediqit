import {hasTrustedOrigin} from '../../../lib/request-security';import {getAdminSession} from '../../../lib/session';
export async function POST(request){if(!hasTrustedOrigin(request))return new Response('Forbidden',{status:403});const session=await getAdminSession();session.destroy();return Response.redirect(new URL('/sign-in',request.url),303)}
