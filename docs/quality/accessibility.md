# Accessibility

- Target: **WCAG 2.2 AA, partially conformant** — the public statement lives
  at `/accessibility` (`legal-src/pages/accessibility.html`) and names
  implemented features and measured gaps rather than claiming perfection.
- Patterns to preserve: content readable with JS off; `prefers-reduced-motion`
  honoured (hero, orbs, boot sequence, wave animation); single H1 per page;
  skip links; labelled controls (`check:forms` enforces `id`/`name`);
  text-red `#e65650` on document pages for small text.
- **Named gap (recorded, deliberate):** `/store` small labels still use brand
  red `#c41e1e` (~3.49:1). Fix in the open with a docs + statement update —
  don't silently restyle identity colours either way.
- Legal/document pages carry no motion effects by design ("documents sit still").
