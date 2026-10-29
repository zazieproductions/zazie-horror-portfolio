# Security policy

## Reporting

Report suspected vulnerabilities privately to the maintainer via the inquiry
channel at <https://horror.zazieproductions.com/#contact> (mark the inquiry
"Security") rather than opening a public issue with exploit detail. You will
get a reply; please allow reasonable time for a fix before disclosure.

## Scope notes

- The site is static with no backend, accounts or cookies; the highest-value
  reports concern the CSP/header policy (`tools/headers.mjs`, `_headers`),
  the service worker (`sw.js`), dependency supply chain (`package-lock.json`)
  and the deploy workflow (`.github/workflows/deploy.yml`).
- The file `644fbc082803520e72f3988e53db3132.txt` is the public IndexNow
  domain-ownership key — its visibility is by design, not a leak.
- Never include credentials or secrets in issues, PRs or reports.
