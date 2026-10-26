# Search Identity — one sentence, everywhere

**Date:** 2026-10-26 · **Branch:** `arena/fd3a3203-zazie-horror-portfolio`
**Entity:** Zazie Kanwar-Torge / Zazie Productions LLC (Asheville, NC — remote worldwide)
**Companion records:** [`AUTHORITY-POSITIONING-DOSSIER-2026.md`](AUTHORITY-POSITIONING-DOSSIER-2026.md) (research and the longer programme) · [`KEYWORD-UNIVERSE-2026.csv`](KEYWORD-UNIVERSE-2026.csv) (query map) · [`SEO-COMPETITOR-AUDIT-WEARY-PINES.md`](SEO-COMPETITOR-AUDIT-WEARY-PINES.md) (what a purpose-built composer page does to a genre SERP)

---

## 1. The decision

The site's primary search identity is now, and only:

> **Experimental psychological horror film composer for independent and arthouse cinema.**

It is stated the same way on the homepage, the biography, the commission page, the inquiry page, the structured data, the sitemap and both LLM manifests. One sentence, repeated — not twelve paraphrases of it.

The objective is **qualified directing and producing inquiries**. Not traffic, not ranking for every variation of "horror music", and not a library of text pages that exist to hold keywords.

**Source of truth:** [`src/data/positioning.ts`](src/data/positioning.ts). Every surface below reads from it (or, where a page is hand-authored HTML, is held to it by [`tools/positioning.test.mjs`](tools/positioning.test.mjs)). Editing copy anywhere else without editing that file will fail the test suite.

---

## 2. Why this sentence

| Part | What it does |
| --- | --- |
| *Experimental* | Separates the practice from marketplace horror scoring and from a stock-soundtrack sound. It is also literally true: the scoring palette is bowed metal, prepared strings, musique concrète and custom synthesis. |
| *psychological horror* | The subgenre the work is actually strongest in, and the one a director searches by. The site already holds the credits and cue taxonomy to support it. |
| *film composer* | Names the role the buyer is hiring. Not "audio artist", not "composer for all media". |
| *for independent and arthouse cinema* | Names the market. It is the sentence's qualifier and its filter: it tells a studio executive that this is not their vendor, and tells a first-feature director that it is. |

The sentence makes no claim it cannot support: no genre-topped box office, no award, no affiliation. Aesthetic territory (the psychologically ambitious horror of the last decade) is left to the reader to infer from the work — naming those films on the site would be an affiliation claim dressed as a compliment, and a legal exposure dressed as SEO.

### What was wrong before

The homepage title was `Horror Composer for Hire — Film, TV & Game Scores`, the H1 was `Dark, atmospheric horror scores, written to your picture.`, and the commission page description opened with `Horror scoring (USD): scene from $250`. Every one of those is a generic head-term or a price floor. Together they put the site in the same bracket as Fiverr, SoundCloud freelancers and stock libraries — a bracket that competes on price, where a specialist cannot win and would not want the inquiries if it did.

---

## 3. What changed, surface by surface

| Surface | File | Now says |
| --- | --- | --- |
| Home `<title>` | `src/data/hubs.ts` → prerendered head | `Experimental Psychological Horror Film Composer` (47 chars, no brand suffix, no price) |
| Home `<h1>` | `home-src/build.mjs` hero pairs → `index.html` + bundle | `Experimental psychological horror film composer` / `for independent and arthouse cinema.` |
| Home hero sub-line | same | `Bowed metal, prepared strings and custom synthesis, written to picture for features, festival shorts and hybrid form.` |
| Home meta description | `positioning.ts` → `hubs.ts` | identity sentence, then the name, then the action (156 chars) |
| Home inquiry intro | `home-src/build.mjs` contact pairs | adds "Commissions are usually independent features and shorts with a director's point of view." |
| Person / Organization / WebSite JSON-LD | `src/data/entities.ts`, injected by `scripts/sync-static-seo.mjs` | identity-led `description`, `jobTitle[0]`, site name |
| `/composer` title, description, H1, lede | `composer/index.html` (twin regenerated) | `Zazie Kanwar-Torge: experimental psychological horror film composer for independent and arthouse cinema` |
| `/hire-a-composer` title, H1, lede, note | `legal-src/pages/hire-a-composer.html` (source, not the build output) | `Hire an experimental psychological horror film composer`, then who commissions the studio and what does not |
| `/hire-a-composer` + `/services` descriptions | `src/lib/pricing-markup.ts` (`pricingMetaHtml`) | identity sentence first, rate card second |
| `/contact` title, description, JSON-LD | `contact/index.html` + `hubs.ts` | identity in the description; H1 stays task-first |
| `llms.txt` / `llms-full.txt` | `scripts/generate-llms.mjs` | identity in line one, a "Primary search identity" fact, and the qualification rules |
| `404.html` | hand-authored | identity in the recovery card |
| Sitemap `lastmod` | `src/data/hubs.ts` | 2026-10-26 on the four edited hubs |

**Price moved below craft.** The published rate card is unchanged and still on the page, in the estimator, in `/services`, `/terms` and the LLM manifests — transparency is a trust asset and supervisors respect it. What changed is that it no longer opens the pitch. A description that leads with "from $250" advertises the floor to the wrong searcher before it has said what the studio is.

---

## 4. Qualification: who this is for

Positioning that attracts everyone qualifies no one. The commission page now carries a short note, and the homepage inquiry intro a shorter version of it:

