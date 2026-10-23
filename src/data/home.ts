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
 * User-supplied artwork, resized into the same responsive AVIF/JPEG ladder as
 * the production posters. `fit: "contain"` preserves the complete 3:4 artwork
 * inside the wall's 2:3 cards instead of cropping the title at the sides.
 */
export const additionalHomePosters = [
  {
    slug: 'uncle-freds-monster-problem',
    title: "UNCLE FRED'S MONSTER PROBLEM",
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
