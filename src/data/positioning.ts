/**
 * src/data/positioning.ts
 * ----------------------------------------------------------------------------
 * The site's primary search identity, in one place.
 *
 * Decision record: SEARCH-IDENTITY-2026.md (2026-10-26). The studio does not
 * compete for "horror music" or "horror composer for hire" as head terms — those
 * SERPs are marketplaces priced by the gig. It competes for one sentence, said
 * the same way on every commercial surface:
 *
 *   Experimental psychological horror film composer for independent and
 *   arthouse cinema.
 *
 * Everything below is copy that appears in served HTML, a <title>, a meta
 * description, JSON-LD, or llms.txt. Edit it here, run `npm run build`, and the
 * head, the sitemap, the LLM manifests, the hub pages and the React hero all
 * move together. `tools/positioning.test.mjs` fails if a primary surface stops
 * carrying the identity or drifts into name-dropping a film the studio has no
 * credit on.
 *
 * RULES
 * - State the identity; do not mint variations of it. One sentence, repeated.
 * - Genre labels (folk horror, body horror, dark ambient) stay in the biography
 *   and the catalogue. They are not the identity and must not lead a page.
 * - Never name a specific film, director or studio as a comparison, influence
 *   or "in the vein of" claim. A list of titles is not positioning; it is an
 *   affiliation claim waiting to be read as a credit.
 * - No page whose only job is to hold a keyword. This repository adds a route
 *   when it has a real document to serve, not to capture a query.
 */

/** The role an entity search should resolve to. Sentence case: it opens copy. */
export const IDENTITY_ROLE = 'Experimental psychological horror film composer';

/** Who the work is for. Deliberately narrow: independent + arthouse cinema. */
export const IDENTITY_AUDIENCE = 'independent and arthouse cinema';

/** Lower-case initial, for use after an article mid-sentence. */
export const IDENTITY_ROLE_LC = IDENTITY_ROLE.charAt(0).toLowerCase() + IDENTITY_ROLE.slice(1);

/** The whole position, as one citable sentence. */
export const IDENTITY_STATEMENT = `${IDENTITY_ROLE} for ${IDENTITY_AUDIENCE}.`;

/** The same sentence where it is already mid-sentence. */
export const IDENTITY_STATEMENT_LC = `${IDENTITY_ROLE_LC} for ${IDENTITY_AUDIENCE}.`;

/** Title-case form for <title> and schema.org jobTitle. */
export const IDENTITY_ROLE_TITLE = 'Experimental Psychological Horror Film Composer';

/** The homepage H1, split so the accent line can be set in italics. */
export const IDENTITY_H1_PRIMARY = IDENTITY_ROLE;
export const IDENTITY_H1_ACCENT = `for ${IDENTITY_AUDIENCE}.`;

/**
 * Craft continuation under the H1. Says what the composer does, not what the
 * search engine should think — the identity line above already did that job.
 */
export const IDENTITY_CRAFT_OPEN = 'Bowed metal, prepared strings and custom synthesis,';
export const IDENTITY_CRAFT_CLOSE = 'written to picture for features, festival shorts and hybrid form.';

/**
 * Qualification. The objective is fewer, better inquiries: a director or
 * producer should be able to tell in one line whether this studio is for them,
 * and the copy should be honest enough to send the wrong project elsewhere.
 */
export const FIT_STATEMENT_SHORT =
  'Commissions are usually independent features and shorts with a director’s point of view.';

export const FIT_STATEMENT = `${FIT_STATEMENT_SHORT} Dread tends to be structural in them rather than a jump-scare device.`;

export const NOT_FIT_STATEMENT =
  'Library-style cue requests and catalogue licences are handled through the store rather than as a commission, and every commission starts from a cut or a sequence, not a script alone.';

/**
 * The homepage meta description, assembled from the parts above so the SERP
 * snippet cannot outlive the identity. Held to 120-160 characters by
 * scripts/verify.mjs; the test asserts the range too.
 */
export const HOME_DESCRIPTION = `${IDENTITY_STATEMENT} Scores by Zazie Kanwar-Torge. Hear the showreel, then start an inquiry.`;

/** The /composer biography page's meta description. */
export const COMPOSER_DESCRIPTION = `${IDENTITY_STATEMENT} Biography, credits, palette and press for Zazie Kanwar-Torge.`;

/** The /hire-a-composer commission page's meta description lead-in. */
export const COMMISSION_DESCRIPTION_LEAD = IDENTITY_STATEMENT;
