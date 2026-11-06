/**
 * src/data/hubs.ts
 * ----------------------------------------------------------------------------
 * The 19 routes that already existed before the per-item archive (the home page
 * plus the 18 silo / commission / document pages). Each entry carries the values
 * its own static <head> already ships - title, meta description, lastmod and the
 * image / video metadata sitemap.xml has always attached to the URL - so
 * scripts/generate-sitemap.mjs can rebuild sitemap.xml without a single
 * hand-typed string.
 *
 * Migrated 2026-10-04 from sitemap.xml (19 URLs, 47 images, 8 videos) and each
 * route's own <head>. URLs are never stored here: they are derived from `path`
 * by url() in src/data/site.ts, so they cannot drift.
 *
 * DO NOT add item routes here. Productions, cues and store items live in
 * productions.ts / cues.ts / releases.ts and are addressed through
 * src/data/routes.ts.
 */

import type { Hub } from './types.js';

export const hubs: Hub[] = [
  {
    path: "/",
    name: "Portfolio",
    // Primary search identity (2026-10-26): experimental psychological horror
    // film composer for independent and arthouse cinema. The title carries the
    // specialist phrase inside the 30-60 character budget (no brand suffix);
    // the description is short, niche-forward SERP copy (2026-11-02 policy:
    // 80-140 characters, no keyword stacking). Both are what the WebPage
    // JSON-LD and sitemap reuse.
    title: "Experimental Psychological Horror Composer | Arthouse Film",
    description: `Experimental psychological horror film scores for indie and arthouse cinema by Zazie Kanwar-Torge. Bespoke work, quoted per project.`,
    lastmod: "2026-10-27",
    images: [
      { loc: "https://horror.zazieproductions.com/images/hero-portrait.jpg", caption: "Portfolio portrait for Zazie Productions, a composer and sound-design studio working across screen and experimental media.", title: "Zazie Kanwar-Torge: Psychological Horror Composer - Dark Atmospheric Scores" },
      { loc: "https://horror.zazieproductions.com/images/headshot.jpg", caption: "Zazie Kanwar-Torge, composer and sound designer associated with Zazie Productions LLC.", title: "Zazie Kanwar-Torge headshot - horror film composer, Zazie Productions LLC" },
      { loc: "https://horror.zazieproductions.com/images/posters/expire-red-check-1200.jpg", caption: "EXPIRE poster artwork. IMDb credits Zazie Kanwar-Torge for sound design; the listed composers are Patricia Chaylade, Jorayo, and Brennan Mack.", title: "EXPIRE (2025) - Short Film; Sound Design Credit" },
      { loc: "https://horror.zazieproductions.com/images/posters/unseen-1200.jpg", caption: "UNSEEN poster artwork. IMDb lists Steve Merlo as composer; no Zazie composing credit is asserted here.", title: "UNSEEN - Feature Film Record; IMDb Composer Credit: Steve Merlo" },
      { loc: "https://horror.zazieproductions.com/images/posters/the-haunted-1200.jpg", caption: "THE HAUNTED poster artwork for the horror and science-fiction short; IMDb credits Zazie Kanwar-Torge and Robert Mason Sandifer as co-composers.", title: "THE HAUNTED - Horror and Science-Fiction Short" },
      { loc: "https://horror.zazieproductions.com/images/posters/peregrinus-1200.jpg", caption: "PEREGRINUS series poster. IMDb describes a science-fiction thriller and credits Zazie Kanwar-Torge as a co-composer.", title: "PEREGRINUS - Science-Fiction Thriller Series" },
      { loc: "https://horror.zazieproductions.com/images/posters/phantom-requiem-1200.jpg", caption: "Poster artwork for Phantom Requiem, an experimental short published by Zazie Productions.", title: "Phantom Requiem - Experimental Short" },
      { loc: "https://horror.zazieproductions.com/images/posters/eclipsed-1200.jpg", caption: "Poster artwork for ECLIPSED, a short whose IMDb composer credits include Zazie Kanwar-Torge and Noah C. Castro.", title: "ECLIPSED - Short Film; Composer Credits Include Zazie Kanwar-Torge and Noah C. Castro" },
      { loc: "https://horror.zazieproductions.com/images/posters/choleric-1200.jpg", caption: "Poster artwork for CHOLERIC. IMDb credits Zazie Kanwar-Torge as co-producer.", title: "CHOLERIC - Short Film; Co-Producer Credit" },
      { loc: "https://horror.zazieproductions.com/images/posters/mike-has-a-visitor-1200.jpg", caption: "Poster artwork for MIKE HAS A VISITOR; IMDb credits Zazie Kanwar-Torge as composer.", title: "MIKE HAS A VISITOR - Horror Short; Composer Credit" },
      { loc: "https://horror.zazieproductions.com/images/posters/the-dark-awaits-1200.jpg", caption: "Poster artwork for THE DARK AWAITS, a paranormal reality-TV series; IMDb credits Zazie Kanwar-Torge as composer.", title: "THE DARK AWAITS - Paranormal Reality-TV Series" },
      { loc: "https://horror.zazieproductions.com/images/posters/uncle-freds-monster-problem-1200.jpg", caption: "Poster artwork for UNCLE FRED'S MONSTER PROBLEM.", title: "UNCLE FRED'S MONSTER PROBLEM - Film Poster" },
    ],
    // Google Video Search indexes a video only when it is the prominent primary
    // content of a dedicated watch page and appears in initial HTML without a
    // click. The homepage is a multi-section portfolio whose eight film cards
    // use click-to-load facades (<button data-video-card>), so <video:video>
    // entries belong exclusively on the dedicated /work/<slug> watch pages.
    videos: [],
  },
  {
    path: "/work",
    name: "Selected productions",
    title: "Selected Production Records: Psychological Horror and Experimental Film | Zazie Productions",
    description: "Nine psychological horror and experimental production records with verified composer, co-composer and sound-design credits.",
    lastmod: "2026-10-26",
    images: [
      { loc: "https://horror.zazieproductions.com/images/posters/expire-red-check-640.jpg", caption: "EXPIRE (2025) - IMDb credits Zazie Kanwar-Torge for sound design; other composers are listed separately.", title: "EXPIRE - Production Record and Sound-Design Credit" },
      { loc: "https://horror.zazieproductions.com/images/posters/unseen-640.jpg", caption: "UNSEEN feature; IMDb lists Steve Merlo as composer.", title: "UNSEEN - Feature Film Record" },
      { loc: "https://horror.zazieproductions.com/images/posters/peregrinus-640.jpg", caption: "PEREGRINUS science-fiction thriller series; IMDb credits Zazie Kanwar-Torge as co-composer.", title: "PEREGRINUS - Science-Fiction Thriller Series" },
      { loc: "https://horror.zazieproductions.com/images/posters/phantom-requiem-640.jpg", caption: "Phantom Requiem - experimental short published by Zazie Productions.", title: "Phantom Requiem - Experimental Short" },
      { loc: "https://horror.zazieproductions.com/images/posters/eclipsed-640.jpg", caption: "ECLIPSED short; IMDb lists Zazie Kanwar-Torge and Noah C. Castro as composers.", title: "ECLIPSED - Short Film; Composer Credits" },
      { loc: "https://horror.zazieproductions.com/images/posters/the-haunted-640.jpg", caption: "THE HAUNTED horror and science-fiction short; IMDb credits Zazie Kanwar-Torge and Robert Mason Sandifer as co-composers.", title: "THE HAUNTED - Horror and Science-Fiction Short" },
      { loc: "https://horror.zazieproductions.com/images/posters/choleric-640.jpg", caption: "CHOLERIC short; IMDb credits Zazie Kanwar-Torge as co-producer.", title: "CHOLERIC - Short Film; Co-Producer Credit" },
      { loc: "https://horror.zazieproductions.com/images/posters/mike-has-a-visitor-640.jpg", caption: "MIKE HAS A VISITOR short; IMDb credits Zazie Kanwar-Torge as composer.", title: "MIKE HAS A VISITOR - Horror Short; Composer Credit" },
      { loc: "https://horror.zazieproductions.com/images/posters/the-dark-awaits-640.jpg", caption: "THE DARK AWAITS paranormal reality-TV series; IMDb credits Zazie Kanwar-Torge as composer.", title: "THE DARK AWAITS - Paranormal Reality-TV Series" },
      { loc: "https://horror.zazieproductions.com/images/project-HaVJP08j77U.jpg", caption: "Still from Mike Has A Visitor, sleep paralysis horror short scored by Zazie Kanwar-Torge", title: "Mike Has A Visitor - Film Still" },
      { loc: "https://horror.zazieproductions.com/images/project-ItrrcilS0ro.jpg", caption: "Still from GOODBYE, BROTHER, dramatic short scored by Zazie Kanwar-Torge", title: "GOODBYE, BROTHER - Film Still" },
      { loc: "https://horror.zazieproductions.com/images/project-riCvy2abhlc.jpg", caption: "Still from Home Intruder, action thriller chase sequence scored by Zazie Kanwar-Torge", title: "Home Intruder - Film Still" },
      { loc: "https://horror.zazieproductions.com/images/project-Ty8tPp59mDc.jpg", caption: "Still from The Haunted teaser by Crystal Fox Films, scored by Zazie Kanwar-Torge", title: "The Haunted - Film Still" },
      { loc: "https://horror.zazieproductions.com/images/project-rvCGO0BJ_2E.jpg", caption: "Still from AQUAPHOBIA, folk and body horror short scored by Zazie Kanwar-Torge", title: "AQUAPHOBIA - Film Still" },
      { loc: "https://horror.zazieproductions.com/images/project-6qa3Uwj47fc.jpg", caption: "Still from Whispers In The Dark, horror short scored by Zazie Kanwar-Torge", title: "Whispers In The Dark - Film Still" },
      { loc: "https://horror.zazieproductions.com/images/project-UX2kv3G89Jw.jpg", caption: "Still from Phantom Requiem, gothic horror short scored by Zazie Kanwar-Torge", title: "Phantom Requiem - Film Still" },
      { loc: "https://horror.zazieproductions.com/images/eclipsed-cover-1280.jpg", caption: "Eclipsed film sample still - psychological thriller horror score by Zazie Kanwar-Torge", title: "Eclipsed - Psychological Thriller Film Sample" },
    ],
    videos: [],
  },
  {
    path: "/reel",
    name: "Showreel",
    title: "Psychological Horror Showreel: 30 Original Dark Cinematic Cues | Zazie Productions",
    description: "30 original experimental horror cues by Zazie Kanwar-Torge: dread beds, dark ambient textures, stingers and body horror. Stream the reel.",
    lastmod: "2026-10-26",
    images: [],
    videos: [],
  },
  {
    path: "/process",
    name: "Scoring process",
    title: "Psychological Horror Scoring Process: Spotting to Delivery | Zazie Productions",
    description: "How a psychological horror score takes shape: spotting, original motifs, agreed revisions and stereo WAV delivery.",
    lastmod: "2026-10-27",
    images: [
      { loc: "https://horror.zazieproductions.com/images/press-photo.jpg", caption: "Zazie Kanwar-Torge at the scoring desk, Asheville, NC studio", title: "Psychological Horror Scoring Suite - Process" },
    ],
    videos: [],
  },
  {
    path: "/store",
    name: "Catalogue",
    title: "Catalogue: Experimental Music, Sound Libraries, Tools and Objects | Zazie Productions",
    description: "Dark ambient records, horror sound libraries, experimental tools and objects from the Zazie Productions catalogue.",
    lastmod: "2026-10-21",
    images: [
      { loc: "https://f4.bcbits.com/img/a4087485987_16.jpg", caption: "Anesthesia for the Signal Age - ten-track experimental electronic album, released May 7, 2026.", title: "Anesthesia for the Signal Age - Zazie Productions" },
      { loc: "https://f4.bcbits.com/img/a4110701137_16.jpg", caption: "Opaline Lament (Life From The Beyond) - a haunting, string-driven meditation between chamber music and spectral cinema.", title: "Opaline Lament (Life From The Beyond) - Zazie Productions" },
      { loc: "https://f4.bcbits.com/img/a3756749177_16.jpg", caption: "Spectral Ode to Synesthesia - an 8:55 binaural acousmatic piece built from impulse noise, stretched rubber, electromagnetic and liquid field recordings.", title: "Spectral Ode to Synesthesia - Zazie Productions" },
      { loc: "https://f4.bcbits.com/img/a0612904516_16.jpg", caption: "To Halt Space Adrift - eight-track experimental album by Zazie Productions, released May 2023.", title: "To Halt Space Adrift - Zazie Productions" },
      { loc: "https://f4.bcbits.com/img/a0935502895_16.jpg", caption: "Constrained Capacity - ten-track dark ambient, industrial and noise album by Zazie Productions, released May 2022.", title: "Constrained Capacity - Zazie Productions" },
      { loc: "https://f4.bcbits.com/img/a0050695008_16.jpg", caption: "Vermiform - eight-track surreal avant-garde album by Zazie Productions, released July 2023.", title: "Vermiform - Zazie Productions" },
      { loc: "https://f4.bcbits.com/img/a0281727228_16.jpg", caption: "Interference Archive 01010101 - five-track synth-led electronic and experimental album, released September 8, 2021.", title: "Interference Archive 01010101 - Zazie Productions" },
      { loc: "https://f4.bcbits.com/img/a1008810016_16.jpg", caption: "Stutter to stammer - Bandcamp listing with one track, “List of Russian Spies on Wikipedia,” timed at 2:34.", title: "Stutter to stammer - Zazie Productions" },
    ],
    videos: [],
  },
  {
    path: "/faq",
    name: "FAQ",
    title: "Psychological Horror Scoring FAQ: Quotes, Process, Rights, Delivery - 35 Questions | Zazie Productions",
    description: "Commissioning a psychological horror film score: quotes, spotting, revisions, licensing and cue sheets in 35 answers.",
    lastmod: "2026-10-27",
    images: [],
    videos: [],
  },
  {
    path: "/legal",
    name: "All documents",
    title: "Documents: Horror Scoring Terms, Privacy, Licensing, Purchases | Zazie Productions",
    description: "Commissioning terms, horror score licensing, privacy and purchase policies for Zazie Productions LLC.",
    lastmod: "2026-10-18",
    images: [],
    videos: [],
  },
  {
    path: "/licensing",
    name: "Licensing and credits",
    title: "Horror Score Licensing, Rights and Credits: Buyout, Cue Sheets | Zazie Productions",
    description: "Horror score licensing: sync rights, buyout and exclusive options, writer share, PRO cue sheets and AI restrictions.",
    lastmod: "2026-10-13",
    images: [],
    videos: [],
  },
  {
    path: "/purchases",
    name: "Purchases and returns",
    title: "Purchases, Delivery and Returns: Horror Sound Libraries, Records | Zazie Productions",
    description: "Delivery and return terms for Zazie Productions sound libraries, experimental albums, tools and objects.",
    lastmod: "2026-10-13",
    images: [],
    videos: [],
  },
  {
    path: "/terms",
    name: "Terms",
    title: "Terms: Horror Film Scoring Commissioning, Quotes, Deposits | Zazie Productions",
    description: "Commissioning terms for a psychological horror score: written quotes, deposits, revisions, clearances and North Carolina law.",
    lastmod: "2026-10-17",
    images: [],
    videos: [],
  },
  {
    path: "/privacy",
    name: "Privacy notice",
    title: "Privacy Notice: Cookieless Analytics, No Cookies | Zazie Productions",
    description: "Privacy notice for this horror scoring portfolio: cookieless analytics, no ad trackers, no cookies and inquiry handling.",
    lastmod: "2026-10-26",
    images: [],
    videos: [],
  },
  {
    path: "/accessibility",
    name: "Accessibility",
    title: "Accessibility Statement: Horror Composer Portfolio | Zazie Productions",
    description: "Accessibility statement for this horror composer portfolio: contrast, keyboard navigation, reduced motion and known gaps.",
    lastmod: "2026-10-13",
    images: [],
    videos: [],
  },
  {
    path: "/sitemap",
    name: "Site map",
    title: "Site Map: Portfolio Hubs and Item Archive | Zazie Productions",
    description: "Browse the portfolio hubs, psychological horror production records, cue pages and catalogue entries.",
    lastmod: "2026-10-27",
    images: [],
    videos: [],
  },
  {
    path: "/hire-a-composer",
    name: "Hire a horror composer",
    title: "Hire an Experimental Psychological Horror Composer | Zazie Productions",
    description: "Hire an experimental psychological horror film composer for indie and arthouse cinema. Custom scores, quoted per project.",
    lastmod: "2026-10-27",
    images: [
      { loc: "https://horror.zazieproductions.com/images/press-photo.jpg", caption: "Zazie Kanwar-Torge, IMDb-credited experimental psychological horror film composer for hire at Zazie Productions LLC.", title: "Hire an Experimental Psychological Horror Composer | Zazie Kanwar-Torge" },
    ],
    videos: [],
  },
  {
    path: "/how-to-hire-a-horror-composer",
    name: "How to hire a horror composer",
    title: "How to Hire a Horror Composer: Budgets, Subgenres & Vetting Guide | Zazie Productions",
    description: "How indie filmmakers hire a horror composer: subgenre fit, custom vs. library music, budgets, spotting and rights.",
    lastmod: "2026-10-27",
    images: [
      { loc: "https://horror.zazieproductions.com/images/press-photo.jpg", caption: "Guide to hiring a horror composer for independent films, series, and video games by Zazie Kanwar-Torge.", title: "How to Hire a Horror Composer: Budgets, Subgenres & Vetting Checklist" },
    ],
    videos: [],
  },
  {
    path: "/sound-design",
    name: "Sound design",
    title: "Cinematic Sound Design for Psychological Horror Film | Zazie Productions",
    description: "Designed dread, atmospheres and stingers for psychological horror and arthouse film, delivered as mix-ready stems.",
    lastmod: "2026-10-26",
    images: [
      { loc: "https://horror.zazieproductions.com/images/posters/expire-red-check-640.jpg", caption: "EXPIRE sci-fi horror short - sound design by Zazie Kanwar-Torge, from the cinematic sound design page.", title: "Cinematic Sound Design for Psychological Horror Film - Zazie Productions" },
    ],
    videos: [],
  },
  {
    path: "/game-scoring",
    name: "Game scoring",
    title: "Adaptive Horror Game Scoring & Music | Zazie Productions",
    description: "Adaptive horror game scoring: layered stems, seamless loops and stingers for Wwise, FMOD, Unity and Unreal.",
    lastmod: "2026-10-17",
    images: [
      { loc: "https://horror.zazieproductions.com/images/posters/the-dark-awaits-640.jpg", caption: "THE DARK AWAITS - the tonal register behind adaptive horror scoring for games, by Zazie Kanwar-Torge.", title: "Adaptive Horror Game Scoring - Zazie Productions" },
    ],
    videos: [],
  },
];

/** The home route. Not a silo: it is the entity page the item pages reference. */
export const homePath = '/';
