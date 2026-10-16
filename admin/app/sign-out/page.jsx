"use client";

import { useClerk } from "@clerk/nextjs";
import { useEffect } from "react";

export default function SignOutPage() {
  const { signOut } = useClerk();
  useEffect(() => { signOut({ redirectUrl: "/sign-in" }); }, [signOut]);
  return <main className="signout-shell"><section className="signout-card"><img src="/assets/mediqit-q.svg" alt="Mediqit"/><h1>Signing you out</h1><p>Your secure session is being closed.</p></section></main>;
}
