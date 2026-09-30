# Decisions

Why things are the way they are. Newest first. Reconstructed from git history and `docs/APP.md` on 2026-09-28. The product changelog in `docs/APP.md` has the user-facing side of each one.

## 2026-09-27 — Every route gets a `loading.tsx`; seal only after a delay
**Context:** On a slow connection, tapping a link left the old screen up until the server answered, and a full-screen seal flashed on every tap.
**Decision:** Every route has a `loading.tsx` (skeletons in `src/components/screen-skeletons.tsx`, the seal on four record screens). `RouteStamp` waits `SHOW_DELAY_MS` before showing, and the seal loops while the wait continues.
**Consequences:** Adding a route without `loading.tsx` brings the old behavior back. An in-page `<Suspense>` must reuse the same skeleton with `header={false}` to avoid flicker.

## 2026-09-27 — Promised date is optional
**Context:** Clients often leave without naming a day, and a required date blocked saving.
**Decision:** A blank `promisedDate` is allowed. The client is "unscheduled" (not overdue or upcoming), and the money is counted under `mix.later`. A promised amount is stored only alongside a date.
**Consequences:** Any queue or status logic must handle a null date.

## 2026-09-27 — Invoice maker stays open, but the receivables bridge is accountant-only
**Context:** Anyone in the office should be able to write a bill, but a stranger or an engineer must never change a balance.
**Decision:** No role gate on invoices. `invoice-ledger-actions.ts`, the `/client` and `/ledger` screens, and the `clientId` field in `saveInvoice` all require the accountant. `invoice-actions.ts` never writes `Client` or `LedgerEntry`.
**Consequences:** Keep that split when adding any invoice feature that touches receivables.

## 2026-09-27 — Ledger entries are voided, never deleted
**Context:** Deleting money lines lost the audit trail.
**Decision:** Set `voidedAt`/`voidReason`, record a `ClientEvent`, and exclude the line from totals through `activeEntries()`.
**Consequences:** New computations over entries must filter through `activeEntries()`.

## 2026-09-27 — Invoice paid total is derived from receipts
**Context:** A stored paid column drifted from the receipt rows.
**Decision:** Remove the stored column and use `sumPayments()` everywhere (screen, PDF, filename, seal).
**Alternatives considered:** Keeping it in sync with triggers or in code was rejected as fragile.

## 2026-09-27 — Service catalog moved from localStorage to Postgres
**Context:** Each phone had its own service list.
**Decision:** A shared `Service` table (archive instead of delete), with a one-time import offer for any leftover localStorage list (`src/lib/invoice-catalog.ts`). `InvoiceLine` snapshots the name and amount.

## 2026-09-25 — Cached reads with tag invalidation; pool of 5
**Context:** Screens were slow because every read hit Neon.
**Decision:** `unstable_cache` via `cachedQuery()` with `db:*` tags and a 300s revalidate. Every write calls the `revalidate*` helpers. Balance checks inside actions bypass the cache. The Prisma pool went from 1 to 5.
**Consequences:** A missed invalidation shows stale rows. Edits made outside the app appear within 5 minutes.

## 2026-09-25 — Invoice ID is typed by the user, not auto-numbered
**Context:** The office has its own numbering (`CC420-2609-C01`).
**Decision:** A unique typed ID in three boxes (the third is optional since 2026-09-27). The middle segment defaults to the year and month, and the ID names the PDF file.

## 2026-09-18 — Accountant password in code, role in a cookie
**Context:** One office with one shared password, and no need for user accounts.
**Decision:** The password is timing-safe compared in `src/lib/workspace-role.ts`, and an httpOnly sha256 role cookie lasts about 400 days. The engineer role is view-only.
**Alternatives considered:** An env var or real auth was declined by the owner. Don't move the password to env or print it.

## 2026-09-16 — Neon Postgres + Vercel; mobile via WebView wrappers
**Context:** SQLite can't run on Vercel, and the office uses phones.
**Decision:** Neon Postgres (`DATABASE_URL` + `DATABASE_URL_UNPOOLED`, mapped by `scripts/prisma-env.mjs`). The Android/iOS apps are thin WebViews of the live URL, so deploys reach the phones without new builds.
**Consequences:** Local dev shares the production DB (see the Hard rules in `AGENTS.md`).

## 2026-09-16 — Money as integer poisha; dates stored at 12:00Z
**Decision:** Amounts are integer poisha (Tk × 100). Invoice amounts and all discounts are whole Tk. Dates are parsed in `Asia/Dhaka` and stored at `T12:00:00Z` so a timezone shift can't move the day.
