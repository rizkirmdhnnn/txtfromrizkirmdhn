# Rizki Portfolio — EmDash

Personal portfolio and writing site built with Astro 7 and [EmDash](https://github.com/emdash-cms/emdash), deployed to Cloudflare Workers with D1 and R2.

## URLs

- Production: https://txtfromrizkirmdhn.my.id
- Admin: https://txtfromrizkirmdhn.my.id/_emdash/admin
- Staging: https://rizki-portfolio-emdash-staging.rizkirmdhn.workers.dev

## Content model

Collections: `projects`, `experience`, `writing`, `about`, `setup`, `gallery`, and a single `profile` entry. Tags use the `tag` taxonomy.

The seed lives at `seed/seed.json`. A one-off converted copy of the legacy content is at `migration/seed-with-content.json`.

## Local development

```bash
npm install
npx emdash seed migration/seed-with-content.json --database ./data.db
npm run dev
```

Astro dev uses SQLite (`data.db`) and local uploads. Production builds use the Cloudflare D1/R2 bindings in `wrangler.production.jsonc`.

## Build and deploy

Staging:

```bash
cp wrangler.staging.jsonc wrangler.jsonc
NODE_ENV=production npm run build
npx wrangler deploy
cp wrangler.staging.jsonc wrangler.jsonc
```

Production:

```bash
cp wrangler.production.jsonc wrangler.jsonc
NODE_ENV=production npm run build
npx wrangler deploy
cp wrangler.staging.jsonc wrangler.jsonc
```

`wrangler.production.jsonc` contains the production route, D1/R2/KV bindings, and cron trigger. Keep `wrangler.jsonc` pointing at staging for day-to-day work.

## Migration and OG images

- `migration/build-content.mjs` converts the legacy D1 export into an EmDash seed.
- `migration/build-d1-import.mjs` creates SQL files for importing the local SQLite database into D1.
- `scripts/generate-og.mjs` pre-generates OG PNGs into `public/og-cache`; with `OG_UPLOAD=1` it also uploads them to R2.
- `docs/EMDASH-MIGRATION-PLAN.md` records the migration plan and decisions.

## Admin auth

Admin uses EmDash passkey auth. Cloudflare Access is not used for the EmDash admin.
