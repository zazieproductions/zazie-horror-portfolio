/**
 * src/data/home.ts
 * ----------------------------------------------------------------------------
 * Small, intentionally curated slices of the homepage that are repeated in
 * both the prerendered index.html and the existing client bundle.
 *
 * `featuredPosterSlugs` controls the nine verified production records in the
 * poster wall. Their artwork, dimensions and titles come from productions.ts.
 * `additionalHomePosters` is for supplied poster artwork that does not yet have
 * enough verified production metadata for a standalone /work/<slug> page. This
 * keeps the wall useful without inventing credits, dates, links or archive
 * routes for a newly supplied image.
 *
 * The client bundle carries the same presentation entries. Build-time checks
 * keep the prerendered cards and the React poster lightbox in step.
 */

export const featuredPosterSlugs = [
  'expire',
  'unseen',
  'peregrinus',
  'phantom-requiem',
  'eclipsed',
  'the-haunted',
  'choleric',
  'mike-has-a-visitor',
  'the-dark-awaits',
] as const;

/**
 * Cues surfaced as MusicComposition structured data on the homepage. Every
 * slug must exist in cues.ts (home.ts builds a throwing lookup for them), and
 * every entry is also visible in the homepage showreel queue, so the graph
 * describes content actually on the page rather than inventing works. The
 * set spans the mood taxonomy and keeps the two queue-promoted cues first.
 */
export const featuredCueSlugs = [
  'the-beautiful-wrongness',
  'needle-in-the-nerve',
  'the-silence-began-crawling',
  'the-fatal-overdose',
  'dissociative-amnesia',
  'ominous-drone',
] as const;

/**
 * User-supplied artwork, resized into the same responsive AVIF/JPEG ladder as
 * the production posters. `fit: "contain"` preserves the complete 3:4 artwork
 * inside the wall's 2:3 cards instead of cropping the title at the sides.
 */
export const additionalHomePosters = [
  {
    slug: 'uncle-freds-monster-problem',
    title: "UNCLE FRED'S MONSTER PROBLEM",
    workType: 'Horror film',
    roleLabel: 'Featured production artwork',
    summary:
      "Featured production poster for Uncle Fred's Monster Problem — 'His problem is now your problem.' Presented in the selected horror and genre productions gallery.",
    fit: 'contain',
    poster: {
      src: '/images/posters/uncle-freds-monster-problem-640.jpg',
      avif: '/images/posters/uncle-freds-monster-problem-640.avif',
      avifSet: '/images/posters/uncle-freds-monster-problem-400.avif 400w, /images/posters/uncle-freds-monster-problem-480.avif 480w, /images/posters/uncle-freds-monster-problem-640.avif 640w',
      srcset: '/images/posters/uncle-freds-monster-problem-640.jpg 640w, /images/posters/uncle-freds-monster-problem-1200.jpg 1200w',
      alt: "Poster artwork for UNCLE FRED'S MONSTER PROBLEM",
      width: 640,
      height: 854,
    },
  },
] as const;
