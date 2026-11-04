#!/usr/bin/env node
/**
 * robots-parse.mjs
 * -----------------------------------------------------------------------------
 * A robots.txt parser and matcher that follows Google's published rules, not a
 * convenient approximation of them. Shared by tools/check-sitemap.mjs and
 * tools/robots.test.mjs so the pre-flight check and the regression test cannot
 * disagree about what a crawler is allowed to fetch.
 *
 * The one rule that matters most here, and that naive parsers get wrong:
 *
 *   Google uses the group whose user-agent token is the most specific match,
 *   and IGNORES `User-agent: *` completely when such a group exists. It does
 *   not merge the two. So a `Disallow:` under `*` has no effect on Googlebot
 *   once the file also has a `User-agent: Googlebot` group, and rewriting the
 *   file is the only way to notice.
 *
 * Matching inside a group is longest-match-wins, and `Allow` beats `Disallow`
 * when both match at the same length (Google's tie-break). `*` is a wildcard;
 * a trailing `$` anchors the end of the path. Everything unmatched is allowed.
 *
 * RFC 9309 fields only: `User-agent`, `Allow`, `Disallow`, `Sitemap`. Anything
 * else is reported rather than silently honoured, because Google ignores
 * fields it does not know -- a typo'd `Disalow:` reads as "allow everything".
 * -----------------------------------------------------------------------------
 */

/** Fields RFC 9309 and Google actually implement. */
const KNOWN_FIELDS = new Set(['user-agent', 'allow', 'disallow', 'sitemap']);
/** Fields honoured by some crawlers, ignored by Google; reported, not applied. */
const IGNORED_FIELDS = new Set(['crawl-delay', 'host', 'request-rate', 'visit-time', 'clean-param']);

/**
 * Parse robots.txt into groups keyed by lowercased user-agent token.
 * Consecutive `user-agent` lines share the rules that follow them, which is
 * how Google merges groups (RFC 9309 section 2.2.1).
 */
export function parseRobots(src) {
  const groups = new Map();
  const sitemaps = [];
  const problems = [];
  const notes = [];
  let current = [];

  const ensure = (token) => {
    if (!groups.has(token)) groups.set(token, { allow: [], disallow: [], crawlDelay: null });
    return groups.get(token);
  };

  // A group is one or more `user-agent` lines followed by that group's rules.
  // A rule line closes the user-agent header, so the next `user-agent` line
  // opens a NEW group rather than adding a token to the previous one (RFC 9309
  // section 2.2.1). Without this, `User-agent: *` / `Disallow: /` followed by
  // `User-agent: Googlebot` would attach the wildcard's rules to Googlebot.
  let headerOpen = false;

  src.split(/\r?\n/).forEach((rawLine, index) => {
    const lineNo = index + 1;
    const line = rawLine.replace(/#.*$/, '').trim();
    if (!line) return;

    const colon = line.indexOf(':');
    if (colon === -1) {
      problems.push(`line ${lineNo}: "${line}" has no field separator`);
      return;
    }
    const field = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();

    if (field === 'user-agent') {
      if (!value) problems.push(`line ${lineNo}: empty User-agent`);
      if (!headerOpen) current = [];
      headerOpen = true;
      current.push(value.toLowerCase());
      ensure(value.toLowerCase());
      return;
    }

    if (field === 'sitemap') {
      sitemaps.push(value);
      return;
    }

    if (IGNORED_FIELDS.has(field)) {
      notes.push(`line ${lineNo}: ${field} is ignored by Google and Bing`);
      return;
    }

    if (!KNOWN_FIELDS.has(field)) {
      problems.push(`line ${lineNo}: unknown field "${field}" is ignored by crawlers`);
      return;
    }

    if (!current.length) {
      problems.push(`line ${lineNo}: ${field} appears before any User-agent`);
      return;
    }

    if (!value.startsWith('/')) {
      problems.push(`line ${lineNo}: ${field} "${value}" must be a path starting with /`);
      return;
    }
    if (/^https?:/i.test(value)) {
      problems.push(`line ${lineNo}: ${field} must be a path, not an absolute URL`);
      return;
    }

    headerOpen = false;
    for (const token of current) ensure(token)[field].push(value);
  });

  for (const [token, group] of groups) {
    if (!group.allow.length && !group.disallow.length) {
      // Legal and means "no restriction", but it is almost always a half-written
      // rule, so it is surfaced instead of assumed.
      notes.push(`group "${token}" has no Allow or Disallow rules`);
    }
  }

  return { groups, sitemaps, problems, notes };
}

/** Strip a version suffix so "Googlebot/2.1" matches the "googlebot" group. */
const productToken = (ua) => ua.split('/')[0].trim().toLowerCase();

/**
 * The group Googlebot (or any crawler) actually obeys: the most specific
 * matching token, falling back to `*` only when nothing specific matches.
 */
export function selectGroup(robots, ua) {
  const token = productToken(ua);
  if (robots.groups.has(token)) return { token, group: robots.groups.get(token) };
  const wildcard = robots.groups.get('*');
  return wildcard ? { token: '*', group: wildcard } : null;
}

/** Wildcard path matching: `*` matches any run of characters, trailing `$` anchors. */
function ruleMatches(rule, target) {
  const anchored = rule.endsWith('$');
  const pattern = anchored ? rule.slice(0, -1) : rule;
  if (pattern === '') return true;
  const body = pattern
    .split('*')
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
    .join('.*');
  return new RegExp(`^${body}${anchored ? '$' : ''}`).test(target);
}

/** Longest match wins; `Allow` beats `Disallow` on an equal-length match. */
export function isAllowed(robots, ua, pathnameAndQuery) {
  const selected = selectGroup(robots, ua);
  if (!selected) return true;
  let best = null;
  for (const [type, rules] of [['allow', selected.group.allow], ['disallow', selected.group.disallow]]) {
    for (const rule of rules) {
      if (!ruleMatches(rule, pathnameAndQuery)) continue;
      const score = rule.replace(/\*/g, '').length;
      if (!best || score > best.score || (score === best.score && type === 'allow')) {
        best = { score, type };
      }
    }
  }
  return best ? best.type !== 'disallow' : true;
}

/**
 * File-level audit: problems that make a real crawler misread the file rather
 * than merely dislike it. A byte-order mark or CRLF is not fatal, but it is
 * reported because it changes what the first and last lines parse as.
 */
export function auditRobots(src) {
  const problems = [];
  const notes = [];
  if (src.charCodeAt(0) === 0xfeff) problems.push('file starts with a UTF-8 byte-order mark');
  if (/\r/.test(src)) notes.push('file uses CRLF line endings');
  if (!src.endsWith('\n')) notes.push('file does not end with a newline');
  if (Buffer.byteLength(src, 'utf8') > 500 * 1024) problems.push('file exceeds the 500 KiB crawl limit');
  if (/^\s*noindex\s*:/im.test(src)) problems.push('"noindex:" is not a robots.txt directive; use X-Robots-Tag');
  if (/^\s*disallow\s*:\s*$/im.test(src)) notes.push('an empty "Disallow:" line disallows nothing');
  const parsed = parseRobots(src);
  return { problems: [...problems, ...parsed.problems], notes: [...notes, ...parsed.notes], robots: parsed };
}
