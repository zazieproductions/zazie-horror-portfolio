# SEO overhaul and crawl audit

**Property:** `https://horror.zazieproductions.com`  
**Audit/build date:** 2026-09-15 (UTC)  
**Scope:** crawl architecture, indexable HTML, technical signals, search intent, structured data, media discoverability, performance, and conversion paths.

## Executive result

The repository is a static deployment containing one React-rendered portfolio shell, hashed JS/CSS, 29 local audio files, 7 film-sample thumbnails, 8 poster assets, and third-party portfolio/press links. Before this pass, all substantial material was concentrated in `/index.html`; the only sitemap URL was the home page, and the HTML shell contained unsupported rating/review schema and anonymous testimonials.

The site now has an intentional, finite discovery architecture:

- One broad home/entity page for the portfolio and artist identity.
- Four distinct service/discipline pages: horror scoring, psychological horror scoring, experimental sound design, and dark ambient/industrial score work.
- One selected-project archive and one crawlable audio-reel page.
- Biography/credits, process, press/media, and contact pages.
- A sitemap index with three logical child sitemaps, canonical trailing-slash URLs, redirects for the old `/index.html` duplicate and no-slash route variants, and no raw audio or technical endpoints in the sitemap.
- A static specialist-page navigation block outside the React mount, plus contextual hub-and-spoke links inside every SEO page. This means discovery does not depend on client-side rendering.

No doorway/city pages, hidden keyword blocks, cloaked content, fake reviews, fabricated awards, fabricated ratings, or scraped content were added. The old anonymous review/aggregate-rating block was removed from the rendered app and crawlable shell.

## 1. Initial crawl and route/content inventory

### Pre-change crawl findings

| URL / asset family | Pre-change status | Finding | Action |
|---|---:|---|---|
| `/` | 200 | One very large React portfolio page with hash sections; broad intent mixed with conversion copy | Retained as the entity/discovery hub; metadata and schema rewritten; new pages linked from a static network block |
| `/index.html` | 200 candidate | Duplicate of `/` on a static host | Added `301` redirect to `/` |
| `#showreel`, `#work`, `#services`, `#about`, `#press`, `#contact`, etc. | Fragment only | Useful navigation targets, not indexable URLs or sitemap candidates | Kept for the app UX; indexable intent now gets its own URL |
| `/audio/track-00.mp3` through `/audio/track-28.mp3` | Binary media | No surrounding standalone HTML; raw files are not useful search landing pages | Excluded from sitemap; allowed to load from `/reel/`; `X-Robots-Tag: noindex` added for raw files |
| `/images/*` | Image assets | Mostly used in the one shell; several filenames are opaque YouTube IDs | Preserved existing files to avoid breaking references; all important new-page images have dimensions, meaningful alt text, and lazy loading below the fold |
| YouTube / IMDb / Bandcamp / Spotify / Apple Music / LinkedIn / press URLs | External | Outbound references, not pages owned by this property | Kept as legitimate references; no external URL appears as a canonical or sitemap `<loc>` |
| Query strings | No search route | No evidence of a useful internal search experience; query duplicates could be created by campaigns or parameters | Canonicals remain path-only; no parameterized URL is in any sitemap; `/search` and `/?s=` are disallowed |
| Trailing slashes | Inconsistent risk | Static directory routes can be requested with and without a slash | Added explicit no-slash → slash redirects for all new directory routes |
| Redirect/error/dev/private routes | None useful | The previous catch-all served the shell for unknown paths, making accidental soft-404s possible | The catch-all SPA fallback was removed so an unknown path can return a real 404 instead of a soft duplicate of the home page. |

### Current indexable URL inventory

| Canonical URL | Primary intent | Evidence/content on page | Schema |
|---|---|---|---|
| `/` | Zazie Productions horror-composer discovery hub | Home hero, reel teaser, film samples, film wall, service overview, biography, press, contact | `Person`, `Organization`, `WebSite`, `WebPage`, `ItemList` |
| `/scoring/` | Horror film composer / custom horror soundtrack | Original music to picture, delivery, independent-film and supervisor paths | `Service`, `WebPage`, `BreadcrumbList` |
| `/psychological-horror-scoring/` | Psychological horror / thriller composer | Silence, motif, dissociation, tension, cue examples | `Service`, `WebPage`, `BreadcrumbList` |
| `/experimental-sound-design/` | Horror sound designer / experimental audiovisual sound | Struck strings, bowed metal, synthesis, noise-informed texture, scope boundaries | `Service`, `WebPage`, `BreadcrumbList` |
| `/dark-ambient-industrial-score/` | Dark ambient / industrial horror music | Drones, pulses, acoustic unease, industrial/noise vocabulary | `Service`, `WebPage`, `BreadcrumbList` |
| `/projects/` | Selected horror projects / portfolio proof | 7 picture-linked samples, 6 additional film-wall references, role caveats | `ItemList`, `VideoObject`, `WebPage`, `BreadcrumbList` |
| `/reel/` | Audio reel / horror soundtrack composer | 29 titled audio controls with cue labels, descriptions, and local sources | `MusicPlaylist`, `MusicRecording`, `WebPage`, `BreadcrumbList` |
| `/about/` | Composer biography / credits / entity resolution | Authorship, practice areas, IMDb and legitimate artist profiles | `Person`, `WebPage`, `BreadcrumbList` |
| `/process/` | How I score horror / informational support | Brief, spotting, palette, composition, revisions, delivery | `Article`, `WebPage`, `BreadcrumbList` |
| `/press/` | Media / press reference | Four existing third-party links, source-first wording | `WebPage`, `BreadcrumbList` |
| `/contact/` | Commercial conversion | Email inquiry, brief requirements, visible FAQ, service routing | `ContactPage`, `WebPage`, `BreadcrumbList` |

