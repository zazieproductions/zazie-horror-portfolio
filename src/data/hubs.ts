/**
 * src/data/hubs.ts
 * ----------------------------------------------------------------------------
 * The original portfolio, commission and document routes. Each entry carries the values
 * its own static <head> already ships - title, meta description, lastmod and the
 * image / video metadata sitemap.xml has always attached to the URL - so
 * scripts/generate-sitemap.mjs can rebuild sitemap.xml without a single
 * hand-typed string.
 *
 * Migrated from the source pages and sitemap metadata. Non-indexable support routes
 * remain available to visitors but are excluded from sitemap.xml.
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
    // the description states the full identity sentence verbatim. Both are
    // what the WebPage JSON-LD and sitemap reuse.
    title: "Experimental Psychological Horror Composer | Arthouse Film",
    description: `Experimental psychological horror film composer for independent and arthouse cinema. IMDb-credited bespoke scores by Zazie Kanwar-Torge, quoted per project.`,
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
    videos: [
      {
        thumbnailLoc: "https://horror.zazieproductions.com/images/project-ItrrcilS0ro.jpg",
        title: "GOODBYE, BROTHER: Original Dark Cinematic Film Score - Psychological Drama",
        description: "Dramatic short film scored by Zazie Kanwar-Torge. Atmospheric cinematic composition for dark psychological storytelling. Original themes and tension cues.",
        playerLoc: "https://www.youtube.com/embed/ItrrcilS0ro",
        tags: ["horror composer", "dark cinematic score", "psychological drama score"],
      },      {
        thumbnailLoc: "https://horror.zazieproductions.com/images/eclipsed-cover-1280.jpg",
        title: "ECLIPSED project sample",
        description: "A Drive-hosted project sample associated with the ECLIPSED short. IMDb describes the surreal horror premise and credits Zazie Kanwar-Torge and Noah C. Castro as composers.",
        playerLoc: "https://drive.google.com/file/d/1zKtAavEx-Yjd2To_troEYlxTTt62Y2OU/preview",
        tags: ["ECLIPSED", "short film sample"],
      },      {
        thumbnailLoc: "https://horror.zazieproductions.com/images/project-HaVJP08j77U.jpg",
        title: "MIKE HAS A VISITOR: sleep-paralysis horror short",
        description: "The 14:23 YouTube upload of MIKE HAS A VISITOR, published by director Marco Saikaley on June 30, 2025. IMDb separately credits Zazie Kanwar-Torge as composer.",
        playerLoc: "https://www.youtube.com/embed/HaVJP08j77U",
        duration: "863",
        publicationDate: "2025-06-30",
        tags: ["psychological horror composer", "horror film score", "sleep paralysis horror", "dark atmospheric score"],
      },      {
        thumbnailLoc: "https://horror.zazieproductions.com/images/project-riCvy2abhlc.jpg",
        title: "Home Intruder: Thriller Chase Cue - Tension-Driven Horror Composition",
        description: "Action thriller chase sequence scored by Zazie Kanwar-Torge. Tension-driven cinematic composition for thriller and horror. Dark, propulsive, dread-filled cue architecture.",
        playerLoc: "https://www.youtube.com/embed/riCvy2abhlc",
        tags: ["thriller chase music", "horror tension cue"],
      },      {
        thumbnailLoc: "https://horror.zazieproductions.com/images/project-Ty8tPp59mDc.jpg",
        title: "THE HAUNTED: official trailer",
        description: "Official trailer for THE HAUNTED from Crystal Fox Films. IMDb credits Zazie Kanwar-Torge and Robert Mason Sandifer as co-composers; the trailer is promotional film media, not a separate score excerpt.",
        playerLoc: "https://www.youtube.com/embed/Ty8tPp59mDc",
        duration: "149",
        tags: ["supernatural horror score", "haunted house music"],
      },      {
        thumbnailLoc: "https://horror.zazieproductions.com/images/project-rvCGO0BJ_2E.jpg",
        title: "AQUAPHOBIA: Short Horror Film Score - Folk and Body Horror",
        description: "Short horror film AQUAPHOBIA scored by Zazie Kanwar-Torge. Dark atmospheric composition for folk horror and psychological dread. Waterphone, bowed metal, hybrid orchestration.",
        playerLoc: "https://www.youtube.com/embed/rvCGO0BJ_2E",
        publicationDate: "2024-09-10",
        tags: ["folk horror music", "body horror score", "waterphone"],
      },      {
        thumbnailLoc: "https://horror.zazieproductions.com/images/project-6qa3Uwj47fc.jpg",
        title: "Whispers In The Dark: Horror Short Score - Atmospheric Dread Composition",
        description: "Horror short Whispers In The Dark scored by Zazie Kanwar-Torge. Atmospheric dread composition for supernatural horror. Slow-burn tension beds and psychological horror architecture.",
        playerLoc: "https://www.youtube.com/embed/6qa3Uwj47fc",
        tags: ["atmospheric horror music", "dread soundscape"],
      },      {
        thumbnailLoc: "https://horror.zazieproductions.com/images/project-UX2kv3G89Jw.jpg",
        title: "Phantom Requiem: experimental short film",
        description: "The complete 4:53 experimental short Phantom Requiem, published by Zazie Productions on June 20, 2024. The studio describes its visuals, sound, and music as part of the work.",
        playerLoc: "https://www.youtube.com/embed/UX2kv3G89Jw",
        duration: "293",
        publicationDate: "2024-06-20",
        tags: ["experimental short", "Phantom Requiem"],
      },
    ],
  },
  {
    path: "/work",
    name: "Selected productions",
    title: 'Selected Productions | Zazie Productions',
    description: 'A selected archive of film, television and experimental projects, with role-specific credits and public source links.',
    lastmod: "2026-10-29",
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
    ],
    videos: [],
  },
  {
    path: "/reel",
    name: "Showreel",
    title: 'Showreel · 30 Original Cues | Zazie Productions',
    description: 'Listen to 30 original cues by Zazie Kanwar-Torge, from slow-burn tension and dark ambient textures to orchestral and thriller motifs.',
    lastmod: "2026-10-29",
    images: [],
    videos: [],
  },
  {
    path: "/process",
    indexable: false,
    name: "Scoring process",
    title: 'Scoring Process | Zazie Productions',
    description: 'A concise overview of the scoring workflow, from an initial project inquiry through spotting, review and delivery.',
    lastmod: "2026-10-29",
    images: [
      { loc: "https://horror.zazieproductions.com/images/press-photo.jpg", caption: "Zazie Kanwar-Torge at the scoring desk, Asheville, NC studio", title: "Psychological Horror Scoring Suite - Process" },
    ],
    videos: [],
  },
  {
    path: "/store",
    name: "Catalogue",
    title: "Catalogue: Experimental Music, Sound Libraries, Tools and Objects | Zazie Productions",
    description: "Twenty-four catalogue entries across Bandcamp, itch.io, Gumroad, and eBay, including experimental music, sound libraries, software and visual assets, and physical objects. Current terms and availability remain with each source platform.",
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
    indexable: false,
    name: "FAQ",
    title: 'Project FAQ | Zazie Productions',
    description: 'Practical answers about scoring inquiries, quotes, revisions, schedules and delivery.',
    lastmod: "2026-10-29",
    images: [],
    videos: [],
  },
  {
    path: "/legal",
    indexable: false,
    name: "All documents",
    title: 'Policies and Documents | Zazie Productions',
    description: 'Operating documents for scoring commissions, catalogue purchases, privacy and accessibility.',
    lastmod: "2026-10-29",
    images: [],
    videos: [],
  },
  {
    path: "/licensing",
    name: "Licensing and credits",
    title: "Horror Score Licensing, Rights and Credits: Buyout, Cue Sheets | Zazie Productions",
    description: "Horror score licensing, synchronization rights, and credit terms for Zazie Kanwar-Torge: buyout vs. exclusive options, writer share, PRO cue sheets, and AI restrictions.",
    lastmod: "2026-10-13",
    images: [],
    videos: [],
  },
  {
    path: "/purchases",
    name: "Purchases and returns",
    title: "Purchases, Delivery and Returns: Horror Sound Libraries, Records | Zazie Productions",
    description: "Order fulfillment, digital delivery, shipping, and return policies for Zazie Productions sound libraries, albums, tools, and hardware across Bandcamp, itch.io, Gumroad, and eBay.",
    lastmod: "2026-10-13",
    images: [],
    videos: [],
  },
  {
    path: "/terms",
    indexable: false,
    name: "Terms",
    title: 'Terms and Commissioning | Zazie Productions',
    description: 'Terms for use of this site and standard clauses for commissioned work. Project-specific agreements and accepted written quotes govern as described in the document.',
    lastmod: "2026-10-29",
    images: [],
    videos: [],
  },
  {
    path: "/privacy",
    indexable: false,
    name: "Privacy notice",
    title: 'Privacy Notice | Zazie Productions',
    description: 'Privacy notice covering site analytics, storage, media providers, retention, privacy rights and the on-device browser inspector.',
    lastmod: "2026-10-29",
    images: [],
    videos: [],
  },
  {
    path: "/accessibility",
    name: "Accessibility",
    title: "Accessibility Statement: Horror Composer Portfolio | Zazie Productions",
    description: "WCAG 2.1 AA accessibility statement for horror.zazieproductions.com: contrast ratios, keyboard navigation, reduced-motion support, known gaps, and alternate-format requests.",
    lastmod: "2026-10-13",
    images: [],
    videos: [],
  },
  {
    path: "/hire-a-composer",
    name: "Hire a horror composer",
    title: "Hire an Experimental Psychological Horror Composer | Zazie Productions",
    description: "Hire experimental psychological horror film composer Zazie Kanwar-Torge (Zazie Productions) for independent and arthouse cinema: IMDb-credited custom scores to picture, quoted per project against your budget and references.",
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
    description: "Guide for independent filmmakers and game developers hiring a horror composer: custom score vs. stock libraries, subgenre matching, planning your music budget, spotting, stems, and licensing.",
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
    description: "Cinematic sound design by Zazie Kanwar-Torge: designed dread, atmospheres, transitions and stingers for psychological horror and arthouse film, delivered as mix-ready stems.",
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
    description: "Adaptive horror scoring for games: states, seamless loops, layered cues, stingers and implementation notes for Wwise, FMOD, Unity and Unreal pipelines.",
    lastmod: "2026-10-17",
    images: [
      { loc: "https://horror.zazieproductions.com/images/posters/the-dark-awaits-640.jpg", caption: "THE DARK AWAITS - the tonal register behind adaptive horror scoring for games, by Zazie Kanwar-Torge.", title: "Adaptive Horror Game Scoring - Zazie Productions" },
    ],
    videos: [],
  },
];

/** The home route. Not a silo: it is the entity page the item pages reference. */
export const homePath = '/';
