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

import { pricingSummary } from './pricing.js';
import type { Hub } from './types.js';

export const hubs: Hub[] = [
  {
    path: "/",
    name: "Portfolio",
    title: "Horror Composer for Film, TV & Games | Zazie Productions",
    description: "A portfolio of selected production records, a 32-cue showreel, and a 24-item catalogue spanning music, sound assets, and objects.",
    lastmod: "2026-10-17",
    images: [
      { loc: "https://horror.zazieproductions.com/images/hero-portrait.jpg", caption: "Portfolio portrait for Zazie Productions, a composer and sound-design studio working across screen and experimental media.", title: "Zazie Kanwar-Torge: Psychological Horror Composer - Dark Atmospheric Scores" },
      { loc: "https://horror.zazieproductions.com/images/headshot.jpg", caption: "Zazie Kanwar-Torge, composer and sound designer associated with Zazie Productions LLC.", title: "Zazie Kanwar-Torge headshot - horror film composer, Zazie Productions LLC" },
      { loc: "https://horror.zazieproductions.com/images/press-photo.jpg", caption: "Press photo for Zazie Productions horror composer portfolio. Original dark atmospheric scores for film, TV, and games.", title: "Zazie Productions press photo - horror composer portfolio, dark cinematic scores" },
      { loc: "https://horror.zazieproductions.com/images/posters/expire-red-check-1200.jpg", caption: "EXPIRE poster artwork. IMDb credits Zazie Kanwar-Torge for sound design; the listed composers are Patricia Chaylade, Jorayo, and Brennan Mack.", title: "EXPIRE (2025) - Short Film; Sound Design Credit" },
      { loc: "https://horror.zazieproductions.com/images/posters/unseen-1200.jpg", caption: "UNSEEN poster artwork. IMDb lists Steve Merlo as composer; no Zazie composing credit is asserted here.", title: "UNSEEN - Feature Film Record; IMDb Composer Credit: Steve Merlo" },
      { loc: "https://horror.zazieproductions.com/images/posters/the-haunted-1200.jpg", caption: "THE HAUNTED poster artwork for the horror and science-fiction short; IMDb credits Zazie Kanwar-Torge and Robert Mason Sandifer as co-composers.", title: "THE HAUNTED - Horror and Science-Fiction Short" },
      { loc: "https://horror.zazieproductions.com/images/posters/peregrinus-1200.jpg", caption: "PEREGRINUS series poster. IMDb describes a science-fiction thriller and credits Zazie Kanwar-Torge as a co-composer.", title: "PEREGRINUS - Science-Fiction Thriller Series" },
      { loc: "https://horror.zazieproductions.com/images/posters/phantom-requiem-1200.jpg", caption: "Poster artwork for Phantom Requiem, an experimental short published by Zazie Productions.", title: "Phantom Requiem - Experimental Short" },
      { loc: "https://horror.zazieproductions.com/images/posters/eclipsed-1200.jpg", caption: "Poster artwork for ECLIPSED, a short whose IMDb composer credits include Zazie Kanwar-Torge and Noah C. Castro.", title: "ECLIPSED - Short Film; Composer Credits Include Zazie Kanwar-Torge and Noah C. Castro" },
      { loc: "https://horror.zazieproductions.com/images/posters/choleric-1200.jpg", caption: "Poster artwork for CHOLERIC. IMDb credits Zazie Kanwar-Torge as co-producer.", title: "CHOLERIC - Short Film; Co-Producer Credit" },
      { loc: "https://horror.zazieproductions.com/images/posters/mike-has-a-visitor-1200.jpg", caption: "Poster artwork for MIKE HAS A VISITOR; IMDb credits Zazie Kanwar-Torge as composer.", title: "MIKE HAS A VISITOR - Horror Short; Composer Credit" },
      { loc: "https://horror.zazieproductions.com/images/posters/the-dark-awaits-1200.jpg", caption: "Poster artwork for THE DARK AWAITS, a paranormal reality-TV series; IMDb credits Zazie Kanwar-Torge as composer.", title: "THE DARK AWAITS - Paranormal Reality-TV Series" },
    ],
    videos: [
      {
        thumbnailLoc: "https://horror.zazieproductions.com/images/project-HaVJP08j77U.jpg",
        title: "MIKE HAS A VISITOR: sleep-paralysis horror short",
        description: "The 14:23 YouTube upload of MIKE HAS A VISITOR, published by director Marco Saikaley on June 30, 2025. IMDb separately credits Zazie Kanwar-Torge as composer.",
        playerLoc: "https://www.youtube.com/embed/HaVJP08j77U",
        duration: "863",
        publicationDate: "2025-06-30",
        tags: ["psychological horror composer", "horror film score", "sleep paralysis horror", "dark atmospheric score"],
      },
      {
        thumbnailLoc: "https://horror.zazieproductions.com/images/project-ItrrcilS0ro.jpg",
        title: "GOODBYE, BROTHER: Original Dark Cinematic Film Score - Psychological Drama",
        description: "Dramatic short film scored by Zazie Kanwar-Torge. Atmospheric cinematic composition for dark psychological storytelling. Original themes and tension cues.",
        playerLoc: "https://www.youtube.com/embed/ItrrcilS0ro",
        tags: ["horror composer", "dark cinematic score", "psychological drama score"],
      },
      {
        thumbnailLoc: "https://horror.zazieproductions.com/images/project-riCvy2abhlc.jpg",
        title: "Home Intruder: Thriller Chase Cue - Tension-Driven Horror Composition",
        description: "Action thriller chase sequence scored by Zazie Kanwar-Torge. Tension-driven cinematic composition for thriller and horror. Dark, propulsive, dread-filled cue architecture.",
        playerLoc: "https://www.youtube.com/embed/riCvy2abhlc",
        tags: ["thriller chase music", "horror tension cue"],
      },
      {
        thumbnailLoc: "https://horror.zazieproductions.com/images/project-Ty8tPp59mDc.jpg",
        title: "THE HAUNTED: official trailer",
        description: "Official trailer for THE HAUNTED from Crystal Fox Films. IMDb credits Zazie Kanwar-Torge and Robert Mason Sandifer as co-composers; the trailer is promotional film media, not a separate score excerpt.",
        playerLoc: "https://www.youtube.com/embed/Ty8tPp59mDc",
        duration: "149",
        tags: ["supernatural horror score", "haunted house music"],
      },
      {
        thumbnailLoc: "https://horror.zazieproductions.com/images/project-rvCGO0BJ_2E.jpg",
        title: "AQUAPHOBIA: Short Horror Film Score - Folk and Body Horror",
        description: "Short horror film AQUAPHOBIA scored by Zazie Kanwar-Torge. Dark atmospheric composition for folk horror and psychological dread. Waterphone, bowed metal, hybrid orchestration.",
        playerLoc: "https://www.youtube.com/embed/rvCGO0BJ_2E",
        publicationDate: "2024-09-10",
        tags: ["folk horror music", "body horror score", "waterphone"],
      },
      {
        thumbnailLoc: "https://horror.zazieproductions.com/images/project-6qa3Uwj47fc.jpg",
        title: "Whispers In The Dark: Horror Short Score - Atmospheric Dread Composition",
        description: "Horror short Whispers In The Dark scored by Zazie Kanwar-Torge. Atmospheric dread composition for supernatural horror. Slow-burn tension beds and psychological horror architecture.",
        playerLoc: "https://www.youtube.com/embed/6qa3Uwj47fc",
        tags: ["atmospheric horror music", "dread soundscape"],
      },
      {
        thumbnailLoc: "https://horror.zazieproductions.com/images/project-UX2kv3G89Jw.jpg",
        title: "Phantom Requiem: experimental short film",
        description: "The complete 4:53 experimental short Phantom Requiem, published by Zazie Productions on June 20, 2024. The studio describes its visuals, sound, and music as part of the work.",
        playerLoc: "https://www.youtube.com/embed/UX2kv3G89Jw",
        duration: "293",
        publicationDate: "2024-06-20",
        tags: ["experimental short", "Phantom Requiem"],
      },
      {
        thumbnailLoc: "https://horror.zazieproductions.com/images/eclipsed-cover-1280.jpg",
        title: "ECLIPSED project sample",
        description: "A Drive-hosted project sample associated with the ECLIPSED short. IMDb describes the surreal horror premise and credits Zazie Kanwar-Torge and Noah C. Castro as composers.",
        playerLoc: "https://drive.google.com/file/d/1zKtAavEx-Yjd2To_troEYlxTTt62Y2OU/preview",
        tags: ["ECLIPSED", "short film sample"],
      },
    ],
  },
  {
    path: "/work",
    name: "Selected productions",
    title: "Selected Production Records: Film, Television and Experimental Work | Zazie Productions",
    description: "Nine selected production records across films, television, and experimental work. Project notes distinguish verified composing, co-composing, sound-design, and production credits.",
    lastmod: "2026-10-13",
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
    title: "Horror Composer Showreel: 32 Original Dark Cinematic Cues | Zazie Productions",
    description: "Stream 32 original horror showreel cues by Zazie Kanwar-Torge: psychological dread beds, tension stingers, dark ambient textures, body horror, and thriller themes.",
    lastmod: "2026-10-13",
    images: [],
    videos: [],
  },
  {
    path: "/composer",
    name: "Composer biography",
    title: "Zazie Kanwar-Torge: Psychological Horror Composer Biography | Zazie Productions",
    description: "Biography of psychological horror composer Zazie Kanwar-Torge, founder of Zazie Productions LLC in Asheville, NC, scoring dark atmospheric films, series, and games.",
    lastmod: "2026-10-13",
    images: [
      { loc: "https://horror.zazieproductions.com/images/headshot.jpg", caption: "Zazie Kanwar-Torge, psychological horror composer and founder of Zazie Productions LLC, Asheville NC.", title: "Zazie Kanwar-Torge - Psychological Horror Composer Biography" },
    ],
    videos: [],
  },
  {
    path: "/process",
    name: "Scoring process",
    title: "Horror Film Scoring Process: Spotting to Stems | Zazie Productions",
    description: "Four-stage horror film scoring process by Zazie Kanwar-Torge: spotting session, palette and motif sketches, scoring to picture with revisions, and final WAV files.",
    lastmod: "2026-10-13",
    images: [
      { loc: "https://horror.zazieproductions.com/images/press-photo.jpg", caption: "Zazie Kanwar-Torge at the scoring desk, Asheville, NC studio", title: "Horror Film Scoring Suite - Process" },
    ],
    videos: [],
  },
  {
    path: "/services",
    name: "Rate card",
    title: "Horror Score Packages and Quotes | Zazie Productions",
    description: `Original music for psychological horror and experimental cinema. ${pricingSummary()}`,
    lastmod: "2026-10-17",
    images: [
      { loc: "https://horror.zazieproductions.com/images/press-photo.jpg", caption: "Zazie Productions horror film scoring suite Asheville, NC", title: "Horror Film Scoring Suite - Rates" },
    ],
    videos: [],
  },
  {
    path: "/store",
    name: "Catalogue",
    title: "Catalogue: Experimental Music, Sound Libraries, Tools and Objects | Zazie Productions",
    description: "Twenty-four catalogue entries across Bandcamp, itch.io, Gumroad, and eBay, including experimental music, sound libraries, software and visual assets, and physical objects. Current terms and availability remain with each source platform.",
    lastmod: "2026-10-13",
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
    path: "/contact",
    name: "Contact",
    title: "Scoring Inquiry: Request a Score Quote | Zazie Productions",
    description: "Request a scoring quote for psychological horror, folk horror, supernatural or experimental film. Share what you know; scored minutes, format, timing and references can be added when available.",
    lastmod: "2026-10-17",
    images: [
      { loc: "https://horror.zazieproductions.com/images/hero-portrait.jpg", caption: "Zazie Kanwar-Torge, psychological horror composer available for commission", title: "Scoring Inquiry - Request a Score Quote" },
    ],
    videos: [],
  },
  {
    path: "/faq",
    name: "FAQ",
    title: "Horror Film Scoring FAQ: Fees, Process, Rights, Delivery - 35 Questions | Zazie Productions",
    description: "35 answers on commissioning a horror score from Zazie Kanwar-Torge: packages priced by scored minutes, spotting to delivery, revisions, licensing and cue sheets.",
    lastmod: "2026-10-17",
    images: [],
    videos: [],
  },
  {
    path: "/legal",
    name: "All documents",
    title: "Documents: Horror Scoring Terms, Privacy, Licensing, Purchases | Zazie Productions",
    description: "Operating and legal documents for Zazie Productions LLC: commissioning terms, licensing and credits, privacy notice, catalogue purchases, accessibility, and 35-question FAQ.",
    lastmod: "2026-10-13",
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
    name: "Terms",
    title: "Terms: Horror Film Scoring Commissioning, Quotes, Deposits | Zazie Productions",
    description: "Commissioning terms and conditions for Zazie Productions LLC: written quotes, deposits, spotting to delivery, revisions, kill fees, clearances, and North Carolina law.",
    lastmod: "2026-10-17",
    images: [],
    videos: [],
  },
  {
    path: "/privacy",
    name: "Privacy notice",
    title: "Privacy Notice: No Trackers, No Cookies | Zazie Productions",
    description: "Privacy notice for horror.zazieproductions.com: zero advertising trackers, zero analytics cookies, local storage inventory, third-party media embeds, and NDA inquiry handling.",
    lastmod: "2026-10-13",
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
    path: "/sitemap",
    name: "Site map",
    title: "Site Map: Portfolio Hubs and Item Archive | Zazie Productions",
    description: "A human-readable overview of the portfolio hubs and operating documents. The XML sitemap separately lists all indexable production, cue, and catalogue item URLs.",
    lastmod: "2026-10-13",
    images: [],
    videos: [],
  },
  {
    path: "/hire-a-composer",
    name: "Hire a composer",
    title: "Hire a Composer: Original Scores & Sound Design | Zazie",
    description: "Hire composer Zazie Kanwar-Torge for original film, game and experimental scores and cinematic sound design. Written to picture.",
    lastmod: "2026-10-17",
    images: [
      { loc: "https://horror.zazieproductions.com/images/press-photo.jpg", caption: "Zazie Kanwar-Torge, composer and sound designer for hire: original scores and cinematic sound design for film, games and experimental projects.", title: "Hire a Composer: Original Scores and Cinematic Sound Design" },
    ],
    videos: [],
  },
  {
    path: "/sound-design",
    name: "Sound design",
    title: "Cinematic Sound Design for Horror Film | Zazie Productions",
    description: "Cinematic sound design by Zazie Kanwar-Torge: designed dread, atmospheres, transitions and stingers for horror and experimental film, delivered as mix-ready stems.",
    lastmod: "2026-10-17",
    images: [
      { loc: "https://horror.zazieproductions.com/images/posters/expire-red-check-640.jpg", caption: "EXPIRE horror short - sound design and score by Zazie Kanwar-Torge, from the cinematic sound design page.", title: "Cinematic Sound Design for Horror Film - Zazie Productions" },
    ],
    videos: [],
  },
  {
    path: "/game-scoring",
    name: "Game scoring",
    title: "Adaptive Horror Game Scoring & Music | Zazie Productions",
    description: "Adaptive horror scoring for games: states, seamless loops, layered cues, stingers and implementation notes for Wwise, FMOD, Unity and Unreal pipelines.",
    lastmod: "2026-10-13",
    images: [
      { loc: "https://horror.zazieproductions.com/images/posters/the-dark-awaits-640.jpg", caption: "THE DARK AWAITS - the tonal register behind adaptive horror scoring for games, by Zazie Kanwar-Torge.", title: "Adaptive Horror Game Scoring - Zazie Productions" },
    ],
    videos: [],
  },
];

/** The home route. Not a silo: it is the entity page the item pages reference. */
export const homePath = '/';
