# Rizki Portfolio & Personal Studio

An English-language portfolio and private CMS built with TanStack Start, Cloudflare Workers, D1, R2, and Access. The dashboard manages the profile, projects, experience, writing, certifications, media, CV, SEO, section order, and website copy.

## Local development

Node.js 22.13+; tested with Node 24. The offline content migration uses Node's SQLite API.

```sh
npm install
cp .dev.vars.example .dev.vars
npm run cf:typegen
npm run db:migrate
npm run dev
```

In another terminal:

```sh
CMS_ORIGIN=http://localhost:3000 npm run db:seed
```

The dashboard is at `/admin`, private saved-draft preview at `/preview`, and the public website at `/`. The public website shows a placeholder until the profile is published. The seed imports seven draft documents and two demo assets, without overwriting existing edits. Markdown files in `content/` are seeds, not runtime content.

Local owner access is enabled only in development builds on localhost/127.0.0.1. Deployment builds require Cloudflare Access on the admin hostname.

## Managing content

Choose a section → Add content/edit → Save draft → Preview → Publish. Saving never changes published content. Concurrent edits are rejected when the document version is stale.

The editor supports visual editing and Markdown, media images, code blocks, quotes, and links. Each document has one English title, summary, body, and set of SEO fields. Markdown import/export uses one `.md` file per document, without language metadata.

Profile & website contains global content settings and a single CV. The media library supports images up to 10 MB and PDFs up to 20 MB, with one English alt text per image. Files referenced by content or revisions cannot be permanently deleted.

Restoring a revision changes only the draft. Restoring trash does not republish content. Settings provides maintenance controls and a version 2 ZIP backup of documents, revisions, redirects, maintenance settings, Markdown, and media. Integration credentials are excluded.

There is no language switcher or AI translation integration. Visitors can use Google Translate or their browser's translation feature. Public links containing an old `lang` query redirect to the same address without that parameter.

## Validation

```sh
npm run typecheck
npm run test
npm run build
```

Integration tests use isolated Miniflare D1/R2 storage. The test environment must permit local ports. Migration tests cover publication boundaries, revisions, translations, stale data, and repeatability.

## Structure

- `src/admin/`: dashboard, editor, media, and statistics.
- `src/server/`: authentication, D1 storage, API, R2 files, and statistics.
- `src/components/public-view.tsx`: shared website and preview presentation.
- `src/lib/cms.ts`: shared data types and validation.
- `migrations/`: versioned database schema.
- `wrangler.jsonc`: preview resources and the production environment.

Public API: `GET /api/public`, `GET|HEAD /api/media/:id`. Admin endpoints under `/api/admin/*` require owner authentication and validate the origin for writes. Public server functions read only published snapshots.

## Cloudflare

Production uses Worker `rizki-portfolio` with its own database and bucket. The public domain serves published content; the dashboard uses Google sign-in through Cloudflare Access. Deployment, analytics, and recovery notes are in [the Cloudflare setup guide](docs/CLOUDFLARE-SETUP.md).

Build output is in `dist/`. Keep `.dev.vars` and build output out of Git. Vite may copy development secrets to `dist/server/.dev.vars` for local preview; do not distribute the build directory as a public archive.

Initial project summaries and the photo come from the owner's GitHub profile. Example experience, certifications, writing, and CV remain marked as demo content and should be reviewed before publication.
