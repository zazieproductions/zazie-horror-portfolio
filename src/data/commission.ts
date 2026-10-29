/**
 * src/data/commission.ts
 * ----------------------------------------------------------------------------
 * The single source of truth for how a commission starts on
 * horror.zazieproductions.com: the inquiry's budget ranges, the standard
 * inclusions, the licence options and the plain-language statements every
 * commissioning surface repeats in the same words.
 *
 * DELIBERATE CHANGE (2026-10-27): this module replaced src/data/pricing.ts.
 * There is no published rate card. The studio removed its published starting
 * fees, packages and cost estimator on purpose, so an inquiry is never
 * anchored by a figure seen before writing: the visitor states the budget
 * range they have set aside for music and the scores they love, and every
 * commission is quoted individually, in writing, against that brief.
 *
 * Do not reintroduce a price, fee, band or multiplier here. The only money
 * strings this module may carry are the visitor-facing BUDGET_RANGES below —
 * bands the *client* picks from to describe their own budget, never a fee
 * for a service. Nothing else in the repository types a scoring price by
 * hand; tools/inquiry.test.mjs fails if a published fee reappears.
 *
 * Consumers:
 *   - static pages carry {{zp:...}} tokens and <!--zp:...--> blocks that
 *     scripts/sync-commission.mjs fills from src/lib/commission-markup.ts
 *     (services, hire-a-composer, faq, contact, the homepage);
 *   - the homepage budget select is generated from BUDGET_RANGES into the
 *     React bundle and the static snapshot by home-src/build.mjs;
 *   - the browser inquiry behaviour in src/inquiry/main.ts validates
 *     against the limits below;
 *   - scripts/generate-llms.mjs republishes the same statements.
 */

/**
 * The budget bands an inquirer picks from to describe the money they have
 * set aside for music (USD). These are deliberately broad and client-stated:
 * they describe the production's budget, not a studio fee. Change the bands
 * here only — both inquiry forms follow.
 */
export const BUDGET_RANGES: readonly string[] = [
  'Not sure yet',
  'Under $500',
  '$500 – $1,000',
  '$1,000 – $2,500',
  '$2,500 – $5,000',
  '$5,000 – $10,000',
  'Over $10,000',
  'Flexible',
];

/** Formats offered in the inquiry form. */
export const FORMATS: readonly string[] = [
  'Not sure yet',
  'Short film',
  'Feature film',
  'Series episode',
  'Game or interactive',
  'Trailer or teaser',
  'Experimental or installation',
];

export type ComplexityId = 'standard' | 'layered' | 'bespoke';
export type LicenceId = 'nonexclusive' | 'distribution' | 'exclusive' | 'buyout' | 'album';

/** Musical complexity: the density, instrumentation and construction of the music. */
export const COMPLEXITY_OPTIONS: readonly { id: ComplexityId; label: string; description: string }[] = [
  {
    id: 'standard',
    label: 'Focused palette',
    description: 'A core sonic palette: a few instruments or processed sources and one motif family.',
  },
  {
    id: 'layered',
    label: 'Layered hybrid',
    description: 'Hybrid orchestral and electronic textures, several themes or motifs, and custom processing.',
  },
  {
    id: 'bespoke',
    label: 'Bespoke or experimental',
    description: 'Custom instrument builds, performed waterphone, bowed metal or other unusual sources, and an unconventional structure.',
  },
] as const;

/**
 * Licence scope. Composition is quoted separately from the rights it is
 * licensed under. A full buyout (copyright transfer) and a soundtrack album
 * always need their own written agreement and are never bundled silently
 * into a composition quote.
 */
export const LICENCE_OPTIONS: readonly { id: LicenceId; label: string; description: string }[] = [
  {
    id: 'nonexclusive',
    label: 'Standard project-use licence',
    description: 'Use of the recorded score in the named production, its festival run and its own release, as set out in the written agreement. Copyright stays with the composer.',
  },
  {
    id: 'distribution',
    label: 'Expanded distribution',
    description: 'Adds broadcast, streaming and paid video-on-demand to the project licence, by separate written agreement.',
  },
  {
    id: 'exclusive',
    label: 'Exclusive licence',
    description: 'Exclusive to the production for an agreed term and territory, by separate written agreement. The composer keeps the copyright.',
  },
  {
    id: 'buyout',
    label: 'Copyright assignment (buyout)',
    description: 'Transfer of copyright on payment. Always under a separate written agreement; never included automatically.',
  },
  {
    id: 'album',
    label: 'Soundtrack album release',
    description: 'Commercial release of the score as an album. Separate agreement, discussed per project.',
  },
] as const;