> **Good fit:** independent features and shorts with a director's point of view, where dread is structural rather than a jump-scare device.
>
> **Not a commission:** library-style cue requests and catalogue licences — those go through `/store` — and a score written to a script with no cut or sequence to work from.

That last clause is deliberate. It does not turn away micro-budgets (`/contact` still says independent and micro-budget productions are welcome); it turns away work that is not scoring. The two statements answer different questions and do not conflict.

The full strings live in `positioning.ts` as `FIT_STATEMENT` and `NOT_FIT_STATEMENT`, and the test fails if the commission page stops carrying them.

---

## 5. What this deliberately does not do

- **No genre pillar pages.** No `/psychological-horror`, `/folk-horror`, `/body-horror`, `/experimental-art-house`. The four-genre programme in the 2026 dossier is a reasonable long-term build, but each pillar is a document that has to be worth reading. Adding four thin landing pages to capture queries is the failure mode this brief rules out. The identity is carried by pages that already have a job: biography, commissions, work, showreel, inquiry.
- **No film-title comparisons.** Nothing on any commercial surface says "in the vein of", "for fans of", or lists *Hereditary*, *The Lighthouse*, *Saint Maud*, *Possessor* and their peers. The test scans every served `<title>`, meta description, `og:` pair and `<h1>` and fails on those names. If the site ever discusses a specific film, it belongs in an editorial piece that explicitly disclaims any affiliation — not in a headline that a producer reads as a credit.
- **No "elevated horror" or "A24-style" as a positioning claim.** Both are contested labels and both read as borrowed authority. The existing topical reference in `knowsAbout` stays where it is — with its explicit "not an affiliation or production credit" description — because a labelled reference topic is different from a headline that borrows the authority.
- **No keyword variation stacking.** "Horror music", "scary music composer", "dark ambient sound design" and the rest of the keyword universe still exist as catalogue and cue vocabulary, not as title tags. One identity per site; the item pages do the long-tail work they were built for.
- **No price in the identity.** The floor figure is a filter on budget, not on craft.

---

## 6. Rules for future copy

1. The identity sentence is not a template. Do not write "experimental horror composer for bold independent filmmakers" as a variation — it splits the entity across phrasings and reads as copy written for a search engine.
2. Identity first, then evidence, then the action. Price comes after craft on every page that carries both.
3. Genre labels (folk horror, body horror, dark ambient, cosmic) are catalogue vocabulary. They can appear in a biography or a track description; they must not lead a page.
4. Never imply affiliation. No film titles, no director names, no studio names in a commercial surface.
5. If a new page is proposed, it needs a document behind it — an article, a case study, a real reference page. Not a query.
6. If the sentence itself must change, change `src/data/positioning.ts` first, run `npm run build`, and let the test tell you which surfaces are still behind.
7. Spelling follows the buyer: **arthouse** (one word) in the identity and in every head surface, because that is how the phrase is searched. The older genre-label alt text that reads "experimental art house" is a taxonomy label, not the identity, and can stay.

---

## 7. Verification

```bash
npm run build     # tsc → hub pages → sync-pricing → sitemap → llms → prerender → verify → checkers
npm test          # 77 tests, including tools/positioning.test.mjs
```

`tools/positioning.test.mjs` asserts, against the **served** files:

- the homepage `<title>` is the identity and stays inside the 30–60 character SERP window;
- the homepage description begins with the identity sentence and stays inside 120–160 characters;
- the homepage `<h1>` is the positioning sentence and the hero craft line is present;
- the shipped React bundle renders the same hero strings as the static snapshot (the failure mode where a patch lands in `index.html` but not in the bundle, so the identity disappears when React re-renders `#root`);
- `/composer` and `/hire-a-composer` carry the identity in title, description and H1;
- `/contact` description opens with the identity;
- `llms.txt` opens with the identity and carries the qualification;
- no served `<title>`, meta description, `og:` pair or `<h1>` names a film the studio has no credit on.

Manual spot check:

```bash
grep -c "Experimental Psychological Horror Film Composer" index.html composer.html hire-a-composer.html
grep -n "<h1" index.html hire-a-composer/index.html composer/index.html | sed 's/<[^>]*>//g'
head -8 llms.txt
```

---

## 8. What to watch, and when to revisit

- **Search Console** (server-side and cookieless, so it does not break the site's privacy claims): impressions and queries for the identity phrase and its close variants. That is the only ranking signal worth looking at; volume on "horror music" is not the goal.
- **Inquiry quality, counted by hand.** Over the next 90 days, note how many inquiries are independent features or shorts with a cut, and how many are library or trailer requests. If library requests dominate, the store link in the note is not doing its job. If nothing arrives, the problem is distribution (reels, supervisors, festivals), not another string of keywords.
- **Review date: 2027-01-24.** If the identity phrase has no impressions after a full quarter, the sentence is too narrow for the market the studio can actually reach, and the change is one line in `positioning.ts` — which is the point of putting it there.

---

## 9. Change log

| Date | Change |
| --- | --- |
| 2026-10-26 | Primary identity set to "Experimental psychological horror film composer for independent and arthouse cinema." Home title/H1/description, person and organization entities, `/composer`, `/hire-a-composer`, `/contact`, `llms.txt`/`llms-full.txt` and the sitemap `lastmod` updated. Pricing metadata re-ordered to identity-then-rate. Qualification note added to the commission page and the homepage inquiry intro. `tools/positioning.test.mjs` added; `tools/geo.test.mjs` and `tools/pricing.test.mjs` updated for the new strings. |
