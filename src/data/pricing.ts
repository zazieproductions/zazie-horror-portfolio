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
export const EXTRA_CUE_FEE = 35;
/** Revision rounds included per cue group (the terms' studio default). */
export const INCLUDED_REVISION_ROUNDS = 2;
/** Surcharge for each revision round beyond the included rounds (fraction). */
export const EXTRA_REVISION_RATE = 0.06;
export const MAX_EXTRA_REVISION_ROUNDS = 3;
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
    scopeLabel: 'Approximately 1–2 minutes of original music',
    minutes: { min: 1, max: 2 },
    display: 'from',
    low: { start: 250, step: 250 },
    high: { start: 350, step: 250 },
    summary: 'One scene or moment composed to picture: a dread bed, tension cue, reveal or stinger-led transition.',
    bestFor: 'A single pivotal scene or cue in a short, feature, trailer or longer edit.',
  },
  {
    id: 'focused',
    name: 'Focused Short-Film Score',
    scopeLabel: 'More than 2 and up to 5 scored minutes',
    minutes: { min: 3, max: 5 },
    display: 'from',
    low: { start: 650, step: 300 },
    high: { start: 800, step: 300 },
    summary: 'A cohesive short-film score for a restrained cue list, with motifs, spotting and a consistent sonic world.',
    bestFor: 'Complete narrative or experimental short films with more than 2 and up to 5 scored minutes.',
  },
  {
    id: 'extended',
    name: 'Extended Short-Film Score',
    scopeLabel: 'More than 5 and up to 12 scored minutes',
    minutes: { min: 6, max: 12 },
    display: 'from',
    low: { start: 1500, step: 200 },
    high: { start: 1700, step: 200 },
    summary: 'A larger short-film score with a broader cue list, developed themes and greater tonal range.',
    bestFor: 'Longer shorts and multi-part short-film scores with more than 5 and up to 12 scored minutes.',
  },
  {
    id: 'feature',
    name: 'Feature Film & Experimental Cinema',
    scopeLabel: 'Substantial full-project scoring; custom scope',
    minutes: null,
    display: 'custom',
    low: null,
    high: null,
    summary: 'Feature-film and experimental-cinema scoring engagements are scoped and quoted individually after review of the cut and delivery needs.',
    bestFor: 'Substantial full-project scores. A single scene or cue for a feature may use Individual Scene Scoring and is not subject to the feature minimum.',
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
    label: 'Three weeks or more',
    description: 'The usual schedule for a short.',
    multiplier: 1.0,
  },
  {
    id: 'expedited',
    label: 'Two weeks',
    description: 'Ten to twenty days, subject to availability.',
    multiplier: 1.15,
  },
  {
    id: 'rush',
    label: 'Under ten days',
    description: 'Subject to availability and confirmed in writing before a quote is accepted.',
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
    label: 'Non-exclusive project licence',
    description: 'Use in the named production, its festival run and its own release, as set out in the written quote.',
    multiplier: 1.0,
    quoted: false,
  },
  {
    id: 'distribution',
    label: 'Expanded distribution',
    description: 'Adds broadcast, streaming and paid video-on-demand to the project licence.',
    multiplier: 1.25,
    quoted: false,
  },
  {
    id: 'exclusive',
    label: 'Exclusive licence',
    description: 'Exclusive to the production for an agreed term and territory. The composer keeps the copyright.',
    multiplier: 1.4,
    quoted: false,
  },
  {
    id: 'buyout',
    label: 'Full buyout (copyright transfer)',
    description: 'Transfer of copyright on payment. Quoted individually; not part of a published estimate.',
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

/** Included in every commission (packages above Feature). */
export const STANDARD_INCLUSIONS: readonly string[] = [
  'Original music composed to picture for the cues agreed in writing.',
  'Creative scope confirmed in writing before composition begins: spotting notes, cue list and tone references.',
  'Two defined revision rounds per cue, collected into one set of notes per round.',
  'Professional stereo WAV delivery (24-bit, 48 kHz unless your project specifies otherwise).',
  'Cue titles and timings listed for your edit.',
];

/**
 * Specialist work, discussed individually after a feasibility check. None of
 * these is a standard inclusion, and none is priced into a published estimate.
 */
export const SPECIALIST_DELIVERABLES: readonly string[] = [
  'Instrumental stems by family',
  'Alternate, tension-variant or clean mixes',
  'Surround or immersive mixes (5.1, 7.1, Dolby Atmos)',
  'Final film mix, dialogue editing or dub-stage supervision',
  'Sound design, foley and effects',
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
  /** Revision rounds requested beyond the two included per cue. */
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
 * Indicative estimate. Pure and deterministic: the same input always gives the
 * same range on the homepage, on /services, and in the browser.
 *
 *   base(band) + extra-cue fee
 *     x complexity x deadline x (1 + revision surcharge) x licence
 *   rounded to $25
 *
 * A standard scope (focused palette, three weeks, two revision rounds, a
 * non-exclusive licence, cues within the allowance) returns the published band.
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
      message: `${licence.label} is quoted individually. It is not included in an indicative estimate; ask for a written quote.`,
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
  const revisionFactor = 1 + extraRounds * EXTRA_REVISION_RATE;

  const factor = complexity.multiplier * deadline.multiplier * revisionFactor * licence.multiplier;
  const low = roundEstimate(Math.max(MINIMUM_FEE, (band.low + cueFee) * factor));
  const high = roundEstimate(Math.max(MINIMUM_FEE, (band.high + cueFee) * factor));

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
      ? `Two rounds per cue, included`
      : `Two rounds included, plus ${extraRounds} additional ${extraRounds === 1 ? 'round' : 'rounds'} (+${Math.round(extraRounds * EXTRA_REVISION_RATE * 100)}%)`,
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
  `All fees are in ${CURRENCY}. Published fees are starting fees, not fixed-price caps or a guarantee of a specific amount of finished music; scope labels are guides. Estimates are indicative and nonbinding. A written quote follows review of your cut or cue list, musical complexity, cue count, schedule, revisions and licence. Substantial feature-film and experimental-cinema scoring engagements have an indicative minimum of ${usd(FEATURE_MINIMUM_ENGAGEMENT)}; this minimum does not apply to an individual scene/cue commission for a feature. Taxes, live players and third-party clearances are additional.`;

export const RUNTIME_NOTICE =
  `Pricing follows the music being commissioned, not total film runtime. A feature client commissioning one scene/cue can use Individual Scene Scoring; the ${usd(FEATURE_MINIMUM_ENGAGEMENT)} indicative minimum applies only to substantial feature-film or experimental-cinema scoring engagements.`;
