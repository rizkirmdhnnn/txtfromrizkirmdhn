-- Membuka kolom kind agar jenis konten baru (setup, gallery, dan berikutnya)
-- tidak membutuhkan rebuild tabel lagi. Validasi kind tetap dilakukan zod di
-- API dan saveDocument. SQLite tidak bisa mengubah CHECK, sedangkan
-- DROP TABLE documents akan meng-cascade-hapus revisions dan redirects
-- (FK ON DELETE CASCADE). Karena itu tabel anak disalin, dihapus lebih dulu,
-- dan dibuat ulang setelah tabel induk diganti.
CREATE TABLE documents_v2 (
 id TEXT PRIMARY KEY,
 kind TEXT NOT NULL,
 draft TEXT NOT NULL CHECK(json_valid(draft)),
 published TEXT CHECK(published IS NULL OR json_valid(published)),
 slug TEXT UNIQUE,
 version INTEGER NOT NULL DEFAULT 1,
 deleted INTEGER NOT NULL DEFAULT 0,
 updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 mutation TEXT
);
INSERT INTO documents_v2(id,kind,draft,published,slug,version,deleted,updated_at,mutation) SELECT id,kind,draft,published,slug,version,deleted,updated_at,mutation FROM documents;
CREATE TABLE revisions_backup AS SELECT * FROM revisions;
CREATE TABLE redirects_backup AS SELECT * FROM redirects;
DROP TABLE revisions;
DROP TABLE redirects;
DROP TABLE documents;
ALTER TABLE documents_v2 RENAME TO documents;
CREATE TABLE revisions (
 id TEXT PRIMARY KEY,
 document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
 snapshot TEXT NOT NULL CHECK(json_valid(snapshot)),
 action TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
INSERT INTO revisions(id,document_id,snapshot,action,created_at) SELECT id,document_id,snapshot,action,created_at FROM revisions_backup;
CREATE INDEX revisions_document ON revisions(document_id, created_at);
CREATE TABLE redirects (slug TEXT PRIMARY KEY, document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE);
INSERT INTO redirects(slug,document_id) SELECT slug,document_id FROM redirects_backup;
DROP TABLE revisions_backup;
DROP TABLE redirects_backup;
