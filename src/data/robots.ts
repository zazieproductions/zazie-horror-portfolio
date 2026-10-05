/** Crawl access for all public routes, with the XML sitemap advertised. */

export const robotsTxt = String.raw`# robots.txt for horror.zazieproductions.com
User-agent: *
Allow: /

# Public archive routes, including their 404 responses, remain crawlable.
Sitemap: https://horror.zazieproductions.com/sitemap.xml
`;
