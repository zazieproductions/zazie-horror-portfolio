-- migrations/0002_hits.sql
-- ---------------------------------------------------------------------------
-- Zazie Productions — page-view counts.
--
-- hit.js posts one page view to /api/hit (functions/api/hit.ts), which writes
-- one row here. The point is to know which pages are looked at without asking
-- a third party and without following anybody.
--
-- Apply once, against the D1 database named in wrangler.toml (`zazie-inquiries`):
--
--   npx wrangler d1 migrations apply zazie-inquiries --remote
--
-- Locally, for a preview run:
--
--   npx wrangler d1 migrations apply zazie-inquiries --local
--
-- Column notes:
--   * Three columns, and that is the whole record: the path that was loaded,
--     the host of the page that linked to it ('' when the visitor arrived
--     directly, or when their browser sent no referrer), and when.
--   * There is deliberately no IP address, no cookie, no session and no
--     identifier of any kind, so two rows cannot be tied to one person. These
--     are counts per page, not unique visitors, and they cannot be turned into
--     a profile.
--   * referrer_host holds a host only — never the full address of the page a
--     visitor came from. The browser reduces it before sending and the
--     Function refuses anything that is not a bare host.
--   * The two indexes are the only way these rows are read: counted per page,
--     and pruned by age.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS hits (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  path          TEXT    NOT NULL,
  referrer_host TEXT    NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS hits_created_at_idx ON hits (created_at DESC);
CREATE INDEX IF NOT EXISTS hits_path_idx ON hits (path);
