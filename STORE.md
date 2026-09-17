# /store — build, data and maintenance record

Date: 2026-09-17 · Page: <https://horror.zazieproductions.com/store>

A single static page that gathers the Zazie Productions catalogue — digital
releases on itch.io and Gumroad, physical finds on eBay — and hands each card
straight to the marketplace that owns the checkout. It shares the portfolio's
palette, type stack, texture layers and section rhythm, but **not** its React
bundle: the store ships as plain HTML, one small stylesheet and one small
script.

---

## 1. Files

| Path | Role |
| --- | --- |
| `store-src/store.html` | Source markup (placeholders `__CSS__`, `__JS__`) |
| `store-src/store.css` | Source stylesheet — self-contained (tokens, `@font-face`, all rules) |
| `store-src/store.js` | Source behaviour — progressive enhancement only |
| `store-src/build.sh` | Build: hashes assets, writes them to the repo root, generates `store.html` |
| `store.html` | **Generated.** Do not edit directly |
| `store-<hash>.css`, `store-<hash>.js` | **Generated**, content-hashed, served `immutable` by `_headers` |

Rebuild after any source edit:

```bash
./store-src/build.sh
```

It removes the previous hashed pair, so no stale assets are left behind.
Never hand-edit `store.html`: the next build overwrites it.

## 2. Deployment

* `_redirects` maps `/store` and `/store/` to `/store.html` **above** the SPA
  catch-all (`/* /index.html 200`). Rule order matters — keep the store rules first.
* `_headers` gives `/store.html` the same `must-revalidate` policy as
  `/index.html`; `/*.css` and `/*.js` are already `immutable, max-age=1y`, which
  is why the generated filenames are content-hashed.
* `sitemap.xml` lists `/store` (priority 0.8, weekly).
* The page is linked from three places:
  1. the primary nav tab (React — `Ix` array in `index-<hash>.js`, feeds the
     desktop tabs *and* the sub-`xl` mobile menu),
  2. the prerendered nav in `index.html` (what a visitor sees before the bundle
     mounts),
  3. the footer link rows in both of the above.

## 3. Catalogue (as captured 2026-09-17)

| # | Title | Platform | Price | Listing | Cover |
| --- | --- | --- | --- | --- | --- |
| 1 | Unholy Anatomy — 209 body horror & creature vocal SFX | itch.io | $10+ | `zazieproductions.itch.io/unholyanatomy` | `img.itch.zone/aW1nLzI5MTYyOTA5LnBuZw==/347x500/…` |
| 2 | Fault Codes — 25+ minimal error beeps | itch.io | $1 | `zazieproductions.itch.io/30-minimal-error-beeps-system-warning-sfx` | `img.itch.zone/aW1nLzI4NjA5NjM4LnBuZw==/347x500/…` |
| 3 | Galactic Requiem — immersive 3D battle soundscape | Gumroad | $5+ | `zazieproductions.gumroad.com/l/immersive3daudio` | `public-files.gumroad.com/kxisasmtty6rugi2h6wyhz29lvb4` |
| 4 | World's Strangest Plug-in Mega-Vault (200+ VSTs) | Gumroad | $35+ | `zazieproductions.gumroad.com/l/plugin` | `public-files.gumroad.com/gxx8r6nvhvokuqz8ktnou29qlm7c` |
| 5 | Micro-Rupture Collection — 18 vertical glitch cuts | Gumroad | $5 | `zazieproductions.gumroad.com/l/hdtgt` | `public-files.gumroad.com/ggkcnd8qzh2wnynjbinyw2b54l0b` |
| 6 | Halloween Ghost Glow Fruit Plate with music | eBay | $45.00 + $10.50 | item `236994104581` | `i.ebayimg.com/images/g/99UAAeSwqhJqd3CA/s-l500.webp` |
| 7 | F998Pro live sound card (white, English version) | eBay | $85.00 + $10.50 | item `236994099582` | `i.ebayimg.com/images/g/7aAAAeSwAVhqd3Cg/s-l500.webp` |
| 8 | Voice-control WiFi bulb, RGBCW 9 W | eBay | $25.00 + $10.50 | item `236992067377` | `i.ebayimg.com/images/g/hkQAAeSwAfJqdiA1/s-l500.webp` |

