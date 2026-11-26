# vibecoded.plugins

A free platform to upload and discover **vibe coded** audio plugins (VST3, AU and CLAP) for your DAW.

- **Upload** a `.zip` with your plugin bundles plus name, tagline, description, category, OS, DAWs it was tested in, tags, version, the AI tool you used, a source link and a screenshot. No account needed.
- **Browse** with search, filters (type, format, OS, DAW, tag) and New / Popular sorting.
- **Plugin pages** with download, file size, SHA-256, a list of bundles inside the zip, and a Report button.

## Safety

Plugins are executable code, so the site is careful about what it accepts:

- Only `.zip` files up to 100 MB, checked by magic bytes, not just the extension.
- The zip is opened (never extracted) on upload. It must contain a `.vst3`, `.component` or `.clap` bundle, and the **formats shown on the site are detected from the zip**, not typed in by the uploader. Zips with `../` or absolute paths are rejected.
- Screenshots must really be PNG, JPG, WebP or GIF (checked by magic bytes), max 5 MB.
- Uploaders must accept an agreement (their work, free, no malware). Every download shows a "not reviewed, scan it" notice, and `/guidelines` explains safe use.
- Reports: one per person per plugin. **3 reports hide a plugin automatically** until someone reviews it.
- Rate limits: 5 uploads and 10 reports per IP per hour (in memory, per server).
- Each upload gets a secret manage link (`/p/<slug>/manage#<token>`). The token is in the URL hash so it never hits server logs, and only its SHA-256 is stored.

## Stack

- [Next.js 16](https://nextjs.org) (App Router, Cache Components), React 19, TypeScript, Tailwind CSS 4
- SQLite through Node's built-in `node:sqlite` (Node 22.13+), no native modules
- Files on local disk under `data/files/`, behind `src/lib/storage.ts`. Swap its three functions for an S3 / Cloudflare R2 client to move files off the server.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
npm run seed         # optional: adds 6 demo plugins (placeholder zips) to the running dev server
```

Data lives in `./data` (set `DATA_DIR` to move it). Delete that folder to start fresh.

## Database migrations

The schema lives in numbered files under `src/lib/migrations/` (`001_initial.ts`, …). On startup `src/lib/db.ts` runs any that haven't been applied yet, each in its own transaction, and records them in the `schema_migrations` table.

To change the schema, add `NNN_short_name.ts` with the next id, list it in `src/lib/migrations/index.ts`, and never edit a migration that has already shipped.

## Tests and CI

```bash
npm run lint
npm run typecheck    # next typegen + tsc
npm test             # unit tests (Vitest): zip/image checks, migrations, upload/report/delete API routes
npm run test:e2e     # Playwright: builds the app, starts it on :3100 with a throwaway data dir, then uploads, searches, reports and deletes a plugin
```

The first e2e run needs a browser: `npx playwright install chromium`. GitHub Actions (`.github/workflows/ci.yml`) runs all of these plus `next build` on every pull request.

## Deploying

Needs a host with a persistent disk for `data/` (a VPS, Fly.io volume, Railway volume…), or swap storage to R2/S3 and SQLite to a hosted database first. If the app sits behind a proxy, make sure it sets `X-Forwarded-For`, since rate limits key on it.

## Project layout

```
src/app/page.tsx                  browse + search + filters
src/app/upload/                   upload page
src/app/p/[slug]/                 plugin page, manage (delete) page
src/app/guidelines/               safety & rules
src/app/api/plugins/              upload (POST), delete (DELETE), download, report
src/app/api/screenshots/[key]/    screenshot files
src/lib/inspect.ts                zip + image checks
src/lib/db.ts, plugins.ts         database connection and queries
src/lib/migrate.ts, migrations/   schema migrations
test/unit/, e2e/                  Vitest unit tests, Playwright end-to-end tests
src/lib/storage.ts                file storage
```

## Ideas for next

Accounts and editing, new versions of a plugin, an admin review queue for reported plugins, virus scanning (e.g. ClamAV) on upload, likes / comments, audio demos.
