/** Static HTML renderer for production, cue and catalogue item routes. */

import { AUTHOR_NAME, SITE_HOST, escapeHtml, oneLine, url } from '../data/site.js';
import { productions } from '../data/productions.js';
import { cues } from '../data/cues.js';
import { releases } from '../data/releases.js';
import { cueBySlug, hubByPath, productionBySlug, releaseBySlug, siblingsOf, stripMarkup } from '../data/routes.js';
import { displayDuration } from '../data/site.js';
import {
  OG_TYPES,
  breadcrumbList,
  creditLine,
  cueNodes,
  ogImageFor,
  productionNodes,
  releaseNodes,
  seoBlock,
  webPageNode,
} from './head.js';
import type { Cue, Image, ItemRoute, Json, Production, Release, VideoSample } from '../data/types.js';

export interface PageChrome {
  masthead: string;
  footer: string;
  legalCss: string;
  legalJs: string;
  itemCss: string;
  itemJs: string;
}

export interface RenderedItemPage {
  path: string;
  kind: ItemRoute['kind'];
  html: string;
  title: string;
  description: string;
}

interface MetaSections {
  metaList: string;
  index: string;
  sections: string;
  crossLinks: string;
  relatedNo: string;
}

const esc = escapeHtml;

function headlineMarkup(headline: string): string {
  const split = headline.indexOf(': ');
  if (split < 0) return esc(headline);
  return `${esc(headline.slice(0, split))} <em>· ${esc(headline.slice(split + 2))}</em>`;
}

function tableRows(rows: Array<[string, string]>): string {
  const body = rows
    .map(([label, value]) => `        <tr><th scope="row">${esc(label)}</th><td>${value}</td></tr>`)
    .join('\n');
  return `<div class="table-wrap">
    <table><tbody>
${body}
    </tbody></table>
  </div>`;
}

function breadcrumbs(crumbs: Array<{ name: string; path: string; current?: boolean }>): string {
  return `<nav class="breadcrumbs" aria-label="Breadcrumb">
      <ol itemscope itemtype="https://schema.org/BreadcrumbList">
        ${crumbs
          .map((crumb, index) => {
            const position = index + 1;
            const separator = index ? '<li aria-hidden="true" class="crumb-sep">/</li>\n        ' : '';
            if (crumb.current) {
              return `${separator}<li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem" aria-current="page">
          <span itemprop="name">${esc(crumb.name)}</span>
          <meta itemprop="position" content="${position}" />
        </li>`;
            }
            return `${separator}<li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
          <a itemprop="item" href="${esc(crumb.path)}"><span itemprop="name">${esc(crumb.name)}</span></a>
          <meta itemprop="position" content="${position}" />
        </li>`;
          })
          .join('\n        ')}
      </ol>
    </nav>`;
}

function entryNumber(item: ItemRoute): number {
  if (item.kind === 'production') return productions.findIndex((entry) => entry.slug === item.slug) + 1;
  if (item.kind === 'cue') return cues.findIndex((entry) => entry.slug === item.slug) + 1;
  return releases.findIndex((entry) => entry.slug === item.slug) + 1;
}

function entryTotal(item: ItemRoute): number {
  if (item.kind === 'production') return productions.length;
  if (item.kind === 'cue') return cues.length;
  return releases.length;
}

function displayName(item: ItemRoute): string {
  if (item.kind === 'production') return productionBySlug.get(item.slug)?.title ?? item.slug;
  if (item.kind === 'cue') return cueBySlug.get(item.slug)?.title ?? item.slug;
  return releaseBySlug.get(item.slug)?.title ?? item.slug;
}

function headlineFor(item: ItemRoute): string {
  if (item.kind === 'production') return productionBySlug.get(item.slug)?.headline ?? item.slug;
  if (item.kind === 'cue') return cueBySlug.get(item.slug)?.headline ?? item.slug;
  return releaseBySlug.get(item.slug)?.headline ?? item.slug;
}

