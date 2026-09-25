# /legal: trust, legal and operating layer

Date: 2026-09-17 · Branch: `arena/01a0b115-zazie-horror-portfolio`
Scope: horror.zazieproductions.com

The site had no terms, no privacy notice, no licensing statement, no purchase
policy, no accessibility statement and no FAQ page. It did have a
`FAQPage` JSON-LD block of six questions in `index.html` with nothing behind
it, a footer with no legal row, and a public phone number, an LLC name and a
"full rights to the score" claim, all of which create obligations that no
published document acknowledged.

This record covers what was built, how it deploys, what was verified, and what
is deliberately not here. Facts that create obligations and need a human
decision are collected in **`RATIFY.md`**, not silently resolved.

> **Addendum, 2026-09-25.** The pipeline now builds an eighth page, `/sitemap`
> (`legal-src/pages/sitemap.html`). It is an HTML site map, not a legal
> document, and it reuses this chrome and stylesheet: the new `.site-map`
> rules moved the stylesheet to `legal-24ac8394.css`. The shared footer's
> Documents row ends with "Site map". Its link row now uses short page names
> ("Full showreel", "Scoring process", "Rate card", "Contact", "Catalogue").
> `/accessibility` gained *More than one way to find a page* (WCAG 2.4.5) and
> is dated 25 September 2026. No legal text changed. See `SITEMAP.md` →
> *Update, 2026-09-25*.

---

## 1. System as found (evidence from repo inspection)

* **No backend of any kind.** The scoring form builds a `mailto:` URL and
  hands off to the visitor's own mail client
  (`window.location.href=\`mailto:…\`` in `Contact.tsx:263`). Nothing is
  posted anywhere. There are no accounts, no database, no newsletter.
* **No analytics, no cookies, no trackers.** `document.cookie` appears zero
  times in `index.html`, the bundle and `store.js`; `localStorage` zero times;
  `sessionStorage` zero times. (The opening sequence used to write one
  `zpBootShown` session key so it would not replay in the same tab; the boot
  now plays on every load and writes nothing.) No `gtag`, GA, Plausible, Fathom, PostHog, Clarity
  or pixel of any kind.
* **Store takes no payment.** All 20 catalogue items link out to Bandcamp,
  itch.io, Gumroad and eBay, which run the checkout (`STORE.md` section 3).
* **Real third parties that are contacted:** `youtube-nocookie.com` (embed on
  play, plus a `prefetch` of the embed document on pointer-enter),
  `drive.google.com` (one sample), and on `/store` the four marketplace image
  CDNs that serve cover art on load. Fonts are self hosted. `doubleclick` and
  `i.ytimg.com` appear as connection hints only.
* **Routing constraint.** `_redirects` once ended with `/* /index.html 200`
  (removed in the SEO pass, see `SEO-DOSSIER.md`), and `STORE.md` section 2
  records the failure mode: on Cloudflare Pages a `200` rewrite to a `.html`
  target loops forever. New routes therefore had to be real static paths, not
  rewrite targets.
* **Two hash conventions.** `store-src/build.sh` hashes `"$(cat file)"`, which
  strips the trailing newline; the React bundle is named from
  `sha256(raw bytes)[:8]` (verified: `index-8638e732.js` matched its own raw
  content hash before this change).
* **No skip link on the portfolio.** `grep -c 'Skip to' index.html` returned
  `0`. The store and the new pages had one.

## 2. What was built

Seven documents, each a real static path, sharing one stylesheet, one script
and two partials:

| Route | Role |
| --- | --- |
| `/legal` | Hub: precedence order, index of all six documents, status of the text |
| `/faq` | 36 questions in 8 sections, `FAQPage` schema generated from the markup |
| `/terms` | 25 clauses: site use plus the commercial terms of a commission |
| `/privacy` | 15 sections: real data inventory, third party table, rights, inspector |
| `/licensing` | 14 sections: grant, options, retained rights, credits, cue sheets, AI |
| `/purchases` | 9 sections: marketplace fulfilment, delivery, returns, sync |
| `/accessibility` | 6 sections: measured contrast, implemented features, named gaps |

### Files

| Path | Role |
| --- | --- |
| `legal-src/pages/*.html` | Page sources (`__CSS__`, `__JS__`, `__MASTHEAD__`, `__FOOTER__`, `<!--FAQ_SCHEMA-->`) |
| `legal-src/partials/masthead.html`, `footer.html` | Shared chrome, so the legal row exists in exactly one place |
| `legal-src/legal.css` | Self-contained stylesheet, same tokens and texture recipes as the portfolio |
| `legal-src/legal.js` | Progressive enhancement: accordion, scroll spy, copy plates, device inspector |
| `legal-src/build.sh` | Hashes assets, injects partials, generates `FAQPage` schema, writes `<slug>/index.html` |
| `<slug>/index.html` | **Generated.** Real static paths, seven of them |
| `legal-<hash>.css`, `legal-<hash>.js` | **Generated**, content hashed, `immutable` under `_headers` |

Rebuild after any source edit:

