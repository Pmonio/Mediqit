# Mediqit Admin

Live: https://admin.mediqit.com

Private workspace for launch-list sign-ups and anonymous student questionnaire replies. Includes search, student-interest filtering, hidden-by-default test entries, newest-first display and formula-safe CSV exports. Student replies open in an accessible answer dialog. Mobile layouts use cards. Refresh reads current saved responses. Exports include all matching responses, including those beyond the 500 displayed-row limit.

## Build and deploy

This directory is the complete application source. No source objects from earlier Vercel deployments are needed. The retired sample operations dashboard redirects to `/responses` and is not included in the deployment.

Install with `npm ci`, then `npm run build`. Deploy this folder, or use the repository with root directory `admin`, framework Next.js, build `npm run build`, and install `npm ci`.

Production project: `prj_TAZy78Cq12KfNFizL0pxjVHXeccl`; team: `cryptomonios-projects`.

## Configuration

Set `ADMIN_EMAILS` (comma-separated verified owner emails), `ADMIN_RESPONSES_SECRET`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in` and `NEXT_PUBLIC_APP_URL=https://admin.mediqit.com`. The main site's `/api/admin-responses` needs the same bridge secret. Never commit secret values.

Every response page and API request checks the server-side Clerk session and a verified email against `ADMIN_EMAILS`. Missing configuration fails closed. The main site reads private Blob records only after a constant-time server secret check. Neither record URLs nor storage credentials reach the browser. Personal-data responses are private, uncached and not indexed; CSV cells are escaped against spreadsheet formula execution. No editing/deletion API is exposed.

## Authentication rollout

The currently connected Clerk instance has development keys. Production requires a production instance, domain verification, production keys, owner account setup and production sign-in testing. Do not hide the development warning as a substitute for completing this rollout. Public self-registration should be disabled and MFA configured in Clerk. The independent server allowlist still prevents unlisted or unverified accounts from reading responses.

Tests: `npm test`. These verify staff access decisions, CSV escaping, original/updated survey formats and the rendered response interface using synthetic records. No tests bypass production authentication or use real respondent data.
