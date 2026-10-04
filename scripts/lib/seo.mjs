/**
 * Per-route <head> and JSON-LD.
 *
 * One builder per route type. The head block ends up in the *static file*, not
 * in the live DOM: `scripts/render-pages.mjs` writes the page shell with an
 * `<!--SEO:START-->…<!--SEO:END-->` placeholder and `scripts/prerender.mjs`
 * replaces it with what is produced here, so the title, description, canonical,
 * robots, Open Graph, Twitter and structured data are all in the first bytes of
 * the response. No JavaScript is involved at any point.
 *
 * The schema graph on every item page references the entities the home page
 * already declares — `#person`, `#org`, `#website` — instead of redefining
 * them, and the runtime head manager (if one is ever reintroduced) has to emit
 * these same values, because these are the ones that get crawled.
 */

import { SITE, absolute, url } from './data.mjs';

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const jsonLd = (value) =>
  '\n<script type="application/ld+json">\n' +
  JSON.stringify(value, null, 2) +
  '\n</script>';

const meta = (attrs) =>
  '<meta ' +
  Object.entries(attrs)
    .map(([k, v]) => `${k}="${esc(v)}"`)
    .join(' ') +
  '/>';

const INDEX_ROBOTS = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

/* --------------------------------------------------------------------- head */

export function headBlock(route) {
  const canonical = absolute(route.path);
  const image = route.image ?? {
    src: '/images/hero-portrait.jpg',
    alt: 'Zazie Kanwar-Torge, psychological horror composer at Zazie Productions',
    width: 1200,
    height: 1500,
  };
  const imageUrl = image.external ? image.src : absolute(image.src);

  const lines = [
    `<title>${esc(route.title)}</title>`,
    meta({ content: route.description, name: 'description' }),
    `<link rel="canonical" href="${esc(canonical)}"/>`,
    meta({ name: 'robots', content: INDEX_ROBOTS }),
    meta({ name: 'author', content: SITE.person }),
    '<link rel="preload" as="font" type="font/woff2" href="/fonts/cormorant-garamond-latin-400-normal.woff2" crossorigin/>',
    '<link rel="preload" as="font" type="font/woff2" href="/fonts/inter-latin-wght-normal.woff2" crossorigin/>',
    meta({ property: 'og:type', content: route.ogType ?? 'article' }),
    meta({ property: 'og:site_name', content: SITE.name }),
    meta({ property: 'og:locale', content: 'en_US' }),
    meta({ property: 'og:title', content: route.ogTitle ?? route.title }),
    meta({ property: 'og:description', content: route.ogDescription ?? route.description }),
    meta({ property: 'og:url', content: canonical }),
    meta({ property: 'og:image', content: imageUrl }),
    meta({ property: 'og:image:alt', content: image.alt }),
    ...(image.width
      ? [meta({ property: 'og:image:width', content: String(image.width) })]
      : []),
    ...(image.height
      ? [meta({ property: 'og:image:height', content: String(image.height) })]
      : []),
    meta({ name: 'twitter:card', content: 'summary_large_image' }),
    meta({ name: 'twitter:title', content: route.twitterTitle ?? route.title }),
    meta({
      name: 'twitter:description',
      content: route.twitterDescription ?? route.ogDescription ?? route.description,
    }),
    meta({ name: 'twitter:image', content: imageUrl }),
    meta({ name: 'twitter:image:alt', content: image.alt }),
    jsonLd(route.graph),
  ];
  return lines.join('\n');
}

/* ------------------------------------------------------------------- schema */

export function breadcrumb(trail) {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${absolute(trail[trail.length - 1].path)}#breadcrumb`,
    itemListElement: trail.map((step, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: step.name,
      item: absolute(step.path),
    })),
  };
}

const personRef = { '@id': SITE.personId };
const orgRef = { '@id': SITE.orgId };
const siteRef = { '@id': SITE.websiteId };

function sampleVideo(production) {
  if (!production.sample) return null;
  const { provider, id, title, description } = production.sample;
  const embedUrl =
    provider === 'youtube'
      ? `https://www.youtube-nocookie.com/embed/${id}`
      : `https://drive.google.com/file/d/${id}/preview`;
  return {
    '@type': 'VideoObject',
    '@id': `${absolute(`/work/${production.slug}`)}#sample`,
    name: title,
    description,
    embedUrl,
    contentUrl:
      provider === 'youtube' ? `https://www.youtube.com/watch?v=${id}` : undefined,
    thumbnailUrl: production.poster.external
      ? production.poster.src
      : absolute(production.poster.large ?? production.poster.src),
    ...(provider === 'youtube'
      ? { publisher: { '@type': 'Organization', name: 'YouTube' } }
      : {}),
  };
}

