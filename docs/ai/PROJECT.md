# Project Overview — Cubity

## Purpose
The internal workspace of **Cubity Engineering & Construction Company**, an architecture/engineering design firm in Chowhatta, Sylhet, Bangladesh. One small office uses it, mostly on phones. It has two live products:

- **Receivables**: client dues, payments, promised dates and installments, overdue/upcoming queues, aging, and a printable due statement. Collections fail on *follow-up*, so promises and queues are the point of the product.
- **Invoice maker**: write an invoice for design services, record installments, and download the PDF. A bill can optionally be pushed onto a receivables client's ledger.

Full product description: `docs/APP.md`.

## Owner / client
Internal tool for Cubity (repo owner: azizul-orvee). It has two roles, and only in Receivables: **accountant** (writes, password checked in code) and **engineer** (view-only). The invoice maker has no role gate, except for the steps that touch receivables.

## Tech stack
| Layer | Tech |
|---|---|
| Framework | Next.js 16.3 App Router, React 19.2 (read `node_modules/next/dist/docs/`; APIs differ from older Next) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4, shadcn/ui (`src/components/ui`), lucide-react, tw-animate-css |
| Database / ORM | Neon Postgres, Prisma 6.16 |
| Validation | zod 4 plus small hand-rolled readers |
| PDFs | pdf-lib, hand-positioned (`src/lib/pdf.ts`) |
| Auth | None. A role cookie (`cubity_role`, httpOnly sha256 token) from `src/lib/workspace-role.ts` |
| Hosting | Vercel, `preferredRegion = "sin1"` for receivables (next to Neon) |
| Mobile | `android/` WebView wrapper (`dist/Cubity.apk`), `ios/` WKWebView wrapper (needs Xcode, not built on this Mac) |
| Backups | GitHub Action nightly `pg_dump`, 90-day artifacts |
| Analytics / payments | None |

## Getting started
```bash
npm install            # postinstall runs prisma generate
brew services start postgresql@17
createdb cubity_dev
cp .env.example .env   # set your macOS user in both URLs
npm run db:migrate     # applies prisma/migrations to cubity_dev
npm run db:seed        # optional: wipe cubity_dev and fill it with fake data
npm run dev
```
Local dev uses its own empty Postgres database (`cubity_dev`), never production. Production Neon URLs live only in Vercel. `src/lib/db.ts` throws in development and `scripts/prisma-env.mjs` refuses non-`generate` commands if a `neon.tech` URL shows up outside Vercel.

## Scripts
| Command | What it does | Safe locally? |
|---|---|---|
| `npm run dev` | `next dev` against local `cubity_dev` | Yes |
| `npm run db:seed` | `scripts/seed.mjs`: wipes `cubity_dev` and inserts fake clients, ledger rows, invoices, services | Yes (refuses Neon) |
| `npm run db:migrate` | `prisma migrate deploy` via `scripts/prisma-env.mjs` | Yes (local DB) |
| `npm run lint` | ESLint (flat config, next core-web-vitals + TS) | Yes |
| `npx tsc --noEmit` | Type-check | Yes |
| `npm run build` | `prisma generate` → `prisma migrate deploy` → `next build` | Yes (migrates local DB); prefer `tsc` for checks |
| `npm run db:push` / `db:studio` | Prisma push / Studio via `scripts/prisma-env.mjs` | Yes (local DB); prefer migrations over `push` |
| `node scripts/prisma-env.mjs generate` | `prisma generate` with env mapping | Yes |

`scripts/prisma-env.mjs` maps Vercel/Neon env names (`POSTGRES_*`, `DATABASE_URL_UNPOOLED`, `DIRECT_URL`) onto what `schema.prisma` expects.

## Environment variables (names only — never values)
| Name | Purpose | Where set |
|---|---|---|
| `DATABASE_URL` | Pooled URL (app runtime; `src/lib/db.ts` adds `pgbouncer=true&connection_limit=5` to Neon pooler URLs) | Vercel (Neon integration); local `.env` = `cubity_dev` |
| `DATABASE_URL_UNPOOLED` | Direct URL (migrations) | Vercel, GitHub repo secret (backup workflow); local `.env` = `cubity_dev` |
| `DIRECT_URL` | Legacy alias, mapped by `scripts/prisma-env.mjs` | unused |

The accountant password is intentionally **not** an env var (see `DECISIONS.md`).

## Deployment
- Push to `main` on GitHub `azizul-orvee/cubity-app` and Vercel auto-deploys. The build applies new `prisma/migrations/*` with `migrate deploy`.
- Schema change: hand-write `prisma/migrations/YYYYMMDDHHMMSS_name/migration.sql`, try it on `cubity_dev` with `npm run db:migrate`, and let the Vercel build apply it to production.
- Production URL: https://cubity-app.vercel.app. Both mobile wrappers load that URL, so most changes need no new APK or iOS build (only shell changes do; see `docs/APP.md` → Android APK / iPhone app).

## External accounts / dashboards
- Vercel project `cubity-app`
- Neon Postgres (connected through the Vercel Storage integration)
- GitHub Actions → "Database backup" (`.github/workflows/db-backup.yml`, 21:00 UTC = 3 AM Sylhet). The repo must stay private
- Android emulator on the owner's Mac: `Cubity_Phone` (Pixel 7)
