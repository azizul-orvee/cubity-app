# Status — last updated 2026-09-30

## Current state
Both products are live and in daily use at https://cubity-app.vercel.app: **Receivables** (dashboard, clients, dues, payments, promises, voiding, discounts, PDFs) and **Invoice maker** (invoices, receipts, discounts, shared service catalog, PDF, and a bridge that puts a bill on a client's ledger). The working tree was clean on `main` at `11fc881` when these docs were written.

## ✅ Recently done
- Every PDF page repeats the letterhead (2026-09-30, uncommitted)
- Invoice PDF amount-due box shows only receipt dates + bold Paid (2026-09-30, uncommitted)
- `npm run db:seed` (`scripts/seed.mjs`) fills `cubity_dev` with fake data (2026-09-28, uncommitted)
- Local dev database `cubity_dev` (Homebrew Postgres 17); production URLs removed from `.env`; Neon guards in `src/lib/db.ts` and `scripts/prisma-env.mjs` (2026-09-28, uncommitted)
- Every route has its own `loading.tsx`; the seal waits before showing and loops while waiting (`11fc881`, `5fe5089`)
- Third part of the invoice ID is optional; the promised date is optional; the role is called "accountant" again (`f91a439`)
- The receivables bridge is accountant-only everywhere; phone-first motion system (`cef68de`)
- Create a receivables client straight from an invoice (`b7cde99`)
- Derived invoice paid total, invoice↔ledger linking, DB service catalog, voided ledger entries (`5a7a1e6`)
- Project memory docs (`docs/ai/`) initialized (2026-09-28)

## 🚧 In progress
- Nothing.

## ⏭️ Next up
- TODO: confirm with user. No roadmap is recorded in the repo.

## 🐛 Known issues
- `cubity_dev` holds page-test rows (2026-09-30): invoice `TEST-LONG` (id `zztestlonginv`), client "Test Long Ledger" (`zztestlongclient`), and "Test Client 01–40" (`zztestc01`–`zztestc40`). All ids start with `zz`; `npm run db:seed` wipes them.
- Outstanding-summary PDF: page 2+ does not repeat the Client/Phone/Promised/Outstanding header row, and "Total receivable" runs into its amount.
- After `npm run db:seed` on a running dev server, clear `.next/dev/cache/fetch-cache` (or wait 5 min), because `unstable_cache` keeps the old results.
- No automated tests; verification is `npx tsc --noEmit`, `npm run lint`, and manual screens.
- `README.md` title is stale ("Cubity Receivables").
- The iOS wrapper can't be built on this Mac (no Xcode).
- `docs/APP.md` Deploy step 3 still mentions `DIRECT_URL` mapping; the schema now uses `DATABASE_URL_UNPOOLED` directly.

## ⚠️ Watch out
- Never put a Neon URL back into `.env`. Local dev is `cubity_dev` only; the code refuses `neon.tech` outside Vercel.
- Any new write must call `revalidateClient` / `revalidateInvoices` / `revalidateServices`. Writes that span both products invalidate both.
- Any new computation over ledger entries must use `activeEntries()`.
- Keep the Next.js `BEGIN/END:nextjs-agent-rules` block at the top of `AGENTS.md` intact, because `next dev` regenerates it.
