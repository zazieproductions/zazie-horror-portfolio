# OPS LOG — horror.zazieproductions.com
Citation-surface operation for Zazie Kanwar-Torge / Zazie Productions.
Running record of what was done, why, how it was tested, residual risk, and the next iteration trigger. Newest entries at the bottom.

---

## 2026-09-15 — Operation: citation-surface expansion

### Reconnaissance findings

1. **Architecture.** Single-URL static site (Cloudflare Pages, repo = deploy root). Prerendered body (~11.7k words visible text) — no CSR blindness. Hash-only navigation (`#showreel`, `#contact`); no path router in the JS bundle (verified: no `pushState`/`pathname`/router signatures).
2. **Existing on-page state (preserve, don't rebuild).** Solid title/meta/canonical/OG, 7 valid JSON-LD blocks (Person, Organization, ItemList, FAQPage, WebSite, LocalBusiness, @graph with WebPage+reviews+films+playlist), image+video sitemap extensions. Prior session's work is intact and working.
3. **Critical gaps (the leverage):**
   - One crawlable URL. All content lives on `/` — the site is invisible for every informational query in the psychological-horror space, which is where citation volume actually lives.
   - Zero definitional/quotable content targeting the head term "psychological horror composer." SERP recon: the informational space is listicle-thin (Collider, StringJoy, Film Score Monthly, academic PDFs). No practitioner-authored definitional resource owns it.
   - No `llms.txt`. No per-page surface for AI answer engines to quote and attribute.
   - Soft-404 problem: `/* /index.html 200` catch-all rewrote every unknown URL to the homepage as 200 (verified platform behavior: static files still served correctly, so the rewrite only poisoned misses).
   - Entity type confusion: `LocalBusiness` schema on a worldwide remote studio with no address — invites local-pack misclassification and triple-entity dilution (Person + Organization + LocalBusiness for the same thing).
4. **Entity footprint.** IMDb nm17333332 (verified, thin but real: The Haunted composer, Mike Has A Visitor composer, Expire sound designer, Choleric producer). Bandcamp, Spotify, Apple Music, YouTube, LinkedIn, ReelCrafter (ranks #1–2 for brand). No Wikidata item, no MusicBrainz artist entity — both are music-ontology feeds that LLMs and classic search pull from.
5. **Press section flag (risk).** "Grammy Weekly" (grammyweekly.com) and "Billboard Wire" (billboardwire.com) are not the Recording Academy's or Billboard's properties — they are lookalike-name outlets. They may be legitimate small publications, but a journalist or manual reviewer pattern-matching them to fake-press is a credibility risk ("the SEO'd horror composer" failure mode). Do not build further authority claims on these. Prefer IMDb, Visual Container (real award documentation), festival placements, and the BMC Museum radio-art feature as corroboration sources.

### Doctrine decision

The single highest-EV move is **converting a one-URL commercial site into a small set of genuinely deep, machine-extractable pages** that (a) each own a query cluster, (b) give LLMs attributable, quotable definitions with original terminology, and (c) reinforce the entity graph via schema cross-linking. This beats any off-page velocity play available from this repo because generative engines cite extractable substance + corroborated entities, not link count — and the informational SERP for the cluster is weak.

De-scoped deliberately (no thin-page spray): 4 pages shipped, each deep enough to earn its keep. Next spokes queued, not faked.

### Shipped (this session)

| Artifact | Purpose |
|---|---|
| `/psychological-horror-composer/` | Flagship concept page: the definition of the term, 8 named techniques, subgenre comparison table, lineage, hiring guide, FAQ. Article + FAQPage + BreadcrumbList schema. ~2.4k words. |
| `/scores/` | Verified credits + 29-cue catalogue as structured data (the unique-database play). CollectionPage + ItemList schema. |
| `/techniques/temp-music/` | "Temp love" definitive essay: psychology, cost, fix. Article + FAQPage + BreadcrumbList schema. |
| `/techniques/` | The Dread Codex hub: Lexicon of Dread (10 defined terms = extractable definition units) + essay index. CollectionPage schema. |
| `/404.html` | Branded 404 with internal links. Replaces soft-404 homepage rewrites. |
| `/llms.txt` | Machine-readable citation feed per llmstxt.org: page inventory, key facts, profiles. |
| `index.html` (edits) | Hydration-safe static directory strip after `#root` (crawlable links to all new pages); Person `subjectOf` + jobTitle alignment; WebSite `hasPart`; `LocalBusiness` → `MusicGroup` (music-ontology fit, kills local-pack misclassification); award attribution made specific (Visual Container); graph dateModified bumped. |
| `sitemap.xml` | +4 URLs with lastmod 2026-09-15; homepage lastmod refreshed. |
| `robots.txt` | llms.txt reference comment (informational). |
| `_redirects` | Removed `/* /index.html 200` catch-all (site has no path routing; misses now serve real 404s). |
| `_headers` | must-revalidate for all new HTML paths; 24h cache + explicit text/plain for llms.txt; `X-Robots-Tag: noindex, nofollow` for `/docs/*`. |
| `css/pages-v1.css` | Version-stamped shared stylesheet for deep pages (immutable-cache safe). |
| `/docs/` | Ops log (this file), citation attack surface tracker, off-page playbook. |

### Original terminology seeded (ownable, quotable)

The uncanny interval · the long inhale · negative-space scoring · dissociative harmony · sub-frequency dread · the vanishing leitmotif · diegetic blurring · temp inversion · psychophonic bed · the Dread Codex.

These now exist in defined form in two corroborating on-site locations (flagship + lexicon). Citation pay-off requires third-party corroboration (see off-page playbook).

### Testing performed

- All JSON-LD re-validated post-edit: 7/7 blocks parse on `/`; each new page's blocks parse (see validation script in test section below).
- Prerendered body + injected strip verified present in raw HTML (no-JS crawlers see links).
- Local static server smoke test: all new URLs return 200 with correct content; 404 path returns 404.html.
- Internal link graph verified: every new page links home + siblings; homepage links all four.
- Hydration safety: directory strip is a sibling of `#root` (React hydrates only the root subtree).

### Residual risks (accepted / monitored)

1. **React hydration vs. static strip** — strip is outside `#root`; risk ≈ zero, but watch for console errors after deploy.
2. **Review markup** — homepage carries `aggregateRating` (5.0/4) with anonymous-author reviews. Visible on-page, but anonymous personas ("Independent Director") don't meet Google's strongest review-snippet evidence bar. If rich results get suppressed, attribute reviews to named productions or move to testimonial-only markup.
3. **Lookalike press outlets** — see recon #5. Recommend replacing those two press-kit cards with verifiable coverage (BMC Museum, Visual Container, festival laurels) over time.
4. **Content velocity** — 4 pages is a foundation, not a moat. The moat forms when the Codex reaches 6–10 spokes and the terminology starts getting quoted.
5. **MusicGroup swap** — if any rich result regressed after the LocalBusiness removal, restore LocalBusiness *with* a valid `PostalAddress` (not applicable today; no address exists by design).

### Next iteration triggers

- New pages not indexed within 14 days → request indexing via GSC / Bing Webmaster, re-submit sitemap.
- Codex spokes: publish next essay when flagship page has been crawled and shows impressions (GSC) — keep velocity natural, 1–2/month.
- If AI Overviews / Perplexity begin citing the flagship for "psychological horror composer" → double down: add case-study spokes ("vanishing leitmotif case studies"), expand FAQ with real Search-console query data.
- If aggregateRating snippet drops → restructure review markup per residual risk #2.
