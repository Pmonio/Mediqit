import { SignIn } from '@clerk/nextjs';
export default function SignInPage(){return <main className="auth-shell"><div className="auth-brand"><img src="/assets/mediqit-q.svg" alt="" width="48" height="48"/><h1>Mediqit Admin</h1><p>Sign in to view launch-list and student responses.</p></div><SignIn routing="path" path="/sign-in" forceRedirectUrl="/responses" signUpUrl="/sign-in" /></main>}
