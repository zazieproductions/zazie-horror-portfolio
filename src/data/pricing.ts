/**
 * src/data/pricing.ts
 * ----------------------------------------------------------------------------
 * The single source of truth for every fee, package boundary, multiplier and
 * estimate rule published on horror.zazieproductions.com.
 *
 * Nothing else in the repository types a price by hand:
 *
 *   - static pages carry {{zp:...}} tokens that scripts/sync-pricing.mjs fills
 *     from this module (services, hire-a-composer, faq, contact, composer,
 *     sound-design, game-scoring, process, work, reel, the homepage);
 *   - the homepage estimator and contact budget list are generated from it
 *     into the React bundle by home-src/build.mjs;
 *   - the browser estimator in src/estimator/main.ts calls quote() below, the
 *     same function the build uses for the default state on every page;
 *   - tools/pricing.test.mjs and tools/check-pricing.mjs fail the build when a
 *     published amount is not produced by these rules.
 *
 * STATUS: APPROVED 2026-10-16. The amounts, boundaries, multipliers and
 * licence tiers here are the approved commercial structure. Change numbers in
 * this file only; the rest of the site follows.
 *
 * Scope principle: price follows the amount and complexity of ORIGINAL
 * COMPOSITION (scored minutes, cue count, musical complexity, deadline,
 * revisions, licence), never the runtime of the film. A 90-minute film can need
 * 2 minutes of music; a 6-minute short can need 9. Inputs are therefore called
 * "scored music minutes" everywhere.
 *
 * Starting-fee principle: each package publishes a starting fee (a floor), not
 * a guaranteed maximum amount of music (a ceiling). A complex two-minute
 * composition may require a higher quote than a simple atmospheric cue of the
 * same length. No ceiling is published that the estimate does not show.
 */

export const PRICING_STATUS = 'approved' as const;
export const PRICING_REVIEWED = '2026-10-16' as const;
export const CURRENCY = 'USD' as const;

/** Lowest fee the studio quotes for a commission (the Individual Scene floor). */
export const MINIMUM_FEE = 250;
/** Estimates are rounded to this increment, in dollars. */
export const ROUND_TO = 25;
/** Scored music above this many minutes is quoted individually. */
export const LONG_FORM_THRESHOLD_MINUTES = 12;
/** Cues included per scored minute before extra cues are charged. */
export const CUE_ALLOWANCE_PER_MINUTE = 2;
/** Fee for each cue beyond the allowance, in dollars (before multipliers). */
export const EXTRA_CUE_FEE = 50;
/**
 * Consolidated revision rounds included per package. An Individual Scene and a
 * Focused score include one round; an Extended score includes two. Feature and
 * experimental engagements agree revisions in writing (two is the default
 * assumption used by the estimator only for scope comparison).
 */
export const INCLUDED_REVISIONS: Readonly<Record<PackageId, number>> = {
  scene: 1,
  focused: 1,
  extended: 2,
  feature: 2,
};
/**
 * Each revision round beyond the included allowance costs 10% of the
 * commission fee or $75, whichever is greater.
 */
export const EXTRA_REVISION_RATE = 0.1;
export const EXTRA_REVISION_MINIMUM = 75;
export const MAX_EXTRA_REVISION_ROUNDS = 3;
/**
 * Indicative minimum engagement for substantial feature-film and experimental
 * scoring projects. Not a fixed price and not a ceiling: single-scene
 * commissions from features use Individual Scene Scoring instead.
 */
export const FEATURE_INDICATIVE_MINIMUM = 2500;
export const MAX_CUES = 80;
export const MAX_MINUTES_INPUT = 60;

export type PackageId = 'scene' | 'focused' | 'extended' | 'feature';
export type EstimatePackageId = Exclude<PackageId, 'feature'>;
export type ComplexityId = 'standard' | 'layered' | 'bespoke';
export type DeadlineId = 'standard' | 'expedited' | 'rush';
export type LicenceId = 'nonexclusive' | 'distribution' | 'exclusive' | 'buyout' | 'album';