Categories (`data-collection`): `sfx` (1–3), `plugins` (4), `motion` (5),
`gear` (6–8). Delivery (`data-delivery`): `digital` (1–5), `physical` (6–8).

## 4. Cover art

Card thumbnails are **hot-linked** from each marketplace's CDN
(`img.itch.zone`, `public-files.gumroad.com`, `i.ebayimg.com`) because the
listings already host correct, current product art — no re-uploads, no
duplicated storage, and the images follow the listing. Each `<img>` carries
`loading="lazy"`, `decoding="async"`, `referrerpolicy="no-referrer"` and an
empty `alt` (the card title is the link text). `store.js` watches for `error`
events and swaps a failed cover for the card's monogram plate, so a pulled
image never leaves a hole. The 500-px eBay variants are used: they are the
sizes eBay itself serves in search results.

If a cover is ever replaced by a locally hosted one, put it in
`images/store/`, keep the source JPEG plus an AVIF sibling, and update both the
`<img>` and the JSON-LD `image` URL.

## 5. Behaviour (`store.js`, ~3 KB)

* Adds `has-js` to `<html>` — the filter bar is hidden without it, so a
  JavaScript-free visitor still sees all eight releases.
* Two filter groups (`collection`, `delivery`) combined with AND logic,
  `aria-pressed` state, a live `role="status"` counter ("N of 8 releases"), and
  an empty state with a reset link.
* Filter selection is reflected in the URL hash (`#sfx`, `#plugins`, `#motion`,
  `#gear`, `#digital`, `#physical`) via `history.replaceState`, so filtered
  views can be linked — and read back on load.
* Cover-error fallback (above) and the footer year.

## 6. Maintenance checklist

1. **Prices move.** The page is static: prices, stock and platform ratings are
   a snapshot. Update `store-src/store.html` (card copy *and* the JSON-LD
   `offers.price`) and the "Prices captured" stamp, then rebuild.
2. **A listing ends.** Remove its `<li>` from the grid, its `ListItem` from the
   JSON-LD, and the `numberOfItems` count.
3. **New release.** Copy a card `<li>`: set `data-collection` /
   `data-delivery`, the cover URL, price block and CTA label ("Buy on Gumroad",
   "Buy on itch.io", "Buy on eBay"), add the JSON-LD entry, and bump the stats
   strip if the totals change.
4. **Bundle edits.** If the nav/footer integration in `index-<hash>.js` is ever
   changed again, rename the file to its new content hash and update the
   dynamic import in `index.html` — the `immutable` header depends on it.

## 7. Verification performed

* `node --input-type=module --check` on the patched bundle: clean.
* jsdom boot test of `index.html` + the production bundle (14 assertions):
  app renders, the nav reads **Reel / Work / Rates / Store**, the tab appears in
  the primary nav and again in the footer, all portfolio sections survive, zero
  runtime errors.
* jsdom test of `store.html` + `store.js` (38 assertions): 8 cards, 8 chips,
  AND-filtering (Plug-ins → 1 card, Plug-ins + Ships → empty state, Objects +
  Ships → 3 cards, reset → 8), counter text, hash updates, cover-error
  fallback, valid JSON-LD with 8 `Product` offers, canonical/OG tags, and every
  local asset reference resolving to a real file.
* Local HTTP crawl of `/store`, `/store/`, `/index.html` and every referenced
  local asset: all 200.

**Not verifiable here:** no headless browser or network route to the live edge,
so the rendered page (including the hot-linked covers) was not visually
captured, and real Lighthouse/INP numbers were not measured.
