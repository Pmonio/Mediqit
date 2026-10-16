# Mediqit Secure Admin

Next.js 16 and Clerk-protected version of the Mediqit admin dashboard.

## Security model

- The dashboard is returned only after Clerk verifies a server-side session.
- Registration should be disabled in Clerk; administrators are invite-only.
- MFA must be enforced in the Clerk dashboard.
- Dashboard responses are private, not cached, not indexed and cannot be framed.
- Future API endpoints must call `auth()` and verify the Mediqit staff role independently.

Copy `.env.example` to `.env.local` and use real Clerk development keys locally. Never commit `.env.local`.
