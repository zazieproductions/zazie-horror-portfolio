/** Structural release check shared by the live audit and its offline tests.
 * The static band must survive the React mount, so inspect both shipped paths.
 * No browser/runtime dependency: the generated band has one non-nested div.
 */
const MARKS = [
  'Golden Bloody Globes',
  'Re:Fract Festival',
  'PVTV Fringe Flicks',
  'Pebbles Underground',
];

export function homeBundlePath(html) {
  return /import\("(\/index-[0-9a-f]{8}\.js)"\)/.exec(html)?.[1] ?? null;
}

export function homepageReleaseProblems(html, bundle) {
  const problems = [];
  const bands = html.match(/<div\b[^>]*class="[^"]*\bzp-hero-laurels\b[^"]*"[^>]*>[\s\S]*?<\/div>/g) ?? [];
  if (bands.length !== 1) problems.push(`expected one .zp-hero-laurels band in live HTML, found ${bands.length}`);
  const band = bands[0] ?? '';
  if (band) {
    const links = band.match(/<span\b[^>]*role="listitem"[^>]*>/g) ?? [];
    if (links.length !== 4) problems.push(`expected four laurel marks, found ${links.length}`);
    for (const mark of MARKS) {
      if (!links.some((link) => link.includes(`aria-label="${mark}`))) problems.push(`live HTML is missing the ${mark} laurel`);
    }

    const heroAt = html.indexOf('<section id="top"');
    const bandAt = html.indexOf(band);
    const headlineAt = html.indexOf('<h1');
    if (!(heroAt >= 0 && heroAt < headlineAt && headlineAt < bandAt)) problems.push('live laurels must follow the hero headline');
  }
  if (!bundle.includes('zp-hero-laurels')) problems.push('the live React bundle does not render .zp-hero-laurels');
  for (const mark of MARKS) {
    if (!bundle.includes(mark)) problems.push(`the live React bundle is missing ${mark}`);
  }
  return problems;
}
