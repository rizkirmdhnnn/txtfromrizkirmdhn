-- Existing bilingual values are converted by scripts/migrate-english.ts.
-- Keep their original values until the reviewed data migration is applied.
CREATE TABLE media_english (id TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL, size INTEGER NOT NULL, alt TEXT NOT NULL DEFAULT '""', created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')));
INSERT INTO media_english SELECT * FROM media;
DROP TABLE media;
ALTER TABLE media_english RENAME TO media;