All 11 canonical URLs are linked from at least one crawlable HTML page. Raw audio, CSS, JS, images, sitemap documents, and external sites are intentionally not indexable landing pages.

## 2. Sitemap and robots strategy

- `sitemap.xml` is now a valid sitemap index at the canonical origin.
- Child files are split by operational purpose:
  - `sitemap-core.xml`: home, biography, process, press, contact.
  - `sitemap-services.xml`: four distinct commercial/discipline pages.
  - `sitemap-projects.xml`: selected projects and audio reel, including useful project images.
- Every `<loc>` is an absolute canonical URL with a trailing slash. No fragment, query string, redirect, raw audio URL, image-only URL, or external URL is listed.
- `<lastmod>2026-09-15</lastmod>` is used for pages changed in this build; it is based on the current repository build date/Git checkout date, not invented content history. No `priority` or `changefreq` is used.
- `robots.txt` advertises only the sitemap index. It does not block CSS, JS, images, or audio required by the crawlable pages. Raw audio is excluded from indexing by `_headers`, not hidden from the page’s media player.
- `_redirects` normalizes `/index.html` and no-slash directory variants before the SPA fallback.

Production verification still required after deployment: request every sitemap URL with `curl -I`, confirm `200`, inspect the final canonical after redirects, and run the production sitemap through Google Search Console/Bing Webmaster Tools. A local static-server smoke test and HTML metadata audit passed in this checkout.

## 3. Search-intent and internal-link architecture

| Cluster | Primary URL | Supporting URLs / anchors |
|---|---|---|
| Horror film composer; independent horror film composer; custom horror soundtrack | `/scoring/` | `/projects/`, `/reel/`, `/process/`, `/contact/` |
| Psychological horror composer; psychological thriller composer; experimental horror score | `/psychological-horror-scoring/` | Cue anchors on `/reel/`, `/dark-ambient-industrial-score/`, `/process/` |
| Horror sound designer; analog horror sound design; found-footage horror music | `/experimental-sound-design/` | `/reel/`, `/projects/`, `/contact/`; page explicitly distinguishes score, design, Foley, and production sound |
| Dark ambient composer; dark ambient film scoring; industrial horror music; noise-influenced film score | `/dark-ambient-industrial-score/` | Named drone/pulse/waterphone cue anchors on `/reel/`; `/psychological-horror-scoring/` |
| Horror soundtrack composer; atmospheric horror composer | `/reel/` and `/scoring/` | `/projects/`, `/contact/`, semantic cue descriptions |
| Selected horror projects / film credits | `/projects/` | `/about/`, `/press/`, `/reel/` |
| Composer biography / credits / entity | `/about/` | IMDb, Spotify, Bandcamp, Apple Music, YouTube, LinkedIn; `/press/` |
| Process / how I score horror | `/process/` | Every service page and `/contact/` |
| Press and media | `/press/` | `/about/`, `/projects/`, `/reel/` |
| Hire / scoring inquiry | `/contact/` | Routed from every commercial page and footer |

The architecture deliberately uses descriptive anchors such as “psychological horror scoring,” “dark ambient and industrial score work,” “selected horror projects,” and “how the score is developed.” Generic “learn more” links were not used on the new pages.

### Competitive/content gaps addressed

The former one-page shell did not clearly own the combinations a specialist should plausibly cover. The new pages create useful, non-duplicative surfaces for:

- psychological horror + restrained tension + unstable motifs;
- analog/found-footage texture + composed sound design + clear score/design boundaries;
- dark ambient + industrial/noise-informed film music;
- horror subgenre + material technique (waterphone, struck/bowed material, custom synthesis, drones, pulses);
- independent horror scoring + spotting and delivery process;
- audio cue discovery with descriptions rather than an unlabeled player wall.

