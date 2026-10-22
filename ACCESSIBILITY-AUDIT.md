# Accessibility remediation — 2026-10-22

The reported “7 Level A / 2 Level AA” total did not include rule IDs,
URLs, or affected elements. These changes address independently reproduced
issues, not a claim that those exact nine findings have been matched.

## Changes

- Increase contrast for red text, muted navigation/footer text, required-field
  markers, and item metadata without changing the dark visual identity.
- Include the visible logo text in its accessible name, retaining a name when
  the wordmark is hidden on mobile. Match the “Enter” link's visible label.
- Underline inline store links rather than relying on color alone.
- Make horizontally scrolling tables and the mobile review carousel focusable
  and give the scrolling regions accessible names.
- Strengthen keyboard focus indicators, homepage form boundaries, anchor scroll
  offsets, and reduced-motion styling.
- Update build inputs, generated pages/assets, and service-worker assets together.

## Reproduce

```sh
npm ci
npx playwright install --with-deps chromium
npm run build
npm run serve
# In another terminal:
npm run test:a11y
```

`test:a11y` uses axe-core's WCAG 2 A/AA, 2.1 A/AA and 2.2 AA tags. It checks
12 representative routes at 1280px and 375px, including the hydrated homepage,
contact, store, reel, work, services, hiring guide landing page, FAQ,
accessibility, privacy, and two item pages. Pass routes as arguments to expand
or narrow the audit. `A11Y_BASE_URL` can target another deployment.

## Validation results

- axe-core: **0 violations across all 24 route/viewport checks**.
- `npm run build`: passed, including route, link, header and sitemap checks.
- `npm test`: 44 tests passed.
- `npm run typecheck` and `git diff --check`: passed.

## Limits / follow-up

Automated checks cannot establish full WCAG conformance. This run checks the
initial rendered state, not every dialog, player, validation state, or route.
Third-party media and checkout pages need separate checks; external content
could not be fully loaded in the restricted test environment. Review keyboard
flows, screen-reader announcements, zoom/reflow, captions/transcripts and audio
description where applicable. Obtain the original audit details and rerun that
audit against the deployed fixes before marking its nine findings resolved.
