# PRESS.md — the press kit and EPK

**Page:** `/press` → `https://horror.zazieproductions.com/press`
**Source:** `legal-src/pages/press.html` (built by `legal-src/build.sh` into `press/index.html`)
**Downloads:** `press/zazie-productions-press-kit-2026.pdf` (6 pages) · `press/zazie-productions-one-sheet-2026.pdf` (1 page)
**Generator:** `press-src/build-press-pdf.py` (ReportLab, brand fonts, clickable source links, QR)
**Status:** ✅ `PASS — 16 URLs, 42 images, 7 videos, 0 errors` (`node tools/check-sitemap.mjs`)
**Date:** 2026-09-18 · Kit version **v1.0**

---

## 1. What this is for

The homepage press section is four cards and a heading. It answers *“has this composer been covered?”*.
It does not answer: which festival, which year, which work, which venue, what can I quote, what image can I
run, who do I email, and how fast will they answer. Journalists, festival programmers, distributors and
producers on deadline need all of that without sending an email first.

`/press` is that page, and the two PDFs are the same kit in the form people attach to emails, print for a
festival desk, or drop into an EPK folder. One source of truth, three surfaces:

| Surface | What it carries | Who it is for |
|---------|-----------------|---------------|
| `/press` | Eleven sections: fact sheet, 2026 recognitions, timeline, coverage, quotable reviews, screening history, approved boilerplate (4 lengths + credit lines), press assets, story angles, press questions, contact | Everyone; it is the canonical record |
| Press-kit PDF (6 pp) | Fact sheet, boilerplate, both 2026 selections in detail, 2021–2026 timeline with clickable sources, quotes, asset list, contact + QR | Attachments, EPK folders, offline press packs |
| One-sheet PDF (1 p) | Recognition, 25-word bio, credit wording, two quotes, productions and what press can get, contact + QR | Deadline one-pager, festival desk, first-contact email |

## 2. Recognition record captured

Everything below is dated and linked to the primary source in sections II–VI of `/press`.

| When | What | Source |
|------|------|--------|
| 12 Sep 2026 | **Ars Electronica Festival 2026** (Linz, AT) — *Slippage Beyond the Hyperlink* (2026, 2:15) selected from the international call for contributions for *Sonic Saturday: Audible Futures, Silent Decisions*; performed in the **MEDIUM SONORUM** closing concert on the Sonic Lab's 20.4-channel system, 20:00, Anton Bruckner University | Ars Electronica Festival programme |
| 4 Oct 2026 | **Golden Bloody Globes Film Festival 2026** (Los Angeles, US) — *Are You Real?* (dir. Aaron Alexander Bergen), original score by Zazie Kanwar-Torge: Official Selection and **Best of the Festival** nominee; screens 11:10, Broadwater Theater Main Stage | hollywoodsff.org selection page |
| 12 Jun 2026 | **Limitless Magazine** feature — “Forget ASMR. This Will Rewire Your Whole Nervous System” | limitless-magazine.com |
| 24 Mar 2025 | **Lake Ivan Film Journal** review — “Spinning in the Wildness: Phantom Requiem”, David Finkelstein | lakeivan.substack.com |
| Jan 2025 | **Visual Container Winter 2024 Award Winner** — published winners press release | visualcontainer.tv (PDF) |
| 2021 | **BMC Radio Artist** — one of five artists selected by Black Mountain College Museum + Arts Center, Asheville FM and Make Noise; interview on Asheville FM 103.3, closing listening session at the museum | blackmountaincollege.org |

Additional coverage already on the site and carried into section IV: Grammy Weekly (feature) and Billboard
Wire (feature).

**Honesty notes**

- The Black Mountain College programme page currently lists the radio broadcast as **postponed, date TBD**.
  The kit says so, in the timeline entry. Do not cite an air date until BMCM+AC confirms one.
- The Golden Bloody Globes page lists *Are You Real?* under 2026 selections headed “Films we selected this
  year” with “All films are nominated for the BEST OF THE FESTIVAL”. The kit writes **Official Selection,
  Best of the Festival nominee** and quotes no verdict, because the awards are handed out on 4 Oct 2026.
- No award is claimed for *Slippage Beyond the Hyperlink*: the selection is a selection. The wording used is
  “selected from the international call for contributions for *Sonic Saturday*”.
- The review quotes are verbatim from Finkelstein's piece, each attributed to the reviewer and the outlet.

## 3. Files added

| File | Role |
|------|------|
| `legal-src/pages/press.html` | Page source (11 clauses, page-scoped CSS, JSON-LD `@graph` of 9 entities) |
| `press/index.html` | Built page (72 KB) |
| `press-src/build-press-pdf.py` | PDF generator — two-pass build so the cover can state the real page count |
| `press-src/fonts/*.ttf` | Cormorant Garamond (regular/italic) and Inter (400/500/600) converted from the site's `woff2` so the PDFs use the brand faces |
| `press/zazie-productions-press-kit-2026.pdf` | 6-page kit, 319 KB, fonts embedded, source links clickable, QR to `/press` |
| `press/zazie-productions-one-sheet-2026.pdf` | 1-page one-sheet, 31 KB |
| `images/press/press-kit-cover.jpg` | Cover render used as the PDF card image on the page |
| `images/press/one-sheet-thumb.jpg` | One-sheet render used as the PDF card image on the page |

