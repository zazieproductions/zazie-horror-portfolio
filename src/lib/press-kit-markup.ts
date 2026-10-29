/**
 * Shared HTML + scoped CSS for the homepage Electronic Press Kit (`#press`).
 *
 * Consumed by `home-src/build.mjs` so static first-paint HTML in `index.html`
 * and the hydrated React component `I5()` in `index-<hash>.js` render identical
 * markup with zero hydration mismatch and zero layout shift.
 *
 * Copy hygiene: avoid raw em-dashes (`\u2014`) so `scripts/normalize-site-copy.mjs`
 * leaves `index.html` byte-identical to the bundle string.
 */

export const PRESS_SECTION_CLASS =
  'zp-pk-section relative overflow-hidden border-y border-blood/20 bg-ink py-20 sm:py-28 md:py-32';

export const PRESS_CONTAINER_CLASS = 'mx-auto max-w-6xl px-5 sm:px-6 relative z-10';

function fmt(n: number): string {
  return Number(n.toFixed(2)).toString();
}

/**
 * Generates an organic sculpted almond/olive leaf SVG path centered at (0,0)
 * pointing along +Y of length `len` and half-width `wid`, then rotated & translated.
 */
function placedLeaf(x: number, y: number, deg: number, len: number, wid: number, curve = 0): string {
  const rad = (deg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const tx = (lx: number, ly: number): string => {
    const rx = x + lx * cos - ly * sin;
    const ry = y + lx * sin + ly * cos;
    return `${fmt(rx)} ${fmt(ry)}`;
  };
  return [
    `M ${tx(0, 0)}`,
    `C ${tx(-wid * 0.95 + curve * 0.3, -len * 0.28)}, ${tx(-wid * 0.8 + curve * 0.7, -len * 0.72)}, ${tx(curve, -len)}`,
    `C ${tx(wid * 0.8 + curve * 0.7, -len * 0.72)}, ${tx(wid * 0.95 + curve * 0.3, -len * 0.28)}, ${tx(0, 0)}`,
    'Z',
  ].join(' ');
}

/**
 * Silhouette 1: Classical Heraldic Olive & Berry Wreath (Re:Fract Festival 2025).
 * Curved elliptical boughs with 10 paired olive leaves + antique-gold berries.
 */
function buildOliveBerryWreathSvg(): string {
  const cx = 156;
  const cy = 100;
  const rx = 122;
  const ry = 78;
  const startDeg = 256;
  const endDeg = 114;
  const steps = 10;

  const a0 = (startDeg * Math.PI) / 180;
  const x0 = cx + rx * Math.cos(a0);
  const y0 = cy - ry * Math.sin(a0);

  const stemPts: string[] = [`M 192 187 Q ${fmt((192 + x0) / 2 - 6)} ${fmt(y0 + 6)} ${fmt(x0)} ${fmt(y0)}`];
  for (let i = 1; i <= 32; i++) {
    const t = i / 32;
    const a = ((startDeg + (endDeg - startDeg) * t) * Math.PI) / 180;
    const px = cx + rx * Math.cos(a);
    const py = cy - ry * Math.sin(a);
    stemPts.push(`L ${fmt(px)} ${fmt(py)}`);
  }
  const stemPath = stemPts.join(' ');

  const leafPaths: string[] = [];
  const berryEls: string[] = [];

  for (let i = 0; i < steps; i++) {
    const t = (i + 0.35) / steps;
    const aDeg = startDeg + (endDeg - startDeg) * t;
    const a = (aDeg * Math.PI) / 180;
    const px = cx + rx * Math.cos(a);
    const py = cy - ry * Math.sin(a);

    const dAdt = ((endDeg - startDeg) * Math.PI) / 180;
    const dx = -rx * Math.sin(a) * dAdt;
    const dy = -ry * Math.cos(a) * dAdt;
    const tangentDeg = (Math.atan2(dx, -dy) * 180) / Math.PI;

    const scale = 1.06 - Math.abs(t - 0.44) * 0.44;
    const len = 22.5 * scale;
    const wid = 5.6 * scale;

    leafPaths.push(placedLeaf(px, py, tangentDeg - 35, len, wid, 1.5));

    if (i < steps - 1) {
      leafPaths.push(placedLeaf(px, py, tangentDeg + 32, len * 0.88, wid * 0.86, -1.3));
    } else {
      leafPaths.push(placedLeaf(px, py, tangentDeg - 3, len * 0.94, wid * 0.82, 0.5));
    }

    if (i % 2 === 1 && i < steps - 1) {
      const bRad = ((tangentDeg - 8) * Math.PI) / 180;
      const bx = px + Math.sin(bRad) * 9.8;
      const by = py - Math.cos(bRad) * 9.8;
      berryEls.push(`<circle cx="${fmt(bx)}" cy="${fmt(by)}" r="2.2" fill="#dfc48b" />`);
    }
  }

  const leftGroup = `
    <path d="${stemPath}" fill="none" stroke="#d8be82" stroke-width="1.35" stroke-linecap="round" opacity="0.88" />
    <path d="${leafPaths.join(' ')}" fill="#f0ebe3" />
    ${berryEls.join('')}
  `;

  return `<svg class="zp-pk-laurel-svg" viewBox="0 0 360 202" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
    <g>${leftGroup}</g>
    <g transform="translate(360 0) scale(-1 1)">${leftGroup}</g>
    <circle cx="180" cy="24" r="2.2" fill="#dfc48b" opacity="0.9" />
    <text x="180" y="61" text-anchor="middle" fill="#dfc48b" font-family="Inter, system-ui, sans-serif" font-size="8.2" font-weight="600" letter-spacing="2.4">SPECIAL JURY MENTION</text>
    <line x1="126" y1="71" x2="234" y2="71" stroke="#dfc48b" stroke-opacity="0.38" stroke-width="0.8" />
    <text x="180" y="102" text-anchor="middle" fill="#f0ebe3" font-family="'Cormorant Garamond', Georgia, serif" font-size="27" font-weight="600" letter-spacing="3.2">RE:FRACT</text>
    <text x="180" y="123" text-anchor="middle" fill="#dfc48b" font-family="'Cormorant Garamond', Georgia, serif" font-size="15.5" font-weight="500" letter-spacing="4.6">FESTIVAL</text>
    <line x1="138" y1="134" x2="222" y2="134" stroke="#dfc48b" stroke-opacity="0.32" stroke-width="0.8" />
    <text x="180" y="150" text-anchor="middle" fill="#b5afa8" font-family="'JetBrains Mono', monospace" font-size="8.2" font-weight="500" letter-spacing="2.4">LJUBLJANA · 2025</text>
  </svg>`;
}

/**
 * Silhouette 2: Sleek European Cinema Palm Frond Wreath (PVTV Fringe Flicks).
 * Distinct upright swept sword-blade palm fronds + 4-point star crown.
 */
function buildCinemaPalmWreathSvg(): string {
  const cx = 158;
  const cy = 102;
  const rx = 124;
  const ry = 80;
  const startDeg = 254;
  const endDeg = 112;
  const fronds = 15;

  const a0 = (startDeg * Math.PI) / 180;
  const x0 = cx + rx * Math.cos(a0);
  const y0 = cy - ry * Math.sin(a0);

  const spinePts: string[] = [`M 194 189 Q ${fmt((194 + x0) / 2 - 6)} ${fmt(y0 + 6)} ${fmt(x0)} ${fmt(y0)}`];
  for (let i = 1; i <= 32; i++) {
    const t = i / 32;
    const a = ((startDeg + (endDeg - startDeg) * t) * Math.PI) / 180;
    const px = cx + rx * Math.cos(a);
    const py = cy - ry * Math.sin(a);
    spinePts.push(`L ${fmt(px)} ${fmt(py)}`);
  }

  const blades: string[] = [];
  for (let i = 0; i < fronds; i++) {
    const t = (i + 0.25) / fronds;
    const aDeg = startDeg + (endDeg - startDeg) * t;
    const a = (aDeg * Math.PI) / 180;
    const px = cx + rx * Math.cos(a);
    const py = cy - ry * Math.sin(a);

    const dAdt = ((endDeg - startDeg) * Math.PI) / 180;
    const dx = -rx * Math.sin(a) * dAdt;
    const dy = -ry * Math.cos(a) * dAdt;
    const tangentDeg = (Math.atan2(dx, -dy) * 180) / Math.PI;

    const env = Math.sin(Math.PI * (0.14 + 0.78 * t));
    const len = 25.5 * (0.58 + 0.48 * env);
    const wid = 3.25 * (0.65 + 0.35 * env);

    blades.push(placedLeaf(px, py, tangentDeg - 40 + t * 12, len, wid, 3.2));
    if (i > 0 && i < fronds - 1) {
      blades.push(placedLeaf(px, py, tangentDeg + 25 - t * 6, len * 0.68, wid * 0.74, -2.0));
    }
  }

  const leftPalm = `
    <path d="${spinePts.join(' ')}" fill="none" stroke="#f0ebe3" stroke-width="1.3" stroke-linecap="round" opacity="0.86" />
    <path d="${blades.join(' ')}" fill="#f0ebe3" />
  `;

  return `<svg class="zp-pk-laurel-svg" viewBox="0 0 360 202" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
    <g>${leftPalm}</g>
    <g transform="translate(360 0) scale(-1 1)">${leftPalm}</g>
    <path d="M 180 14 L 182.2 21.8 L 190 24 L 182.2 26.2 L 180 34 L 177.8 26.2 L 170 24 L 177.8 21.8 Z" fill="#e65650" />
    <text x="180" y="60" text-anchor="middle" fill="#e65650" font-family="Inter, system-ui, sans-serif" font-size="8.2" font-weight="600" letter-spacing="2.6">FESTIVAL WINNER</text>
    <text x="180" y="96" text-anchor="middle" fill="#f0ebe3" font-family="'Cormorant Garamond', Georgia, serif" font-size="30" font-weight="600" letter-spacing="4.2">PVTV</text>
    <text x="180" y="120" text-anchor="middle" fill="#f0ebe3" font-family="'Cormorant Garamond', Georgia, serif" font-size="16.5" font-weight="500" letter-spacing="3.5">FRINGE FLICKS</text>
    <line x1="136" y1="133" x2="224" y2="133" stroke="#e65650" stroke-opacity="0.45" stroke-width="0.85" />
    <text x="180" y="150" text-anchor="middle" fill="#b5afa8" font-family="'JetBrains Mono', monospace" font-size="8.2" font-weight="500" letter-spacing="2.4">LIVERPOOL · UK</text>
  </svg>`;
}

/**
 * Silhouette 3: Trifoliate Bay-Cluster Biennale Medallion Wreath
 * (Pebbles Underground · Visual Container Winter 2024 Award Winner).
 */
function buildBayMedallionWreathSvg(): string {
  const cx = 156;
  const cy = 100;
  const rx = 121;
  const ry = 77;
  const startDeg = 254;
  const endDeg = 115;
  const clusters = 8;

  const a0 = (startDeg * Math.PI) / 180;
  const x0 = cx + rx * Math.cos(a0);
  const y0 = cy - ry * Math.sin(a0);

  const arcPts: string[] = [`M 191 186 Q ${fmt((191 + x0) / 2 - 5)} ${fmt(y0 + 5)} ${fmt(x0)} ${fmt(y0)}`];
  for (let i = 1; i <= 28; i++) {
    const t = i / 28;
    const a = ((startDeg + (endDeg - startDeg) * t) * Math.PI) / 180;
    arcPts.push(`L ${fmt(cx + rx * Math.cos(a))} ${fmt(cy - ry * Math.sin(a))}`);
  }

  const leaves: string[] = [];
  for (let i = 0; i < clusters; i++) {
    const t = (i + 0.35) / clusters;
    const aDeg = startDeg + (endDeg - startDeg) * t;
    const a = (aDeg * Math.PI) / 180;
    const px = cx + rx * Math.cos(a);
    const py = cy - ry * Math.sin(a);

    const dAdt = ((endDeg - startDeg) * Math.PI) / 180;
    const dx = -rx * Math.sin(a) * dAdt;
    const dy = -ry * Math.cos(a) * dAdt;
    const tangentDeg = (Math.atan2(dx, -dy) * 180) / Math.PI;

    const s = 1.04 - Math.abs(t - 0.45) * 0.36;
    leaves.push(placedLeaf(px, py, tangentDeg - 42, 19 * s, 4.5 * s, 0.8));
    leaves.push(placedLeaf(px, py, tangentDeg - 6, 21 * s, 4.7 * s, 0));
    if (i < clusters - 1) {
      leaves.push(placedLeaf(px, py, tangentDeg + 30, 18 * s, 4.25 * s, -0.8));
    }
  }

  const leftSide = `
    <path d="${arcPts.join(' ')}" fill="none" stroke="#b5afa8" stroke-width="1.2" stroke-linecap="round" opacity="0.72" />
    <path d="${leaves.join(' ')}" fill="#e7e1d7" />
  `;

  return `<svg class="zp-pk-laurel-svg" viewBox="0 0 360 202" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
    <g>${leftSide}</g>
    <g transform="translate(360 0) scale(-1 1)">${leftSide}</g>
    <polygon points="180,21 183.5,24.5 180,28 176.5,24.5" fill="#dfc48b" opacity="0.88" />
    <text x="180" y="61" text-anchor="middle" fill="#dfc48b" font-family="Inter, system-ui, sans-serif" font-size="8" font-weight="600" letter-spacing="2.3">JURY SPECIAL MENTION</text>
    <text x="180" y="96" text-anchor="middle" fill="#f0ebe3" font-family="'Cormorant Garamond', Georgia, serif" font-size="25" font-weight="600" letter-spacing="3.2">PEBBLES</text>
    <text x="180" y="118" text-anchor="middle" fill="#dfc48b" font-family="'Cormorant Garamond', Georgia, serif" font-size="14.5" font-weight="500" letter-spacing="3.6">UNDERGROUND</text>
    <line x1="132" y1="132" x2="228" y2="132" stroke="#dfc48b" stroke-opacity="0.3" stroke-width="0.8" />
    <text x="180" y="149" text-anchor="middle" fill="#b5afa8" font-family="'JetBrains Mono', monospace" font-size="7.8" font-weight="500" letter-spacing="2.1">VISUAL CONTAINER · 2024</text>
  </svg>`;
}

interface PressFeatureItem {
  num: string;
  publication: string;
  badge: string;
  title: string;
  excerpt: string;
  href: string;
  cta: string;
  isPdf?: boolean;
}

const PRESS_FEATURES: readonly PressFeatureItem[] = [
  {
    num: '01',
    publication: 'Lake Ivan Film Journal',
    badge: 'Critical Review',
    title: 'Spinning in the Wildness: Phantom Requiem',
    excerpt:
      'Critic David Finkelstein dissects the layered gothic motifs, electroacoustic precision, and harrowing psychological command of Zazie Kanwar-Torge\'s scored experimental horror short.',
    href: 'https://lakeivan.substack.com/p/spinning-in-the-wildness-phantom',
    cta: 'Read Critical Review',
  },
  {
    num: '02',
    publication: 'Billboard Wire',
    badge: 'Composer Profile',
    title: 'How an Underground Experimental Musician Became a Go-To Horror Composer',
    excerpt:
      'Long-form profile charting the path from underground sound art and spatial installations to bespoke psychological horror scoring for independent cinema.',
    href: 'https://billboardwire.com/how-an-underground-experimental-musician-became-a-go-to-composer-for-psychological-horror/',
    cta: 'Read Feature Article',
  },
  {
    num: '03',
    publication: 'Grammy Weekly',
    badge: 'Artist Feature',
    title: 'The Underground Polymath Redefining Experimental Music',
    excerpt:
      'Feature portrait examining Zazie Productions\' multi-instrumental studio practice, acoustic processing, and refusal of generic library templates.',
    href: 'https://grammyweekly.com/zazie-productions-the-underground-polymath-redefining-experimental-music/',
    cta: 'Read Feature Article',
  },
  {
    num: '04',
    publication: 'Limitless Magazine',
    badge: 'Sonic Analysis',
    title: 'Forget ASMR. This Will Rewire Your Nervous System',
    excerpt:
      'Close listen to visceral sub-bass architecture, bowed metal overtones, and physiological dread across the Zazie Productions discography.',
    href: 'https://limitless-magazine.com/2026/06/12/forget-asmr-zazie-productions-will-rewire-your-whole-nervous-system/',
    cta: 'Read Feature Article',
  },
  {
    num: '05',
    publication: 'Black Mountain College Museum',
    badge: 'Commission & Radio',
    title: 'Broadcast: BMC Radio Artist Zazie Productions',
    excerpt:
      'Institutional feature and broadcast presentation of commissioned musique concrete work produced for the Black Mountain College Museum + Arts Center.',
    href: 'https://www.blackmountaincollege.org/broadcast-bmc-radio-artist-zazie-productions/',
    cta: 'Explore Broadcast',
  },
  {
    num: '06',
    publication: 'Visual Container TV',
    badge: 'Official Dossier · PDF',
    title: 'Winter 2024 Award Winners Official Press Release',
    excerpt:
      'Curatorial announcement and international exhibition dossier documenting the Jury Special Mention awarded to Phantom Requiem.',
    href: 'https://www.visualcontainer.tv/wp-content/uploads/2025/01/Winter-2024-Award-Winners_Press-Release.pdf',
    cta: 'Open Press Release PDF',
    isPdf: true,
  },
];

interface ProfileDirectoryItem {
  label: string;
  meta: string;
  code: string;
  href: string;
}

const PROFILE_DIRECTORY: readonly ProfileDirectoryItem[] = [
  {
    code: 'IMDb',
    label: 'IMDb Credits',
    meta: 'nm17333332 · Verified Filmography',
    href: 'https://www.imdb.com/name/nm17333332/',
  },
  {
    code: 'FFW',
    label: 'FilmFreeway',
    meta: 'Festival Selections & Laurels',
    href: 'https://filmfreeway.com/ZazieProductions',
  },
  {
    code: 'BC',
    label: 'Bandcamp',
    meta: 'Full Studio Discography & Stems',
    href: 'https://zazieproductions.bandcamp.com/',
  },
  {
    code: 'SP',
    label: 'Spotify',
    meta: 'Official Composer Releases',
    href: 'https://open.spotify.com/artist/4UOgvZEOo7xBhFBjJvlMm0',
  },
  {
    code: 'AM',
    label: 'Apple Music',
    meta: 'Lossless Score Catalogue',
    href: 'https://music.apple.com/us/artist/zazie-productions/1623719351',
  },
  {
    code: 'YT',
    label: 'YouTube',
    meta: 'Scored Shorts & Visual Works',
    href: 'https://www.youtube.com/@zazieproductions',
  },
  {
    code: 'SB',
    label: 'SoundBetter',
    meta: 'Verified Film Score Producer',
    href: 'https://soundbetter.com/profiles/614805-zazie-productions',
  },
  {
    code: 'MU',
    label: 'Muso.AI',
    meta: 'Verified Engineering & Credits',
    href: 'https://credits.muso.ai/profile/4010f3b7-9a87-4961-8dfd-917de0ba787e',
  },
];

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const ARROW_UP_RIGHT_SVG = `<svg class="zp-pk-arrow-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7"/><path d="M8 7h9v9"/></svg>`;

const FILE_PDF_SVG = `<svg class="zp-pk-arrow-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M12 18v-6"/><path d="m9.5 15.5 2.5 2.5 2.5-2.5"/></svg>`;

export function pressKitInnerHtml(): string {
  const oliveSvg = buildOliveBerryWreathSvg();
  const palmSvg = buildCinemaPalmWreathSvg();
  const baySvg = buildBayMedallionWreathSvg();

  const featuresHtml = PRESS_FEATURES.map(
    (item) => `<a href="${escapeHtml(item.href)}" target="_blank" rel="noopener noreferrer" class="zp-pk-feature-card">
      <span class="zp-pk-corner zp-pk-corner-tl" aria-hidden="true"></span>
      <span class="zp-pk-corner zp-pk-corner-br" aria-hidden="true"></span>
      <div class="zp-pk-feature-top">
        <span class="zp-pk-feature-num">${escapeHtml(item.num)}</span>
        <span class="zp-pk-feature-badge">${escapeHtml(item.badge)}</span>
      </div>
      <div class="zp-pk-feature-pub">${escapeHtml(item.publication)}</div>
      <h3 class="zp-pk-feature-title">${escapeHtml(item.title)}</h3>
      <p class="zp-pk-feature-desc">${escapeHtml(item.excerpt)}</p>
      <div class="zp-pk-feature-foot">
        <span class="zp-pk-feature-cta">${escapeHtml(item.cta)}</span>
        <span class="zp-pk-feature-icon">${item.isPdf ? FILE_PDF_SVG : ARROW_UP_RIGHT_SVG}</span>
      </div>
    </a>`,
  ).join('');

  const directoryHtml = PROFILE_DIRECTORY.map(
    (item) => `<a href="${escapeHtml(item.href)}" target="_blank" rel="noopener noreferrer" class="zp-pk-dir-link">
      <span class="zp-pk-dir-monogram" aria-hidden="true">${escapeHtml(item.code)}</span>
      <span class="zp-pk-dir-body">
        <span class="zp-pk-dir-title">${escapeHtml(item.label)}</span>
        <span class="zp-pk-dir-meta">${escapeHtml(item.meta)}</span>
      </span>
      <span class="zp-pk-dir-arrow" aria-hidden="true">${ARROW_UP_RIGHT_SVG}</span>
    </a>`,
  ).join('');

  return `<div class="zp-pk-ambient" aria-hidden="true"></div>
    <header class="zp-pk-masthead">
      <h2 id="zp-press-heading" class="zp-pk-heading">Press Kit</h2>
      <p class="zp-pk-lead">Independent features, interviews and award coverage - read what other people heard before you decide.</p>
    </header>

    <div class="zp-pk-tier">
      <div class="zp-pk-tier-head">
        <span class="zp-pk-tier-idx">I</span>
        <span class="zp-pk-tier-title">Festival Laurels &amp; Jury Recognition</span>
        <span class="zp-pk-tier-line" aria-hidden="true"></span>
      </div>
      <div class="zp-pk-laurels-grid" role="list" aria-label="Film festival laurels and awards">
        <article class="zp-pk-laurel-card zp-pk-laurel-card-featured" role="listitem">
          <div class="zp-pk-laurel-stage">
            <picture>
              <source srcset="/images/laurels/golden-bloody-globes.webp" type="image/webp" />
              <img src="/images/laurels/golden-bloody-globes.png" alt="Golden Bloody Globes horror film festival laurel emblem" width="480" height="280" loading="lazy" decoding="async" class="zp-pk-laurel-img" />
            </picture>
          </div>
          <div class="zp-pk-laurel-caption">
            <div class="zp-pk-laurel-award zp-pk-laurel-award-crimson">Festival Award Honoree</div>
            <h3 class="zp-pk-laurel-name">Golden Bloody Globes</h3>
            <p class="zp-pk-laurel-detail">Los Angeles · International Horror Film Festival &amp; Awards</p>
          </div>
        </article>

        <article class="zp-pk-laurel-card" role="listitem">
          <div class="zp-pk-laurel-stage">
            ${oliveSvg}
          </div>
          <div class="zp-pk-laurel-caption">
            <div class="zp-pk-laurel-award">Special Jury Mention · 2025</div>
            <h3 class="zp-pk-laurel-name">Re:Fract Festival (2025)</h3>
            <p class="zp-pk-laurel-detail">Received a Special Jury Mention · Festival for Nonlinear Futures</p>
          </div>
        </article>

        <article class="zp-pk-laurel-card" role="listitem">
          <div class="zp-pk-laurel-stage">
            ${palmSvg}
          </div>
          <div class="zp-pk-laurel-caption">
            <div class="zp-pk-laurel-award zp-pk-laurel-award-crimson">Festival Winner</div>
            <h3 class="zp-pk-laurel-name">PVTV Fringe Flicks</h3>
            <p class="zp-pk-laurel-detail">Liverpool, UK · Underground &amp; Experimental Cinema Showcase</p>
          </div>
        </article>

        <article class="zp-pk-laurel-card" role="listitem">
          <div class="zp-pk-laurel-stage">
            ${baySvg}
          </div>
          <div class="zp-pk-laurel-caption">
            <div class="zp-pk-laurel-award">Jury Special Mention · 2024</div>
            <h3 class="zp-pk-laurel-name">Pebbles Underground</h3>
            <p class="zp-pk-laurel-detail">VisualcontainerTV · Winter 2024 Award-Winning Works</p>
          </div>
        </article>
      </div>
    </div>

    <div class="zp-pk-tier">
      <div class="zp-pk-tier-head">
        <span class="zp-pk-tier-idx">II</span>
        <span class="zp-pk-tier-title">Critical Acclaim</span>
        <span class="zp-pk-tier-line" aria-hidden="true"></span>
      </div>
      <div class="zp-pk-spotlight">
        <figure class="zp-pk-lead-quote">
          <span class="zp-pk-quote-glyph" aria-hidden="true">&ldquo;</span>
          <div class="zp-pk-review-eyebrow">Critical Review · Phantom Requiem</div>
          <blockquote cite="https://lakeivan.substack.com/p/spinning-in-the-wildness-phantom" class="zp-pk-blockquote-main">
            &ldquo;While the film constantly references horror film tropes, the originality of the imagery is startling, and Kanwar-Torge has painstakingly assembled these layers of imagery and music into a gushingly assaultive onslaught with finesse and precision.&rdquo;
          </blockquote>
          <figcaption class="zp-pk-quote-footer">
            <div class="zp-pk-critic">
              <span class="zp-pk-critic-name">David Finkelstein</span>
              <span class="zp-pk-critic-pub">Lake Ivan Film Journal · &ldquo;Spinning in the Wildness: Phantom Requiem&rdquo;</span>
            </div>
            <a href="https://lakeivan.substack.com/p/spinning-in-the-wildness-phantom" target="_blank" rel="noopener noreferrer" class="zp-pk-review-cta">
              <span>Read Full Review</span>
              ${ARROW_UP_RIGHT_SVG}
            </a>
          </figcaption>
        </figure>

        <div class="zp-pk-side-quotes">
          <figure class="zp-pk-mini-quote">
            <div class="zp-pk-mini-label">On Psychological Horror</div>
            <blockquote cite="https://billboardwire.com/how-an-underground-experimental-musician-became-a-go-to-composer-for-psychological-horror/" class="zp-pk-mini-text">
              &ldquo;His scores are built around tension, anticipation, and psychological misdirection.&rdquo;
            </blockquote>
            <figcaption class="zp-pk-mini-cite"><a href="https://billboardwire.com/how-an-underground-experimental-musician-became-a-go-to-composer-for-psychological-horror/" target="_blank" rel="noopener noreferrer">Ethan Walker · BillboardWire</a></figcaption>
          </figure>

          <figure class="zp-pk-mini-quote">
            <div class="zp-pk-mini-label">On Immersive Sound</div>
            <blockquote cite="https://limitless-magazine.com/2026/06/12/forget-asmr-zazie-productions-will-rewire-your-whole-nervous-system/" class="zp-pk-mini-text">
              &ldquo;Listening on headphones feels almost physical, as if the music is happening around you rather than in front of you.&rdquo;
            </blockquote>
            <figcaption class="zp-pk-mini-cite"><a href="https://limitless-magazine.com/2026/06/12/forget-asmr-zazie-productions-will-rewire-your-whole-nervous-system/" target="_blank" rel="noopener noreferrer">Limitless Magazine · Anesthesia for the Signal Age</a></figcaption>
          </figure>
        </div>
      </div>
    </div>

    <div class="zp-pk-tier">
      <div class="zp-pk-tier-head">
        <span class="zp-pk-tier-idx">III</span>
        <span class="zp-pk-tier-title">Selected Features, Interviews &amp; Coverage</span>
        <span class="zp-pk-tier-line" aria-hidden="true"></span>
      </div>
      <div class="zp-pk-features-grid">
        ${featuresHtml}
      </div>
    </div>

    <div class="zp-pk-tier zp-pk-tier-last">
      <div class="zp-pk-tier-head">
        <span class="zp-pk-tier-idx">IV</span>
        <span class="zp-pk-tier-title">Official Profiles, Credits &amp; Streaming</span>
        <span class="zp-pk-tier-line" aria-hidden="true"></span>
      </div>
      <div class="zp-pk-dir-grid">
        ${directoryHtml}
      </div>
    </div>`;
}

export function pressKitSectionHtml(): string {
  return `<section id="press" aria-labelledby="zp-press-heading" class="${PRESS_SECTION_CLASS}"><div class="${PRESS_CONTAINER_CLASS}">${pressKitInnerHtml()}</div></section>`;
}

export const PRESS_CSS = `
.zp-pk-section {
  background:
    radial-gradient(ellipse 75% 42% at 50% 0%, rgba(139, 0, 0, 0.13) 0%, transparent 72%),
    radial-gradient(ellipse 55% 45% at 88% 58%, rgba(216, 190, 130, 0.045) 0%, transparent 70%),
    linear-gradient(180deg, #060607 0%, #050505 52%, #070607 100%);
}
.zp-pk-ambient {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(90deg, rgba(240, 235, 227, 0.025) 1px, transparent 1px),
    linear-gradient(180deg, rgba(240, 235, 227, 0.02) 1px, transparent 1px);
  background-size: 96px 96px;
  mask-image: radial-gradient(ellipse 80% 65% at 50% 32%, #000 15%, transparent 80%);
  -webkit-mask-image: radial-gradient(ellipse 80% 65% at 50% 32%, #000 15%, transparent 80%);
  opacity: 0.45;
}
.zp-pk-masthead {
  padding-bottom: 2.25rem;
  border-bottom: 1px solid rgba(240, 235, 227, 0.1);
}
@media (min-width: 1024px) {
  .zp-pk-masthead {
    padding-bottom: 2.65rem;
  }
}
.zp-pk-heading {
  margin: 0;
  font-family: "Cormorant Garamond", Georgia, serif;
  font-size: clamp(2.55rem, 5.2vw, 4.1rem);
  font-weight: 500;
  line-height: 1.02;
  letter-spacing: -0.015em;
  color: #f0ebe3;
}
.zp-pk-lead {
  margin: 1rem 0 0;
  max-width: 40rem;
  font-family: Inter, system-ui, -apple-system, sans-serif;
  font-size: 0.98rem;
  line-height: 1.7;
  color: #b5afa8;
}

/* Section tiers */
.zp-pk-tier {
  margin-top: 3rem;
}
@media (min-width: 768px) {
  .zp-pk-tier {
    margin-top: 3.75rem;
  }
}
.zp-pk-tier-head {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.35rem;
}
.zp-pk-tier-idx {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.75rem;
  height: 1.45rem;
  padding: 0 0.4rem;
  border: 1px solid rgba(223, 196, 139, 0.3);
  border-radius: 2px;
  background: rgba(223, 196, 139, 0.06);
  font-family: "Cormorant Garamond", Georgia, serif;
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: #dfc48b;
}
.zp-pk-tier-title {
  font-family: Inter, system-ui, -apple-system, sans-serif;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.26em;
  text-transform: uppercase;
  color: #d8d1c7;
}
.zp-pk-tier-line {
  flex: 1 1 auto;
  height: 1px;
  background: linear-gradient(90deg, rgba(240, 235, 227, 0.16), rgba(240, 235, 227, 0.02));
}

/* Tier I: Festival Laurels */
.zp-pk-laurels-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}
@media (min-width: 640px) {
  .zp-pk-laurels-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1.15rem;
  }
}
@media (min-width: 1120px) {
  .zp-pk-laurels-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
.zp-pk-laurel-card {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1.35rem 1.15rem 1.3rem;
  border: 1px solid rgba(240, 235, 227, 0.1);
  border-radius: 2px;
  background:
    radial-gradient(ellipse 80% 55% at 50% 28%, rgba(223, 196, 139, 0.065) 0%, transparent 72%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.026) 0%, rgba(10, 10, 12, 0.85) 100%);
  box-shadow: 0 18px 40px -28px rgba(0, 0, 0, 0.9);
  transition: border-color 0.28s ease, transform 0.28s ease, box-shadow 0.28s ease;
}
.zp-pk-laurel-card-featured {
  border-color: rgba(184, 32, 32, 0.34);
  background:
    radial-gradient(ellipse 82% 58% at 50% 30%, rgba(168, 22, 22, 0.14) 0%, transparent 74%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, rgba(10, 8, 9, 0.9) 100%);
}
.zp-pk-laurel-card:hover {
  border-color: rgba(223, 196, 139, 0.38);
  transform: translateY(-2px);
  box-shadow: 0 22px 46px -24px rgba(0, 0, 0, 0.95), 0 0 28px -14px rgba(223, 196, 139, 0.25);
}
.zp-pk-laurel-card-featured:hover {
  border-color: rgba(230, 86, 80, 0.55);
  box-shadow: 0 22px 46px -24px rgba(0, 0, 0, 0.95), 0 0 32px -12px rgba(184, 32, 32, 0.4);
}
.zp-pk-laurel-stage {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 9.25rem;
  padding: 0.25rem 0.35rem;
}
.zp-pk-laurel-img {
  width: auto;
  max-width: 100%;
  height: 8.5rem;
  object-fit: contain;
  filter: drop-shadow(0 8px 18px rgba(0, 0, 0, 0.65));
}
.zp-pk-laurel-svg {
  width: 100%;
  max-width: 15.5rem;
  height: 8.65rem;
  overflow: visible;
  filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.55));
}
.zp-pk-laurel-caption {
  margin-top: 0.85rem;
  padding-top: 0.9rem;
  border-top: 1px solid rgba(240, 235, 227, 0.08);
  text-align: center;
}
.zp-pk-laurel-award {
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 0.63rem;
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #dfc48b;
}
.zp-pk-laurel-award-crimson {
  color: #e65650;
}
.zp-pk-laurel-name {
  margin: 0.35rem 0 0;
  font-family: "Cormorant Garamond", Georgia, serif;
  font-size: 1.28rem;
  font-weight: 600;
  line-height: 1.2;
  color: #f0ebe3;
}
.zp-pk-laurel-detail {
  margin: 0.3rem 0 0;
  font-size: 0.76rem;
  line-height: 1.5;
  color: #a9a39b;
}

/* Tier II: Critical Spotlight */
.zp-pk-spotlight {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.15rem;
}
@media (min-width: 1024px) {
  .zp-pk-spotlight {
    grid-template-columns: minmax(0, 1.32fr) minmax(0, 1fr);
    gap: 1.35rem;
  }
}
.zp-pk-lead-quote {
  position: relative;
  margin: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 2rem 1.65rem 1.75rem;
  border: 1px solid rgba(223, 196, 139, 0.22);
  border-left: 3px solid #a81c1c;
  border-radius: 2px;
  background:
    radial-gradient(ellipse 75% 65% at 12% 10%, rgba(139, 0, 0, 0.16) 0%, transparent 68%),
    linear-gradient(155deg, rgba(255, 255, 255, 0.032) 0%, rgba(10, 9, 10, 0.92) 100%);
  overflow: hidden;
}
@media (min-width: 640px) {
  .zp-pk-lead-quote {
    padding: 2.35rem 2.35rem 2rem;
  }
}
.zp-pk-quote-glyph {
  position: absolute;
  top: -0.6rem;
  right: 1.25rem;
  font-family: "Cormorant Garamond", Georgia, serif;
  font-size: 7.5rem;
  line-height: 1;
  color: rgba(223, 196, 139, 0.1);
  pointer-events: none;
  user-select: none;
}
.zp-pk-review-eyebrow {
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 0.66rem;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: #dfc48b;
}
.zp-pk-blockquote-main {
  margin: 1.1rem 0 1.6rem;
  font-family: "Cormorant Garamond", Georgia, serif;
  font-size: clamp(1.38rem, 2.3vw, 1.86rem);
  font-weight: 500;
  font-style: italic;
  line-height: 1.38;
  color: #f5f0e8;
}
.zp-pk-quote-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-top: 1.2rem;
  border-top: 1px solid rgba(240, 235, 227, 0.1);
}
.zp-pk-critic {
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
}
.zp-pk-critic-name {
  font-family: Inter, system-ui, -apple-system, sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: #f0ebe3;
}
.zp-pk-critic-pub {
  font-size: 0.77rem;
  color: #b5afa8;
}
.zp-pk-review-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.58rem 1rem;
  border: 1px solid rgba(223, 196, 139, 0.42);
  border-radius: 2px;
  background: rgba(223, 196, 139, 0.08);
  font-family: Inter, system-ui, -apple-system, sans-serif;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  text-decoration: none;
  color: #f5ebd6;
  transition: border-color 0.22s ease, background-color 0.22s ease, color 0.22s ease, transform 0.22s ease;
}
.zp-pk-review-cta:hover {
  border-color: #dfc48b;
  background: rgba(223, 196, 139, 0.17);
  color: #ffffff;
  transform: translateY(-1px);
}
.zp-pk-side-quotes {
  display: grid;
  grid-template-rows: 1fr 1fr;
  gap: 1.15rem;
}
.zp-pk-mini-quote {
  margin: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1.4rem 1.5rem;
  border: 1px solid rgba(240, 235, 227, 0.1);
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.02);
}
.zp-pk-mini-label {
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 0.63rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #e65650;
}
.zp-pk-mini-text {
  margin: 0.7rem 0 0.85rem;
  font-family: "Cormorant Garamond", Georgia, serif;
  font-size: 1.12rem;
  font-style: italic;
  line-height: 1.48;
  color: #e6dfd5;
}
.zp-pk-mini-cite {
  font-size: 0.73rem;
  letter-spacing: 0.06em;
  color: #9e9890;
}

/* Tier III: Monograph Press Feature Cards */
.zp-pk-features-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.1rem;
}
@media (min-width: 720px) {
  .zp-pk-features-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (min-width: 1080px) {
  .zp-pk-features-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1.2rem;
  }
}
.zp-pk-feature-card {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 1.55rem 1.5rem 1.4rem;
  border: 1px solid rgba(240, 235, 227, 0.1);
  border-radius: 2px;
  background: linear-gradient(170deg, rgba(255, 255, 255, 0.028) 0%, rgba(11, 10, 12, 0.92) 100%);
  text-decoration: none;
  color: inherit;
  transition: border-color 0.26s ease, background-color 0.26s ease, transform 0.26s ease, box-shadow 0.26s ease;
}
.zp-pk-feature-card:hover {
  border-color: rgba(223, 196, 139, 0.42);
  background: linear-gradient(170deg, rgba(255, 255, 255, 0.045) 0%, rgba(20, 12, 13, 0.95) 100%);
  transform: translateY(-3px);
  box-shadow: 0 22px 44px -26px rgba(0, 0, 0, 0.95), 0 0 28px -16px rgba(184, 32, 32, 0.45);
}
.zp-pk-corner {
  position: absolute;
  width: 9px;
  height: 9px;
  pointer-events: none;
  opacity: 0.45;
  transition: opacity 0.25s ease, border-color 0.25s ease;
}
.zp-pk-corner-tl {
  top: -1px;
  left: -1px;
  border-top: 1.5px solid #dfc48b;
  border-left: 1.5px solid #dfc48b;
}
.zp-pk-corner-br {
  right: -1px;
  bottom: -1px;
  border-right: 1.5px solid #e65650;
  border-bottom: 1.5px solid #e65650;
}
.zp-pk-feature-card:hover .zp-pk-corner {
  opacity: 1;
}
.zp-pk-feature-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.95rem;
}
.zp-pk-feature-num {
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 0.68rem;
  letter-spacing: 0.16em;
  color: #9e9890;
}
.zp-pk-feature-badge {
  padding: 0.2rem 0.52rem;
  border: 1px solid rgba(223, 196, 139, 0.24);
  border-radius: 2px;
  background: rgba(223, 196, 139, 0.06);
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 0.6rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #dfc48b;
}
.zp-pk-feature-pub {
  font-family: Inter, system-ui, -apple-system, sans-serif;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #e65650;
}
.zp-pk-feature-title {
  margin: 0.45rem 0 0.7rem;
  font-family: "Cormorant Garamond", Georgia, serif;
  font-size: 1.42rem;
  font-weight: 600;
  line-height: 1.22;
  color: #f0ebe3;
  transition: color 0.22s ease;
}
.zp-pk-feature-card:hover .zp-pk-feature-title {
  color: #ffffff;
}
.zp-pk-feature-desc {
  margin: 0;
  flex: 1 1 auto;
  font-size: 0.84rem;
  line-height: 1.62;
  color: #ada79f;
}
.zp-pk-feature-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 1.25rem;
  padding-top: 0.9rem;
  border-top: 1px solid rgba(240, 235, 227, 0.08);
}
.zp-pk-feature-cta {
  font-family: Inter, system-ui, -apple-system, sans-serif;
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #d8d1c7;
  transition: color 0.22s ease;
}
.zp-pk-feature-card:hover .zp-pk-feature-cta {
  color: #dfc48b;
}
.zp-pk-feature-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border: 1px solid rgba(240, 235, 227, 0.14);
  border-radius: 9999px;
  color: #b5afa8;
  transition: border-color 0.22s ease, background-color 0.22s ease, color 0.22s ease, transform 0.22s ease;
}
.zp-pk-feature-card:hover .zp-pk-feature-icon {
  border-color: rgba(223, 196, 139, 0.55);
  background: rgba(223, 196, 139, 0.12);
  color: #dfc48b;
  transform: translate(2px, -2px);
}

/* Tier IV: Verified Profiles & Streaming Directory */
.zp-pk-dir-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}
@media (min-width: 600px) {
  .zp-pk-dir-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (min-width: 1024px) {
  .zp-pk-dir-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.85rem;
  }
}
.zp-pk-dir-link {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.9rem 1rem;
  border: 1px solid rgba(240, 235, 227, 0.1);
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.018);
  text-decoration: none;
  color: inherit;
  transition: border-color 0.22s ease, background-color 0.22s ease, transform 0.22s ease;
}
.zp-pk-dir-link:hover {
  border-color: rgba(230, 86, 80, 0.48);
  background: linear-gradient(135deg, rgba(139, 0, 0, 0.14) 0%, rgba(223, 196, 139, 0.06) 100%);
  transform: translateY(-1px);
}
.zp-pk-dir-monogram {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.35rem;
  height: 2.35rem;
  border: 1px solid rgba(223, 196, 139, 0.26);
  border-radius: 2px;
  background: rgba(223, 196, 139, 0.05);
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 0.64rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: #dfc48b;
  transition: border-color 0.22s ease, background-color 0.22s ease, color 0.22s ease;
}
.zp-pk-dir-link:hover .zp-pk-dir-monogram {
  border-color: rgba(230, 86, 80, 0.6);
  background: rgba(139, 0, 0, 0.28);
  color: #fff6ea;
}
.zp-pk-dir-body {
  min-width: 0;
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: 0.14rem;
}
.zp-pk-dir-title {
  font-family: Inter, system-ui, -apple-system, sans-serif;
  font-size: 0.84rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: #f0ebe3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.zp-pk-dir-meta {
  font-size: 0.71rem;
  color: #9e9890;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.zp-pk-dir-arrow {
  flex: 0 0 auto;
  color: #8f8981;
  transition: color 0.22s ease, transform 0.22s ease;
}
.zp-pk-dir-link:hover .zp-pk-dir-arrow {
  color: #dfc48b;
  transform: translate(2px, -2px);
}

.zp-pk-review-cta:focus-visible,
.zp-pk-feature-card:focus-visible,
.zp-pk-dir-link:focus-visible {
  outline: 2px solid #dfc48b;
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .zp-pk-laurel-card,
  .zp-pk-review-cta,
  .zp-pk-feature-card,
  .zp-pk-feature-icon,
  .zp-pk-dir-link,
  .zp-pk-dir-monogram,
  .zp-pk-dir-arrow {
    transition: none;
    transform: none;
  }
}
`.trim();