/** A linear price line in whole scored minutes: value at the band start, then per extra minute. */
export interface PriceLine {
  readonly start: number;
  readonly step: number;
}

export interface PricingPackage {
  readonly id: PackageId;
  readonly name: string;
  /** Approximate scored music, as published on the site. */
  readonly minutesLabel: string;
  /** Whole scored minutes handled by the estimator, inclusive. null = custom quotation. */
  readonly minutes: { readonly min: number; readonly max: number } | null;
  /** How the price is published: a closed range, a "from" floor, or a custom quotation. */
  readonly display: 'range' | 'from' | 'custom';
  readonly low: PriceLine | null;
  readonly high: PriceLine | null;
  /** Indicative minimum for custom-quoted packages, in dollars. */
  readonly indicativeMinimum?: number;
  readonly summary: string;
  readonly bestFor: string;
}

/**
 * The four commissioning packages. Bands are linear in whole scored minutes
 * and join without overlap, so a larger scope never costs less than a smaller
 * one: Scene 1-2 min from $250; Focused 3-5 min from $650; Extended 6-12 min
 * from $1,500; Feature & experimental custom (indicative minimum $2,500 for
 * substantial engagements). The steps between bands reflect a meaningful change
 * in scope (a single cue vs. a spotted short with motifs vs. a developed
 * thematic score), not only the extra minute.
 */
export const PACKAGES: readonly PricingPackage[] = [
  {
    id: 'scene',
    name: 'Individual Scene Scoring',
    minutesLabel: 'about 1–2 minutes',
    minutes: { min: 1, max: 2 },
    display: 'from',
    low: { start: 250, step: 200 },
    high: { start: 350, step: 200 },
    summary: 'A single sequence or moment composed to picture: a dread bed, a tension cue, a reveal or a stinger-led transition. Open to shorts and features alike when only one cue is needed.',
    bestFor: 'Festival scenes, pitch sequences and a single pivotal moment in a longer edit, including features.',
  },
  {
    id: 'focused',
    name: 'Focused Short-Film Score',
    minutesLabel: 'about 3–5 minutes',
    minutes: { min: 3, max: 5 },
    display: 'from',
    low: { start: 650, step: 250 },
    high: { start: 800, step: 275 },
    summary: 'A complete short film or a fully scored act, with its own motifs, a spotting session and a consistent sonic world. Up to 5 scored minutes.',
    bestFor: 'Narrative and experimental shorts where the score carries the story from the first frame.',
  },
  {
    id: 'extended',
    name: 'Extended Short-Film Score',
    minutesLabel: 'about 6–12 minutes',
    minutes: { min: 6, max: 12 },
    display: 'from',
    low: { start: 1500, step: 125 },
    high: { start: 1750, step: 150 },
    summary: 'Longer shorts, multi-part short work or a developed theme set with a larger cue list and more tonal range. Up to 12 scored minutes.',
    bestFor: 'Longer shorts, series pilots and projects that need a developed thematic score.',
  },
  {
    id: 'feature',
    name: 'Feature Film & Experimental Cinema',
    minutesLabel: 'more than 12 minutes, or multi-part work',
    minutes: null,
    display: 'custom',
    low: null,
    high: null,
    indicativeMinimum: FEATURE_INDICATIVE_MINIMUM,
    summary: 'Features, series episodes at length, installation and experimental work with expanded scope, live players or complex delivery. Quoted after review; substantial engagements start from an indicative minimum.',
    bestFor: 'Features and longer experimental films. Single-scene needs use Individual Scene Scoring; substantial scores are quoted after the studio has watched a cut and agreed the schedule.',
  },
] as const;

