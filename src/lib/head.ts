/** Server-rendered metadata and structured-data builders for every route. */

import {
  AUTHOR_NAME,
  INDEXABLE_ROBOTS,
  ORG_ID,
  PERSON_ID,
  SITE_NAME,
  SITE_ORIGIN,
  WEBSITE_ID,
  escapeHtml,
  isoDuration,
  jsonLdScript,
  oneLine,
  url,
} from '../data/site.js';
import { stripMarkup } from '../data/routes.js';
import type { Cue, Credit, Image, Json, Production, Release } from '../data/types.js';

export interface OgImage {
  url: string;
  alt: string;
  width: number;
  height: number;
}

export interface PageHead {
  title: string;
  description: string;
  canonical: string;
  robots: string;
  ogType: string;
  image?: OgImage;
  jsonLd: Json[];
}

export const OG_TYPES = {
  website: 'website',
  video: 'video.other',
  music: 'music.song',
  product: 'product',
} as const;

/** Metadata is serialized directly into HTML. No browser-side head mutation. */
export function seoBlock(head: PageHead): string {
  const title = escapeHtml(oneLine(head.title));
  const description = escapeHtml(oneLine(head.description));
  const canonical = escapeHtml(head.canonical);
  const lines = [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}"/>`,
    `<link rel="canonical" href="${canonical}"/>`,
    `<meta name="robots" content="${escapeHtml(head.robots)}"/>`,
    `<meta name="author" content="${escapeHtml(AUTHOR_NAME)}"/>`,
    `<meta property="og:type" content="${head.ogType}"/>`,
    `<meta property="og:site_name" content="${escapeHtml(SITE_NAME)}"/>`,
    '<meta property="og:locale" content="en_US"/>',
    `<meta property="og:title" content="${title}"/>`,
    `<meta property="og:description" content="${description}"/>`,
    `<meta property="og:url" content="${canonical}"/>`,
  ];
  if (head.image) {
    lines.push(
      `<meta property="og:image" content="${escapeHtml(head.image.url)}"/>`,
      `<meta property="og:image:alt" content="${escapeHtml(oneLine(head.image.alt))}"/>`,
      `<meta property="og:image:width" content="${head.image.width}"/>`,
      `<meta property="og:image:height" content="${head.image.height}"/>`,
    );
  }
  lines.push(
    `<meta name="twitter:card" content="${head.image ? 'summary_large_image' : 'summary'}"/>`,
    `<meta name="twitter:title" content="${title}"/>`,
    `<meta name="twitter:description" content="${description}"/>`,
  );
  if (head.image) {
    lines.push(
      `<meta name="twitter:image" content="${escapeHtml(head.image.url)}"/>`,
      `<meta name="twitter:image:alt" content="${escapeHtml(oneLine(head.image.alt))}"/>`,
    );
  }
  for (const node of head.jsonLd) lines.push(jsonLdScript(node));
  return lines.join('\n');
}

export interface Crumb {
  name: string;
  path: string;
}

export function breadcrumbList(path: string, crumbs: Crumb[]): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${url(path)}#breadcrumb`,
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: url(crumb.path),
    })),
  };
}

export interface WebPageInput {
  path: string;
  name: string;
  description: string;
  lastmod: string;
  aboutId?: string;
}

export function webPageNode(input: WebPageInput): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${url(input.path)}#webpage`,
    url: url(input.path),
    name: input.name,
    description: input.description,
    isPartOf: { '@id': WEBSITE_ID },
    about: { '@id': input.aboutId ?? PERSON_ID },
    author: { '@id': PERSON_ID },
    publisher: { '@id': ORG_ID },
    inLanguage: 'en',
    dateModified: input.lastmod,
    breadcrumb: { '@id': `${url(input.path)}#breadcrumb` },
  };
}

function credited(production: Production, role: RegExp): Json[] {
  return production.credits
    .filter((credit) => role.test(credit.role))
    .map((credit) => ({ '@type': 'Person', name: credit.name }));
}

