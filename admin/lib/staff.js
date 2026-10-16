import { auth, currentUser } from '@clerk/nextjs/server';
export async function isStaff() {
  const {userId}=await auth();
  if(!userId)return false;
  const user=await currentUser();
  if(!user)return false;
  const allowed=(process.env.ADMIN_EMAILS||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
  return user.emailAddresses.some(e=>e.verification?.status==='verified' && allowed.includes(e.emailAddress.toLowerCase()));
}