/** Movie / TVSeries + optional VideoObject + BreadcrumbList. */
export function productionGraph(production) {
  const path = `/work/${production.slug}`;
  const node = {
    '@type': production.format === 'Series' ? 'TVSeries' : 'Movie',
    '@id': `${absolute(path)}#production`,
    url: absolute(path),
    name: production.title,
    alternateName: `${production.title} (${production.yearLabel})`,
    description: production.metaDescription,
    genre: production.genres,
    ...(production.director
      ? { director: { '@type': 'Person', name: production.director } }
      : {}),
    ...(production.company
      ? { productionCompany: { '@type': 'Organization', name: production.company } }
      : {}),
    musicBy: personRef,
    composer: personRef,
    creator: orgRef,
    contributor: orgRef,
    inLanguage: 'en',
    isPartOf: siteRef,
    image: absolute(production.poster.large ?? production.poster.src),
    ...(production.still ? { thumbnailUrl: absolute(production.still.src) } : {}),
    ...(production.sameAs?.length ? { sameAs: production.sameAs } : {}),
    about: {
      '@type': 'Thing',
      name: `${production.title} — original horror score by ${SITE.person}`,
    },
  };
  const video = sampleVideo(production);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${absolute(path)}#webpage`,
        url: absolute(path),
        name: `${production.title} (${production.yearLabel})`,
        description: production.metaDescription,
        isPartOf: siteRef,
        primaryImageOfPage: { '@id': `${absolute(path)}#primaryimage` },
        breadcrumb: { '@id': `${absolute(path)}#breadcrumb` },
        inLanguage: 'en',
        dateModified: production.updatedAt,
      },
      { '@type': 'ImageObject', '@id': `${absolute(path)}#primaryimage`, url: node.image, caption: production.poster.alt },
      node,
      ...(video ? [video] : []),
      breadcrumb([
        { name: 'Portfolio', path: '/' },
        { name: 'Selected Horror Productions', path: '/work' },
        { name: `${production.title} (${production.yearLabel})`, path },
      ]),
    ].filter(Boolean),
  };
}

/** MusicComposition + AudioObject + BreadcrumbList. */
export function cueGraph(cue, relatedReleaseRoutes = []) {
  const path = `/reel/${cue.slug}`;
  const audio = {
    '@type': 'AudioObject',
    '@id': `${absolute(path)}#audio`,
    name: `${cue.title} — original horror cue`,
    description: cue.description,
    contentUrl: absolute(cue.src),
    encodingFormat: 'audio/mpeg',
    duration: isoSeconds(cue.seconds),
    genre: cue.mood,
    creator: personRef,
    uploadDate: cue.updatedAt,
  };
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${absolute(path)}#webpage`,
        url: absolute(path),
        name: cue.title,
        description: cue.metaDescription,
        isPartOf: siteRef,
        breadcrumb: { '@id': `${absolute(path)}#breadcrumb` },
        inLanguage: 'en',
        dateModified: cue.updatedAt,
      },
      {
        '@type': 'MusicComposition',
        '@id': `${absolute(path)}#composition`,
        name: cue.title,
        composer: personRef,
        genre: cue.mood,
        duration: isoSeconds(cue.seconds),
        inLanguage: 'zxx',
        description: cue.description,
        isPartOf: { '@id': `${absolute('/reel')}#playlist` },
        audio,
        ...(relatedReleaseRoutes.length
          ? { sameAs: relatedReleaseRoutes.map((r) => absolute(r.path)) }
          : {}),
      },
      audio,
      breadcrumb([
        { name: 'Portfolio', path: '/' },
        { name: 'Horror Composer Showreel', path: '/reel' },
        { name: cue.title, path },
      ]),
    ],
  };
}

/** MusicAlbum/Product + Offer + BreadcrumbList. */
export function releaseGraph(release, relatedCueRoutes = []) {
  const path = `/store/${release.slug}`;
  const isRecord = release.platform === 'Bandcamp';
  const offer = {
    '@type': 'Offer',
    '@id': `${absolute(path)}#offer`,
    url: release.links[0]?.href ?? absolute(path),
    price: release.offerPrice,
    priceCurrency: 'USD',
    availability:
      release.availability ?? 'https://schema.org/InStock',
    seller: orgRef,
  };
  const node = isRecord
    ? {
        '@type': 'MusicAlbum',
        '@id': `${absolute(path)}#release`,
        url: absolute(path),
        name: release.title,
        description: release.metaDescription,
        albumReleaseType: 'https://schema.org/AlbumRelease',
        byArtist: personRef,
        publisher: orgRef,
        genre: 'Dark Ambient',
        ...(release.releaseDate ? { datePublished: release.releaseDate } : {}),
        image: release.image.src,
        offers: offer,
      }
    : {
        '@type': 'Product',
        '@id': `${absolute(path)}#release`,
        url: absolute(path),
        name: release.title,
        description: release.metaDescription,
        category: release.kicker,
        brand: { '@type': 'Brand', name: SITE.name },
        image: [release.image.src],
        offers: offer,
      };
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${absolute(path)}#webpage`,
        url: absolute(path),
        name: release.title,
        description: release.metaDescription,
        isPartOf: siteRef,
        breadcrumb: { '@id': `${absolute(path)}#breadcrumb` },
        inLanguage: 'en',
        dateModified: release.updatedAt,
      },
      node,
      offer,
      ...(relatedCueRoutes.length
        ? [
            {
              '@type': 'ItemList',
              name: `Cues included in ${release.title}`,
              itemListElement: relatedCueRoutes.map((r, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                item: { '@id': `${absolute(r.path)}#composition`, name: r.item.title, url: absolute(r.path) },
              })),
            },
          ]
        : []),
      breadcrumb([
        { name: 'Portfolio', path: '/' },
        { name: 'Catalogue', path: '/store' },
        { name: release.title, path },
      ]),
    ],
  };
}

/** Seconds -> ISO 8601 duration, from the raw master value. */
export function isoSeconds(seconds) {
  const total = Math.round(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  let out = 'PT';
  if (h) out += `${h}H`;
  if (m) out += `${m}M`;
  if (s || (!h && !m)) out += `${s}S`;
  return out;
}

/** Absolute URL helper re-exported so generators import from one place. */
export { absolute, url };