export function productionNodes(production: Production, path: string): Json[] {
  const composers = credited(production, /composer/i);
  const directors = credited(production, /^director$/i);
  const creators = credited(production, /^(creator|writer)$/i);
  const productionCompanies = production.credits
    .filter((credit) => /^(production company|producer|co-producer)$/i.test(credit.role))
    .map((credit) => ({ '@type': 'Organization', name: credit.name }));
  const published = production.releaseDate ??
    (production.status === 'Released' && production.releaseYear ? String(production.releaseYear) : undefined);

  const work: Json = {
    '@context': 'https://schema.org',
    '@type': production.schemaType,
    '@id': `${url(path)}#work`,
    url: url(path),
    name: production.title,
    description: production.summary,
    genre: production.genres,
    inLanguage: 'en',
    image: [url(production.poster.src)],
    ...(published ? { datePublished: published } : {}),
    ...(production.expectedReleaseDate ? { startDate: production.expectedReleaseDate } : {}),
    ...(production.runtimeSeconds ? { duration: isoDuration(production.runtimeSeconds) } : {}),
    ...(creators.length ? { creator: creators } : {}),
    ...(directors.length ? { director: directors } : {}),
    ...(composers.length ? { composer: composers, musicBy: composers } : {}),
    ...(productionCompanies.length ? { productionCompany: productionCompanies } : {}),
    isPartOf: { '@id': WEBSITE_ID },
    mainEntityOfPage: { '@id': `${url(path)}#webpage` },
    dateModified: production.updatedAt,
  };

  const nodes: Json[] = [work];
  // Self hosted samples are portfolio-only material: no VideoObject, so no
  // search engine is invited to fetch or feature the stream.
  if (production.sample && production.sample.kind !== 'self') {
    const sample = production.sample;
    nodes.push({
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      '@id': `${url(path)}#video`,
      name: sample.title,
      description: sample.description,
      thumbnailUrl: [url(sample.thumbnail.src)],
      embedUrl: sample.embedUrl,
      ...(sample.watchUrl ? { url: sample.watchUrl } : {}),
      ...(sample.publicationDate ? { uploadDate: sample.publicationDate } : {}),
      ...(sample.durationSeconds ? { duration: isoDuration(sample.durationSeconds) } : {}),
      ...(sample.creator ? { creator: { '@type': sample.creator.type, name: sample.creator.name } } : {}),
      isPartOf: { '@id': WEBSITE_ID },
      mainEntityOfPage: { '@id': `${url(path)}#webpage` },
    });
  }
  return nodes;
}

export function cueNodes(cue: Cue, path: string): Json[] {
  const compositionId = `${url(path)}#composition`;
  const audioId = `${url(path)}#audio`;
  const description = oneLine(`${cue.description} ${cue.paragraphs[0]}`);
  const composition: Json = {
    '@context': 'https://schema.org',
    '@type': 'MusicComposition',
    '@id': compositionId,
    url: url(path),
    name: cue.title,
    description,
    genre: cue.category,
    composer: { '@id': PERSON_ID },
    creator: { '@id': PERSON_ID },
    duration: isoDuration(cue.durationSeconds),
    isPartOf: { '@id': WEBSITE_ID },
    audio: { '@id': audioId },
    mainEntityOfPage: { '@id': `${url(path)}#webpage` },
    dateModified: cue.updatedAt,
  };
  const audio: Json = {
    '@context': 'https://schema.org',
    '@type': 'AudioObject',
    '@id': audioId,
    name: cue.title,
    description,
    contentUrl: url(cue.audioPath),
    encodingFormat: 'audio/mpeg',
    duration: isoDuration(cue.durationSeconds),
    genre: cue.category,
    creator: { '@id': PERSON_ID },
    isPartOf: { '@id': WEBSITE_ID },
    mainEntityOfPage: { '@id': `${url(path)}#webpage` },
  };
  return [composition, audio];
}

function releaseCreator(release: Release): Json | undefined {
  if (!release.creatorName) return undefined;
  const isPerson = release.creatorName === AUTHOR_NAME;
  return { '@type': isPerson ? 'Person' : 'Organization', name: release.creatorName };
}

export function releaseNodes(release: Release, path: string): Json[] {
  const productId = `${url(path)}#product`;
  const offerId = `${url(path)}#offer`;
  const album = release.schemaType === 'MusicAlbum';
  const product: Json = {
    '@context': 'https://schema.org',
    '@type': album ? ['MusicAlbum', 'Product'] : 'Product',
    '@id': productId,
    url: url(path),
    name: release.title,
    description: stripMarkup(release.summary),
    ...(release.image ? { image: [url(release.image.src)] } : {}),
    brand: { '@id': ORG_ID },
    category: release.section,
    ...(releaseCreator(release) ? { creator: releaseCreator(release) } : {}),
    ...(album && release.creatorName === AUTHOR_NAME ? { byArtist: { '@type': 'Person', name: AUTHOR_NAME } } : {}),
    ...(release.releaseDate ? { datePublished: release.releaseDate } : {}),
    ...(release.durationSeconds ? { duration: isoDuration(release.durationSeconds) } : {}),
    ...(release.trackCount ? { numTracks: release.trackCount } : {}),
    ...(release.genre?.length ? { genre: release.genre } : {}),
    offers: { '@id': offerId },
    isPartOf: { '@id': WEBSITE_ID },
    mainEntityOfPage: { '@id': `${url(path)}#webpage` },
    dateModified: release.updatedAt,
  };
  const offer: Json = {
    '@context': 'https://schema.org',
    '@type': 'Offer',
    '@id': offerId,
    url: release.listingUrl ?? url(path),
    name: release.title,
    itemOffered: { '@id': productId },
    ...(release.sellerName ? { seller: { '@type': 'Organization', name: release.sellerName } } : {}),
  };
  return [product, offer];
}

/** Social preview artwork is emitted only when the source actually supplies it. */
export function ogImageFor(image: Image): OgImage {
  return {
    url: /^https?:\/\//.test(image.src) ? image.src : `${SITE_ORIGIN}${image.src}`,
    alt: image.alt,
    width: image.width,
    height: image.height,
  };
}

export function socialDescription(value: string): string {
  return oneLine(value);
}

/** A neutral attribution line that never assigns an unsupported production role. */
export function creditLine(): string {
  return 'Archive entry by Zazie Productions';
}
