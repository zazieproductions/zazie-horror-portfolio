# STUDIO PASS — the boutique register

**2026-10-24.** A visual pass over the whole site: same pages, same copy, same
interactive systems — a quieter, more expensive register. The brief was
"more prestigious and boutique, less vibe-coded, without changing tons", with
the interactive work untouched.

Everything below is a styling change. No markup was restructured, no copy was
rewritten, no interactive system was removed.

---

## 1. What changed, in one paragraph

The site used to shout in pure black and bright blood red: `#030303` voids,
`#c41e1e` fills, `#ff2a2a` hovers, glow shadows on every button, gradient text
in the hero, blurred red blooms behind sections, gold rating stars and a pulsing
"booking" pill. It now behaves like printed matter: warm black stock
(`#070605`), bone ink (`#f2ece3`), one oxblood accent (`#8e2b24`) used for rules,
fills and a single action per surface, hairlines instead of halos, and type set
for reading.

## 2. The palette contract

| Token | Value | Use |
| --- | --- | --- |
| `void` | `#070605` | page stock, hero fold, dark plates |
| `ink` | `#0b0908` | alternating section ground |
| `smoke` | `#141110` | card ground |
| `ash` | `#272220` | hairlines, frame edges |
| `mist` | `#a89f95` | body copy, labels, nav |
| `bone` | `#f2ece3` | headings, primary text |
| `blood` | `#8e2b24` | **fills and rules only** — 2.4:1 on void, never small text |
| `ember` | `#a33a30` | pressed/deep states, never a hover shout |
| `blood-text` | `#c88076` | the only red small text (6.5:1) |

Rules of thumb:

- One oxblood mark per surface. If a card already has a red border, its number
  is stone, not red.
- Hover goes **to bone**, not to a brighter red. Red-on-hover reads as an alert;
  bone-on-hover reads as a light coming up.
- Hairline first: `1px rgba(242,236,227,.07–.14)` before any shadow or fill.
- Small caps stay letter-spaced (`.2em–.34em`) but never below 11px on section
  labels.

## 3. What was removed

- Every `shadow-[…]` glow on buttons, play buttons, cards and hover states
  (their depth now comes from hairlines and the plate backgrounds).
- The hero's gradient-text line — it is now bone italic.
- The pulsing availability dot and the sparkles icon in the hero meta row.
- Blurred red "bloom" blobs (`blur-[100px]` / `blur-3xl`): replaced with a
  filter-free, low-opacity radial wash, so they cost nothing to paint.
- Gold rating stars (`#F5C518`) → muted bronze `#b5a189`.
- Red hover borders on posters, cards, chips and form fields → bone hairlines.

## 4. What was kept (deliberately)

The archive boot transmission, the shared showreel engine and sticky player,
the film-sample players and fullscreen control, the poster lightbox, the mood
filter rail, the scope estimator and inquiry `mailto:` handoff, the catalogue
vitrine, the pointer-follow cursor light on `/store`, and the ken-burns hero.
The grain, vignette and frame layers stay — just quieter.

## 5. Where the rules live

| Surface | Source of truth | Asset |
| --- | --- | --- |
| `/` (homepage) | inline `<style id="zp-studio-pass">` in `index.html`, last in `<head>` | `index-<hash>.css` (theme utilities) |
| Hubs, documents, item pages | `legal-src/legal.css` → `./legal-src/build.sh` | `legal-<hash>.css` |
| Packages, estimator, inquiry | `src/estimator/estimator.css` → `node scripts/build-estimator.mjs` | `estimator-<hash>.css` |
| Item-page extras | `src/item/item.css` → `vite build` (part of `npm run build`) | `item-<hash>.css` |
| `/store` catalogue | `store-src/store.css` → `./store-src/build.sh` | `store-<hash>.css` |

The homepage layer is unlayered CSS on purpose: Tailwind's utilities live in
`@layer`, and unlayered rules win against them without `!important`, including
after the React bundle re-renders `#root`.

**One trap worth remembering:** Tailwind bakes *opacity-modified* palette values
into literals (`border-blood/40` ships as `#c41e1e66`), so overriding
`--color-*` alone cannot reach them. The homepage block restates the exact
tokens it needs (`section 2b`), matched with `[class~="…"]` so hover variants
(`hover:border-blood/50`) are never flattened into rest state. Add a line there
when you introduce a new alpha of the accent on the homepage.

## 6. Verification

`npm run build` regenerates every hashed asset and re-runs the header, link,
route, sitemap and coverage checks. `npm test` includes a byte-for-byte check
that the inline cinema-player CSS and the bundled copy still match — if you
restyle the film players, change both in the same commit.
