PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS documents (
 id TEXT PRIMARY KEY,
 kind TEXT NOT NULL CHECK(kind IN ('site','projects','experience','writing','about')),
 draft TEXT NOT NULL CHECK(json_valid(draft)),
 published TEXT CHECK(published IS NULL OR json_valid(published)),
 slug TEXT UNIQUE,
 version INTEGER NOT NULL DEFAULT 1,
 deleted INTEGER NOT NULL DEFAULT 0,
 updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS revisions (
 id TEXT PRIMARY KEY,
 document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
 snapshot TEXT NOT NULL CHECK(json_valid(snapshot)),
 action TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS revisions_document ON revisions(document_id, created_at);
CREATE TABLE IF NOT EXISTS redirects (slug TEXT PRIMARY KEY, document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS media (id TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL, size INTEGER NOT NULL, alt TEXT NOT NULL DEFAULT '{"id":"","en":""}', created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')));
CREATE TABLE IF NOT EXISTS integrations (id TEXT PRIMARY KEY, value TEXT NOT NULL CHECK(json_valid(value)));
CREATE TABLE IF NOT EXISTS analytics_cache (id TEXT PRIMARY KEY, value TEXT NOT NULL, expires INTEGER NOT NULL);
