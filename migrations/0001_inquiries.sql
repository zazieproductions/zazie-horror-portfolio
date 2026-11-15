-- migrations/0001_inquiries.sql
-- ---------------------------------------------------------------------------
-- Zazie Productions — inquiry capture.
--
-- The scoring inquiry form posts to /api/inquiry (functions/api/inquiry.ts),
-- which writes one row here. Before 2026-11-14 the form only built a `mailto:`
-- handoff and the site stored nothing; this table is what makes a submission
-- survive the click.
--
-- Apply once, against the D1 database named in wrangler.toml (`zazie-inquiries`):
--
--   npx wrangler d1 migrations apply zazie-inquiries --remote
--
-- Locally, for a preview run:
--
--   npx wrangler d1 migrations apply zazie-inquiries --local
--
-- Wrangler records applied migrations in the `d1_migrations` table it creates,
-- so this file runs once and is never re-applied by hand.
--
-- Column notes:
--   * minutes and cues are TEXT because the homepage form asks for scored
--     minutes in words ("e.g. 3 scored minutes"); a digits-only answer is
--     bounds-checked (1..60 minutes, 0..80 cues) in the Function before it is
--     stored, and anything else is kept as the visitor wrote it.
--   * country is the two-letter country Cloudflare reports for the request
--     (request.cf.country), not a geolocated address; user_agent is the raw
--     header, kept for abuse triage only.
--   * No index on any free-text column. One index on created_at, which is how
--     rows are read back.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS inquiries (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  name        TEXT    NOT NULL,
  email       TEXT    NOT NULL,
  project     TEXT    NOT NULL DEFAULT '',
  budget      TEXT    NOT NULL DEFAULT '',
  tone        TEXT    NOT NULL DEFAULT '',
  format      TEXT    NOT NULL DEFAULT '',
  minutes     TEXT    NOT NULL DEFAULT '',
  cues        TEXT    NOT NULL DEFAULT '',
  deadline    TEXT    NOT NULL DEFAULT '',
  complexity  TEXT    NOT NULL DEFAULT '',
  licence     TEXT    NOT NULL DEFAULT '',
  link        TEXT    NOT NULL DEFAULT '',
  notes       TEXT    NOT NULL DEFAULT '',
  user_agent  TEXT    NOT NULL DEFAULT '',
  country     TEXT    NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS inquiries_created_at_idx ON inquiries (created_at DESC);
