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
 * STATUS: PROVISIONAL. Every amount, boundary, multiplier and licence tier here
 * is a recommendation awaiting the owner's written approval before public
 * deployment. See COMMERCIAL-OVERHAUL.md ("Owner approvals"). Change numbers in
 * this file only; the rest of the site follows.
 *
 * Scope principle: price follows the amount and complexity of ORIGINAL
 * COMPOSITION (scored minutes, cue count, musical complexity, deadline,
 * revisions, licence), never the runtime of the film. A 90-minute film can need
 * 4 minutes of music; a 6-minute short can need 9. Inputs are therefore called
 * "scored music minutes" everywhere.
 */

export const PRICING_STATUS = 'approved' as const;
export const PRICING_REVIEWED = '2026-10-14' as const;
export const CURRENCY = 'USD' as const;

/** Lowest fee the studio quotes for a commission (the Individual Scene floor). */
export const MINIMUM_FEE = 250;
/** Estimates are rounded to this increment, in dollars. */
export const ROUND_TO = 25;
/** Scored music above this many minutes is quoted individually. */
export const LONG_FORM_THRESHOLD_MINUTES = 12;
/** Approximate planning baseline for estimator routing; not a promised cue cap. */
export const CUE_ALLOWANCE_PER_MINUTE = 2;
/** Revision rounds included per cue group (the terms' studio default). */
export const INCLUDED_REVISION_ROUNDS = 1;
/** Surcharge for each revision round beyond the included rounds (fraction). */
export const EXTRA_REVISION_MINIMUM = 75;
export const EXTRA_REVISION_RATE = 0.10;
export const MAX_EXTRA_REVISION_ROUNDS = 6;
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
  readonly summary: string;
  readonly bestFor: string;
}

/**
 * The four commissioning packages. Bands are linear in whole scored minutes.
 * Scene: 1-2 scored minutes, from $250. Focused: up to 5 minutes, from $650.
 * Extended: up to 12 minutes, from $1,500. Substantial feature engagements: custom, indicative minimum $2,500.
 * Bands join without overlap, so a larger scope never costs less than a smaller one.
 */
