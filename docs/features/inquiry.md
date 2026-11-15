# Feature: inquiry & commissioning

- The inquiry form posts to `POST /api/inquiry` on this origin — a Cloudflare
  Pages Function (`functions/api/inquiry.ts`) that validates the submission,
  writes one row to the D1 database `zazie-inquiries` (binding `DB`, declared
  in `wrangler.toml`) and answers `{ ok: true }`. The visitor sees an in-page
  confirmation. The `mailto:` handoff is kept: it is the form's action without
  JavaScript, and it is what runs when the endpoint cannot be reached
  (network failure, 5xx, or 503 because the binding is missing), so an inquiry
  is never left with a dead end.
- The homepage contact form is rendered by the prebuilt React bundle (no
  source in this repo). `src/inquiry/main.ts` intercepts its submit in the
  capture phase and sends it to the same endpoint; on failure it falls back to
  the bundle's mail handoff.
- Server-side validation is authoritative: email pattern, minute ceiling
  (`MAX_MINUTES_INPUT`) and cue ceiling (`MAX_CUES`), and the budget, format,
  complexity and licence options all come from `src/data/commission.ts`, so the
  form and the endpoint cannot drift. A 32 KB body cap, unexpected-field
  rejection and an invisible `website` honeypot (silent success, nothing
  stored) guard the endpoint. No submitted email is ever echoed in an error,
  and no personal data is logged.
- The table is created by `migrations/0001_inquiries.sql`; apply it with
  `npx wrangler d1 migrations apply zazie-inquiries --remote`.
- No published rate card: visitors state budget range and references; every
  score is quoted per project in writing. Commission pages: `/hire-a-composer`
  (pillar), `/sound-design`, `/game-scoring`, `/how-to-hire-a-horror-composer`.
- Every form control must carry `id` or `name` — enforced by
  `tools/check-forms.mjs` against served HTML.
- Privacy: `/privacy` states that an inquiry is transmitted to this server and
  stored so it can be answered, that it is not shared and not used for
  tracking. The footer's "no cookies, no trackers" claim stays literally true —
  the form sets no cookie and adds no third-party origin, and the CSP needed no
  change (`connect-src 'self'`, `form-action 'self' mailto:`).
