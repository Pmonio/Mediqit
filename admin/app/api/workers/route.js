import {buildWorker,publicAccounts,readAccounts,refreshWorker,saveAccounts} from '../../../lib/accounts';
import {hasTrustedOrigin} from '../../../lib/request-security';
import {getValidAdminSession} from '../../../lib/session';
import {cleanPermissions,dashboards} from '../../../lib/access';
import {addAudit} from '../../../lib/workspace';
export const runtime='nodejs';export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow'};
async function owner(){const session=await getValidAdminSession();return session?.role==='owner'?session:null}
export async function GET(){const actor=await owner();if(!actor)return Response.json({error:'Owner access required.'},{status:403,headers});const accounts=await readAccounts();return Response.json({workers:publicAccounts(accounts.filter(a=>a.role==='staff')),dashboards},{headers})}
export async function POST(request){if(!hasTrustedOrigin(request))return Response.json({error:'Forbidden.'},{status:403,headers});const actor=await owner();if(!actor)return Response.json({error:'Owner access required.'},{status:403,headers});let body;try{body=await request.json()}catch{return Response.json({error:'Invalid request.'},{status:400,headers})}let accounts=await readAccounts(true);try{
 if(body.action==='create'){const made=buildWorker(body);if(accounts.some(a=>a.username===made.account.username))return Response.json({error:'That username already exists.'},{status:409,headers});accounts.push(made.account);await saveAccounts(accounts);await addAudit(actor,'Worker created',made.account.username,'Access: '+made.account.permissions.join(', '));return Response.json({worker:publicAccounts([made.account])[0],code:made.code},{status:201,headers})}
 const index=accounts.findIndex(a=>a.role==='staff'&&a.username===String(body.username||'').trim().toLowerCase());if(index<0)return Response.json({error:'Worker not found.'},{status:404,headers});
 if(body.action==='refresh'){const refreshed=refreshWorker(accounts[index]);accounts[index]=refreshed.account;await saveAccounts(accounts);await addAudit(actor,'Worker code refreshed',accounts[index].username,'Existing sessions revoked');return Response.json({worker:publicAccounts([refreshed.account])[0],code:refreshed.code},{headers})}
 if(body.action==='toggle'){accounts[index]={...accounts[index],active:!accounts[index].active,credentialVersion:(accounts[index].credentialVersion||1)+1,updatedAt:new Date().toISOString()};await saveAccounts(accounts);await addAudit(actor,accounts[index].active?'Worker enabled':'Worker disabled',accounts[index].username);return Response.json({worker:publicAccounts([accounts[index]])[0]},{headers})}
 if(body.action==='permissions'){accounts[index]={...accounts[index],permissions:cleanPermissions(body.permissions),credentialVersion:(accounts[index].credentialVersion||1)+1,updatedAt:new Date().toISOString()};await saveAccounts(accounts);await addAudit(actor,'Worker access changed',accounts[index].username,'Access: '+accounts[index].permissions.join(', '));return Response.json({worker:publicAccounts([accounts[index]])[0]},{headers})}
 if(body.action==='delete'){const removed=accounts[index];accounts.splice(index,1);await saveAccounts(accounts);await addAudit(actor,'Worker removed',removed.username);return Response.json({deleted:true},{headers})}
 return Response.json({error:'Invalid action.'},{status:400,headers});
 }catch(error){return Response.json({error:error?.message||'Unable to update worker.'},{status:400,headers})}}
