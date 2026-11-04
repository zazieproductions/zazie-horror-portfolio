/** Parse crawler groups and sitemap declarations from robots.txt. */
export function parseRobots(src) {
  const groups = new Map();
  const sitemaps = [];
  let agents = [];
  let hasRules = false;
  for (const rawLine of src.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim();
    const i = line.indexOf(':');
    if (i < 0) continue;
    const field = line.slice(0, i).trim().toLowerCase();
    const value = line.slice(i + 1).trim();
    if (field === 'user-agent' && value) {
      if (hasRules) agents = [];
      hasRules = false;
      const agent = value.toLowerCase();
      agents.push(agent);
      if (!groups.has(agent)) groups.set(agent, []);
    } else if (field === 'allow' || field === 'disallow') {
      hasRules = true;
      // An empty rule has no effect, not a match for every URL.
      if (value) for (const agent of agents) groups.get(agent).push({ type: field, path: value });
    } else if (field === 'sitemap') {
      sitemaps.push(value);
    }
  }
  return { groups, sitemaps };
}

/** Apply Google's most-specific user-agent and longest-path matching rules. */
export function isAllowed(robots, userAgent, url) {
  const agent = userAgent.toLowerCase();
  const matches = [...robots.groups.keys()].filter((key) => key !== '*' && agent.includes(key));
  const longest = Math.max(0, ...matches.map((key) => key.length));
  const selected = longest ? matches.filter((key) => key.length === longest) : ['*'];
  const target = url.pathname + url.search;
  let best = null;
  for (const key of selected) {
    for (const rule of robots.groups.get(key) ?? []) {
      const end = rule.path.endsWith('$');
      const pattern = end ? rule.path.slice(0, -1) : rule.path;
      const escaped = pattern.split('*').map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*');
      if (!new RegExp(`^${escaped}${end ? '$' : ''}`).test(target)) continue;
      const length = pattern.replace(/\*/g, '').length;
      if (!best || length > best.length || (length === best.length && rule.type === 'allow')) {
        best = { length, type: rule.type };
      }
    }
  }
  return !best || best.type === 'allow';
}
