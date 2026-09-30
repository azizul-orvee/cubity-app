# Changelog

Engineering history, newest first. Every AI tool and human adds an entry here after each change. The plain-language, user-facing product log lives at the bottom of `docs/APP.md` and is kept in step with this one.

## 2026-09-30 — Letterhead on every PDF page
**Type:** style
**Tool:** Claude Code
**What changed:**
- `src/lib/pdf.ts`: `buildClientStatementPdf`, `buildOutstandingSummaryPdf`, and `buildInvoicePdf` each define a local `nextPage()` that adds a page and draws `drawLetterhead` with the same title and meta line. All 9 page breaks use it (before, continuation pages had only the 5pt teal strip or nothing). The unused `height` locals were dropped
- Docs: `docs/APP.md` (PDFs section, changelog)
**Why:** User wanted the header on page 2 and later pages.
**Notes / gotchas:** Checked by inserting a 40-line invoice (`zztestpagesinv`) and a 50-entry client (`zztestpagesclient`) in `cubity_dev`, rendering both 3-page PDFs, then deleting both rows (counts back to 6 invoices / 10 clients). The contact footer is still drawn only on the last page.

## 2026-09-30 — Invoice PDF amount-due box trimmed
**Type:** style
**Tool:** Claude Code
**What changed:**
- `src/lib/pdf.ts` `buildInvoicePdf`: the top-right amount-due box no longer draws Total amount / Discount / After discount; it lists each receipt date + amount, then Paid (amount now bold). Box height is `94 + payments.length * 14` and no longer depends on the discount
- Docs: `docs/APP.md` (screen table, PDFs section, changelog)
**Why:** Those totals already appear in the block under the particulars; the user wanted no duplication.
**Notes / gotchas:** Checked by rendering `CC420-2609-C03` from the local dev server. The due statement's OUTSTANDING box is unchanged.

## 2026-09-28 — Fake-data seed for the local database
**Type:** config
**Tool:** Claude Code
**What changed:**
- `scripts/seed.mjs` + `npm run db:seed` (`node --env-file=.env`): wipes every table in `cubity_dev` and inserts 10 clients covering each status (overdue, upcoming, unscheduled, settled, credit, 90+ aging), a discount, a voided payment with its `ClientEvent`, 8 services, 6 invoices (unpaid / partial / paid, one discounted) and one invoice linked to a client and pushed to its ledger. Dates are relative to today in `Asia/Dhaka`
- Refuses to run if `DATABASE_URL` contains `neon.tech` or `VERCEL` is set
- Docs: `CLAUDE.md`, `README.md`, `docs/APP.md`, `docs/ai/PROJECT.md`, `docs/ai/STATUS.md`
**Why:** The new local database was empty, so no screen could be tested.
**Notes / gotchas:** A running dev server keeps serving cached (`unstable_cache`, 5 min) results after a reseed. Clear `.next/dev/cache/fetch-cache` or wait. All fake phone numbers are `0171100000x` / `0181100001x`.

## 2026-09-28 — Local dev database, production removed from `.env`
**Type:** config
**Tool:** Claude Code
**What changed:**
- Created local Postgres database `cubity_dev` (Homebrew `postgresql@17`) and applied all 8 migrations with `migrate deploy`
- `.env`: replaced the Neon `DATABASE_URL` / `DATABASE_URL_UNPOOLED` / `DIRECT_URL` with local `cubity_dev` URLs; `.env.example` rewritten for local setup
- `src/lib/db.ts`: throws in development if `DATABASE_URL` contains `neon.tech`
- `scripts/prisma-env.mjs`: refuses `migrate` / `push` / `studio` against a `neon.tech` URL unless `VERCEL` is set (Vercel builds still migrate production)
- `package.json`: new `db:migrate` script
- `.claude/launch.json`: `autoPort: true` (port 3000 is often taken by another project)
- Docs: `AGENTS.md`, `CLAUDE.md`, `README.md`, `docs/APP.md`, `docs/ai/PROJECT.md`, `docs/ai/STATUS.md`
**Why:** Local dev was reading and writing the live office database.
**Notes / gotchas:** Production credentials now exist only in Vercel env settings and the GitHub backup secret. The local DB starts empty. No production data was touched.

## 2026-09-28 — Project documentation initialized
**Type:** docs
**Tool:** Claude Code
**What changed:**
- Created `docs/ai/` with `PROJECT.md`, `ARCHITECTURE.md`, `STATUS.md`, `CHANGELOG.md`, `DECISIONS.md`
- Rewrote `AGENTS.md` into a cross-tool entry point: kept the auto-generated Next.js block and the database-confirmation rule, and added the project map, conventions, Hard rules (git + production DB), and Documentation rules
- `CLAUDE.md`: added a guardrail pointing at the `docs/ai/` logs next to `docs/APP.md`
**Why:** So any session or AI tool (Claude Code, Cursor, Codex, …) can pick up the project without re-explaining.
**Notes / gotchas:** No code or database changes. State at this point: `main` at `11fc881`, clean tree. History reconstructed from git:
- 2026-09-16: first version of Receivables (SQLite) → Neon Postgres on Vercel; letterhead due-statement PDFs; Android WebView APK; workspace hub with receivables moved under `/receivables`; bKash/bank payment card; promised amounts
- 2026-09-18/19: accountant/engineer role gate; Cursor rules and the add-product skill
- 2026-09-25: Invoice maker (typed IDs, paid seals, PDF); iOS wrapper; cached reads + pool of 5; WhatsApp simplification
- 2026-09-26: dated invoice receipts; nightly DB backup Action
- 2026-09-27: discounts on invoices and clients; derived paid total; invoice↔ledger bridge; create client from invoice; DB service catalog; voided ledger entries; motion system; optional promised date and optional third invoice-ID part; per-route loading states
