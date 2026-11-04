/**
 * Canonical robots.txt contents for horror.zazieproductions.com.
 *
 * The file is generated from this constant by scripts/generate-sitemap.mjs and
 * written to the site root as robots.txt, so this is the only place to edit.
 * tools/robots.test.mjs fails the build if the committed robots.txt and this
 * constant ever disagree.
 *
 * WHAT ROBOTS.TXT CAN AND CANNOT DO
 *
 * robots.txt controls crawling, not ranking. Every removed page is a page a
 * search engine cannot see, so this file removes nothing: a `Disallow:` rule
 * that covers a page you want ranked is the fastest way to fall out of Google
 * while staying in Bing, which re-fetches on push (IndexNow) rather than on a
 * crawl schedule.
 *
 * The rules below therefore do one thing: name the crawlers whose access this
 * site wants on the record. `User-agent: *` already allows everything, so a
 * crawler that is not named here is still fully welcome, and deleting any
 * named group would not change what that crawler may fetch.
 *
 * Only RFC 9309 fields are used: `User-agent`, `Allow`, and the host-scoped
 * `Sitemap`. `Crawl-delay` is ignored by Google and Bing, and `Host` is a
 * Yandex-only field; both are deliberately absent so Search Console reports
 * zero syntax warnings.
 *
 * GOOGLE: SEARCH AND AI ARE SEPARATE TOKENS
 *
 * `Googlebot` fetches for Google Search. `Google-Extended` is not a crawler:
 * it controls only whether Google may use this site's text for Gemini /
 * Vertex generative training and grounding. It does not affect Search
 * ranking, indexing, or the pages shown in AI Overviews. Both are allowed
 * here, and neither is a ranking lever in either direction.
 *
 * Machine-readable LLM summaries:
 * - https://horror.zazieproductions.com/llms.txt
 * - https://horror.zazieproductions.com/llms-full.txt
 */

export const ROBOTS_TXT = `# robots.txt for horror.zazieproductions.com
# Official portfolio and scoring commission site of Zazie Kanwar-Torge (Zazie Productions LLC)
# Machine-readable LLM summaries: https://horror.zazieproductions.com/llms.txt | https://horror.zazieproductions.com/llms-full.txt
#
# Every group below is Allow: /. Nothing on this site is robots-blocked, and
# "User-agent: *" already allows any crawler not named here. Naming a crawler
# is documentation, not a ranking lever: remove a group and that crawler falls
# back to "*" and still gets Allow: /. Only RFC 9309 fields are used.

User-agent: *
Allow: /

# Google Search: the Googlebot groups. Google-Extended is NOT Search -- it only
# controls Gemini / Vertex training and grounding, so it neither helps nor
# hurts a ranking or an AI Overview.
User-agent: Googlebot
Allow: /

User-agent: Googlebot-Image
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: GoogleOther
Allow: /

# Microsoft Bing / Copilot, Apple Intelligence, DuckDuckGo and Amazon.
# DuckDuckBot is the DuckDuckGo search crawler; DuckAssistBot is its
# AI-assistant fetcher. Both are named because DuckDuckGo and Bing re-fetch on
# an IndexNow push, which is a different schedule from Google's crawl queue.
User-agent: Bingbot
Allow: /

User-agent: DuckDuckBot
Allow: /

User-agent: DuckAssistBot
Allow: /

User-agent: Applebot
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: Amazonbot
Allow: /

# OpenAI: OAI-SearchBot indexes for ChatGPT search, GPTBot is model training,
# ChatGPT-User is a person asking ChatGPT to open this URL.
User-agent: OAI-SearchBot
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

# Perplexity: PerplexityBot indexes, Perplexity-User fetches on a live request.
User-agent: PerplexityBot
Allow: /

User-agent: Perplexity-User
Allow: /

# Anthropic: ClaudeBot is model training, Claude-SearchBot indexes for Claude
# search, Claude-User fetches on a live request. The retired anthropic-ai and
# Claude-Web tokens are dropped; they now resolve to "*" above.
User-agent: ClaudeBot
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: Claude-User
Allow: /

User-agent: Meta-ExternalAgent
Allow: /

User-agent: Cohere-ai
Allow: /

# Sitemaps are host-scoped records, not part of any user-agent group (RFC 9309
# section 2.2.4), so this line applies to every crawler above. It is the only
# discovery channel Google has here -- see docs/quality/robots-txt.md.
Sitemap: https://horror.zazieproductions.com/sitemap.xml
`;

export const robotsTxt = ROBOTS_TXT;
