# robots.txt — what it can and cannot do for Google

> **Scope.** An audit of `robots.txt` against the symptom "the site ranks in
> DuckDuckGo but not in Google", what was actually wrong in the file on
> **2026-11-04**, what changed, and the parts of that symptom `robots.txt` has
> no power over.
>
> Companion to [Google indexing](indexing.md), which records the live edge
> behaviour, the stale index entry for `/` and the duplicate `*.pages.dev`
> host.

---

## 1. The short answer

`robots.txt` **cannot** make a page rank well in one engine and badly in
another, and it cannot make a page rank at all. It has exactly one job: tell a
crawler which URLs it may request. It carries no ranking signal, no hint, no
priority, and Google has said plainly that
[`Google-Extended`](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers)
— the only Google directive in this file that people mistake for a ranking
lever — "does not impact a site's inclusion in Google Search nor is it used as
a ranking signal in Google Search".

So the honest diagnosis of "high on DuckDuckGo, invisible on Google" is **not**
a robots.txt block. A block would remove the site from DuckDuckGo too (Bing
powers it, and Bingbot reads the same file). What a wrong robots.txt produces
is one of two things:

- **a page nobody can crawl anywhere**, or
- **a page only some crawlers can crawl**, which is a duplicate-content mess,
  not a ranking difference.

The audit below found no block. It found four small correctness defects, one
real bug in the tool that was supposed to catch a block, and a genuine
Google-versus-Bing asymmetry that lives outside this repository's control
(§4).

---

## 2. What the audit found

| # | Finding | Effect on Google | Fix |
|---|---|---|---|
| 1 | `DuckDuckBot` was not named; only `DuckAssistBot` was | none (the `*` group allowed it anyway) | named, alongside `DuckAssistBot` |
| 2 | `Google-Extended` sat under a comment reading *"Search & AI Overviews"* | none, but the comment invited the exact misreading in §1 | given its own comment: training and Gemini grounding only, not Search |
| 3 | `Googlebot-Image` was not named | none (`*` covered it) | named, so image crawling is on the record too |
| 4 | Retired Anthropic tokens `anthropic-ai` and `Claude-Web` were still listed, and `Claude-SearchBot` / `Claude-User` were missing | none | tokens updated |
| 5 | `tools/check-sitemap.mjs` modelled robots group selection **wrongly** (§3) | none today — but it would have passed a file that blocks Googlebot | replaced with `tools/robots-parse.mjs`, which follows Google's rules, plus `tools/robots.test.mjs` |

Nothing in the file was ever `Disallow`ed, and nothing is now. That is
deliberate and it is the single most important property of the file: every
`Disallow:` that covers a page you want ranked removes it from the index, and
on a site with 80 routes there is no route that is not meant to be found.

### What the file looks like now

```text
User-agent: *
Allow: /

User-agent: Googlebot
Allow: /
…
Sitemap: https://horror.zazieproductions.com/sitemap.xml
```

Every group is `Allow: /`, `*` exists as the catch-all, the only fields used are
`User-agent`, `Allow` and the host-scoped `Sitemap`, and `Crawl-delay` / `Host`
/ `noindex:` are deliberately absent — Google and Bing ignore the first two, and
`noindex:` is not a robots.txt directive at all.

The file is generated. Edit `src/data/robots.ts` and run
`node scripts/generate-sitemap.mjs`; never hand-edit `robots.txt`. The new
regression test fails the build if the committed file and the source disagree.

---

## 3. The one precedence rule that silently deindexes sites

This is the rule the old checker got wrong, and it is the reason a robots.txt
can look correct and mean the opposite:

> Google obeys **only the most specific group that matches it**. When a
> `User-agent: Googlebot` group exists, the `User-agent: *` group is ignored
> for Googlebot entirely — the two are *not* merged.

Which means this file blocks Google from the whole site while leaving Bing,
DuckDuckGo and every other crawler untouched:

```text
User-agent: *
Allow: /

User-agent: Googlebot
Disallow: /
```

That is precisely the shape that produces "it is indexed in DuckDuckGo and not
in Google", and it is invisible to any checker that merges the two groups or
reads the file top-to-bottom. Within a group the second rule is longest match
wins, with `Allow` beating `Disallow` on an equal-length tie.

