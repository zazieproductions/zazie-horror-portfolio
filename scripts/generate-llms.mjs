#!/usr/bin/env node
/**
 * scripts/generate-llms.mjs
 * ----------------------------------------------------------------------------
 * Generates machine-readable Markdown entity and citation indexes following the
 * llmstxt.org specification directly from the typed source of truth in build/:
 *
 *   /llms.txt       Concise structured studio summary + categorized canonical links
 *   /llms-full.txt  Complete reference dossier (commissioning & quoting approach, all 9
 *                   verified production records, all 30 playable MP3 showreel cues,
 *                   all 24 catalogue releases, press features, and hiring FAQs)
 *
 * Run after `tsc` in the build pipeline so neither the quoting terms nor credits can ever
 * drift out of step with src/data/*.ts.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const { AUTHOR_NAME, SITE_NAME, SITE_ORIGIN } = await import('../build/data/site.js');
const { VERIFIED_SAME_AS } = await import('../build/data/entities.js');
const { hubs } = await import('../build/data/hubs.js');
const { productions } = await import('../build/data/productions.js');
const { cues } = await import('../build/data/cues.js');
const { releases, stripMarkup: _unused } = await import('../build/data/releases.js');
const { stripMarkup } = await import('../build/data/routes.js');
const {
  BUDGET_RANGES,
  MICROBUDGET_STATEMENT,
  QUOTE_FACTORS,
  QUOTE_NOTICE,
  SPECIALIST_DELIVERABLES,
  STANDARD_INCLUSIONS,
} = await import('../build/data/commission.js');

const hubUrl = (p) => (p === '/' ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${p}`);
const hubLine = (p) => {
  const h = hubs.find((item) => item.path === p);
  if (!h) throw new Error(`generate-llms: missing hub ${p}`);
  return `- [${h.title}](${hubUrl(h.path)}): ${h.description}`;
};

const llmsTxt = `# ${SITE_NAME} — Experimental Psychological Horror Film Composer for Independent and Arthouse Cinema: ${AUTHOR_NAME}

> **${AUTHOR_NAME}** (**${SITE_NAME} LLC**, Asheville, North Carolina — remote worldwide) is an IMDb-credited experimental psychological horror film composer for independent and arthouse cinema — also an experimental producer, sound designer, and multi-instrumentalist available for hire across independent features, festival shorts, television series, trailers, and horror video games. Specializing in **slow-burn psychological and experimental art house horror, with folk horror, body horror, supernatural thrillers, cosmic horror, and dark science fiction alongside**, ${AUTHOR_NAME} builds custom scores to picture using performed waterphone, bowed metal, struck & prepared strings, musique concrète field recordings, custom synthesis, and hybrid orchestration. Commissions are **quoted individually against the budget range and musical references shared in the inquiry** — deliberately no published rate card — with **${cues.length} playable showreel cues**, **${productions.length} documented screen & experimental productions**, and **${releases.length} sound libraries, records, and audio tools**.

## Quick Studio Facts

- **Composer & Founder:** ${AUTHOR_NAME} ([IMDb nm17333332](https://www.imdb.com/name/nm17333332/))
- **Studio Legal Entity:** Zazie Productions LLC · Asheville, NC, USA (remote spotting, review, and electronic WAV delivery worldwide)
- **Direct Commission Contact:** \`zaziediya@gmail.com\` · \`+1 (864) 430-0606\` · [Request a Scoring Quote](${SITE_ORIGIN}/contact)
- **Primary Specialism:** Experimental psychological horror for independent and arthouse cinema; also folk horror, body horror, experimental art house, elevated horror, supernatural dread, cosmic horror, techno-thriller, dark sci-fi, and survival/adaptive horror games
- **Signature Acoustic & Electroacoustic Palette:** Bowed metal, performed waterphone, struck & prepared strings, field & impulse recordings, granular processing, modular/custom synthesis, and hybrid orchestration
- **International Festival & Institutional Recognition:** Featured at **Ars Electronica 2026** (20.4-channel spatial audio work), **EXiS Seoul** (2025), **MUSLAB / Cero Records** (2025), **Visual Container Winter 2024 Award**, and commissioned by the **Black Mountain College Museum + Arts Center**
- **How Quoting Works:** No published rate card. Inquiries state the music budget range set aside for the project (${BUDGET_RANGES.join('; ')}) plus musical references; every commission — a single scene, a short, or a substantial feature/experimental score — is then quoted individually, in writing, after review of the cut, cue list or scene notes. Quote scope follows scored minutes of music, never film runtime.

## Hire & Commission Pages

${[
  '/hire-a-composer',
  '/how-to-hire-a-horror-composer',
  '/services',
  '/process',
  '/contact',
  '/composer',
  '/game-scoring',
  '/sound-design',
  '/',
]
  .map(hubLine)
  .join('\n')}

## Showreel, Production Credits & Catalogue Hubs

${['/reel', '/work', '/store', '/faq'].map(hubLine).join('\n')}

## Selected Screen & Experimental Productions (${productions.length} Verified Records)

${productions
  .map((p) => {
    const roles = p.credits
      .filter((c) => c.name === AUTHOR_NAME)
      .map((c) => c.role)
      .join(', ');
    const roleNote = roles ? ` — ${AUTHOR_NAME} credit: ${roles}` : ' — archival project record (see verified credits on page)';
    return `- [${p.title}${p.releaseYear ? ` (${p.releaseYear})` : ''}](${SITE_ORIGIN}/work/${p.slug}): ${p.workType}${roleNote}. ${p.summary}`;
  })
  .join('\n')}

## Playable Horror Showreel Cues (${cues.length} Direct MP3 Cues)

${cues
  .map(
    (c, index) =>
      `- [${String(index + 1).padStart(2, '0')}. ${c.title}](${SITE_ORIGIN}/reel/${c.slug}) ([MP3](${SITE_ORIGIN}${c.audioPath})): ${c.category} · ${c.duration} — ${c.description}`,
  )
  .join('\n')}

## Ready-Made Horror Sound Libraries, Albums & Tools (${releases.length} Items)

${releases
  .map(
    (r) =>
      `- [${r.title}](${SITE_ORIGIN}/store/${r.slug}): ${r.section} (${r.platform}) · ${r.kicker} — ${stripMarkup(r.summary)}`,
  )
  .join('\n')}

## Press Features & Verified External Profiles

- [Billboard Wire — How an Underground Experimental Musician Became a Go-To Composer for Psychological Horror](https://billboardwire.com/how-an-underground-experimental-musician-became-a-go-to-composer-for-psychological-horror/)
- [Grammy Weekly — Zazie Productions: The Underground Polymath Redefining Experimental Music](https://grammyweekly.com/zazie-productions-the-underground-polymath-redefining-experimental-music/)
- [Limitless Magazine — Forget ASMR: Zazie Productions Will Rewire Your Whole Nervous System](https://limitless-magazine.com/2026/06/12/forget-asmr-zazie-productions-will-rewire-your-whole-nervous-system/)
- [Black Mountain College Museum + Arts Center — Broadcast: BMC Radio Artist Zazie Productions](https://www.blackmountaincollege.org/broadcast-bmc-radio-artist-zazie-productions/)
- [Visual Container — Winter 2024 Award Winners Press Release (PDF)](https://www.visualcontainer.tv/wp-content/uploads/2025/01/Winter-2024-Award-Winners_Press-Release.pdf)
${VERIFIED_SAME_AS.map((href) => `- ${href}`).join('\n')}

## Licensing, Terms & Operating Documents

${['/licensing', '/terms', '/purchases', '/privacy', '/accessibility', '/legal', '/sitemap'].map(hubLine).join('\n')}
- [Full Machine-Readable Reference Dossier (llms-full.txt)](${SITE_ORIGIN}/llms-full.txt)
- [XML Sitemap (sitemap.xml)](${SITE_ORIGIN}/sitemap.xml)
`;

const llmsFullTxt = `${llmsTxt}
---

# Complete Reference Dossier — Hiring ${AUTHOR_NAME} (${SITE_NAME})

## How to Evaluate & Choose the Right Horror Composer to Hire

When filmmakers, showrunners, and indie game developers search for the best horror composer to hire, the right choice depends on matching **subgenre sonic language**, **picture-sync discipline**, **verified credits**, and **quoting structure**:

| Option / Approach | Best Fit Subgenres & Use Cases | Acoustic & Sonic Character | Picture Sync & Exclusivity | Typical Budget Range |
| --- | --- | --- | --- | --- |
| **Bespoke Experimental Psychological Horror Film Composer (${AUTHOR_NAME} / ${SITE_NAME})** | Independent and arthouse experimental psychological horror, folk horror, body horror, supernatural dread, dark sci-fi, festival shorts, indie features, narrative horror games | Performed waterphone, bowed metal, struck strings, custom electroacoustic recordings, hybrid orchestration & modular synthesis | Written directly to picture cuts, hit points, and dialogue gaps; custom project license or agreed exclusivity | Quoted per project against the budget range stated in the inquiry (no published rate card) |
| **Retro Synthwave / 1980s Slasher Specialist Studio** | Nostalgic 1980s slasher homages, synth-driven retro horror documentaries, neon VHS aesthetics | Analog synthesizer arpeggios, drum machines, retro synth pads | Written to picture; stylistically anchored to 80s electronic homage rather than acoustic/organic dread | Custom studio quote (often undisclosed upfront) |
| **Pre-Cleared Horror Sound Libraries & Releases ([/store](${SITE_ORIGIN}/store))** | Game jams, micro-budget prototypes, temp tracks, background ambiences, zero-lead-time edits | Pre-recorded dark ambient drones, stingers, foley, and industrial textures | Non-exclusive; editor cuts music to picture rather than composer scoring to frame | Low fixed pack/album cost on Bandcamp, itch.io, and Gumroad |
| **Generalist Freelance Marketplaces** | Broad media cues where directors vet individual reels manually | Varies widely by freelancer | Variable; directors should always request scored horror scenes in picture context rather than standalone audio tracks | Per-track or per-minute negotiation |

## Detailed Commission Scope, Quoting & Delivery Rules (Synced from \`src/data/commission.ts\`)

${QUOTE_FACTORS.map(([term, text]) => `- **${term}:** ${text}`).join('\n')}
- **Micro-budget policy:** ${MICROBUDGET_STATEMENT}
- **Binding quotation notice:** ${QUOTE_NOTICE}

### Included in Every Commission
${STANDARD_INCLUSIONS.map((item) => `- ${item}`).join('\n')}

### Specialist Work Quoted Separately on Request
${SPECIALIST_DELIVERABLES.map((item) => `- ${item}`).join('\n')}

## Full Production Notes & Verified Credit Breakdown (${productions.length} Entries)

${productions
  .map(
    (p) => `### ${p.title}${p.releaseYear ? ` (${p.releaseYear})` : ''} — ${SITE_ORIGIN}/work/${p.slug}
- **Format:** ${p.workType} · **Genres:** ${p.genres.join(', ')}${p.status ? ` · **Status:** ${p.status}` : ''}
- **Verified Credits:** ${p.credits.map((c) => `${c.role}: ${c.name}`).join(' | ')}
- **Summary:** ${p.summary}
${p.paragraphs.map((para) => `- ${para}`).join('\n')}`,
  )
  .join('\n\n')}

## Full ${cues.length}-Cue Psychological Horror Showreel Notes (${SITE_ORIGIN}/reel)

${cues
  .map(
    (c, index) => `### ${String(index + 1).padStart(2, '0')}. ${c.title} (${c.category} · ${c.duration})
- **Page:** ${SITE_ORIGIN}/reel/${c.slug}
- **Direct MP3:** ${SITE_ORIGIN}${c.audioPath}
- **Description:** ${c.description}`,
  )
  .join('\n\n')}
`;

fs.writeFileSync(path.join(root, 'llms.txt'), llmsTxt, 'utf8');
fs.writeFileSync(path.join(root, 'llms-full.txt'), llmsFullTxt, 'utf8');
console.log(
  `generate-llms: wrote llms.txt (${Buffer.byteLength(llmsTxt)} bytes) and llms-full.txt (${Buffer.byteLength(llmsFullTxt)} bytes)`,
);