export const PACKAGES: readonly PricingPackage[] = [
  {
    id: 'scene',
    name: 'Individual Scene Scoring',
    minutesLabel: 'approximately 1–2 minutes',
    minutes: { min: 1, max: 2 },
    display: 'from',
    low: { start: 250, step: 100 },
    high: { start: 400, step: 100 },
    summary: 'A single sequence or moment composed to picture: a dread bed, a tension cue, a reveal or a stinger-led transition.',
    bestFor: 'Festival scenes, pitch sequences and a single pivotal moment in a longer edit.',
  },
  {
    id: 'focused',
    name: 'Focused Short-Film Scoring',
    minutesLabel: 'up to 5 scored minutes',
    minutes: { min: 3, max: 5 },
    display: 'from',
    low: { start: 650, step: 175 },
    high: { start: 900, step: 200 },
    summary: 'A complete short film or a fully scored act, with its own motifs, a spotting session and a consistent sonic world.',
    bestFor: 'Narrative and experimental shorts where the score carries the story from the first frame.',
  },
  {
    id: 'extended',
    name: 'Extended Short-Film Scoring',
    minutesLabel: 'up to 12 scored minutes',
    minutes: { min: 6, max: 12 },
    display: 'from',
    low: { start: 1500, step: 125 },
    high: { start: 2000, step: 150 },
    summary: 'Longer shorts, multi-part short work or a developed theme set with a larger cue list and more tonal range.',
    bestFor: 'Longer shorts, series pilots and projects that need a developed thematic score.',
  },
  {
    id: 'feature',
    name: 'Feature Film & Experimental Cinema',
    minutesLabel: 'substantial feature work; single scenes remain eligible for scene scoring',
    minutes: null,
    display: 'custom',
    low: null,
    high: null,
    summary: 'Substantial feature-scoring engagements and experimental cinema are quoted individually; a single feature scene can use Individual Scene Scoring.',
    bestFor: 'Substantial feature engagements; indicative minimum $2,500. Single-scene commissions are not subject to this minimum.',
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
    label: 'Standard schedule (no surcharge)',
    description: 'The usual schedule for a short.',
    multiplier: 1.0,
  },
  {
    id: 'expedited',
    label: 'Expedited (approximately 10–20 days)',
    description: 'Ten to twenty days, subject to availability.',
    multiplier: 1.15,
  },
  {
    id: 'rush',
    label: 'Rush (under 10 days)',
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
    label: 'Standard project-use licence',
    description: 'Non-exclusive use in the named production, festival exhibition and agreed distribution, as expressly defined in writing.',
    multiplier: 1.0,
    quoted: false,
  },
  {
    id: 'distribution',
    label: 'Expanded distribution',
    description: 'Broadcast, streaming, paid VOD or other expanded use: scope and fee agreed in writing.',
    multiplier: 1,
    quoted: true,
  },
  {
    id: 'exclusive',
    label: 'Exclusive licence',
    description: 'Exclusivity is not included; terms and fee require a separate written agreement.',
    multiplier: 1,
    quoted: true,
  },
  {
    id: 'buyout',
    label: 'Full buyout (copyright transfer)',
    description: 'Copyright assignment is not included; any transfer or expanded use requires a separate written agreement.',
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
  'Package-specific consolidated revision rounds: one for Scene and Focused; two for Extended.',
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
  /** Additional consolidated revision rounds beyond the package allowance. */
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
  readonly reason: 'long-form' | 'licence' | 'cue-scope';
  readonly packageId: PackageId | LicenceId;
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

/** The public price label, e.g. "$200–$350", "From $500", "Custom quotation". */
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
 * Indicative estimate. Pure and deterministic: the same input always gives the
 * same range on the homepage, on /services, and in the browser.
 *
 *   base(band) x complexity x deadline x licence, plus any extra revision fee
 *     computed as max($75, 10% of commission fee) per additional round
 *   rounded to $25
 *
 * The estimate is deterministic; expanded rights, extra cue scopes and long-form work are routed to individual quotation.
 */
export function quote(input: QuoteInput): Quote {
  const licence = licenceById(input.licence);
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
      message: `Feature Film & Experimental Cinema and scores over ${LONG_FORM_THRESHOLD_MINUTES} minutes are quoted individually. The $2,500 indicative minimum applies to substantial feature-scoring engagements only; a single scene in a feature may use Individual Scene Scoring.`,
    };
  }

  const minutes = clamp(requested, 1, LONG_FORM_THRESHOLD_MINUTES);
  const pkg = estimatePackageFor(minutes);
  if (!pkg || !pkg.minutes) throw new Error(`no estimate package for ${minutes} minutes`);
  const band = bandAt(pkg, minutes);

  const allowance = minutes * CUE_ALLOWANCE_PER_MINUTE;
  const cueCount = clamp(Math.round(input.cueCount ?? 0) || allowance, 1, MAX_CUES);
  const extraCues = Math.max(0, cueCount - allowance);
  if (extraCues > 0) {
    return { kind: 'custom', nonbinding: true, reason: 'cue-scope', packageId: pkg.id, message: `This cue count exceeds the approximate planning baseline; additional composition is quoted individually based on additional scored minutes, cue count and creative complexity.` };
  }

  const complexity = complexityById(input.complexity);
  const deadline = deadlineById(input.deadline);
  const extraRounds = clamp(Math.round(input.extraRevisionRounds) || 0, 0, MAX_EXTRA_REVISION_ROUNDS);
  const includedRounds = pkg.id === 'extended' ? 2 : 1;
  const factor = complexity.multiplier * deadline.multiplier * licence.multiplier;
  const revisionFeeLow = extraRounds * Math.max(EXTRA_REVISION_MINIMUM, band.low * factor * EXTRA_REVISION_RATE);
  const revisionFeeHigh = extraRounds * Math.max(EXTRA_REVISION_MINIMUM, band.high * factor * EXTRA_REVISION_RATE);
  const low = roundEstimate(Math.max(MINIMUM_FEE, band.low * factor + revisionFeeLow));
  const high = roundEstimate(Math.max(MINIMUM_FEE, band.high * factor + revisionFeeHigh));

  const factors: { label: string; value: string }[] = [
    { label: 'Package', value: `${pkg.name} (${pkg.minutesLabel})` },
    { label: 'Scored music', value: `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}` },
  ];
  factors.push({
    label: 'Cues',
    value: extraCues > 0
      ? `${cueCount} cues; ${extraCues} above the approximate cue-count baseline (additional composition quoted by scope)`
      : `${cueCount} ${cueCount === 1 ? 'cue' : 'cues'} (rough planning baseline: ${allowance})`,
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
      ? `${includedRounds} consolidated ${includedRounds === 1 ? 'round' : 'rounds'} included`
      : `Included rounds, plus ${extraRounds} additional (${usd(revisionFeeLow)}–${usd(revisionFeeHigh)} minimum rule)`,
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
    if (pkg.display === 'custom') options.push(`${pkg.name}: custom quotation`);
    else options.push(`${pkg.name}: ${priceLabel(pkg).replace(/^From /, 'from ')}`);
  }
  options.push('Flexible: discuss');
  return options;
}

/** Plain-language rules that every page repeats in the same words. */
export const PRICING_NOTICE =
  'Preliminary estimate — final quotation subject to creative scope and written agreement. Starting fees are not guaranteed maximums. Fees are in US dollars; complexity, cue count, additional composition, deadlines and licensing scope affect the final quotation.';

export const RUNTIME_NOTICE =
  'Your film’s runtime does not set the amount of music. A 90-minute feature may need 4 scored minutes; a 6-minute short may need 9. Quotes are built from the music you need composed.';
