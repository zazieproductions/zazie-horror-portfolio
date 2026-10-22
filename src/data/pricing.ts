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
 * STATUS: APPROVED RATE CARD. The starting fees and non-overlapping scored-
 * music scope bands below are the owner-approved structure, reviewed 2026-10-17.
 * Public figures are starting fees, not fixed-price caps or a promise of a
 * specific duration. The estimate varies with composition complexity and scope.
 * Change prices and boundaries here; generated pages, the estimator and forms
 * follow this module.
 *
 * Scope principle: price follows the amount and complexity of ORIGINAL
 * COMPOSITION (scored minutes, cue count, musical complexity, deadline,
 * revisions, licence), never the runtime of the film. A feature client may
 * commission one individual scene/cue without engaging the substantial-score
 * minimum; the $2,500 indicative minimum applies only to substantial feature-
 * film or experimental-cinema scoring engagements.
 */

export const PRICING_STATUS = 'approved' as const;
export const PRICING_REVIEWED = '2026-10-17' as const;
export const CURRENCY = 'USD' as const;

/** Lowest starting fee for an individual scene/cue commission. */
export const MINIMUM_FEE = 250;
/** Indicative minimum engagement for substantial feature/experimental scores. */
export const FEATURE_MINIMUM_ENGAGEMENT = 2500;
/** Estimates are rounded to this increment, in dollars. */
export const ROUND_TO = 25;
/** Scored music above this many minutes is quoted individually. */
export const LONG_FORM_THRESHOLD_MINUTES = 12;
/** Cues included per scored minute before extra cues are charged. */
export const CUE_ALLOWANCE_PER_MINUTE = 2;
/** Fee for each cue beyond the allowance, in dollars (before multipliers). */
export const EXTRA_CUE_FEE = 50;
/** Consolidated revision rounds included by scope; the Feature/custom allowance needs written confirmation. */
export const INCLUDED_REVISIONS: Readonly<Record<PackageId, number>> = {
  scene: 1,
  focused: 1,
  extended: 2,
  feature: 2,
};
/** Each extra revision round costs 10% of the commission fee or $75, whichever is greater. */
export const EXTRA_REVISION_RATE = 0.1;
export const EXTRA_REVISION_MINIMUM = 75;
export const MAX_EXTRA_REVISION_ROUNDS = 3;
export const STARTING_FEE_NOTE =
  'Each package publishes a starting fee, not a guaranteed maximum amount of music. A complex two-minute composition may require a higher quote than a simple atmospheric cue of the same length.';
export const REVISION_DEFINITION =
  'A revision round means one consolidated set of reasonable changes to an agreed creative direction. New cues, substantial rewrites, and changes caused by picture recuts are separately quoted.';
export const MICROBUDGET_STATEMENT =
  'Independent and low-budget projects are welcome. A smaller music scope or a licence for an existing track may lower the cost.';
export const PAYMENT_TERMS =
  '50% deposit before work begins. Remaining 50% due before release of final approved deliverables, subject to the written agreement. Applies to new commissions only; existing contracts are unchanged.';
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
  /** Published scope guide; for the first three packages it describes scored music. */
  readonly scopeLabel: string;
  /** Whole scored minutes handled by the estimator, inclusive. null = custom quotation. */
  readonly minutes: { readonly min: number; readonly max: number } | null;
  /** Public price presentation: a starting fee or custom quotation. */
  readonly display: 'from' | 'custom';
  /** Indicative estimate lines; neither line is a guaranteed price or cap. */
  readonly low: PriceLine | null;
  readonly high: PriceLine | null;
  /** Conditional minimum for substantial custom-quoted projects, in dollars. */
  readonly indicativeMinimum?: number;
  readonly summary: string;
  readonly bestFor: string;
}

/**
 * The short-form estimate bands are contiguous and non-overlapping in whole
 * scored minutes: Scene 1–2, Focused 3–5, Extended 6–12. Their starting fees
 * begin at $250, $650 and $1,500 respectively. Estimate lines rise smoothly
 * across the boundaries; they are indicative only, not price caps or duration
 * guarantees. Substantial feature/experimental scores are quoted individually.
 */
