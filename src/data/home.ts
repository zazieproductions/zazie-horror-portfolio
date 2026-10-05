/**
 * src/data/home.ts
 * ----------------------------------------------------------------------------
 * Small, intentionally curated slices of the homepage that are repeated in
 * both the prerendered index.html and the existing client bundle.
 *
 * `featuredPosterSlugs` is the nine-production poster wall's order. It is a
 * presentation choice, not the complete filmography: adding an item route
 * does not silently add an image, a link, or a new shelf to the homepage. The
 * poster, dimensions, title and accessible button name are read from
 * productions.ts, so artwork is never copied into a second hand-maintained
 * list. These cards remain buttons for the existing poster lightbox, not links
 * to item routes; the approved information architecture keeps the home page
 * linking to hubs rather than expanding it into dozens of item links.
 *
 * The existing client bundle has the same nine names and poster files. The
 * verification script checks parity between this data, the prerendered DOM
 * and that bundle so their two render paths cannot drift apart.
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
