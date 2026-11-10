# Feature: inquiry & commissioning

- The inquiry form builds a `mailto:` handoff in the visitor's own mail
  client — there is no backend endpoint. Source: `src/inquiry/`, built by
  `scripts/build-inquiry.mjs`; commission copy/options single-sourced in
  `src/data/commission.ts` and synced by `scripts/sync-commission.mjs`.
- No published rate card: visitors state budget range and references; every
  score is quoted per project in writing. Commission pages: `/hire-a-composer`
  (pillar — owns the transactional "hire a horror composer" queries),
  `/sound-design`, `/game-scoring`. `/how-to-hire-a-horror-composer` is the
  informational companion (score budgeting, custom vs. library music, vetting,
  rights) and does not repeat the pillar's quoting pitch — see the
  cannibalisation record in `SEO-DOSSIER.md`.
- Every form control must carry `id` or `name` — enforced by
  `tools/check-forms.mjs` against served HTML.