function metaFor(item: ItemRoute): MetaSections {
  if (item.kind === 'production') return productionMeta(productionBySlug.get(item.slug)!, item);
  if (item.kind === 'cue') return cueMeta(cueBySlug.get(item.slug)!, item);
  return releaseMeta(releaseBySlug.get(item.slug)!, item);
}

function siblingMeta(route: ItemRoute): string {
  if (route.kind === 'production') {
    const production = productionBySlug.get(route.slug);
    return production ? `${production.workType}${production.releaseYear ? ` · ${production.releaseYear}` : ''} · ${production.genres.join(', ')}` : '';
  }
  if (route.kind === 'cue') {
    const cue = cueBySlug.get(route.slug);
    return cue ? `${cue.category} · ${cue.duration}` : '';
  }
  const release = releaseBySlug.get(route.slug);
  return release ? `${release.section} · ${release.kicker}` : '';
}

function siblingCards(routes: ItemRoute[], hubPath: string): string {
  const hubName = hubByPath.get(hubPath)?.name ?? 'Archive';
  const cards = routes
    .map((route) => {
      const ordinal = String(entryNumber(route)).padStart(2, '0');
      // Only the production shelf has poster art. Cue and catalogue cards are text-only.
      const artwork = route.kind === 'production'
        ? (() => {
            const poster = productionBySlug.get(route.slug)?.poster;
            if (!poster) return '';
            return `            <figure class="poster-figure sibling-figure">
              <picture>${poster.avif ? `\n                <source srcset="${esc(poster.avif)} 640w" sizes="(min-width: 1024px) 18vw, (min-width: 640px) 35vw, 90vw" type="image/avif"/>` : ''}
                <img src="${esc(poster.src)}" alt="${esc(poster.alt)}" width="${poster.width}" height="${poster.height}" loading="lazy" decoding="async"${poster.srcset ? ` srcset="${esc(poster.srcset)}" sizes="(min-width: 1024px) 18vw, (min-width: 640px) 35vw, 90vw"` : ''}/>
              </picture>
            </figure>`;
          })()
        : '';
      return `          <li class="hub-card">
${artwork}
            <span class="no">${ordinal}</span>
            <h3><a class="stretch" href="${esc(route.path)}">${esc(displayName(route))}</a></h3>
            <p>${esc(siblingMeta(route))}</p>
            <p class="stamp">${esc(hubName)}</p>
          </li>`;
    })
    .join('\n');
  return `        <ul class="hub-grid" style="margin-top:1.5rem">
${cards}
        </ul>`;
}

function figure(image: Image, shape: 'poster' | 'still' | 'square', loading: 'eager' | 'lazy' = 'eager'): string {
  const sources = image.avif
    ? `\n              <source srcset="${esc(image.avif)} 640w" sizes="(min-width: 1024px) 32vw, 92vw" type="image/avif"/>`
    : '';
  const srcset = image.srcset ? ` srcset="${esc(image.srcset)}" sizes="(min-width: 1024px) 32vw, 92vw"` : '';
  const remote = /^https?:\/\//.test(image.src) ? ' referrerpolicy="no-referrer"' : '';
  // The entry figure is the LCP candidate on every item page; the browser hint
  // has to sit on the <img> too, or the preload and the element race apart.
  const priority = loading === 'eager' ? ' fetchpriority="high"' : '';
  return `          <figure class="poster-figure entry-figure ${shape}">
            <picture>${sources}
              <img src="${esc(image.src)}" alt="${esc(image.alt)}" width="${image.width}" height="${image.height}" loading="${loading}" decoding="async"${srcset}${priority}${remote}/>
            </picture>
          </figure>`;
}

const YT_ALLOW = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen';
const DRIVE_ALLOW = 'autoplay; clipboard-write; encrypted-media; picture-in-picture; fullscreen';

/** The page a visitor lands on when they leave the archive for the host. */
export function watchUrlFor(sample: VideoSample): string | undefined {
  if (sample.watchUrl) return sample.watchUrl;
  if (sample.kind === 'drive') {
    const view = sample.embedUrl.replace(/\/preview\/?(\?.*)?$/, '/view');
    return view !== sample.embedUrl ? view : undefined;
  }
  const match = /youtube(?:-nocookie)?\.com\/embed\/([\w-]+)/.exec(sample.embedUrl);
  return match ? `https://www.youtube.com/watch?v=${match[1]}` : undefined;
}

