# Security

- **Policy source:** `tools/headers.mjs`; `_headers` is checked against it on
  every build (`tools/check-headers.mjs`). CSP is `default-src 'self'` with
  per-directive allowlists; the only remote script/connect origins are the
  disclosed Cloudflare Web Analytics hosts. Adding any third-party origin
  requires: CSP update, `/privacy` inventory update, and PR justification.
- HSTS (preload), `nosniff`, `SAMEORIGIN` framing, restrictive
  Permissions-Policy on `/*`.
- No cookies set by this site, no accounts, no form backend (mailto handoff),
  no secrets in the repo. Deploy credentials live only as GitHub secrets
  (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`) — names documented,
  values never.
- The IndexNow key file (`644fbc082803520e72f3988e53db3132.txt`) is public by
  design (it proves domain ownership to search engines).
- Reporting: see [`SECURITY.md`](../../SECURITY.md). For the legal/privacy
  surface itself, root `LEGAL.md` and `/privacy` are authoritative.
