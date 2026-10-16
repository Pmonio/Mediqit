# Mediqit Admin

Live: https://admin.mediqit.com

The response workspace at `/responses` reads existing launch-list and student-survey records. It offers search, student-interest filtering, test-entry filtering, newest-first display and CSV export. Refresh reads current data; data is not pushed in real time. Export includes every matching response, including rows beyond the 500-row display limit.

## Access and data flow

Clerk verifies the session. Every response page and response API request separately checks `ADMIN_EMAILS` against the signed-in user's verified emails. An unlisted signed-in user receives 403. An authenticated server-to-server bridge calls the main site's `/api/admin-responses`; private Blob credentials and record URLs never go to the browser. Both response APIs use private no-store headers. No record editing or deletion is exposed.

Configure `ADMIN_EMAILS` and `ADMIN_RESPONSES_SECRET` in the admin project, and the same `ADMIN_RESPONSES_SECRET` in the main site project. The existing Clerk keys and sign-in configuration remain in the admin project. Never put these secrets in source control.

**Authentication follow-up:** the connected Clerk instance currently uses development keys. Set up a Clerk production instance, disable public registration, enforce MFA, migrate/invite the owners, and replace the Vercel integration's Clerk keys before relying on this as the permanent production authentication configuration. The server email allowlist is enforced independently of Clerk registration settings.

## Deployment

The original operations dashboard was deployed directly to Vercel rather than GitHub. `preserved-files.json` references the original source objects, preserving it unchanged except for a link to the new response workspace. These two referenced files are not checked into this directory. When deploying this folder using the Vercel deployment API, include these SHA references alongside all the local source files; otherwise `/dashboard` will lack its legacy HTML. The response workspace does not depend on those legacy files.

Original deployment (rollback): `dpl_3ooyGm2mohrgveP7TfyBwyHcLr5p`.

Build: `npm ci && npm run build`. Keep the configured Clerk publishable key available during the build. Production project: `prj_TAZy78Cq12KfNFizL0pxjVHXeccl`.
