# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Guardrails (from `.cursor/rules/`)

- **Live database.** `.env` points at the production Neon database, so any write from this machine changes live data. `npm run build` runs `prisma migrate deploy` before `next build`, so **do not run `npm run build` locally** without the user's OK. Type-check with `npx tsc --noEmit` instead. `npm run db:push` and `db:studio` edits also count as writes. `prisma generate` is safe.
- **Git.** Only run `git commit` or `git push` (including `--amend`) when the user asks for it in the current message.
- **Docs.** `docs/APP.md` is the product source of truth: screens, features, data, deploy, and the mobile wrappers. After any user-visible or data-model change, update the matching section in the same turn and add a changelog entry at the top (`- YYYY-MM-DD — summary.`). Don't create new doc files for small changes.

## Commands

```bash
npm run dev          # next dev (uses the live Neon DB from .env)
npm run lint         # eslint (flat config, next core-web-vitals + typescript)
npx tsc --noEmit     # type-check without building/migrating
```

There is no test suite.

Prisma commands go through `scripts/prisma-env.mjs` (`generate | migrate | push | studio`). It maps Vercel/Neon env names (`POSTGRES_*`, `DATABASE_URL_UNPOOLED`, `DIRECT_URL`) onto the `DATABASE_URL` and `DATABASE_URL_UNPOOLED` names that the schema expects. For a schema change, write a new folder under `prisma/migrations/`. The Vercel build applies it with `migrate deploy`.

## Architecture

Next.js 16 App Router, React 19, Prisma 6 on Neon Postgres, Tailwind 4 with shadcn/ui (`src/components/ui`), zod, pdf-lib. It's deployed on Vercel at https://cubity-app.vercel.app. `android/` and `ios/` are thin WebView wrappers that load the live site, so most changes don't need a new APK or app build (see `docs/APP.md`).

**Workspace hub, not a single app.** `/` (`src/app/page.tsx`) shows product cards. Each product owns `src/app/<slug>/`:
- `receivables/` tracks client dues, payments, promises, a dashboard, and PDFs. Its layout is `force-dynamic` with `preferredRegion = "sin1"` (next to Neon), and it wraps pages in `AppShell`, or the role picker when there's no role cookie.
- `invoices/` is the invoice maker, with `InvoiceShell` chrome and no role gate. The service catalog lives in the browser's `localStorage` (`src/lib/invoice-catalog.ts`), not the DB.
- Hub-style screens use `SiteChrome`. To add a product, follow `.cursor/skills/add-cubity-product/SKILL.md`: routes helper, folder, hub card, and docs.

**Paths:** every link and redirect goes through the helpers in `src/lib/routes.ts` (`receivables.*`, `invoices.*`). Never hard-code `/receivables/...` or `/invoices/...`. Old `/clients` URLs redirect through `next.config.ts`.

**Roles (receivables):** `src/lib/workspace-role.ts` stores accountant or engineer in a signed httpOnly cookie. The password is checked in code. Don't move it to env, docs, or chat. Accountant can write; engineer is view-only. Enforce this in both places:
- Hide write controls when `canEdit` is false.
- In every write server action, start with `const denied = await requireAccountant(); if (denied) return denied;`, and write pages call `redirectUnlessAccountant(...)`.

**Data flow:**
- Server actions live in `src/lib/actions.ts` (receivables) and `src/lib/invoice-actions.ts`. They validate `FormData` with zod.
- Reads live in `src/lib/queries.ts` and `src/lib/invoice-queries.ts`. They're wrapped in React `cache()` and in `cachedQuery()` from `src/lib/data-cache.ts`, which is `unstable_cache` tagged `db:clients`, `db:invoices`, or `db:payment`, expires after 300s, and turns cached ISO strings back into `Date`s.
- **Any new write must call `updateTag(TAGS.<x>)`**, or the next screen shows stale rows. Balance checks inside actions read Prisma directly, not the cache.
- `src/lib/db.ts` adds `pgbouncer=true&connection_limit=5` to pooled URLs.

**Domain model:**
- `Client` has many `LedgerEntry` rows, each with `type` `"DUE"` or `"PAYMENT"`. Balances, aging buckets, status, the dashboard snapshot, and monthly series are all computed in `src/lib/ledger.ts`. Nothing stores them.
- `Client.nextPromisedDate` and `nextPromisedAmount` hold the current promise.
- `Invoice` has many `InvoiceLine` rows, plus `paidAmount`. Paid, partial, or unpaid status and the PDF filename come from `src/lib/invoice-queries.ts`.
- `CompanyPayment` is a singleton row for the bKash and bank details printed on PDFs. `DEFAULT_PAYMENT` in `src/lib/company.ts` is the fallback.

**Money and dates:**
- Store amounts as integer **poisha** (Tk × 100) and convert with `src/lib/money.ts`. Display **Tk**, never `$` or `BDT`.
- Dates use the `Asia/Dhaka` timezone (`src/lib/dates.ts`).
- Company address, phones, and payment methods come from `src/lib/company.ts`. Don't retype them.

**PDFs:** `src/lib/pdf.ts` (pdf-lib) builds the client statement, the outstanding summary, and invoices. They're served from `route.ts` handlers (`receivables/clients/[id]/statement`, `receivables/reports/outstanding`, `invoices/[id]/pdf`).

**UI:** mobile-first, with a thumb-zone bottom nav, large tap targets, and hero money cards. Receivables and Invoices share the same look.