export const PACKAGES: readonly PricingPackage[] = [
  {
    id: 'scene',
    name: 'Individual Scene Scoring',
    scopeLabel: 'About 1–2 minutes of original music',
    minutes: { min: 1, max: 2 },
    display: 'from',
    low: { start: 250, step: 200 },
    high: { start: 350, step: 200 },
    summary: 'Music for one scene or key moment. This can be a dread bed, tension cue, reveal, or stinger. For shorts and features that need one cue.',
    bestFor: 'Festival scenes, pitch videos, or one key moment in a longer film.',
  },
  {
    id: 'focused',
    name: 'Focused Short-Film Score',
    scopeLabel: 'About 3–5 minutes of original music',
    minutes: { min: 3, max: 5 },
    display: 'from',
    low: { start: 650, step: 250 },
    high: { start: 800, step: 275 },
    summary: 'A score for a short film or one act. Includes themes, a spotting session, and a consistent sound. Covers up to 5 scored minutes.',
    bestFor: 'Shorts where music helps carry the story from start to finish.',
  },
  {
    id: 'extended',
    name: 'Extended Short-Film Score',
    scopeLabel: 'About 6–12 minutes of original music',
    minutes: { min: 6, max: 12 },
    display: 'from',
    low: { start: 1500, step: 125 },
    high: { start: 1750, step: 150 },
    summary: 'For longer shorts or linked scenes. Allows more cues, themes, and tone shifts. Covers up to 12 scored minutes.',
    bestFor: 'Longer shorts, pilots, and projects that need a developed set of themes.',
  },
  {
    id: 'feature',
    name: 'Feature Film & Experimental Cinema',
    scopeLabel: 'Over 12 scored minutes or a larger scope',
    minutes: null,
    display: 'custom',
    low: null,
    high: null,
    indicativeMinimum: FEATURE_MINIMUM_ENGAGEMENT,
    summary: 'For features, long episodes, installations, and experimental work. The scope may include live players or complex delivery. I review the project before quoting a fee.',
    bestFor: 'Features and long experimental films. For one scene, choose Individual Scene Scoring. For a full score, I review the cut and schedule before you receive a quote.',
  },
] as const;

/** Musical complexity: the density, instrumentation and construction of the music. */
export const COMPLEXITY: readonly { id: ComplexityId; label: string; description: string; multiplier: number }[] = [
  {
    id: 'standard',
    label: 'Focused palette',
    description: 'A small set of instruments or processed sounds, with one theme family.',
    multiplier: 1.0,
  },
  {
    id: 'layered',
    label: 'Layered hybrid',
    description: 'A mix of orchestral and electronic sounds, with several themes and custom processing.',
    multiplier: 1.2,
  },
  {
    id: 'bespoke',
    label: 'Bespoke or experimental',
    description: 'Custom instruments, waterphone, bowed metal, or other unusual sources. The structure may also be experimental.',
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
    description: 'Delivery in about 10–20 days, if I am available. Adds 15% to the music fee.',
    multiplier: 1.15,
  },
  {
    id: 'rush',
    label: 'Rush: under 10 days',
    description: 'Delivery in under 10 days, if agreed in writing first. Adds 30% to the music fee.',
    multiplier: 1.3,
  },
] as const;

/**
 * Licence scope. Composition is priced separately from the rights it is
 * licensed under. A full buyout (copyright transfer) and a soundtrack album are
 * always quoted individually and never added to a published estimate.
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
    description: 'Use the score in the named production, its festival run, and its own release. Your written agreement sets the terms. The composer keeps the copyright.',
    multiplier: 1.0,
    quoted: false,
  },
  {
    id: 'distribution',
    label: 'Expanded distribution',
    description: 'Adds broadcast, streaming, and paid video-on-demand use. Requires a separate written agreement.',
    multiplier: 1.25,
    quoted: false,
  },
  {
    id: 'exclusive',
    label: 'Exclusive licence',
    description: 'Limits the music to your production for an agreed time and region. Requires a separate written agreement. The composer keeps the copyright.',
    multiplier: 1.4,
    quoted: false,
  },
  {
    id: 'buyout',
    label: 'Copyright assignment (buyout)',
    description: 'Transfers copyright after payment. Quoted separately and never included by default.',
    multiplier: 1.0,
    quoted: true,
  },
  {
    id: 'album',
    label: 'Soundtrack album release',
    description: 'For a commercial soundtrack album. Requires a separate agreement and quote.',
    multiplier: 1.0,
    quoted: true,
  },
] as const;

/** Standard inclusions for every commission; custom scope is confirmed in writing. */
export const STANDARD_INCLUSIONS: readonly string[] = [
  'Original music for the cues listed in your written agreement.',
  'Before work starts, we agree on the music scope and deliverables. This includes spotting notes, the cue list, and tone references.',
  'Revision rounds depend on your package. Individual Scene and Focused scores include one round. Extended and Feature/Experimental scores include two. Your quote lists the allowance.',
  'Stereo WAV files in 24-bit, 48 kHz. Tell me if your project needs another format.',
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
  'Not sure yet',
  'Short film',
  'Feature film',
  'Series episode',
  'Game or interactive',
  'Trailer or teaser',
  'Experimental or installation',
];

/* ----------------------------------------------------------------- estimate */

