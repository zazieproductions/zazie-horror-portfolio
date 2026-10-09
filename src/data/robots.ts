/** Crawl access for all public routes, with the XML sitemap advertised. */

export const robotsTxt = String.raw`# robots.txt for horror.zazieproductions.com
User-agent: *
Allow: /
# Self hosted film samples are portfolio material, not published media:
# nothing under /media is listed in the sitemap, linked from a page or
# intended for a search result (the _headers rule adds X-Robots-Tag: noindex).
Disallow: /media/

# Public archive routes, including their 404 responses, remain crawlable.
Sitemap: https://horror.zazieproductions.com/sitemap.xml
`;
