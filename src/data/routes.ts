/**
 * The 19 routes that already existed, with the metadata they already publish.
 *
 * MIGRATION NOTE: generated once from the committed `sitemap.xml` plus every
 * route page's own `<title>` and `<meta name="description">`, then frozen as
 * data. The sitemap generator re-emits these entries from here and
 * `scripts/verify-hub-parity.mjs` diffs the result against the pre-migration
 * file, so the legacy URLs (and their image and video extensions) cannot
 * regress while the item routes are added. `path` is '' for the home page and
 * has no trailing slash anywhere. `priority` and `changefreq` are carried
 * because the 2026 sitemap carried them; Google ignores both, and neither is
 * used for anything here. Rows are in sitemap order.
 */

import type { HubRoute } from './types.js';

export const hubRoutes: HubRoute[] = [
  {
    path: "",
    title: "Horror Composer for Film, TV & Games | Zazie Productions",
    description: "Original dark, atmospheric horror scores for film, TV, games and experimental projects. Listen to 32 cues or send a brief.",
    lastmod: "2026-10-04",
    changefreq: "weekly",
    priority: "1.0",
    images: [
      { loc: "https://horror.zazieproductions.com/images/hero-portrait.jpg", caption: "Award-winning psychological horror composer specializing in dark, atmospheric, cinematic original scores for psychological horror, folk horror, body horror, supernatural thrillers, and dark sci-fi. Film, TV, and game scoring.", title: "Zazie Kanwar-Torge: Psychological Horror Composer - Dark Atmospheric Scores" },
      { loc: "https://horror.zazieproductions.com/images/headshot.jpg", caption: "Zazie Kanwar-Torge, award-winning horror film composer and founder of Zazie Productions LLC, Asheville NC.", title: "Zazie Kanwar-Torge headshot - horror film composer, Zazie Productions LLC" },
      { loc: "https://horror.zazieproductions.com/images/press-photo.jpg", caption: "Press photo for Zazie Productions horror composer portfolio. Original dark atmospheric scores for film, TV, and games.", title: "Zazie Productions press photo - horror composer portfolio, dark cinematic scores" },
      { loc: "https://horror.zazieproductions.com/images/posters/expire-red-check-1200.jpg", caption: "EXPIRE theatrical poster - Muhammad Abed Baryal horror short, sound design by Zazie Kanwar-Torge", title: "EXPIRE (2025) - Horror Short Film Score by Zazie Kanwar-Torge" },
      { loc: "https://horror.zazieproductions.com/images/posters/unseen-1200.jpg", caption: "UNSEEN feature poster - Steve Merlo unseen killer feature, original horror score by Zazie Kanwar-Torge", title: "UNSEEN Feature Film - Psychological Horror Score by Zazie Kanwar-Torge" },
      { loc: "https://horror.zazieproductions.com/images/posters/the-haunted-1200.jpg", caption: "THE HAUNTED feature poster - perception is reality, Crystal Fox Films, original score by Zazie Kanwar-Torge", title: "THE HAUNTED - Supernatural Horror Feature Score" },
      { loc: "https://horror.zazieproductions.com/images/posters/peregrinus-1200.jpg", caption: "PEREGRINUS series poster - original score by Zazie Kanwar-Torge", title: "PEREGRINUS - Series Score by Zazie Kanwar-Torge" },
      { loc: "https://horror.zazieproductions.com/images/posters/phantom-requiem-1200.jpg", caption: "Phantom Requiem short film poster - gothic horror score by Zazie Kanwar-Torge", title: "Phantom Requiem - Short Film Score by Zazie Kanwar-Torge" },
      { loc: "https://horror.zazieproductions.com/images/posters/eclipsed-1200.jpg", caption: "ECLIPSED feature poster - original horror score by Zazie Kanwar-Torge", title: "ECLIPSED - Feature Horror Score by Zazie Kanwar-Torge" },
      { loc: "https://horror.zazieproductions.com/images/posters/choleric-1200.jpg", caption: "CHOLERIC short film poster - original horror score by Zazie Kanwar-Torge", title: "CHOLERIC - Short Film Score by Zazie Kanwar-Torge" },
      { loc: "https://horror.zazieproductions.com/images/posters/mike-has-a-visitor-1200.jpg", caption: "Mike Has A Visitor short film poster - sleep paralysis horror score by Zazie Kanwar-Torge", title: "Mike Has A Visitor - Sleep Paralysis Horror Short Score" },
      { loc: "https://horror.zazieproductions.com/images/posters/the-dark-awaits-1200.jpg", caption: "THE DARK AWAITS (2025) poster - supernatural horror score by Zazie Kanwar-Torge", title: "THE DARK AWAITS - Supernatural Horror Score" },
    ],
    videos: [
      [
        ["thumbnail_loc", "https://horror.zazieproductions.com/images/project-HaVJP08j77U.jpg"],
        ["title", "Mike Has A Visitor: Original Psychological Horror Score - Sleep Paralysis Short"],
        ["description", "Sleep paralysis horror short scored by Zazie Kanwar-Torge. Dark, atmospheric, cinematic composition for psychological horror. Original score, themes, tension cues, and dread beds written to picture. Psychological horror composer showreel sample."],
        ["player_loc", "https://www.youtube.com/embed/HaVJP08j77U"],
        ["duration", "150"],
        ["publication_date", "2025-01-15"],
        ["family_friendly", "yes"],
        ["tag", "psychological horror composer"],
        ["tag", "horror film score"],
        ["tag", "sleep paralysis horror"],
        ["tag", "dark atmospheric score"],
      ],
      [
        ["thumbnail_loc", "https://horror.zazieproductions.com/images/project-ItrrcilS0ro.jpg"],
        ["title", "GOODBYE, BROTHER: Original Dark Cinematic Film Score - Psychological Drama"],
        ["description", "Dramatic short film scored by Zazie Kanwar-Torge. Atmospheric cinematic composition for dark psychological storytelling. Original themes and tension cues."],
        ["player_loc", "https://www.youtube.com/embed/ItrrcilS0ro"],
        ["family_friendly", "yes"],
        ["tag", "horror composer"],
        ["tag", "dark cinematic score"],
        ["tag", "psychological drama score"],
      ],
      [
        ["thumbnail_loc", "https://horror.zazieproductions.com/images/project-riCvy2abhlc.jpg"],
        ["title", "Home Intruder: Thriller Chase Cue - Tension-Driven Horror Composition"],
        ["description", "Action thriller chase sequence scored by Zazie Kanwar-Torge. Tension-driven cinematic composition for thriller and horror. Dark, propulsive, dread-filled cue architecture."],
        ["player_loc", "https://www.youtube.com/embed/riCvy2abhlc"],
        ["family_friendly", "yes"],
        ["tag", "thriller chase music"],
        ["tag", "horror tension cue"],
      ],
      [
        ["thumbnail_loc", "https://horror.zazieproductions.com/images/project-Ty8tPp59mDc.jpg"],
        ["title", "The Haunted: Horror Film Teaser Score - Supernatural Thriller"],
        ["description", "Official teaser for The Haunted by Crystal Fox Films. Original supernatural horror score by Zazie Kanwar-Torge. Atmospheric dread, dark ambient beds, and cinematic themes for supernatural thriller and haunted house horror."],
        ["player_loc", "https://www.youtube.com/embed/Ty8tPp59mDc"],
        ["duration", "105"],
        ["publication_date", "2024-11-20"],
        ["family_friendly", "yes"],
        ["tag", "supernatural horror score"],
        ["tag", "haunted house music"],
      ],
      [
        ["thumbnail_loc", "https://horror.zazieproductions.com/images/project-rvCGO0BJ_2E.jpg"],
        ["title", "AQUAPHOBIA: Short Horror Film Score - Folk and Body Horror"],
        ["description", "Short horror film AQUAPHOBIA scored by Zazie Kanwar-Torge. Dark atmospheric composition for folk horror and psychological dread. Waterphone, bowed metal, hybrid orchestration."],
        ["player_loc", "https://www.youtube.com/embed/rvCGO0BJ_2E"],
        ["publication_date", "2024-09-10"],
        ["family_friendly", "yes"],
        ["tag", "folk horror music"],
        ["tag", "body horror score"],
        ["tag", "waterphone"],
      ],
      [
        ["thumbnail_loc", "https://horror.zazieproductions.com/images/project-6qa3Uwj47fc.jpg"],
        ["title", "Whispers In The Dark: Horror Short Score - Atmospheric Dread Composition"],
        ["description", "Horror short Whispers In The Dark scored by Zazie Kanwar-Torge. Atmospheric dread composition for supernatural horror. Slow-burn tension beds and psychological horror architecture."],
        ["player_loc", "https://www.youtube.com/embed/6qa3Uwj47fc"],
        ["family_friendly", "yes"],
        ["tag", "atmospheric horror music"],
        ["tag", "dread soundscape"],
      ],
      [
        ["thumbnail_loc", "https://horror.zazieproductions.com/images/project-UX2kv3G89Jw.jpg"],
        ["title", "Phantom Requiem: Short Film Score - Gothic Horror"],
        ["description", "Short film Phantom Requiem scored by Zazie Kanwar-Torge. Dark cinematic composition for psychological horror and gothic dread. Original themes, motifs, atmospheric beds."],
        ["player_loc", "https://www.youtube.com/embed/UX2kv3G89Jw"],
        ["family_friendly", "yes"],
        ["tag", "gothic horror score"],
        ["tag", "phantom requiem"],
      ],
      [
        ["thumbnail_loc", "https://horror.zazieproductions.com/images/eclipsed-cover-1280.jpg"],
        ["title", "Eclipsed: Psychological Thriller Short - Unsettling Film Score"],
        ["description", "Psychological thriller short film scored by Zazie Kanwar-Torge. Experimental analog synthesis, prepared instruments, and psychoacoustic dread composition."],
        ["player_loc", "https://drive.google.com/file/d/1zKtAavEx-Yjd2To_troEYlxTTt62Y2OU/preview"],
        ["duration", "195"],
        ["publication_date", "2024-10-05"],
        ["family_friendly", "yes"],
        ["tag", "psychological horror score"],
        ["tag", "horror film composer"],
        ["tag", "dark thriller composition"],
        ["tag", "analog synth dread"],
      ],
    ],
  },
  {
    path: "/work",
    title: "Selected Horror Productions: Psychological, Folk, Body Horror Scores | Zazie Productions",
    description: "Nine selected horror productions scored by psychological horror composer Zazie Kanwar-Torge: EXPIRE, UNSEEN, PEREGRINUS, Phantom Requiem, ECLIPSED, THE HAUNTED, CHOLERIC, MIKE HAS A VISITOR, THE DARK AWAITS. Original dark, atmospheric cinematic scores for psychological horror, folk horror, body horror, and supernatural thrillers.",
    lastmod: "2026-10-04",
    changefreq: "monthly",
    priority: "0.85",
    images: [
      { loc: "https://horror.zazieproductions.com/images/posters/expire-red-check-640.jpg", caption: "EXPIRE (2025) horror short - sound design and score by Zazie Kanwar-Torge", title: "EXPIRE - Horror Film Score Portfolio" },
      { loc: "https://horror.zazieproductions.com/images/posters/unseen-640.jpg", caption: "UNSEEN feature - original psychological horror score by Zazie Kanwar-Torge", title: "UNSEEN - Feature Horror Score" },
      { loc: "https://horror.zazieproductions.com/images/posters/peregrinus-640.jpg", caption: "PEREGRINUS series - original score by Zazie Kanwar-Torge", title: "PEREGRINUS - Series Score" },
      { loc: "https://horror.zazieproductions.com/images/posters/phantom-requiem-640.jpg", caption: "Phantom Requiem short film - gothic horror score by Zazie Kanwar-Torge", title: "Phantom Requiem - Short Film Score" },
      { loc: "https://horror.zazieproductions.com/images/posters/eclipsed-640.jpg", caption: "ECLIPSED feature - original horror score by Zazie Kanwar-Torge", title: "ECLIPSED - Feature Horror Score" },
      { loc: "https://horror.zazieproductions.com/images/posters/the-haunted-640.jpg", caption: "THE HAUNTED feature - supernatural horror score by Zazie Kanwar-Torge", title: "THE HAUNTED - Supernatural Horror Feature Score" },
      { loc: "https://horror.zazieproductions.com/images/posters/choleric-640.jpg", caption: "CHOLERIC short film - original horror score by Zazie Kanwar-Torge", title: "CHOLERIC - Short Film Score" },
      { loc: "https://horror.zazieproductions.com/images/posters/mike-has-a-visitor-640.jpg", caption: "Mike Has A Visitor short film - sleep paralysis horror score by Zazie Kanwar-Torge", title: "Mike Has A Visitor - Sleep Paralysis Horror Short Score" },
      { loc: "https://horror.zazieproductions.com/images/posters/the-dark-awaits-640.jpg", caption: "THE DARK AWAITS horror film - original supernatural horror score by Zazie Kanwar-Torge", title: "THE DARK AWAITS - Supernatural Horror Film Score" },
      { loc: "https://horror.zazieproductions.com/images/project-HaVJP08j77U.jpg", caption: "Still from Mike Has A Visitor, sleep paralysis horror short scored by Zazie Kanwar-Torge", title: "Mike Has A Visitor - Film Still" },
      { loc: "https://horror.zazieproductions.com/images/project-ItrrcilS0ro.jpg", caption: "Still from GOODBYE, BROTHER, dramatic short scored by Zazie Kanwar-Torge", title: "GOODBYE, BROTHER - Film Still" },
      { loc: "https://horror.zazieproductions.com/images/project-riCvy2abhlc.jpg", caption: "Still from Home Intruder, action thriller chase sequence scored by Zazie Kanwar-Torge", title: "Home Intruder - Film Still" },
      { loc: "https://horror.zazieproductions.com/images/project-Ty8tPp59mDc.jpg", caption: "Still from The Haunted teaser by Crystal Fox Films, scored by Zazie Kanwar-Torge", title: "The Haunted - Film Still" },
      { loc: "https://horror.zazieproductions.com/images/project-rvCGO0BJ_2E.jpg", caption: "Still from AQUAPHOBIA, folk and body horror short scored by Zazie Kanwar-Torge", title: "AQUAPHOBIA - Film Still" },
      { loc: "https://horror.zazieproductions.com/images/project-6qa3Uwj47fc.jpg", caption: "Still from Whispers In The Dark, horror short scored by Zazie Kanwar-Torge", title: "Whispers In The Dark - Film Still" },
      { loc: "https://horror.zazieproductions.com/images/project-UX2kv3G89Jw.jpg", caption: "Still from Phantom Requiem, gothic horror short scored by Zazie Kanwar-Torge", title: "Phantom Requiem - Film Still" },
      { loc: "https://horror.zazieproductions.com/images/eclipsed-cover-1280.jpg", caption: "Eclipsed film sample still - psychological thriller horror score by Zazie Kanwar-Torge", title: "Eclipsed - Psychological Thriller Film Sample" },
    ],
    videos: [
    ],
  },
  {
    path: "/reel",
    title: "Horror Composer Showreel: 32 Original Dark Cinematic Cues | Zazie Productions",
    description: "Listen to 32 original dark, atmospheric horror cues by psychological horror composer Zazie Kanwar-Torge: Needle in The Nerve, Dissociative Amnesia, R'lyeh's Xenolith, Bone-Colored Air, Obsidian Hall, and more. Psychological dread beds, tension stingers, dark ambient soundscapes, cosmic and body horror, thriller chase cues.",
    lastmod: "2026-10-04",
    changefreq: "monthly",
    priority: "0.85",
    images: [
      { loc: "https://horror.zazieproductions.com/images/hero-portrait.jpg", caption: "Zazie Kanwar-Torge, psychological horror composer showreel artwork", title: "Horror Composer Showreel - 32 Cues" },
    ],
    videos: [
    ],
  },
  {
    path: "/composer",
    title: "Zazie Kanwar-Torge: Psychological Horror Composer Biography | Zazie Productions",
    description: "Biography of award-winning psychological horror composer Zazie Kanwar-Torge: experimental producer, multi-instrumentalist, founder of Zazie Productions LLC. Specializing in dark, atmospheric, cinematic scores for psychological horror, folk horror, body horror, supernatural thrillers, and dark sci-fi. Film, TV, and game scoring from Asheville, NC.",
    lastmod: "2026-10-04",
    changefreq: "monthly",
    priority: "0.8",
    images: [
      { loc: "https://horror.zazieproductions.com/images/headshot.jpg", caption: "Zazie Kanwar-Torge, psychological horror composer and founder of Zazie Productions LLC, Asheville NC.", title: "Zazie Kanwar-Torge - Psychological Horror Composer Biography" },
      { loc: "https://horror.zazieproductions.com/images/hero-portrait.jpg", caption: "Zazie Kanwar-Torge - dark, atmospheric, cinematic scores for psychological horror, thrillers, and dark sci-fi.", title: "Zazie Kanwar-Torge - Dark Atmospheric Horror Composer" },
      { loc: "https://horror.zazieproductions.com/images/press-photo.jpg", caption: "Press photo - Zazie Productions horror composer portfolio, original dark atmospheric scores for film, TV, and games.", title: "Zazie Productions Press Photo - Horror Composer Portfolio" },
    ],
    videos: [
    ],
  },
  {
    path: "/process",
    title: "Horror Film Scoring Process: Spotting to Stems | Zazie Productions",
    description: "How a horror film score gets from spotting session to final stems: psychological horror architecture, dark atmospheric color, cinematic themes, revisions, delivery, cue sheets, and rights. Process documentation for psychological horror, folk horror, body horror, and supernatural thrillers scored by Zazie Kanwar-Torge.",
    lastmod: "2026-10-04",
    changefreq: "monthly",
    priority: "0.75",
    images: [
      { loc: "https://horror.zazieproductions.com/images/press-photo.jpg", caption: "Zazie Kanwar-Torge at the scoring desk, Asheville, NC studio", title: "Horror Film Scoring Suite - Process" },
    ],
    videos: [
    ],
  },
  {
    path: "/services",
    title: "Horror Film Scoring Rates: Micro-Budget to Feature | Zazie Productions",
    description: "Horror film scoring rates by psychological horror composer Zazie Kanwar-Torge: quotes priced on a sliding scale tied to project funding, typically a few hundred dollars. Lean, Standard, Signature, Orchestral+ tiers. Build a scope and estimate.",
    lastmod: "2026-10-04",
    changefreq: "monthly",
    priority: "0.8",
    images: [
      { loc: "https://horror.zazieproductions.com/images/press-photo.jpg", caption: "Zazie Productions horror film scoring suite Asheville, NC", title: "Horror Film Scoring Suite - Rates" },
    ],
    videos: [
    ],
  },
  {
    path: "/store",
    title: "Catalogue: Horror Sound Libraries, Dark Ambient Records, Tools and Objects | Zazie Productions",
    description: "The Zazie Productions catalogue by psychological horror composer Zazie Kanwar-Torge: eight dark ambient records on Bandcamp, horror sound libraries including 209 body horror SFX, immersive 3D sci-fi soundscapes, vault of 200+ discontinued VSTs, Renaissance score facsimiles, and horror objects. Twenty-four releases across Bandcamp, itch.io, Gumroad, eBay. From the same room as the horror scores.",
    lastmod: "2026-10-04",
    changefreq: "weekly",
    priority: "0.8",
    images: [
      { loc: "https://f4.bcbits.com/img/a4087485987_16.jpg", caption: "Anesthesia for the Signal Age - ten-track album of acousmatic modular percussion, glitch-lacerated IDM and scavenged sound objects by Zazie Productions.", title: "Anesthesia for the Signal Age - Zazie Productions" },
      { loc: "https://f4.bcbits.com/img/a4110701137_16.jpg", caption: "Opaline Lament (Life From The Beyond) - a haunting, string-driven meditation between chamber music and spectral cinema.", title: "Opaline Lament (Life From The Beyond) - Zazie Productions" },
      { loc: "https://f4.bcbits.com/img/a3756749177_16.jpg", caption: "Spectral Ode to Synesthesia - an 8:55 binaural acousmatic piece built from impulse noise, stretched rubber, electromagnetic and liquid field recordings.", title: "Spectral Ode to Synesthesia - Zazie Productions" },
      { loc: "https://f4.bcbits.com/img/a0612904516_16.jpg", caption: "To Halt Space Adrift - eight-track experimental album by Zazie Productions, released May 2023.", title: "To Halt Space Adrift - Zazie Productions" },
      { loc: "https://f4.bcbits.com/img/a0935502895_16.jpg", caption: "Constrained Capacity - ten-track dark ambient, industrial and noise album by Zazie Productions, released May 2022.", title: "Constrained Capacity - Zazie Productions" },
      { loc: "https://f4.bcbits.com/img/a0050695008_16.jpg", caption: "Vermiform - eight-track surreal avant-garde album by Zazie Productions, released July 2023.", title: "Vermiform - Zazie Productions" },
      { loc: "https://f4.bcbits.com/img/a0281727228_16.jpg", caption: "Interference Archive 01010101 - five tracks of pseudo-retro industrial and EBM by Zazie Productions, released September 2021.", title: "Interference Archive 01010101 - Zazie Productions" },
      { loc: "https://f4.bcbits.com/img/a1008810016_16.jpg", caption: "Stutter to stammer - musique concrete album built from hundreds of collected sounds by Zazie Productions, released November 2019.", title: "Stutter to stammer - Zazie Productions" },
    ],
    videos: [
    ],
  },
  {
    path: "/contact",
    title: "Scoring Inquiry: Request a Score Quote | Zazie Productions",
    description: "Hire psychological horror composer Zazie Kanwar-Torge: original dark, atmospheric scores for psychological horror, folk horror, body horror, supernatural thrillers, and dark sci-fi. Film, TV, and game scoring. Tell me about your project: format, runtime, timeline, budget. Reply within 48 hours. Boutique capacity, limited concurrent scores. Email zaziediya@gmail.com.",
    lastmod: "2026-10-04",
    changefreq: "monthly",
    priority: "0.75",
    images: [
      { loc: "https://horror.zazieproductions.com/images/hero-portrait.jpg", caption: "Zazie Kanwar-Torge, psychological horror composer available for commission", title: "Hire a Horror Composer - Scoring Inquiry" },
    ],
    videos: [
    ],
  },
  {
    path: "/faq",
    title: "Horror Film Scoring FAQ: Fees, Process, Rights, Delivery - 35 Questions | Zazie Productions",
    description: "35 questions filmmakers ask psychological horror composer Zazie Kanwar-Torge before commissioning: what a horror score costs on a sliding scale tied to project funding (most projects a few hundred dollars), what moves price, spotting to stems process, revisions, who owns music, cue sheets, game scoring, catalogue delivery. Horror film scoring FAQ.",
    lastmod: "2026-10-04",
    changefreq: "monthly",
    priority: "0.7",
    images: [
    ],
    videos: [
    ],
  },
  {
    path: "/legal",
    title: "Documents: Horror Scoring Terms, Privacy, Licensing, Purchases | Zazie Productions",
    description: "Operating documents for psychological horror composer Zazie Kanwar-Torge, Zazie Productions LLC: commissioning terms for horror scores priced on a sliding scale by project funding, privacy notice with no trackers, licensing and credit terms, purchases and returns for horror sound libraries, accessibility, and 36-question FAQ. Documents hub.",
    lastmod: "2026-10-04",
    changefreq: "monthly",
    priority: "0.55",
    images: [
    ],
    videos: [
    ],
  },
  {
    path: "/licensing",
    title: "Horror Score Licensing, Rights and Credits: Buyout, Cue Sheets | Zazie Productions",
    description: "Horror score licensing, rights and credits for psychological horror composer Zazie Kanwar-Torge: default buyout grant on payment in full, exclusive and non-exclusive licence options, writer share retained, PRO and cue sheets, exact credit wording Music by Zazie Kanwar-Torge, AI training prohibition. Horror film scoring rights.",
    lastmod: "2026-10-04",
    changefreq: "yearly",
    priority: "0.5",
    images: [
    ],
    videos: [
    ],
  },
  {
    path: "/purchases",
    title: "Purchases, Delivery and Returns: Horror Sound Libraries, Records | Zazie Productions",
    description: "Purchases, delivery and returns for horror sound libraries, dark ambient records, tools and objects from psychological horror composer Zazie Kanwar-Torge catalogue: fulfilled by Bandcamp, itch.io, Gumroad, eBay, download fails, shipping, refund position on digital goods. Catalogue orders.",
    lastmod: "2026-10-04",
    changefreq: "monthly",
    priority: "0.5",
    images: [
    ],
    videos: [
    ],
  },
  {
    path: "/terms",
    title: "Terms: Horror Film Scoring Commissioning, Quotes, Deposits | Zazie Productions",
    description: "Terms of use and commissioning for psychological horror composer Zazie Kanwar-Torge, Zazie Productions LLC: quotes for horror scores scaled to project funding (most projects a few hundred dollars), deposits, scope changes, spotting to stems delivery, acceptance, cancellation, kill fee, clearances, confidentiality, liability, governing law. Horror scoring terms.",
    lastmod: "2026-10-04",
    changefreq: "yearly",
    priority: "0.4",
    images: [
    ],
    videos: [
    ],
  },
  {
    path: "/privacy",
    title: "Privacy Notice: No Trackers, No Cookies | Zazie Productions",
    description: "Privacy notice for psychological horror composer Zazie Kanwar-Torge portfolio horror.zazieproductions.com: no analytics, no advertising trackers, no cookies set by site, one storage key for boot sequence, service worker cache, full inventory of third parties contacted when you press play, device inspector. No tracking horror composer site.",
    lastmod: "2026-10-04",
    changefreq: "yearly",
    priority: "0.4",
    images: [
    ],
    videos: [
    ],
  },
  {
    path: "/accessibility",
    title: "Accessibility Statement: Horror Composer Portfolio | Zazie Productions",
    description: "Accessibility statement for psychological horror composer Zazie Kanwar-Torge portfolio: standards, implemented features, gaps with honest measurements, how to request any document in another format. Horror scoring portfolio built for screen readers, keyboard navigation, no cookies, no trackers.",
    lastmod: "2026-10-04",
    changefreq: "yearly",
    priority: "0.3",
    images: [
    ],
    videos: [
    ],
  },
  {
    path: "/sitemap",
    title: "Site Map: Every Page and Section | Zazie Productions",
    description: "Every page and section of the Zazie Productions horror scoring portfolio in one index: showreel, productions, rates, process, catalogue, FAQ and documents.",
    lastmod: "2026-10-04",
    changefreq: "monthly",
    priority: "0.3",
    images: [
    ],
    videos: [
    ],
  },
  {
    path: "/hire-a-composer",
    title: "Hire a Composer: Original Scores & Sound Design | Zazie",
    description: "Hire composer Zazie Kanwar-Torge for original film, game and experimental scores and cinematic sound design. Written to picture.",
    lastmod: "2026-10-04",
    changefreq: "monthly",
    priority: "0.9",
    images: [
      { loc: "https://horror.zazieproductions.com/images/press-photo.jpg", caption: "Zazie Kanwar-Torge, composer and sound designer for hire: original scores and cinematic sound design for film, games and experimental projects.", title: "Hire a Composer: Original Scores and Cinematic Sound Design" },
    ],
    videos: [
    ],
  },
  {
    path: "/sound-design",
    title: "Cinematic Sound Design for Horror Film | Zazie Productions",
    description: "Cinematic sound design by Zazie Kanwar-Torge: designed dread, atmospheres, transitions and stingers for horror and experimental film, delivered as mix-ready stems.",
    lastmod: "2026-10-04",
    changefreq: "monthly",
    priority: "0.8",
    images: [
      { loc: "https://horror.zazieproductions.com/images/posters/expire-red-check-640.jpg", caption: "EXPIRE horror short - sound design and score by Zazie Kanwar-Torge, from the cinematic sound design page.", title: "Cinematic Sound Design for Horror Film - Zazie Productions" },
    ],
    videos: [
    ],
  },
  {
    path: "/game-scoring",
    title: "Adaptive Horror Game Scoring & Music | Zazie Productions",
    description: "Adaptive horror scoring for games: states, seamless loops, layered stems, stingers and implementation notes for Wwise, FMOD, Unity and Unreal pipelines.",
    lastmod: "2026-10-04",
    changefreq: "monthly",
    priority: "0.8",
    images: [
      { loc: "https://horror.zazieproductions.com/images/posters/the-dark-awaits-640.jpg", caption: "THE DARK AWAITS - the tonal register behind adaptive horror scoring for games, by Zazie Kanwar-Torge.", title: "Adaptive Horror Game Scoring - Zazie Productions" },
    ],
    videos: [
    ],
  },
];