/** Musical complexity: the density, instrumentation and construction of the music. */
export const COMPLEXITY: readonly { id: ComplexityId; label: string; description: string; multiplier: number }[] = [
  {
    id: 'standard',
    label: 'Focused palette',
    description: 'A core sonic palette: a few instruments or processed sources and one motif family.',
    multiplier: 1.0,
  },
  {
    id: 'layered',
    label: 'Layered hybrid',
    description: 'Hybrid orchestral and electronic textures, several themes or motifs, and custom processing.',
    multiplier: 1.2,
  },
  {
    id: 'bespoke',
    label: 'Bespoke or experimental',
    description: 'Custom instrument builds, performed waterphone, bowed metal or other unusual sources, and an unconventional structure.',
    multiplier: 1.4,
  },
] as const;

/** Schedule: the time between the agreed start and the delivery date. */
export const DEADLINES: readonly { id: DeadlineId; label: string; description: string; multiplier: number }[] = [
  {
    id: 'standard',
    label: 'Standard schedule',
    description: 'The usual schedule for a short. No surcharge.',
    multiplier: 1.0,
  },
  {
    id: 'expedited',
    label: 'Expedited: about 10–20 days',
    description: 'About ten to twenty days, subject to availability. Adds 15% to the composition fee.',
    multiplier: 1.15,
  },
  {
    id: 'rush',
    label: 'Rush: under 10 days',
    description: 'Under ten days, subject to availability and confirmed in writing before a quote is accepted. Adds 30% to the composition fee.',
    multiplier: 1.3,
  },
] as const;

/**
 * Licence scope. Composition is priced separately from the rights it is
 * licensed under. Exclusivity, copyright assignment, soundtrack exploitation
 * and expanded uses require a separate written agreement. A copyright buyout
 * and a soundtrack album are always quoted individually and never added to a
 * published estimate.
 */
export const LICENCES: readonly {
  id: LicenceId;
  label: string;
  description: string;
  multiplier: number;
  quoted: boolean;
}[] = [
  {
    id: 'nonexclusive',
    label: 'Standard project-use licence',
    description: 'Use of the recorded score in the named production, its festival run and its own release, as set out in the written agreement. Copyright stays with the composer.',
    multiplier: 1.0,
    quoted: false,
  },
  {
    id: 'distribution',
    label: 'Expanded distribution',
    description: 'Adds broadcast, streaming and paid video-on-demand to the project licence, by separate written agreement.',
    multiplier: 1.25,
    quoted: false,
  },
  {
    id: 'exclusive',
    label: 'Exclusive licence',
    description: 'Exclusive to the production for an agreed term and territory, by separate written agreement. The composer keeps the copyright.',
    multiplier: 1.4,
    quoted: false,
  },
  {
    id: 'buyout',
    label: 'Copyright assignment (buyout)',
    description: 'Transfer of copyright on payment. Quoted individually under a separate written agreement; never included automatically.',
    multiplier: 1.0,
    quoted: true,
  },
  {
    id: 'album',
    label: 'Soundtrack album release',
    description: 'Commercial release of the score as an album. Separate agreement; quoted individually.',
    multiplier: 1.0,
    quoted: true,
  },
] as const;

/** Included in every commission. */
export const STANDARD_INCLUSIONS: readonly string[] = [
  'Original music synchronized to picture for the cues agreed in writing.',
  'Agreed musical scope and cue deliverables confirmed in writing before composition begins: spotting notes, cue list and tone references.',
  'Defined consolidated revision rounds: one round for Individual Scene and Focused scores, two rounds for Extended scores.',
  'Professional stereo WAV delivery (24-bit, 48 kHz unless your project specifies otherwise).',
  'Cue titles and timings listed for your edit.',
];

/**
 * Specialist work, discussed individually after a feasibility check. None of
 * these is a standard inclusion, and none is priced into a published estimate.
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

/** Formats offered in the inquiry form. */
export const FORMATS: readonly string[] = [
  'Short film',
  'Feature film',
  'Series episode',
  'Game or interactive',
  'Trailer or teaser',
  'Experimental or installation',
];