Rebuild everything:

```bash
python3 press-src/build-press-pdf.py     # needs reportlab, qrcode[pil], pillow
./legal-src/build.sh                     # rebuilds /press and the other documents
node tools/check-sitemap.mjs             # must print PASS
```

## 4. Wiring done in the same change

- **Homepage press section** (`index-2b3820b1.js`, `PressKit.tsx` region): the four cards became **eight**, with
  the 2026 recognitions first (Ars Electronica, Golden Bloody Globes, Black Mountain College, Lake Ivan Film
  Journal), each with its own CTA label, plus a hairline row under the grid: *“Open the full press kit”* →
  `/press` and the line *“Approved bios · pull quotes · twelve cleared images · press-kit PDF and one-sheet ·
  reply target 48 hours”*. The section intro now names the 2026 selections and links `/press`.
- **Footer (homepage bundle + shared partial):** “Press kit” now points at `/press` instead of `/#press`, and
  the shared footer says *“Press kit: recognition and assets”*. The `#press` anchor still exists on `/` for old
  links, but nothing sends people there any more.
- **Masthead (shared partial):** `/press` added to the tab row, so every document page can reach the kit.
- **`/composer`:** press section expanded from 4 to 8 entries (2026 recognitions first) and cross-linked to
  `/press`; “Press kit and EPK” added to its related-archives grid and footer.
- **`/404`:** added a press-kit recovery card (renumbered the surrounding cards so they still run 01–12).
- **`server.mjs`:** `/press` added to `CLEAN_ROUTES` so the local preview server resolves the pretty URL.
- **`sw.js`:** cache bumped **v3 → v4**, `/press`, both PDFs and both preview images precached, `/press` added
  to `LEGAL_PATHS` (network-first, never stale) and `.pdf` treated as a static cache-first asset.
- **`_headers`:** `/press`, `/press/`, `/press/index.html` get `max-age=0, must-revalidate` plus the canonical
  `Link:` header; `/press/*.pdf` gets a 1-hour TTL with `stale-while-revalidate` so a corrected kit replaces
  the old one within the hour **without changing the URL**.
- **`sitemap.xml`:** `/press` added as *SILO 3b* with five `image:image` entries (kit cover, one-sheet thumb,
  press photo, headshot, hero portrait) in schema order. Validator: **16 URLs, 42 images, 7 videos — PASS**.

## 5. Conversion thinking (why it is ordered this way)

1. **Proof before prose.** Recognition plates and the fact sheet come first; the boilerplate is section VII.
   A programmer scanning for “has this been at a festival” gets the answer in the first screen.
2. **One-click answers.** Download band in the header (kit / one-sheet / email), copy buttons on every bio and
   credit line, `download` attributes on every asset, a QR that resolves to the page that stays current.
3. **Assets without friction.** Twelve cleared images with dimensions, file sizes, use-cases and a blanket
   caption line; no login, no request form, no ZIP to wait for.
4. **Quotes ready to paste.** Four attributed lines, plus the rule for shortening them, so a writer never
   needs to paraphrase or ask permission for a one-liner.
5. **Deadline mechanics made explicit.** Reply target, what to put in the subject line, what can be supplied
   on request (excerpts, stems, stills, screeners), and what is *not* cleared (ads, merch, AI training).
6. **Story angles are pre-sold.** Six specific angles with the material behind each one, so a features editor
   can commission without a discovery call.
7. **Machine-readable.** `Person` (with `award`, `sameAs`, `subjectOf`), `MusicComposition`, `MusicEvent`,
   `Movie`, `ScreeningEvent`, `Review`, `WebPage`, `BreadcrumbList` — the recognitions are entities Google can
   connect to the composer rather than prose it has to infer.

## 6. Maintenance

- **Bump the version, not the claim.** When recognition changes, update `/press`, the PDF generator and this
  file in the same commit, then bump the kit string (`v1.0 · 18 September 2026`) everywhere it appears: the
  fact-sheet caption, the page footer line, the PDF footers and the one-sheet header.
- **After 4 Oct 2026:** replace “Best of the Festival nominee” with the actual outcome, and add the verdict to
  the screening table. If the film wins, the award moves into the `Person.award` list in the page JSON-LD.
- **After the BMC broadcast airs:** drop the “postponed, date TBD” note and add the air date.
- **New recognition?** Add it to: section II or III of `/press`, the coverage grid, the homepage press cards
  (bundle), the composer page press grid, the PDF timeline, `sitemap.xml` if a new image is involved, and
  `Person.subjectOf` in the page JSON-LD.
- **The PDFs are generated, never hand-edited.** If a PDF must change, change `press-src/build-press-pdf.py`
  and rerun it.
- Re-run `node tools/check-sitemap.mjs` before merging; it enforces the canonical, robots and image checks.