The pre-flight checker could not see this. Its matcher **merged** the `*` and
`Googlebot` groups and then applied longest-match across the union, so for the
file above both rules scored 1 and the equal-length tie broke for `Allow`: it
reported the file as safe for Googlebot while Googlebot was blocked on all 80
URLs. Verified on 2026-11-04 by writing that file to the site root and running
`node tools/check-sitemap.mjs`: it printed `PASS` before the change, and after
the change it prints `blocked for User-agent: googlebot` against every route.

`tools/robots-parse.mjs` now implements both rules (specific group wins,
wildcard ignored once one matches; longest match, `Allow` on ties) and
`tools/robots.test.mjs` asserts them against synthetic files, so the checker
cannot drift back into agreeing with a broken file.
`tools/check-sitemap.mjs` evaluates **every** named group against all 80
sitemap URLs instead of only `*` and `Googlebot`, and runs a whole-file audit
(BOM, CRLF, unknown or ignored directives, rules before any `User-agent`,
absolute URLs in `Allow`/`Disallow`).

---

## 4. What actually differs between DuckDuckGo and Google here

Not the robots.txt. These three things are, in order of how much they explain
the gap:

1. **This site pushes to Bing and DuckDuckGo, and only waits for Google.**
   `.github/workflows/indexnow.yml` submits every changed URL to `api.indexnow.org`
   after each deploy, and IndexNow fans that out to Bing (which supplies
   DuckDuckGo's organic results), Yandex, Seznam and Naver. Google is not an
   IndexNow participant and has no equivalent push API. Its only discovery
   channel from this repository is the `Sitemap:` line above. That asymmetry is
   the whole answer to "why does DuckDuckGo know about this page and Google not
   yet": one engine was told, the other has to be found.
2. **Nothing in the repository proves Search Console ownership.** There is no
   `google-site-verification` meta tag and no Google verification file in the
   tree — only the IndexNow key (`<32 hex>.txt`). Search Console is where a
   crawl problem, a manual action, or a "Discovered — currently not indexed"
   decision is actually visible, and until the property is verified that
   information does not exist. Verify it by DNS TXT or by the HTML file, not by
   a tag that a build then has to keep in sync.
3. **The structured data makes claims Google's systems are designed to
   discount.** The home page's JSON-LD carries an `award` array including
   "Golden Bloody Globes" and four `subjectOf` articles whose hosts include
   `billboardwire.com`, `grammyweekly.com` and `limitless-magazine.com` —
   press-release wire domains rather than publications. Bing parses the markup
   and moves on; Google's quality systems treat invented or self-published
   credibility signals as a trust problem. This is an editorial decision, not a
   bug, so it is listed and not changed: see [indexing.md](indexing.md) §5 step 5.

The duplicate `*.pages.dev` host (§4 of [indexing.md](indexing.md)) is a fourth
factor and is deliberately **left crawlable**: a crawler that cannot fetch the
`pages.dev` copy cannot see its self-referencing canonical, and the consolidation
onto the custom domain stops working. Do not "fix" it with a `Disallow:`.

---

## 5. Re-verify

```bash
# offline: form, precedence, and every sitemap URL against every group
node tools/check-sitemap.mjs
node --test tools/robots.test.mjs

# the file the crawler actually receives (robots.txt is cached up to 24h by
# Google, and this zone's edge rewrites its cache lifetime -- see indexing.md §1)
curl -s https://horror.zazieproductions.com/robots.txt

# Google's own view: Search Console → Settings → robots.txt report.
# A fetch error there is treated as "no restrictions" for up to 30 days, so a
# 5xx on this path is worse than a permissive file.
```

---

## 6. What not to do

- **Do not `Disallow:` anything to "consolidate" or "clean up".** Use the
  canonical and the redirects; those are in `_headers` and `_redirects` and are
  already correct.
- **Do not give `Googlebot` a group with different rules than `*`.** Either
  every rule is repeated inside the Googlebot group, or the group goes. Half
  a rule is a silent exclusion.
- **Do not use `robots.txt` to block `/*?*` parameter URLs.** Google must be
  able to fetch a URL to see its canonical.
- **Do not `Disallow:` the `pages.dev` twin** for the reason in §4.
- **Do not add `Crawl-delay`.** Google and Bing ignore it; it only makes the
  file look authoritative about something it does not do.
- **Do not block `Google-Extended` expecting a Search effect, and do not allow
  it expecting one.** It controls Gemini training and grounding; allowing it is
  correct here because it makes the site eligible for citation in Gemini, but
  it will not move a single Google ranking.