/** Standard inclusions for every commission; custom scope is confirmed in writing. */
export const STANDARD_INCLUSIONS: readonly string[] = [
  'Original music synchronized to picture for the cues agreed in writing.',
  'Agreed musical scope and cue deliverables confirmed in writing before composition begins: spotting notes, cue list and tone references.',
  'Consolidated revision rounds, with the number of included rounds stated in the written quote.',
  'Professional stereo WAV delivery (24-bit, 48 kHz unless your project specifies otherwise).',
  'Cue titles and timings listed for your edit.',
];

/**
 * Specialist work, discussed individually after a feasibility check. None of
 * these is a standard inclusion; each is quoted per project on request.
 */
export const SPECIALIST_DELIVERABLES: readonly string[] = [
  'Multitrack stems by family',
  'Alternate, tension-variant or clean mixes',
  'Surround or immersive mastering (5.1, 7.1, Dolby Atmos)',
  'Final film mix, dialogue editing or dub-stage supervision',
  'Comprehensive audio post-production',
  'Bespoke sound-design packages, foley and effects',
  'Live musicians, soloists and session costs',
  'Soundtrack album mastering and distribution',
  'Adaptive or interactive music implementation for game engines',
  'Trailer or teaser cut adaptation',
];

/* ------------------------------------------------- plain-language statements */

export const MICROBUDGET_STATEMENT =
  'Independent and micro-budget productions are welcome to inquire. Where appropriate, a reduced musical scope or licensing of existing material may offer a more accessible alternative.';

export const PAYMENT_TERMS =
  '50% deposit before work begins. Remaining 50% due before release of final approved deliverables, subject to the written agreement. Applies to new commissions only; existing contracts are unchanged.';

export const REVISION_DEFINITION =
  'A revision round means one consolidated set of reasonable changes to an agreed creative direction. New cues, substantial rewrites, and changes caused by picture recuts are separately quoted.';

/** The quoting notice repeated at the foot of every commissioning surface. */
export const QUOTE_NOTICE =
  'There is no published rate card: every commission is quoted individually against the budget, scope and references you share. The written quote (issued after review of your cut, cue list or scene notes) states the scope, revision rounds, licence and fee for your project, and it is the only binding figure. Quotes are nonbinding until accepted in writing; taxes, live players and third-party clearances are additional where they apply.';

/* --------------------------------------------------------- commissioning copy */

/** What shapes a written quote, in order. Generated onto /services. */
export const QUOTE_FACTORS: readonly (readonly [string, string])[] = [
  ['Your budget', 'Tell me the range you have set aside for music and the scope is built around it honestly: a focused cue set, a fuller score, or licensing existing material where that serves the film better. “Not sure yet” is a workable answer; the quote still itemizes exactly what it covers.'],
  ['Scored music', 'Minutes of finished music, not film runtime. A fourteen-minute short with three minutes of score is quoted on three minutes; nothing scales with how long the film is.'],
  ['Cues', 'How many separate pieces the score needs. The cue list is agreed at spotting and named in the quote; a cue added after the list is locked is quoted before it is written.'],
  ['Musical complexity', 'A focused palette (a few sources, one motif family), a layered hybrid (orchestral and electronic textures, several themes), or bespoke and experimental work (custom builds, performed waterphone, bowed metal, unconventional structure). A complex two-minute composition can quote higher than a simple atmospheric cue of the same length.'],
  ['Schedule', 'A comfortable schedule is the easiest to quote. Tight turnarounds are subject to availability and are confirmed in writing before a quote is accepted.'],
  ['Revisions', `${REVISION_DEFINITION} The number of included rounds is stated in the written quote; additional rounds are quoted before work on them begins.`],
  ['Licence', 'Composition and rights are separate lines in the same agreement. The standard project-use licence covers the named production; wider distribution, exclusivity, a copyright buyout or a soundtrack album each need a separate written agreement.'],
  ['Live players & specialist delivery', 'Session musicians, stems, surround or immersive masters, album mastering and game-engine implementation are discussed per project after a feasibility check, never assumed.'],
  ['Payment', PAYMENT_TERMS],
];

/** The three steps from first message to a written quote. */
export const COMMISSION_STEPS: readonly { title: string; body: string }[] = [
  {
    title: 'Tell me about the project',
    body: 'Format, how much music you need and your deadline, rough answers are fine, and only your name and email are required to start.',
  },
  {
    title: 'Share your budget & references',
    body: 'Pick the budget range you have set aside for music and name the films, scores or tracks you love. The scope is then built around your production (not around a published rate card, because there isn’t one).',
  },
  {
    title: 'Receive a written quote',
    body: 'A written, nonbinding quote follows review of your materials: scope, cue list, revision rounds, licence and fee, in that order. Nothing is booked until it is agreed in writing.',
  },
];

/* -------------------------------------------------------------- form limits */

/** Validation ceilings shared by the inquiry form markup and its script. */
export const MAX_CUES = 80;
export const MAX_MINUTES_INPUT = 60;