export interface QuoteInput {
  /** Scored music in minutes. Not film runtime. The estimator accepts whole minutes. */
  scoredMinutes: number;
  /** True only when asking for a substantial feature/experimental full-project score. */
  substantialProject: boolean;
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
  readonly reason: 'long-form' | 'licence' | 'feature-project';
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
  return INCLUDED_REVISIONS[id];
}

/** One additional revision round costs 10% of the subtotal or $75, whichever is greater. */
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

/** Public price label, e.g. "From $250" or "Custom quotation". */
export function priceLabel(pkg: PricingPackage): string {
  if (pkg.display === 'custom') return 'Custom quotation';
  const span = publishedSpan(pkg);
  return span ? `From ${usd(span.low)}` : 'Custom quotation';
}

/** Short, dynamic rate-card summary for metadata and other concise surfaces. */
export function pricingSummary(): string {
  const scene = packageById('scene');
  const focused = packageById('focused');
  const extended = packageById('extended');
  const sceneFee = priceLabel(scene).replace(/^From /, 'from ');
  const focusedFee = priceLabel(focused).replace(/^From /, 'from ');
  const extendedFee = priceLabel(extended).replace(/^From /, 'from ');
  return `Horror scoring (USD): scene ${sceneFee}; focused short ${focusedFee}; extended short ${extendedFee}. Feature/experimental scores are custom quoted; indicative ${usd(FEATURE_MINIMUM_ENGAGEMENT)} minimum only for substantial projects.`;
}

/** Whole-dollar formatting used everywhere a price appears. */
export function usd(amount: number): string {
  return '$' + Math.round(amount).toLocaleString('en-US');
}

export function roundEstimate(amount: number): number {
  return Math.round(amount / ROUND_TO) * ROUND_TO;
}

/**
 * Preliminary estimate. Pure and deterministic: the same input always gives
 * the same range on the homepage, /services and in the browser.
 *
 *   subtotal = (base(band) + extra-cue fee) x complexity x deadline x licence
 *   total    = subtotal + extra rounds x max($75, 10% of subtotal)
 *   rounded to $25
 *
 * A standard scope (focused palette, standard schedule, no extra revisions,
 * standard project-use licence, and cues within the allowance) returns the
 * published band.
 */
export function quote(input: QuoteInput): Quote {
  const licence = licenceById(input.licence);
  if (input.substantialProject) {
    const licenceNote = licence.quoted ? ` The requested ${licence.label.toLowerCase()} is also quoted individually.` : '';
    return {
      kind: 'custom',
      nonbinding: true,
      reason: 'feature-project',
      packageId: 'feature',
      message: `Substantial feature-film and experimental-cinema scores are custom quoted. The indicative minimum engagement is ${usd(FEATURE_MINIMUM_ENGAGEMENT)} for substantial full-project scoring.${licenceNote} A standalone scene/cue commission for a feature is not subject to this minimum; leave the substantial-project option unselected to estimate an individual cue.`,
    };
  }
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
      message: `Scores above ${LONG_FORM_THRESHOLD_MINUTES} scored minutes are quoted individually. The indicative minimum engagement of ${usd(FEATURE_MINIMUM_ENGAGEMENT)} applies only to substantial feature-film or experimental-cinema scoring projects, not to every project associated with a feature. A single scene/cue for a feature may still be commissioned under Individual Scene Scoring.`,
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

  const includedLabel = includedRounds === 1 ? 'One revision round, included' : `${includedRounds} revision rounds, included`;

  const factors: { label: string; value: string }[] = [
    { label: 'Package', value: `${pkg.name} (${pkg.scopeLabel})` },
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
  substantialProject: false,
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
      options.push(`${pkg.name}: custom quotation; indicative minimum ${usd(FEATURE_MINIMUM_ENGAGEMENT)} for substantial scores`);
    } else {
      options.push(`${pkg.name}: ${priceLabel(pkg).replace(/^From /, 'from ')} ${CURRENCY}`);
    }
  }
  options.push('Flexible: discuss');
  return options;
}

/** Plain-language rules that every pricing surface repeats in the same words. */
export const PRICING_NOTICE =
  `Estimate only. I confirm the scope and fee in your written quote. The estimate uses your choices for music length, cue count, complexity, schedule, revisions, licence, and deliverables. Listed fees are starting prices. Fees are in ${CURRENCY}. Taxes, live players, and third-party clearances cost extra.`;

export const RUNTIME_NOTICE =
  `Pricing follows original music being commissioned, not total film runtime. A 90-minute feature may need 2 scored minutes; a 6-minute short may need 9. A single scene or cue for a feature may use Individual Scene Scoring. The ${usd(FEATURE_MINIMUM_ENGAGEMENT)} indicative minimum applies only to substantial feature-film or experimental-cinema scoring engagements.`;