/* ----------------------------------------------------------------- estimate */

export interface QuoteInput {
  /** Scored music in minutes. Not film runtime. Rounded up to whole minutes. */
  scoredMinutes: number;
  /** Number of cues. Undefined or 0 means "not sure yet": the allowance applies. */
  cueCount?: number;
  complexity: ComplexityId;
  deadline: DeadlineId;
  /** Consolidated revision rounds requested beyond the package allowance. */
  extraRevisionRounds: number;
  licence: LicenceId;
}

export interface EstimateQuote {
  readonly kind: 'estimate';
  readonly nonbinding: true;
  readonly packageId: EstimatePackageId;
  readonly packageName: string;
  readonly scoredMinutes: number;
  readonly cueCount: number;
  readonly cueAllowance: number;
  readonly includedRevisionRounds: number;
  /** Nearest $25. For a standard scope these equal the published band. */
  readonly low: number;
  readonly high: number;
  readonly factors: readonly { readonly label: string; readonly value: string }[];
}

export interface CustomQuote {
  readonly kind: 'custom';
  readonly nonbinding: true;
  readonly reason: 'long-form' | 'licence';
  readonly packageId: 'feature' | LicenceId;
  readonly message: string;
}

export type Quote = EstimateQuote | CustomQuote;

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export function packageById(id: PackageId): PricingPackage {
  const found = PACKAGES.find((p) => p.id === id);
  if (!found) throw new Error(`unknown package ${id}`);
  return found;
}

export function complexityById(id: ComplexityId) {
  return COMPLEXITY.find((c) => c.id === id) ?? COMPLEXITY[0];
}

export function deadlineById(id: DeadlineId) {
  return DEADLINES.find((d) => d.id === id) ?? DEADLINES[0];
}

export function licenceById(id: LicenceId) {
  return LICENCES.find((l) => l.id === id) ?? LICENCES[0];
}

/** Consolidated revision rounds included for a package. */
export function includedRevisionsFor(id: PackageId): number {
  return INCLUDED_REVISIONS[id] ?? 1;
}

/**
 * Fee for one revision round beyond the included allowance: 10% of the given
 * subtotal or $75, whichever is greater. Pure, so tests can pin it.
 */
export function revisionFeePerRound(subtotal: number): number {
  return Math.max(EXTRA_REVISION_MINIMUM, subtotal * EXTRA_REVISION_RATE);
}

/** Estimator package for a whole number of scored minutes (1..12), or null for custom. */
export function estimatePackageFor(minutes: number): PricingPackage | null {
  for (const pkg of PACKAGES) {
    if (pkg.minutes && minutes >= pkg.minutes.min && minutes <= pkg.minutes.max) return pkg;
  }
  return null;
}

/** The unadjusted low and high band for a package at a given minute count. */
export function bandAt(pkg: PricingPackage, minutes: number): { low: number; high: number } {
  if (!pkg.minutes || !pkg.low || !pkg.high) throw new Error(`${pkg.id} has no published band`);
  const steps = minutes - pkg.minutes.min;
  return {
    low: pkg.low.start + pkg.low.step * steps,
    high: pkg.high.start + pkg.high.step * steps,
  };
}

/** Published span of a package: its lowest and highest figure across the whole band. */
export function publishedSpan(pkg: PricingPackage): { low: number; high: number } | null {
  if (!pkg.minutes || !pkg.low || !pkg.high) return null;
  return {
    low: pkg.low.start,
    high: pkg.high.start + pkg.high.step * (pkg.minutes.max - pkg.minutes.min),
  };
}