```bash
./legal-src/build.sh
```

Never hand edit a generated `<slug>/index.html`; the next build overwrites it.

### Design decisions worth recording

* **Real paths, no rewrites.** `<slug>/index.html` only — real assets, matched
  before any splat rule, so nothing can loop. Since 2026-09-19 every page also
  ships a byte-identical root twin `<slug>.html` (`tools/route-aliases.mjs`),
  which is what `/store` has always done with `store.html`: Cloudflare Pages
  308s the slashless `/slug` to `/slug/` for a directory route, and serves the
  twin instead when one exists, so the canonical slashless URL that
  `sitemap.xml` and the `<link rel=canonical>` tags advertise answers 200 with
  no redirect hop. Real files are safe; what loops is a *rewrite* to a `.html`
  target or a trailing-slash redirect rule fighting the host's 308 — see the
  note at the foot of `_redirects`.
* **`FAQPage` is generated, not written.** `build.sh` parses the page's own
  `<details class="faq-item">` elements and emits the schema from them, so the
  structured data cannot drift from the visible answers. The build reports the
  count (36).
* **No cookie banner.** A consent banner on a site that sets no cookies is
  theatre, and a visitor who dismisses one learns nothing true. The consent
  surface here is instead: media that loads only on press, a privacy notice
  that inventories every third party and when it is contacted, a device
  inspector that reads the visitor's own browser, and a one line footer
  statement on every page.
* **The device inspector** (`/privacy` section 5) reads `document.cookie`,
  `localStorage`, `sessionStorage`, `CacheStorage`, service worker
  registrations and the count of off origin scripts on the page, and prints
  them. It makes no network request and writes nothing. The claim on the page
  is falsifiable by the reader, which is the point.
* **Documents sit still.** Grain, vignette and the hairline frame are kept;
  the torch, custom cursor, scanlines and VHS roll are not carried onto these
  pages. A page someone is asked to rely on should not move.
* **Answers ship open.** Every `<details>` is `open` in the markup, so with
  JavaScript off the FAQ is a complete document and the section index is a
  plain list of links. The script collapses them on load.
* **Legibility red.** `#c41e1e` measures 3.49:1 on `#030303`, short of the
  4.5:1 needed for small text. These pages add `--blood-text:#e65650`
  (5.71:1) for labels and keep the darker red for rules, marks and display
  type. The portfolio and `/store` still use the darker red for small labels;
  that is listed as an open gap in the accessibility statement rather than
  quietly fixed or ignored.
* **Legal pages bypass the stale cache.** `sw.js` serves navigations
  stale-while-revalidate, which is right for a portfolio and wrong for a
  document whose effective date matters. The seven legal paths are now
  network first with the cache as a fallback only (`NETWORK_FIRST`; `/store`
  joined the same set on 2026-09-19, since its prices and nav must not be
  served from cache either).
* **Copy rules followed.** No em or en dashes anywhere on the new pages
  (asserted by the suite), no marketing filler, and no SaaS defined terms: no
  "the App", no "Your Account", no "the Service".

### Integration with what already existed

* **Portfolio footer** (`index.html` prerendered *and* the React `Footer.tsx`
  output in the bundle): a `nav[aria-label="Legal and operating documents"]`
  row with all seven documents, and a bottom bar that adds "No advertising
  trackers · no cookies set by this site" beside the copyright line. Both
  footers were patched, because the bundle tears down and rebuilds the static
  DOM on mount: patching one alone would flash and disappear.
* **Contact**: a line under the inquiry CTA pointing at the FAQ, in both the
  prerendered markup and `Contact.tsx`.
* **Bundle renamed** `index-8638e732.js` → `index-9e79ed09.js` per the raw
  sha256 convention, with the dynamic import in `index.html` and the
  precache entry in `sw.js` updated. No stale references remain.
* **Store**: the same legal row and tracker line added to
  `store-src/store.html`, with `.foot-law` styles added to
  `store-src/store.css` (which moved its hash to `store-8af6034d.css`;
  `sw.js` updated to match).
* **Skip link** added to `index.html` outside `#root`, so the React teardown
  cannot remove it, with `tabindex="-1"` on `#root` to make it a real target.
* **`server.mjs`** now resolves a directory URL to its `index.html`, matching
  edge behaviour. Before this, `/faq` 404'd locally.
* **`_headers`**: `must-revalidate` added for all 21 new HTML paths.
* **`sitemap.xml`**: seven URLs added, priorities 0.2 to 0.6. `robots.txt`
  unchanged: the documents should be crawled.

### Merge with `main` (PR #26) and what it cost the privacy notice

