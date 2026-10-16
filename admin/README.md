# Mediqit Admin

Live: https://admin.mediqit.com

Private workspace for launch-list sign-ups and anonymous student questionnaire replies. Includes search, student-interest filtering, hidden-by-default test entries, newest-first display and formula-safe CSV exports. Student replies open in an accessible answer dialog. Mobile layouts use cards. Refresh reads current saved responses. Exports include all matching responses, including those beyond the 500 displayed-row limit.

## Build and deploy

This directory is the complete application source. No source objects from earlier Vercel deployments are needed. The retired sample operations dashboard redirects to `/responses` and is not included in the deployment.

Install with `npm ci`, then `npm run build`. Deploy this folder, or use the repository with root directory `admin`, framework Next.js, build `npm run build`, and install `npm ci`.

Production project: `prj_TAZy78Cq12KfNFizL0pxjVHXeccl`; team: `cryptomonios-projects`.

## Configuration

Set `ADMIN_ACCOUNTS_JSON`, `ADMIN_SESSION_SECRET`, `ADMIN_RESPONSES_SECRET`, `ADMIN_RESPONSE_ASSIGNMENTS={}` and `NEXT_PUBLIC_APP_URL=https://admin.mediqit.com`. Account records contain a lowercase username, display name, scrypt salt and hash, role (`owner` or `staff`) and a unique workspace ID. Plaintext special codes are never stored in the application or repository.

Owner sessions can read all responses and manage worker access at `/workers`. Worker accounts are stored in a private Vercel Blob store. New codes are shown once, saved only as scrypt hashes, and each refresh increments the credential version so the old code and all existing worker sessions stop working immediately. Staff sessions receive only records explicitly assigned to their workspace in `ADMIN_RESPONSE_ASSIGNMENTS`; new staff workspaces therefore start empty. Every protected page and API route checks the encrypted, HTTP-only session cookie on the server. Login attempts use generic errors, a delay and temporary rate limiting. Cross-site login and logout posts are rejected.

The main site's `/api/admin-responses` needs the same bridge secret. Neither record URLs nor storage credentials reach the browser. Personal-data responses are private, uncached and not indexed; CSV cells are escaped against spreadsheet formula execution. No public registration, Google sign-in, editing or deletion API is exposed.

Tests: `npm test`. Build: `npm run build`.

## Admin modules and permissions

The unified admin includes Overview, Marketing, Customer Research, Content, Roadmap & Ideas, Finance, Workers & Access and an owner-only Audit Log. Marketing, content, roadmap and finance records persist in the private Blob store. Worker creation requires at least one dashboard permission. The owner can change permissions later; permission changes increment the credential version and immediately revoke existing sessions. The UI hides unavailable modules and every page and API enforces the same permission server-side. Workers & Access and the complete Audit Log are never assignable to workers.

## Owner recovery

The owner-only Security page supports current-code changes and eight one-time offline recovery codes. Changing or recovering the owner code increments the credential version, invalidating all active owner sessions. `/forgot-code` supports a generic-response, rate-limited 15-minute email recovery flow through Brevo when `BREVO_API_KEY` is configured; it uses the first address in `ADMIN_EMAILS` and the verified `BREVO_SENDER_EMAIL`. Recovery tokens and codes are stored only as hashes. Sensitive recovery actions are written to the audit log without recording any secret.