/** The public price label, e.g. "From $250", "Custom quotation". */
export function priceLabel(pkg: PricingPackage): string {
  if (pkg.display === 'custom') return 'Custom quotation';
  const span = publishedSpan(pkg);
  if (!span) return 'Custom quotation';
  return pkg.display === 'from' ? `From ${usd(span.low)}` : `${usd(span.low)}–${usd(span.high)}`;
}

/** Whole-dollar formatting used everywhere a price appears. */
export function usd(amount: number): string {
  return '$' + Math.round(amount).toLocaleString('en-US');
}

export function roundEstimate(amount: number): number {
  return Math.round(amount / ROUND_TO) * ROUND_TO;
}

/**
 * Preliminary estimate. Pure and deterministic: the same input always gives the
 * same range on the homepage, on /services, and in the browser.
 *
 *   subtotal = (base(band) + extra-cue fee) x complexity x deadline x licence
 *   total    = subtotal + extraRounds x max($75, 10% of subtotal)
 *   rounded to $25
 *
 * A standard scope (focused palette, standard schedule, no extra revisions, a
 * standard project-use licence, cues within the allowance) returns the
 * published band.
 */
export function quote(input: QuoteInput): Quote {
  const licence = licenceById(input.licence);
  if (licence.quoted) {
    return {
      kind: 'custom',
      nonbinding: true,
      reason: 'licence',
      packageId: licence.id,
      message: `${licence.label} is quoted individually under a separate written agreement. It is not included in a preliminary estimate; ask for a written quote.`,
    };
  }

  const requested = Number.isFinite(input.scoredMinutes) ? Math.ceil(input.scoredMinutes) : 1;
  if (requested > LONG_FORM_THRESHOLD_MINUTES) {
    return {
      kind: 'custom',
      nonbinding: true,
      reason: 'long-form',
      packageId: 'feature',
      message: `Scores over ${LONG_FORM_THRESHOLD_MINUTES} scored minutes, and multi-part or experimental work, are quoted individually after a cut has been reviewed. Substantial feature and experimental engagements start from an indicative minimum of ${usd(FEATURE_INDICATIVE_MINIMUM)}; a single scene from a feature can still be commissioned as an Individual Scene.`,
    };
  }

  const minutes = clamp(requested, 1, LONG_FORM_THRESHOLD_MINUTES);
  const pkg = estimatePackageFor(minutes);
  if (!pkg || !pkg.minutes) throw new Error(`no estimate package for ${minutes} minutes`);
  const band = bandAt(pkg, minutes);

  const allowance = minutes * CUE_ALLOWANCE_PER_MINUTE;
  const cueCount = clamp(Math.round(input.cueCount ?? 0) || allowance, 1, MAX_CUES);
  const extraCues = Math.max(0, cueCount - allowance);
  const cueFee = extraCues * EXTRA_CUE_FEE;

  const complexity = complexityById(input.complexity);
  const deadline = deadlineById(input.deadline);
  const extraRounds = clamp(Math.round(input.extraRevisionRounds) || 0, 0, MAX_EXTRA_REVISION_ROUNDS);
  const includedRounds = includedRevisionsFor(pkg.id);

  const factor = complexity.multiplier * deadline.multiplier * licence.multiplier;
  const subtotalLow = (band.low + cueFee) * factor;
  const subtotalHigh = (band.high + cueFee) * factor;
  const low = roundEstimate(Math.max(MINIMUM_FEE, subtotalLow + extraRounds * revisionFeePerRound(subtotalLow)));
  const high = roundEstimate(Math.max(MINIMUM_FEE, subtotalHigh + extraRounds * revisionFeePerRound(subtotalHigh)));

  const includedLabel = includedRounds === 1 ? 'One consolidated round, included' : `${includedRounds} consolidated rounds, included`;
  const factors: { label: string; value: string }[] = [
    { label: 'Package', value: `${pkg.name} (${pkg.minutesLabel})` },
    { label: 'Scored music', value: `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}` },
  ];
  factors.push({
    label: 'Cues',
    value: extraCues > 0
      ? `${cueCount} cues: ${allowance} included, ${extraCues} extra at ${usd(EXTRA_CUE_FEE)} each`
      : `${cueCount} ${cueCount === 1 ? 'cue' : 'cues'}, within the ${allowance} included`,
  });
  factors.push({
    label: 'Musical complexity',
    value: complexity.multiplier === 1 ? `${complexity.label} (standard)` : `${complexity.label} (×${complexity.multiplier.toFixed(2)})`,
  });
  factors.push({
    label: 'Deadline',
    value: deadline.multiplier === 1 ? `${deadline.label} (standard)` : `${deadline.label} (×${deadline.multiplier.toFixed(2)})`,
  });
  factors.push({
    label: 'Revisions',
    value: extraRounds === 0
      ? includedLabel
      : `${includedLabel}, plus ${extraRounds} additional ${extraRounds === 1 ? 'round' : 'rounds'} (${usd(EXTRA_REVISION_MINIMUM)} minimum or 10% of the fee each, whichever is greater)`,
  });
  factors.push({
    label: 'Licence',
    value: licence.multiplier === 1 ? `${licence.label} (included)` : `${licence.label} (×${licence.multiplier.toFixed(2)})`,
  });

  return {
    kind: 'estimate',
    nonbinding: true,
    packageId: pkg.id as EstimatePackageId,
    packageName: pkg.name,
    scoredMinutes: minutes,
    cueCount,
    cueAllowance: allowance,
    includedRevisionRounds: includedRounds,
    low,
    high,
    factors,
  };
}

