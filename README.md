# Mediqit
## Maintenance and verification

- `npm ci` installs the locked dependencies; `npm test` tests validation, plus-address emails, consent records, local throttling and persistence failures without writing live subscriber data.
- Brand images are static HTML. `assets/mediqit-wordmark-small.webp` is the approved wordmark resized to 435 × 145 for the 145px display size.
- `styles.css` owns shared and scoped homepage rules. Page-specific CSS remains separate. Do not reintroduce JavaScript image/style overrides.
- Update the asset version in HTML and `sw.js`, and bump the `mediqit-pwa-` cache name whenever a cached resource changes. Offline navigation uses cached pages or `/offline.html`; API requests are never cached.
- Waitlist summaries remain private at `waitlist/<email-hash>.json`. Consent submissions are preserved separately at `waitlist-consents/<email-hash>/<event-id>.json`. Deletion/retention requests must include both prefixes for that email hash. Exports should read only `waitlist/`, not the consent archive.
- The in-memory limiter is instance-local defence in depth, not a global abuse quota. Configure a narrowly scoped platform rate-limit rule for `POST /api/waitlist` before paid acquisition; log first and review shared-IP traffic before enforcing.