/**
 * Click-to-load facade for the film samples.
 *
 * The 2026-10-22 SEO audit measured the embedded players as the worst cost on
 * the archive: /work/expire reached LCP at 9.3s and TBT at 360ms, and every
 * sampled page shipped 300KB+ of unused YouTube player JavaScript. The iframe
 * (and the provider's whole player stack) now loads only on an explicit play,
 * exactly like the homepage film cards have always done. The thumbnail is a
 * plain image; the button is real markup, keyboard-focusable, and the original
 * iframe is kept inside <noscript> so a scripted crawler and a no-JS visitor
 * both still reach the video.
 */
function embedMarkup(sample: VideoSample): string {
  const allow = sample.kind === 'youtube' ? YT_ALLOW : DRIVE_ALLOW;
  const provider = sample.kind === 'youtube' ? 'YouTube' : 'Google Drive';
  const thumb = sample.thumbnail;
  const remote = /^https?:\/\//.test(thumb.src) ? ' referrerpolicy="no-referrer"' : '';
  const watch = watchUrlFor(sample);
  const fallback = watch
    ? `\n        <p class="small embed-fallback">The ${provider} player loads only when you press play — nothing is fetched before that. Prefer to skip the embed? <a href="${esc(watch)}" target="_blank" rel="noopener noreferrer">Open “${esc(sample.title)}” on ${provider}</a>.</p>`
    : '';
  return `        <div class="entry-embed">
          <button type="button" class="embed-facade" data-embed-src="${esc(sample.embedUrl)}" data-embed-kind="${sample.kind}" data-embed-title="${esc(sample.title)}" aria-label="Play ${esc(sample.title)} — loads the ${provider} player">
            <img src="${esc(thumb.src)}" alt="" width="${thumb.width}" height="${thumb.height}" loading="lazy" decoding="async"${remote}/>
            <span class="embed-facade-play" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"/></svg></span>
          </button>
          <noscript><iframe src="${esc(sample.embedUrl)}" title="${esc(sample.title)}" loading="lazy" allow="${allow}" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></noscript>
        </div>${fallback}`;
}

function audioPlayer(src: string, title: string): string {
  return `          <audio controls preload="none" src="${esc(src)}" class="audio-player">
            <a href="${esc(src)}">Play or open ${esc(title)} MP3</a>
          </audio>`;
}

function cuePlayerList(cue: Cue): string {
  return `${audioPlayer(cue.audioPath, cue.title)}
          <p class="small">Runtime ${esc(cue.duration)} · <a href="${esc(cue.audioPath)}">Open the MP3 directly</a>. Playback is optional; the written cue details are already on this page.</p>`;
}

function linkList(links: Array<{ label: string; href: string; external: boolean }>): string {
  if (!links.length) return 'No external project reference is available for this entry.';
  return links.map((link) => link.external
    ? `<a href="${esc(link.href)}" target="_blank" rel="noopener noreferrer">${esc(link.label)}</a>`
    : `<a href="${esc(link.href)}">${esc(link.label)}</a>`).join(' · ');
}

function cueLinkList(slugs: string[]): string {
  const linked = slugs.map((slug) => cueBySlug.get(slug)).filter((cue): cue is Cue => Boolean(cue));
  if (!linked.length) return 'No specific showreel link is listed.';
  return linked.map((cue) => `<a href="/reel/${esc(cue.slug)}">${esc(cue.title)}</a>`).join(' · ');
}