`main` moved while this branch was open: PR #26 swapped the Eclipsed cover
frame from the self hosted `/images/project-eclipsed-drive.jpg` to
`https://drive.google.com/thumbnail?id=…&sz=w1600`, in both `index.html` and
the bundle. That is the whole of its bundle change (verified: the size delta of
46 bytes matches that one string swap exactly, and reconstructing it from the
base reproduces main's bundle byte for byte).

Two consequences, both handled:

* **The conflict.** Git followed this branch's rename and reported a content
  conflict in the bundle. It was resolved by rebuilding from **main's** content
  and re applying both of this branch's patches to it, so PR #26's thumbnail
  survives: the result is `index-9e79ed09.js`, and `index-8638e732.js` is gone.
  `index.html` auto merged cleanly; all six of this branch's edits to it are
  present exactly once, with no conflict markers anywhere in the tree.
* **The claim it broke.** The cover frame is now an `<img src>` that loads on
  page load, so six statements in these documents became false: "only requested
  when you press play" (privacy section 1), "nothing is requested from those
  hosts until you press play" (FAQ question 35), "load only when you press
  play" (terms clause 16), the `drive.google.com` row in the third party table,
  "every poster and frame on this site is a self hosted image", and section 7's
  "a visit that never plays anything never loads a player". All six were
  corrected and the pages rebuilt, which regenerates the `FAQPage` schema from
  the amended answer automatically. Section 7 now names the load time image
  request explicitly rather than letting the player sentence imply otherwise.

The wider lesson is worth keeping: any change to what the portfolio loads is a
change to the privacy notice, because that document inventories requests rather
than describing intentions.



Two suites, 344 assertions, all passing. They live outside the repo
(`/home/user/verify/`) and read the real files.

**`static-checks.mjs`, 256 assertions:** every generated page exists as a real
path with no root alias; hash discipline for all four hashed assets; every
page references its hashed assets and carries no leftover placeholder;
canonical, `og:url`, robots, title, description, `lang`, a single `h1`, skip
link and effective date on all seven; zero off origin subresource loads and no
`preconnect` to a third party on any document page; no em or en dashes and no
template tells in any page body; all JSON-LD parses and carries `WebPage` (or
`CollectionPage`) plus `BreadcrumbList`; **all 36 `FAQPage` questions and
answers match the visible text exactly**; every internal href resolves to a
route, a file on disk, or an id that exists on the target page; cross
references between documents; `_headers`, `_redirects`, `sw.js`, `sitemap.xml`
and `robots.txt` all correct with no stale hashes; portfolio and store
integration present; and `node --check` clean on the patched bundle, both
generated scripts, `sw.js`, `server.mjs` and the legal source.

**`runtime-checks.mjs`, 88 assertions:** boots the patched bundle against the
patched `index.html` in jsdom and asserts React renders, the site footer
carries all seven document links plus the tracker statement and the copyright
line, the primary nav still reads Reel / Work / Rates / Store, the FAQ link
sits inside the contact section, all eight portfolio sections survive, and
zero runtime errors. Then boots `legal.js` against the generated pages: the
accordion collapses all 36 on load, the counter tracks state, expand and
collapse both work, a `#q-who-owns` deep link opens only that question, the
device inspector populates every row, and the credit line copies verbatim.
Finally a crawl through the repo's own `server.mjs`: `/faq`, `/faq/` and
`/faq/index.html` for all seven routes, plus `/`, `/store`, `/store/`,
`/store.html`, `robots.txt` and `sitemap.xml` all 200; every local asset
referenced by the new pages serves 200; the old bundle name 404s; unknown
paths still 404.

Two bugs were found by the suite and fixed: the device inspector had no
`data-device` hook, so `legal.js` skipped the whole block, and the panel
lookup is now also derived from the output list as a fallback.

**Not verifiable here:** no headless browser and no route to the live edge, so
the pages were not visually captured, the Cloudflare Pages asset-before-splat
behaviour was not observed first hand (it is inferred from `/store` working
the same way today), and no screen reader or automated WCAG tool was run. The
contrast figures in the accessibility statement are computed from the palette
values, not measured from a rendered page.

## 4. Residual risks and open items

* **`RATIFY.md` is the short list.** Governing law, the default rights model,
  payment terms, retention periods and the plug-in vault's redistribution
  position are drafted as studio defaults and flagged, not invented as facts.
  Nothing in these pages takes effect for a real counterparty until the
  principal confirms those.
* **Not legal advice, and it says so.** `/legal` section iii, `/terms`
  section 18 and `/licensing` section 14 all state that the documents are the
  studio's standard position rather than counsel. A lawyer should read
  `/terms` clauses 10, 19 and 23 before the studio relies on them against a
  represented counterparty.
* **Pre-existing claims now carry documents.** The homepage asserts "full
  rights to the score", a 5.0 rating with four attributed reviews, a public
  phone number and an LLC name. The documents are consistent with those
  claims; whether the claims themselves are right is in `RATIFY.md`.
* **Accent red contrast on `/` and `/store`** remains below AA for small
  text. Fixed on the documents, open elsewhere, disclosed in the
  accessibility statement.
* **Service worker staleness** is handled for the seven legal paths, the six
  IA hubs and `/store` (network first). Any future document route must be added
  to `NETWORK_FIRST` in `sw.js`.
* **The FAQ count is load bearing.** `/faq` states 36 questions in its
  heading meta and the counter's static text. Adding a question means editing
  both; the build regenerates the schema automatically.
