/**
 * Canonical robots.txt contents for horror.zazieproductions.com.
 *
 * Explicitly welcomes both traditional search crawlers and generative search /
 * answer-engine crawlers while keeping all public archive routes crawlable.
 * Only standard RFC 9309 directives are emitted so Google Search Console
 * reports zero syntax warnings.
 *
 * Machine-readable LLM summaries:
 * - https://horror.zazieproductions.com/llms.txt
 * - https://horror.zazieproductions.com/llms-full.txt
 */

export const ROBOTS_TXT = `# robots.txt for horror.zazieproductions.com
# Official portfolio and scoring commission site of Zazie Kanwar-Torge (Zazie Productions LLC)
# Machine-readable LLM summaries: https://horror.zazieproductions.com/llms.txt | https://horror.zazieproductions.com/llms-full.txt

User-agent: *
Allow: /

# Search & AI Overviews (Google / Gemini)
User-agent: Googlebot
Allow: /

User-agent: Googlebot-Image
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: GoogleOther
Allow: /

# OpenAI Search & ChatGPT
User-agent: OAI-SearchBot
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

# Perplexity Search & Answer Engine
User-agent: PerplexityBot
Allow: /

User-agent: Perplexity-User
Allow: /

# Anthropic Claude Search & Web Fetch
User-agent: ClaudeBot
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: anthropic-ai
Allow: /

# Microsoft Bing / Copilot, Apple Intelligence & DuckAssist
User-agent: Bingbot
Allow: /

User-agent: Applebot
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: DuckAssistBot
Allow: /

User-agent: Amazonbot
Allow: /

User-agent: Meta-ExternalAgent
Allow: /

User-agent: Cohere-ai
Allow: /

# Public archive routes, including their 404 responses, remain crawlable.
Sitemap: https://horror.zazieproductions.com/sitemap.xml
`;

export const robotsTxt = ROBOTS_TXT;
