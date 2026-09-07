# Rizki Portfolio & Personal Studio

An English-language portfolio and private CMS built with TanStack Start, Cloudflare Workers, D1, R2, and Access. The dashboard manages the profile, projects, experience, writing, certifications, setup (gear and tools), a photo gallery, media, CV, SEO, section order, and website copy.

## Local development

Node.js 22.13+; tested with Node 24. The offline content migration uses Node's SQLite API.

```sh
npm install
cp .dev.vars.example .dev.vars
npm run cf:typegen
npm run db:migrate
npm run dev
```

The dashboard is at `/admin`, private saved-draft preview at `/preview`, and the public website at `/`. A freshly migrated database is empty, so the public website shows a placeholder until you create a profile in the dashboard and publish it. There is no seed step: all content lives in D1 and is authored through `/admin`.

Local owner access is enabled only in development builds on localhost/127.0.0.1. Deployment builds require Cloudflare Access on the admin hostname.

## Managing content

Choose a section → Add content/edit → Save draft → Preview → Publish. Saving never changes published content. Concurrent edits are rejected when the document version is stale.

The editor supports visual editing and Markdown, media images, code blocks, quotes, and links. Each document has one English title, summary, body, and set of SEO fields. Markdown import/export uses one `.md` file per document, without language metadata.

Profile & website contains global content settings and a single CV. The media library supports images up to 10 MB and PDFs up to 20 MB, with one English alt text per image. Photos larger than 2400 px or 1.5 MB are resized to WebP in the browser before upload. Files referenced by content or revisions cannot be permanently deleted.

Setup and Gallery are managed on one page each instead of the full editor. Every gear item or photo is still one document with the usual draft and published snapshots, but edits save automatically and each row has its own Publish button; "Publish all" appears when more than one row has unpublished changes. Gallery: "Add photos" uploads and creates one draft per photo, each with a title, description, and link; photos open in a lightbox on the website. Setup: "Add item" creates a row with a group, name, description, and link, rendered publicly as a spec sheet grouped by category; the desk photo and intro at the top of that page live in the profile document and have their own Publish button. Both tabs stay hidden on the website until they are enabled under Section order & visibility in Profile & website and the profile is published.

Restoring a revision changes only the draft. Restoring trash does not republish content. Settings provides maintenance controls and a version 2 ZIP backup of documents, revisions, redirects, maintenance settings, Markdown, and media. Integration credentials are excluded.

There is no language switcher or AI translation integration. Visitors can use Google Translate or their browser's translation feature. Public links containing an old `lang` query redirect to the same address without that parameter.

## Validation

```sh
npm run typecheck
npm run test
npm run build
```

Integration tests use isolated Miniflare D1/R2 storage, applying the files in `migrations/` in order. The test environment must permit local ports. Coverage spans publication boundaries, revisions, owner authentication, media protection, stale data, and maintenance mode.

## Structure

- `src/admin/`: dashboard, editor, media, and statistics.
- `src/server/`: authentication, D1 storage, API, R2 files, and statistics.
- `src/components/public-view.tsx`: shared website and preview presentation.
- `src/lib/cms.ts`: shared data types and validation.
- `migrations/`: versioned database schema.
- `wrangler.jsonc`: preview resources and the production environment.

Public API: `GET /api/public`, `GET|HEAD /api/media/:id`, `GET /og.png`, `GET /og/:slug.png`. The two `og` routes render 1200×630 PNG share cards on demand from published content and are cached for one hour; documents with a cover image keep using that image instead. Admin endpoints under `/api/admin/*` require owner authentication and validate the origin for writes. Public server functions read only published snapshots.

## Cloudflare

Production uses Worker `rizki-portfolio` with its own database and bucket. The public domain serves published content; the dashboard uses Google sign-in through Cloudflare Access. Deployment, analytics, and recovery notes are in [the Cloudflare setup guide](docs/CLOUDFLARE-SETUP.md).

Build output is in `dist/`. Keep `.dev.vars` and build output out of Git. Vite may copy development secrets to `dist/server/.dev.vars` for local preview; do not distribute the build directory as a public archive.