function releaseLinkList(slugs: string[]): string {
  const linked = slugs.map((slug) => releaseBySlug.get(slug)).filter((release): release is Release => Boolean(release));
  if (!linked.length) return 'No specific catalogue release is linked.';
  return linked.map((release) => `<a href="/store/${esc(release.slug)}">${esc(release.title)}</a>`).join(' · ');
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'];

function indexList(entries: Array<[string, string]>): string {
  return entries
    .map(([anchor, label], index) => `        <li><a href="#${anchor}"><span class="idx">${ROMAN[index] ?? index + 1}</span> ${esc(label)}</a></li>`)
    .join('\n');
}

function updatedRow(item: ItemRoute): [string, string] {
  return ['Archive record updated', `<time datetime="${esc(item.lastmod)}">${esc(item.lastmod)}</time>`];
}

/* --------------------------------------------------------------- production */

function productionMeta(production: Production, item: ItemRoute): MetaSections {
  const sample = production.sample;
  const relatedCues = production.relatedCueSlugs.map((slug) => cueBySlug.get(slug)).filter((cue): cue is Cue => Boolean(cue));
  const credits = production.credits.map((credit) => `${credit.role}: ${credit.name}`).join(' · ');
  const composerCredits = production.credits.filter((credit) => /composer/i.test(credit.role)).map((credit) => credit.name);

  const metaList = [
    `<li>Format <b>${esc(production.workType)}${production.releaseYear ? ` · ${production.releaseYear}` : ''}</b></li>`,
    ...(production.status ? [`<li>Listed status <b>${esc(production.status)}</b></li>`] : []),
    `<li>Verified credits <b>${esc(credits || 'No individual credits listed')}</b></li>`,
    ...(production.runtime ? [`<li>Runtime <b>${esc(production.runtime)}</b></li>`] : []),
    ...(composerCredits.length ? [`<li>Composer credit${composerCredits.length > 1 ? 's' : ''} <b>${esc(composerCredits.join(', '))}</b></li>`] : []),
  ].join('\n      ');

  const rows: Array<[string, string]> = [
    ['Project format', esc(production.workType)],
    ...(production.status ? [['Listed status', esc(production.status)] as [string, string]] : []),
    ...(production.releaseYear ? [['Year', String(production.releaseYear)] as [string, string]] : []),
    ...(production.releaseDate ? [['Release date', esc(production.releaseDate)] as [string, string]] : []),
    ...(production.expectedReleaseDate ? [['Premiere date listed', esc(production.expectedReleaseDate)] as [string, string]] : []),
    ...(production.runtime ? [['Runtime', esc(production.runtime)] as [string, string]] : []),
    ['Genres', esc(production.genres.join(', '))],
    ...production.credits.map((credit): [string, string] => [esc(credit.role), esc(credit.name)]),
    ['Project archive', '<a href="/work">Selected productions</a>'],
    ['Adjacent showreel cues', cueLinkList(production.relatedCueSlugs)],
    ...(production.links.length ? [['Project references', linkList(production.links)] as [string, string]] : []),
    updatedRow(item),
  ];

  const sampleSection = sample
    ? `      <section class="clause" id="sample">
        <h2><span class="no">III</span> Project video</h2>
        <p>${esc(sample.description)}${sample.durationSeconds ? ` Runtime ${esc(displayDuration(sample.durationSeconds))}.` : ''}</p>
${embedMarkup(sample)}
      </section>`
    : `      <section class="clause" id="sample">
        <h2><span class="no">III</span> Adjacent showreel listening</h2>
        <p>The recordings below are separate showreel cues offered as adjacent listening. They are not presented as placements in this production; read the cue notes or play an MP3 if useful.</p>
${relatedCues.slice(0, 3).map((cue) => `        <p style="margin-top:1.25rem"><strong><a href="/reel/${esc(cue.slug)}">${esc(cue.title)}</a></strong> · ${esc(cue.category)} · ${esc(cue.duration)}</p>
${audioPlayer(cue.audioPath, cue.title)}
        <p class="small"><a href="${esc(cue.audioPath)}">Open the MP3 directly</a></p>`).join('\n')}
      </section>`;

  return {
    metaList,
    index: indexList([
      ['entry', 'The production'],
      ['detail', 'Credits and project facts'],
      ['sample', sample ? 'Project video' : 'Adjacent showreel listening'],
      ['related', 'Related entries'],
    ]),
    relatedNo: 'IV',
    sections: `      <section class="clause" id="entry">
        <h2><span class="no">I</span> The production</h2>
${figure(production.poster, 'poster')}
${production.paragraphs.map((paragraph) => `        <p>${esc(paragraph)}</p>`).join('\n')}
      </section>

      <section class="clause" id="detail">
        <h2><span class="no">II</span> Credits and project facts</h2>
${tableRows(rows)}
      </section>

${sampleSection}`,
    crossLinks: `The <a href="/work">selected productions archive</a> · <a href="/hire-a-composer">hire a horror composer</a> · adjacent cues: ${cueLinkList(production.relatedCueSlugs)} · <a href="/process">scoring process</a> · <a href="/contact">contact</a>.`,
  };
}

/* --------------------------------------------------------------------- cue */

function cueMeta(cue: Cue, item: ItemRoute): MetaSections {
  const metaList = [
    `<li>Showreel track <b>${String(cue.track + 1).padStart(2, '0')} / ${cues.length}</b></li>`,
    `<li>Category <b>${esc(cue.category)}</b></li>`,
    `<li>Runtime <b>${esc(cue.duration)}</b></li>`,
  ].join('\n      ');
  const rows: Array<[string, string]> = [
    ['Showreel position', `${cue.track + 1} of ${cues.length}`],
    ['Category', esc(cue.category)],
    ['Runtime', `${esc(cue.duration)} (${cue.durationSeconds} seconds)`],
    ['Composer', esc(AUTHOR_NAME)],
    ['Audio format', 'MP3'],
    ['Direct file', `<a href="${esc(cue.audioPath)}">${esc(cue.audioPath)}</a>`],
    ['Related catalogue release', releaseLinkList(cue.releaseSlugs)],
    updatedRow(item),
  ];

  return {
    metaList,
    index: indexList([
      ['entry', 'Cue description'],
      ['listen', 'Listen to the MP3'],
      ['detail', 'Cue facts'],
      ['related', 'Related entries'],
    ]),
    relatedNo: 'IV',
    sections: `      <section class="clause" id="entry">
        <h2><span class="no">I</span> Cue description</h2>
        <p>${esc(cue.description)}</p>
${cue.paragraphs.map((paragraph) => `        <p>${esc(paragraph)}</p>`).join('\n')}
      </section>

      <section class="clause" id="listen">
        <h2><span class="no">II</span> Listen to the MP3</h2>
        <p>The showreel recording is available here and as a direct MP3 file. Playback is optional; the description and contextual notes remain readable without sound or JavaScript.</p>
${cuePlayerList(cue)}
      </section>

      <section class="clause" id="detail">
        <h2><span class="no">III</span> Cue facts</h2>
${tableRows(rows)}
      </section>`,
    crossLinks: `Browse <a href="/reel">all ${cues.length} showreel cues</a> · <a href="/hire-a-composer">hire a horror composer</a> · related releases: ${releaseLinkList(cue.releaseSlugs)} · <a href="/contact">scoring inquiry</a>.`,
  };
}

/* ------------------------------------------------------------------ release */

function releaseMeta(release: Release, item: ItemRoute): MetaSections {
  const related = release.relatedCueSlugs.map((slug) => cueBySlug.get(slug)).filter((cue): cue is Cue => Boolean(cue));
  const metaList = [
    `<li>Catalogue section <b>${esc(release.section)}</b></li>`,
    `<li>Item type <b>${esc(release.kicker)}</b></li>`,
    ...(release.platform ? [`<li>Platform <b>${esc(release.platform)}</b></li>`] : []),
    ...(release.creatorName ? [`<li>Creator credit <b>${esc(release.creatorName)}</b></li>`] : []),
  ].join('\n      ');

  const rows: Array<[string, string]> = [
    ['Catalogue section', esc(release.section)],
    ['Item type', esc(release.kicker)],
    ['Platform', esc(release.platform)],
    ...(release.creatorName ? [['Creator / credit', esc(release.creatorName)] as [string, string]] : []),
    ...(release.sellerName ? [['Seller name shown by source', esc(release.sellerName)] as [string, string]] : []),
    ...(release.releaseDate ? [['Published', esc(release.releaseDate)] as [string, string]] : []),
    ...(release.durationSeconds ? [['Runtime', esc(displayDuration(release.durationSeconds))] as [string, string]] : []),
    ...release.facts.map((fact): [string, string] => [esc(fact.label), esc(fact.value)]),
    ...(release.listingUrl ? [['Source listing', `<a href="${esc(release.listingUrl)}" target="_blank" rel="noopener noreferrer">Open the ${esc(release.platform)} listing</a>`] as [string, string]] : []),
    updatedRow(item),
  ];

  const releaseImage = release.image ? figure(release.image, 'square') : '';
  const listening = related.length
    ? `      <section class="clause" id="listen">
        <h2><span class="no">III</span> Related showreel listening</h2>
        <p>The linked cues are separate showreel records. They are connected by verified title or catalogue references, but are not described here as checkout previews.</p>
${related.map((cue) => `        <p style="margin-top:1.25rem"><strong><a href="/reel/${esc(cue.slug)}">${esc(cue.title)}</a></strong> · ${esc(cue.category)} · ${esc(cue.duration)}</p>
${audioPlayer(cue.audioPath, cue.title)}
        <p class="small"><a href="${esc(cue.audioPath)}">Open the MP3 directly</a></p>`).join('\n')}
      </section>`
    : '';
  const offerSectionNo = related.length ? 'IV' : 'III';
  const relatedNo = related.length ? 'V' : 'IV';
  const offerSection = `      <section class="clause" id="listing">
        <h2><span class="no">${offerSectionNo}</span> Source and availability</h2>
${release.listingUrl
  ? `        <p>The external listing is the source for current terms, formats, variants, and availability. This archive page deliberately does not repeat time-sensitive prices or stock claims.</p>
        <p style="margin-top:1rem"><a class="btn" href="${esc(release.listingUrl)}" target="_blank" rel="noopener noreferrer">View on ${esc(release.platform)}</a></p>`
  : `        <p>${esc(release.linkNote ?? 'No verified external listing is available for this catalogue record, so no purchase link is shown.')}</p>`}
      </section>`;

  return {
    metaList,
    index: indexList([
      ['entry', 'The catalogue item'],
      ['detail', 'Verified item facts'],
      ...(related.length ? [['listen', 'Related showreel listening'] as [string, string]] : []),
      ['listing', 'Source and availability'],
      ['related', 'Related entries'],
    ]),
    relatedNo,
    sections: `      <section class="clause" id="entry">
        <h2><span class="no">I</span> The catalogue item</h2>
${releaseImage}
        <p>${esc(stripMarkup(release.summary))}</p>
${release.paragraphs.map((paragraph) => `        <p>${esc(paragraph)}</p>`).join('\n')}
      </section>

      <section class="clause" id="detail">
        <h2><span class="no">II</span> Verified item facts</h2>
${tableRows(rows)}
      </section>

${listening ? `${listening}\n\n` : ''}${offerSection}`,
    crossLinks: `The <a href="/store">full catalogue</a> · <a href="/hire-a-composer">hire a horror composer</a> · related cues: ${cueLinkList(release.relatedCueSlugs)} · <a href="/purchases">purchase information</a> · <a href="/contact">contact</a>.`,
  };
}

/* -------------------------------------------------------------- document */

/**
 * The one-line lead under the H1. It closes with the studio byline so the
 * brand the <title> promises is also in the first visible lines of the main
 * content - the 2026-10-22 audit found "Zazie Productions" in item titles but
 * not in the extracted body copy of the showreel and catalogue pages.
 */
function leadFor(item: ItemRoute): string {
  if (item.kind === 'production') {
    const production = productionBySlug.get(item.slug)!;
    return `${production.workType}${production.releaseYear ? ` · ${production.releaseYear}` : ''} · ${production.genres.join(', ')} · Zazie Productions`;
  }
  if (item.kind === 'cue') {
    const cue = cueBySlug.get(item.slug)!;
    return `Track ${String(cue.track + 1).padStart(2, '0')} · ${cue.category} · ${cue.duration} · Zazie Productions`;
  }
  const release = releaseBySlug.get(item.slug)!;
  return `${release.section} · ${release.kicker}${release.platform ? ` · ${release.platform}` : ''} · Zazie Productions`;
}

function imageFor(item: ItemRoute): Image | undefined {
  if (item.kind === 'production') return productionBySlug.get(item.slug)?.poster;
  if (item.kind === 'cue') return undefined;
  return releaseBySlug.get(item.slug)?.image;
}

/**
 * LCP preload for the entry artwork.
 *
 * Two audit findings shaped this: work pages lost seconds of LCP because the
 * preload pointed at the JPEG while the <picture> rendered the AVIF (the
 * preloaded bytes were never painted, and both formats downloaded), and
 * catalogue pages with hosted artwork (Gumroad, itch.io, Bandcamp, eBay) got
 * no preload at all. The preload now targets the same file the <picture> will
 * actually paint - AVIF when it exists - and remote artwork is preloaded and
 * preconnected instead of skipped.
 */
function preloadImage(image: Image | undefined): string {
  if (!image) return '';
  const target = image.avif ?? image.src;
  return `<link rel="preload" as="image" href="${esc(target)}" fetchpriority="high"/>`;
}

/**
 * preconnect/dns-prefetch for the third-party origins a page really touches:
 * the host of remote catalogue artwork (LCP-critical), the thumbnail host and
 * the watch-page host of a film sample (only needed once a visitor presses
 * play, so dns-prefetch is enough there).
 */
function thirdPartyHints(item: ItemRoute): string {
  const hints: string[] = [];
  const seen = new Set<string>();
  const add = (origin: string, rel: 'preconnect' | 'dns-prefetch'): void => {
    const key = `${rel} ${origin}`;
    if (seen.has(key)) return;
    seen.add(key);
    hints.push(`<link rel="${rel}" href="${esc(origin)}"/>`);
  };
  const originOf = (href: string): string | undefined => {
    try {
      const parsed = new URL(href);
      return parsed.protocol === 'https:' ? parsed.origin : undefined;
    } catch {
      return undefined;
    }
  };
  const image = imageFor(item);
  if (image) {
    const origin = /^https?:\/\//.test(image.src) ? originOf(image.src) : undefined;
    if (origin) {
      add(origin, 'preconnect');
      add(origin, 'dns-prefetch');
    }
  }
  if (item.kind === 'production') {
    const sample = productionBySlug.get(item.slug)?.sample;
    if (sample) {
      const thumbOrigin = /^https?:\/\//.test(sample.thumbnail.src) ? originOf(sample.thumbnail.src) : undefined;
      if (thumbOrigin) add(thumbOrigin, 'dns-prefetch');
      const watch = watchUrlFor(sample);
      const watchOrigin = watch ? originOf(watch) : undefined;
      if (watchOrigin) add(watchOrigin, 'dns-prefetch');
    }
  }
  return hints.join('\n');
}

export function renderItemPage(item: ItemRoute, chrome: PageChrome): RenderedItemPage {
  const hub = hubByPath.get(item.hub);
  const number = entryNumber(item);
  const total = entryTotal(item);
  const heading = item.kind === 'production'
    ? { prefix: 'Archive 01', label: 'Selected productions' }
    : item.kind === 'cue'
      ? { prefix: 'Archive 02', label: 'Showreel' }
      : { prefix: 'Archive 03', label: 'Catalogue' };
  const trail = [
    { name: 'Zazie Productions', path: '/' },
    { name: hub?.name ?? heading.label, path: item.hub },
    { name: displayName(item), path: item.path, current: true },
  ];
  const meta = metaFor(item);
  const aboutId = item.kind === 'production'
    ? `${url(item.path)}#work`
    : item.kind === 'cue'
      ? `${url(item.path)}#composition`
      : `${url(item.path)}#product`;
  const typedNodes = item.kind === 'production'
    ? productionNodes(productionBySlug.get(item.slug)!, item.path)
    : item.kind === 'cue'
      ? cueNodes(cueBySlug.get(item.slug)!, item.path)
      : releaseNodes(releaseBySlug.get(item.slug)!, item.path);
  const jsonLd: Json[] = [
    webPageNode({ path: item.path, name: item.title, description: item.description, lastmod: item.lastmod, aboutId }),
    ...typedNodes,
    breadcrumbList(item.path, trail),
  ];
  const image = imageFor(item);
  const head = seoBlock({
    title: item.title,
    description: item.description,
    canonical: url(item.path),
    robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    ogType: item.kind === 'production'
      ? (productionBySlug.get(item.slug)?.sample ? OG_TYPES.video : OG_TYPES.website)
      : item.kind === 'cue'
        ? OG_TYPES.music
        : OG_TYPES.product,
    ...(image ? { image: ogImageFor(image) } : {}),
    jsonLd,
  });

  const h1 = headlineFor(item);
  const pageTitle = displayName(item);
  const pageHtml = `<!DOCTYPE html>
<html lang="en" style="background:#030303;color-scheme:dark">
<head>
<meta charset="utf-8"/>
<link href="/favicon.svg" rel="icon" type="image/svg+xml"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover"/>
<meta name="theme-color" content="#030303"/>
<link rel="preload" as="font" type="font/woff2" href="/fonts/cormorant-garamond-latin-400-normal.woff2" crossorigin/>
<link rel="preload" as="font" type="font/woff2" href="/fonts/inter-latin-wght-normal.woff2" crossorigin/>
${preloadImage(image)}
${thirdPartyHints(item)}
<link href="/${chrome.legalCss}" rel="stylesheet"/>
<link href="/${chrome.itemCss}" rel="stylesheet"/>
${head}
</head>
<body>
${chrome.masthead.trim()}

<main id="doc">
<header class="doc-head">
  <div class="shell doc-head-inner">
    ${breadcrumbs(trail)}
    <p class="eyebrow">${esc(heading.prefix)} · ${esc(heading.label)} · Entry ${String(number).padStart(2, '0')} / ${total}</p>
    <h1>${headlineMarkup(h1)}</h1>
    <p class="doc-lead">${esc(leadFor(item))}</p>
    <ul class="doc-meta">
      ${meta.metaList}
    </ul>
  </div>
</header>

<div class="doc">
  <div class="shell doc-layout">
    <nav class="doc-index" aria-label="On this page">
      <p>Contents</p>
      <ol>
${meta.index}
      </ol>
    </nav>

    <div class="doc-body">
${meta.sections}

      <section class="clause" id="related">
        <h2><span class="no">${meta.relatedNo}</span> Related entries</h2>
        <p>This archive gives the entry a direct page, keeps it connected to its original hub, and provides text links to other records in the same collection.</p>
        <p><a class="btn btn-ghost" href="${esc(item.hub)}">All ${esc((hub?.name ?? heading.label).toLowerCase())}</a></p>
${siblingCards(siblingsOf(item, 4), item.hub)}
        <p style="margin-top:1.5rem">${meta.crossLinks}</p>
        <p class="stamp" style="margin-top:1rem">${esc(creditLine())} · Last updated <time datetime="${esc(item.lastmod)}">${esc(item.lastmod)}</time></p>
      </section>
    </div>
  </div>
</div>
</main>

${chrome.footer.trim()}

<noscript>
  <div class="shell" style="padding:2.5rem 0 0">
    <p><strong>${esc(oneLine(pageTitle))}</strong></p>
    <p>${esc(oneLine(item.description))}</p>
    <p><a href="${esc(item.hub)}">${esc(hub?.name ?? heading.label)}</a> · <a href="/">Zazie Productions home</a> · <a href="/sitemap">Site map</a></p>
  </div>
</noscript>

<script src="/${chrome.legalJs}" defer></script>
<script src="/${chrome.itemJs}" defer></script>
</body>
</html>
`;

  return { path: item.path, kind: item.kind, html: pageHtml, title: item.title, description: item.description };
}