/** The default scope every estimator starts from (also the server-rendered state). */
export const DEFAULT_SCOPE: QuoteInput = {
  scoredMinutes: 3,
  cueCount: undefined,
  complexity: 'standard',
  deadline: 'standard',
  extraRevisionRounds: 0,
  licence: 'nonexclusive',
};

/** Human-readable budget options for the inquiry forms, derived from the packages. */
export function budgetOptions(): string[] {
  const options = ['Not sure yet: please advise'];
  for (const pkg of PACKAGES) {
    if (pkg.display === 'custom') {
      const minimum = pkg.indicativeMinimum ? ` (indicative minimum ${usd(pkg.indicativeMinimum)})` : '';
      options.push(`${pkg.name}: custom quotation${minimum}`);
    } else options.push(`${pkg.name}: ${priceLabel(pkg).replace(/^From /, 'from ')}`);
  }
  options.push('Flexible: discuss');
  return options;
}

/** Plain-language rules that every page repeats in the same words. */
export const PRICING_NOTICE =
  'Preliminary estimate — final quotation subject to creative scope and written agreement. Estimates come from the scope you enter. A written quote follows review of your cut or cue list, the schedule and the licence you need. Starting fees are floors, not ceilings: complex composition, unusual deadlines, extensive revisions and expanded licensing can increase a quotation. Fees are in US dollars and exclude taxes, live players and third-party clearances.';

export const RUNTIME_NOTICE =
  'Your film’s runtime does not set the amount of music. A 90-minute feature may need 2 scored minutes; a 6-minute short may need 9. Quotes are built from the music you need composed.';

export const STARTING_FEE_NOTE =
  'Each package publishes a starting fee, not a guaranteed maximum amount of music. A complex two-minute composition may require a higher quote than a simple atmospheric cue of the same length.';

export const REVISION_DEFINITION =
  'A revision round means one consolidated set of reasonable changes to an agreed creative direction. New cues, substantial rewrites, and changes caused by picture recuts are separately quoted.';

export const MICROBUDGET_STATEMENT =
  'Independent and micro-budget productions are welcome to inquire. Where appropriate, a reduced musical scope or licensing of existing material may offer a more accessible alternative.';

export const PAYMENT_TERMS =
  '50% deposit before work begins. Remaining 50% due before release of final approved deliverables, subject to the written agreement.';
