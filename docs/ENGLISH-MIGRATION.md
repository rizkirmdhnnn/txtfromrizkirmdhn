# Migrating existing content to English

The new application requires flat, English-only content. Deploy the data conversion and application together; the old application cannot read the new JSON format. This guide covers local SQLite databases and offline copies exported from D1. The migration tool never contacts a translation provider or a remote database.

## Prepare and inspect

Stop the local development server before modifying its database or copying R2 storage. For a remote cutover, pause owner edits, enable maintenance on the old application, and export the complete D1 database and R2 assets. The CMS ZIP is useful for content recovery, but is not a substitute for a full database backup.

Use Node 22.13+ (Node 24 recommended). Locate local databases under `.wrangler/state/v3/d1/miniflare-D1DatabaseObject/`; exclude `metadata.sqlite`. Inspect the intended database explicitly:

```sh
npm run content:migrate-english -- \
  --db /absolute/path/database.sqlite \
  --plan /private/path/english-plan.json
```

Inspection reads the database and writes a private JSON plan. It covers all drafts, published versions, trashed documents, revisions, media alt text, and maintenance settings. Existing nonempty English fields take precedence. The tool preserves document IDs, slugs, versions, publication status, revision relationships, redirects, and original assets. It removes the obsolete AI settings row only when applying the migration.

If English text is missing, inspection exits with status 1 and creates `english-plan.json.translations.json`. Translate each `source` into `english`, preserve code, Markdown, URLs, names and facts, and set `reviewed: true` after checking it. Identical source text is translated once. A `cv` item requires an English PDF uploaded to the existing media library; set `english` to that PDF's `/api/media/<id>` URL. Do not relabel an Indonesian PDF as English.

Review existing English CVs too. The former `cv-demo.pdf` was bilingual; the repository now supplies an English-only demo. For existing installations, upload the new PDF under a new media ID and select it in the old English CV field before creating the final migration plan. Retain the original file for rollback.

```sh
npm run content:migrate-english -- \
  --db /absolute/path/database.sqlite \
  --plan /private/path/english-plan.json \
  --translations /private/path/english-plan.json.translations.json
```

The regenerated plan must report zero unresolved items. Review its `changes`. Do not edit the generated changes manually: application recomputes them from the database and reviewed translations. Plans can contain private drafts and legacy encrypted settings; keep them out of Git.

## Apply locally or to an offline copy

```sh
npm run content:migrate-english -- \
  --db /absolute/path/database.sqlite \
  --plan /private/path/english-plan.json \
  --apply \
  --backup /private/path/new-backup-directory \
  --assets /absolute/path/to/r2-storage
```

The backup directory must not already exist and must be outside the asset directory. For local Miniflare, use `.wrangler/state/v3/r2` as the asset directory. Application creates a consistent `database.sqlite` backup and copies the assets before writing. The database fingerprint is checked again inside the write transaction; changes since inspection abort the entire migration. Missing translations, invalid content, missing referenced media, or altered plan changes also abort it. Inspecting and applying an already migrated database produces zero changes.

Run `npm run db:migrate` for the configured local database to apply schema migration `0003_english_media.sql`, which changes the default for new media alt text. It intentionally leaves old JSON conversion to the reviewed tool. Then start the new application and validate the public site, admin editor, preview, CV, maintenance, and old `?lang=` links.

## Remote cutover and rollback

Remote changes are a separate deployment step. Convert an offline copy of the D1 export, validate it with the new application and copied media, and import the converted database into a new D1 database for the cutover. Keep owner edits paused from the final export through switching the Worker binding and deploying the new application; otherwise re-export and re-review the plan. Apply all schema migrations to the new database. Preserve media object IDs when copying R2; do not delete the original database or bucket.

Verify public pages and CV, owner login, draft/preview/publish boundaries, English maintenance messages, redirects, and the version 2 ZIP backup before reopening traffic. Check Workers Logs for 5xx responses. The tool preserves the maintenance enabled flag, so disabling maintenance after validation is an explicit step.

For rollback, switch back to the previous Worker version and its original database and assets together. Locally, stop the server and restore `database.sqlite` plus the backed-up R2 directory to their original locations before starting the old code. Do not restore a database over an active SQLite connection; handle its WAL/SHM sidecars as part of the stopped-server restore. Keep the original AI encryption secret available until the old release is no longer needed.