Future opportunities are intentionally conditional, not mass-generated: publish an individual case study only when a real brief, credit, role, date, and permitted excerpt exist; add transcripts for actual interviews/video; add a glossary only if it contains useful original explanations; add individual cue URLs only if each cue can support genuinely unique editorial text and stable ownership metadata.

## 4. On-page and SERP-snippet audit

Every new HTML page was checked for:

- exactly one visible H1;
- a distinct title, 39–70 characters in this build;
- a distinct meta description, 156–176 characters in this build;
- path-only canonical;
- Open Graph title/description/url/image/alt;
- Twitter card/title/description/image;
- crawlable introductory copy above the main content;
- BreadcrumbList JSON-LD plus visible breadcrumbs;
- contextual links to related services, projects, reel, process, press, and contact where relevant;
- width/height on important images, descriptive alt text, and `loading="lazy"` below the fold;
- visible audio titles and descriptions around every local audio player.

The home title now leads with the artist/organization and specialist category instead of unsupported “award-winning” and scarcity language. The site-wide claims cleanup removed the prior anonymous four-review block, aggregate rating, rating stars, and rating schema. Existing price/scope copy remains in the pre-existing commercial app, but it is not represented as an `Offer`, `PriceSpecification`, rating, award, or review in the new structured data.

## 5. Structured-data policy

Implemented only where the page visibly supports the entity or work:

- `Person` and `Organization` are connected by stable `@id` values.
- `sameAs` is limited to the six artist/profile destinations already linked in the portfolio.
- `WebSite` and `WebPage` are used for the property and each canonical page.
- `BreadcrumbList` appears on every new route.
- `Service` appears on the four service pages.
- `VideoObject` and `ItemList` appear on the selected-project archive using the existing thumbnails and external video URLs.
- `MusicPlaylist`/`MusicRecording` appears on the audio-reel page using the existing 29 cue names, local audio URLs, and source durations already present in the app data.
- `Article` appears only on the process page, where there is actual instructional editorial content.
- `ContactPage` appears only on the contact route.

Intentionally removed from the old root schema: `AggregateRating`, anonymous `Review` objects, unverified award properties, `LocalBusiness`, invented pricing offers, fabricated client/credit enrichment, and unsupported release/performance claims.

## 6. Performance/crawl-efficiency changes

- Below-fold YouTube and Bandcamp iframes now use lazy loading and an `IntersectionObserver` with a 400px prefetch margin; the prior one-second “load every iframe” behavior was removed.
- The audio reel uses `preload="none"` so 29 MP3s do not download on first paint.
- New pages use one small shared local stylesheet rather than importing another JS runtime.
- Important images include intrinsic dimensions to reduce layout shift. Hero imagery is preloaded only on the home page/large viewport.
- The new pages are server-delivered static HTML. Important text, headings, links, schema, and media descriptions do not depend on React hydration.
- Raw MP3s stay out of the sitemap and receive `X-Robots-Tag: noindex`; the audio-reel HTML remains crawlable and indexable.
- Existing large poster files were not recompressed in this pass because changing or renaming them without a source build could break the deployed app. The next production pass should generate AVIF/WebP variants and use `srcset`/`sizes` if the hosting pipeline supports it.

## 7. Validation performed

- `node --check index-daKuu3pI.js` passed after the lazy-embed and trust-signal changes.
- Local static-server requests returned content for `/`, `/scoring/`, and the generated route directories.
- All 11 sitemap URLs are present as internal `href` values in crawlable HTML.
- All 11 generated pages have one H1, a canonical, an OG block, a Twitter block, and parseable JSON-LD.
- Sitemap XML is split without `priority` or `changefreq`; raw media is omitted.
- No unsupported review/rating/award strings remain in the rendered root shell or application bundle.

## 8. Post-deploy checklist

1. `curl -I` every sitemap URL and each no-slash redirect; confirm final URL, status, and `Content-Type`.
2. Run the sitemap index through XML validation and submit it in Search Console/Bing Webmaster Tools.
3. Inspect the rendered home page after React mounts: navigation, audio player, poster wall, contact flow, and lazy iframes.
4. Run Lighthouse/PageSpeed on `/`, `/projects/`, `/reel/`, and `/contact/`; check LCP, CLS, INP, iframe cost, and mobile tap targets.
5. Use Rich Results Test/schema validation for `Person`, `BreadcrumbList`, `VideoObject`, `MusicRecording`, and `Article`; eligibility is not guaranteed for every schema type.
6. Verify the six `sameAs` profiles still belong to the artist and remove any link that cannot be confirmed.
7. Replace any remaining portfolio-listed but unverified credit wording with source-confirmed role/date information before publishing individual project case studies.
