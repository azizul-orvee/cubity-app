# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

**Cubity** is the internal workspace of **Cubity Engineering & Construction Company** — an architecture/engineering design firm in Chowhatta, Sylhet, Bangladesh. One small office uses it on phones. It is not a multi-tenant SaaS: there is exactly one company, one set of clients, and no user accounts beyond a single shared accountant password.

Two live products:

- **Receivables** — who owes the firm money, what they paid, what they promised to pay next, and a printable due statement.
- **Invoice maker** — write a Cubity invoice for design services, record installments against it, download the PDF.

The business story the receivables app was built around (worth keeping in mind when changing ledger logic):

> An engineer visits a site. The client was supposed to pay Tk 10,000, hands over Tk 3,000, and promises the remaining Tk 7,000 "on Saturday" — or promises only Tk 3,000 of it. Saturday comes, they pay Tk 5,000, and Tk 2,000 rolls to another day. Collections here fail on **follow-up**, not on the first visit, so promised dates, promised installment amounts, overdue queues, and aging buckets are the point of the product — not accounting purity.

Live at https://cubity-app.vercel.app. Phones mostly open it through the Android/iOS WebView wrappers, which load that same URL.

Currency is always **Tk** (Bangladeshi Taka) — never `$` or `BDT`. Dates are `Asia/Dhaka`. Copy is plain, short, and non-accountant ("still due", "promised", "log payment"), not invoice-industry jargon.

## Guardrails (from `.cursor/rules/`)

- **Live database.** `.env` points at the production Neon database, so any write from this machine changes live data. `npm run build` runs `prisma migrate deploy` before `next build`, so **do not run `npm run build` locally** without the user's OK. Type-check with `npx tsc --noEmit` instead. `npm run db:push` and `db:studio` edits also count as writes. `prisma generate` is safe.
- **Git.** Only run `git commit` or `git push` (including `--amend`) when the user asks for it in the current message.
- **Docs.** `docs/APP.md` is the product source of truth: screens, features, data, deploy, and the mobile wrappers. After any user-visible or data-model change, update the matching section in the same turn and add a changelog entry at the top (`- YYYY-MM-DD — summary.`). Don't create new doc files for small changes.
- **Secret.** The accountant password lives in code (`src/lib/workspace-role.ts`). Don't move it to env, don't print it in docs, chat, or commit messages.

## Commands

```bash
npm run dev          # next dev (uses the live Neon DB from .env)
npm run lint         # eslint (flat config, next core-web-vitals + typescript)
npx tsc --noEmit     # type-check without building/migrating
```

There is no test suite. Verification is `npx tsc --noEmit` + `npm run lint`, plus reading the screen.

Prisma commands go through `scripts/prisma-env.mjs` (`generate | migrate | push | studio`). It maps Vercel/Neon env names (`POSTGRES_*`, `DATABASE_URL_UNPOOLED`, `DIRECT_URL`) onto the `DATABASE_URL` and `DATABASE_URL_UNPOOLED` names that the schema expects. For a schema change, hand-write a new folder under `prisma/migrations/` (`YYYYMMDDHHMMSS_name/migration.sql`, matching the existing ones). The Vercel build applies it with `migrate deploy`.

A GitHub Action (`.github/workflows/db-backup.yml`) `pg_dump`s Neon nightly at 3 AM Sylhet time and keeps 90 days of artifacts. Read-only.

## Architecture

Next.js 16 App Router, React 19, Prisma 6 on Neon Postgres, Tailwind 4 with shadcn/ui (`src/components/ui`), zod 4, pdf-lib, date-fns, lucide-react. Deployed on Vercel. `android/` and `ios/` are thin WebView wrappers that load the live site, so most changes don't need a new APK or app build (see `docs/APP.md`).

**Workspace hub, not a single app.** `/` (`src/app/page.tsx`) shows product cards. Each product owns `src/app/<slug>/`:

- `receivables/` — dues, payments, promises, dashboard, PDFs. Its layout is `force-dynamic` with `preferredRegion = "sin1"` (next to Neon), and it wraps pages in `AppShell`, or the role picker when there's no role cookie.
- `invoices/` — the invoice maker, with `InvoiceShell` chrome and **no role gate**: anyone who opens the hub card can create, edit, and delete invoices. Everything that touches receivables *is* accountant-gated: both bridge screens (`/invoices/[id]/client`, `/ledger`), all three actions in `invoice-ledger-actions.ts`, and the `clientId` field inside `saveInvoice` (`readClientLink` ignores it unless the caller is the accountant, so a tampered form can't relink a bill). Keep it that way: `invoice-actions.ts` must never write `Client` or `LedgerEntry`.
- Hub-style screens use `SiteChrome`. To add a product, follow `.cursor/skills/add-cubity-product/SKILL.md`: routes helper, folder, hub card, docs.

**Paths:** every link and redirect goes through the helpers in `src/lib/routes.ts` (`receivables.*`, `invoices.*`). Never hard-code `/receivables/...` or `/invoices/...`. Old `/clients` and `/reports/outstanding` URLs redirect through `next.config.ts`.

### Screen map

| Route | What it is |
| --- | --- |
| `/` | Hub cards. Receivables card opens the role popup when there's no cookie |
| `/receivables` | Dashboard: hero total to collect, three rings, donut mix, 6-month billed-vs-collected line, aging capsule, largest balances, overdue/upcoming queues, office stamp |
| `/receivables/clients` | Search + filter (all / dues / overdue / settled) |
| `/receivables/clients/new`, `/[id]/edit` | Client form. Name + phone required; email, address, company, site, notes optional |
| `/receivables/clients/[id]` | Ledger with running balance, outstanding, next promise, call/WhatsApp, PDF, and (accountant) Edit / Discount / Add due / Log payment |
| `/receivables/clients/[id]/due` | "Site visit": what became due + what was collected on the spot, in one form |
| `/receivables/clients/[id]/pay` | Log a payment |
| `/receivables/clients/[id]/discount` | Set or remove the account discount |
| `/receivables/clients/[id]/statement` | `route.ts` → client due-statement PDF |
| `/receivables/settings` | bKash + bank details printed on PDFs (accountant) |
| `/receivables/reports/outstanding` | `route.ts` → company-wide outstanding PDF |
| `/invoices` | All invoices, grouped by creation day, searchable |
| `/invoices/new` | Card-based invoice form; `?from=<id>` clones an invoice (new ID, today's date, payments not copied) |
| `/invoices/[id]` | Invoice rendered like the PDF + a Payments card to add/remove receipts |
| `/invoices/[id]/edit`, `/[id]/discount` | Edit lines/client/ID; set or remove the discount. Both refuse to change the total once the bill is on a client's ledger |
| `/invoices/[id]/client` | Create a new receivables client from the invoice's own details, or pick an existing one (accountant). Unlinking is a separate button |
| `/invoices/[id]/ledger` | Put the bill on that client's ledger as a due, with a promised date (accountant) |
| `/invoices/[id]/pdf` | `route.ts` → invoice PDF |
| `/invoices/services` | The shared service catalog in Postgres (add / rename / set a usual amount / remove with undo), plus a one-time offer to import a phone's old localStorage list |

### Roles (receivables only)

`src/lib/workspace-role.ts` stores accountant or engineer in an httpOnly cookie holding a sha256 role token (`cubity_role`, ~400 days). The password is checked in code with a timing-safe compare. The accountant can write; engineer is view-only. The role is called **accountant** in the UI and in the code — keep them in step. Enforce this in **both** places:

- Hide write controls when `canEdit` is false.
- In every write server action: `const denied = await requireAccountant(); if (denied) return denied;`. Write *pages* call `await redirectUnlessAccountant(...)` instead (it redirects rather than returning an error).

`src/lib/role-actions.ts` holds enter-as-accountant / enter-as-engineer / log-out. Invoices have no equivalent — don't add a gate there unless asked.

### Data flow

- **Writes:** server actions in `src/lib/actions.ts` (receivables) and `src/lib/invoice-actions.ts`. They take `FormData`, validate with zod or small hand-rolled readers, `return { error: "..." }` on failure, and `redirect(...)` on success.
- **Reads:** `src/lib/queries.ts`, `src/lib/invoice-queries.ts`, and `src/lib/service-queries.ts`, wrapped in React `cache()` and in `cachedQuery()` from `src/lib/data-cache.ts` — `unstable_cache` tagged `db:clients`, `db:invoices`, `db:payment`, or `db:services`, `revalidate: 300`, with `reviveDates()` turning cached ISO strings back into `Date`s (the JSON cache would otherwise hand components strings).
- **Any new write must invalidate its tag.** Use `revalidateClient(id?)` / `revalidateInvoices(id?)` / `revalidateServices()` from `src/lib/revalidate.ts` rather than calling `updateTag` ad hoc — they also `revalidatePath` the affected screens. A missed tag shows stale rows on the next screen. `updateTag` only works inside a Server Action, never a route handler. A write that touches both products (linking an invoice, pushing it to a ledger, deleting a linked invoice) invalidates **both** tags.
- Balance checks inside actions read Prisma **directly**, never the cache, so a validation never fires against a 5-minute-old total.
- `src/lib/db.ts` adds `pgbouncer=true&connection_limit=5` to pooled URLs.

### Forms (client components)

The pattern in every form: `"use client"`, `useActionState` wrapping a `.bind(null, id)`-ed server action, `<SubmitButton>` (`useFormStatus`) for the pending label, live math echoed under the inputs with `formatMoney`, and `state?.error` rendered inline. Destructive actions go through shadcn `AlertDialog` (`src/components/delete-buttons.tsx`).

## Domain model

`prisma/schema.prisma`. Nothing stores a computed balance — every total is derived.

**Receivables**

- `Client` — profile fields + `discountAmount` + `nextPromisedDate` + `nextPromisedAmount`, and many `LedgerEntry`.
- `LedgerEntry` — `type` is the string `"DUE"` or `"PAYMENT"` (not an enum), `amount`, `date`, optional `method`, `note`, a snapshot of `promisedDate` / `promisedAmount`, an optional `invoiceId` when the line came from a bill, and `voidedAt` / `voidReason`.
- **The ledger is append-only.** Nothing deletes a `LedgerEntry`; `voidEntry` stamps `voidedAt` instead. A voided line stays visible (struck through on screen, marked `VOIDED` on the statement) and is excluded from every total through `activeEntries()` in `ledger.ts`. If you add a computation over entries, filter through that helper or the balance will silently include cancelled money.
- `ClientEvent` — account history that is not money: `DISCOUNT_SET`, `DISCOUNT_REMOVED`, `ENTRY_VOIDED`. Written in the same transaction as the change it records, shown as "Account history" on the client page.
- `src/lib/ledger.ts` computes everything: `runningLedger`, `totals`, `openDues` (FIFO — payments then the discount are applied oldest-due-first), `agingBucket` (current / 1–30 / 31–60 / 61–90 / 90+), `clientStatus`, `companySnapshot`, `monthlySeries`, plus `whatsappHref` (BD `01…` → `880…`) and `telHref`.
- **A promise is optional.** `recordSiteVisit`, `recordPayment`, and `addInvoiceToLedger` all accept a blank `promisedDate`, because clients often leave without naming a day. Without a date the client is neither overdue nor upcoming — `clientStatus` reports them as unscheduled and `companySnapshot` files the money under `mix.later` — but the balance still counts. A blank promised *amount* means "the whole leftover"; a smaller number means an installment. A promised amount is only stored alongside a date, and when the balance reaches zero both fields are cleared.
- Overpayment is allowed and surfaces as credit/advance.

**Invoices**

- `Invoice` — `number` is the human-typed unique ID (e.g. `CC420-2609-C01`; regex `^[A-Z0-9]+(-[A-Z0-9]+)*$`, upper-cased, ≤40 chars). The form composes it from three boxes; **the third is optional**, giving `CC420-2609` with no trailing hyphen, and `splitInvoiceId` parses two- or three-part IDs back into the boxes. The middle segment starts as `invoiceYearMonthCode` — September 2026 → `2609`. Plus client fields, `issueDate`, `discountAmount`, `notes`, and an optional `clientId` linking it to a receivables `Client`.
- `InvoiceLine` — a **snapshot** of the service name and amount, so renaming a service later never rewrites old invoices. Ordered by `sortOrder`.
- `InvoicePayment` — one receipt: amount, date, optional note. **The paid total is never stored.** `getInvoice` / `getInvoices` derive `paidAmount` with `sumPayments()`, so the screen, the PDF, the file name, and the seal cannot disagree with the receipt rows. Don't reintroduce a stored column.
- Status (`paid` / `partial` / `unpaid`) and the PDF filename come from `src/lib/invoice-queries.ts` (`sumPayments`, `invoiceBill`, `invoiceDue`, `invoicePayStatus`, `invoicePdfFilename`).
- `Service` — the shared catalog (`name` unique, optional `defaultAmount`, `sortOrder`, `archivedAt`). Removing a service archives it; `InvoiceLine` keeps its own name snapshot, so an old bill is never rewritten. `src/lib/invoice-catalog.ts` now only *reads* a phone's leftover localStorage list for the one-time import.
- **The invoice↔ledger bridge** lives in `src/lib/invoice-ledger-actions.ts`. `createClientFromInvoice` makes a `Client` out of the invoice's name/phone/address/project and links it, refusing a phone number another client already uses. `addInvoiceToLedger` writes one `DUE` for the net plus a `PAYMENT` per receipt, all carrying `invoiceId` and a `Invoice <number>` note (which is what puts the number on the due statement). A bill can only be pushed once while its entries are active, and while it is on the ledger its total is frozen — the edit and discount actions refuse to change it.
- `CompanyPayment` is a singleton row (`id: "default"`, lazily created) for the bKash and bank details printed on PDFs. `DEFAULT_PAYMENT` in `src/lib/company.ts` is the fallback.

**Discounts** exist in both products and behave the same: whole **Tk** only (no fractions, no letters), clamped by `clampDiscount()` in `src/lib/money.ts`, never more than the billed total, and removable. On an invoice, a discount is also refused if it would drop the net below what's already paid. Every screen that shows one shows billed → discount → total after discount → paid → still due.

## Money and dates

- Store amounts as integer **poisha** (Tk × 100). `src/lib/money.ts`: `parseAmountToPoisha` (receivables, accepts decimals), `formatMoney`, `clampDiscount`, `poishaToInput`. Invoice amounts and all discounts are parsed as **whole Tk** with a `/^\d+$/` check in the actions file.
- `src/lib/dates.ts` keeps everything in `Asia/Dhaka`: `todayInputValue`, `parseDateInput` (stores dates at `T12:00:00Z` so a timezone shift can't move the day), `startOfToday`, `daysFromToday`, `isDateBeforeToday`, `invoiceYearMonthCode`.
- Company address, phones, email, and payment methods come from `src/lib/company.ts` (`COMPANY`, `PAYMENT_METHODS`). Don't retype them.

## PDFs

`src/lib/pdf.ts` (~1000 lines, pdf-lib, hand-positioned) builds three documents: `buildClientStatementPdf`, `buildOutstandingSummaryPdf`, `buildInvoicePdf`. They're served from `route.ts` handlers, and every one prints the shared Cubity letterhead, contact footer, and bKash/bank payment card. Filenames are meaningful: `Azizul-Hakim-due-statement.pdf`, `Invoice-CC420-2609-C01-PartialPaid.pdf`. Paid/partial/unpaid use the seal artwork in `public/seals/`. Reuse the existing `drawText` / `drawRight` / `wrapText` / `drawPayCard` helpers and the `TEAL`/`INK`/`MUTED` palette instead of introducing new drawing code.

## UI conventions

Mobile-first: thumb-zone bottom nav, large tap targets, hero money cards, rounded `1.75rem` white cards on a teal radial-gradient background. Teal is `#128C86`.

**Motion** lives in one commented block at the end of `src/app/globals.css` and is applied with utility classes, not per-component CSS: `cb-rise` (a card or screen arriving), `cb-stagger` (children cascade, capped at 10 steps), `cb-tap` / `cb-tap-soft` (press feedback — the thing that makes the APK feel native), `cb-pop` (money figures), `cb-sweep` (bars filling), `cb-draw` (SVG strokes drawing on, paired with `pathLength={1}` and a `--cb-dash` style var), `cb-fade`, `cb-nav`, and `cb-d1`–`cb-d4` delays. Rules: animate only `transform`, `opacity`, and `stroke-dashoffset`; never animate on scroll; finish on `transform: none` so nothing stays layer-promoted; and add any new animation to the `prefers-reduced-motion` block. The shadcn `Button` already has its own `active:translate-y-px`, so don't put `cb-tap` on it. Receivables and Invoices deliberately share the same look, spacing, and wording. Dashboard charts in `src/components/charts.tsx` are hand-written SVG — there is no chart library. **Every route has a `loading.tsx`** (except the hub, which only reads a cookie). That is what lets Next commit a navigation immediately instead of holding the previous screen until the server answers, so don't add a route without one. The shared placeholders live in `src/components/screen-skeletons.tsx` (`FormSkeleton`, `ListSkeleton`, `DashboardSkeleton`); four record screens keep the Cubity seal instead (`clients`, `clients/[id]`, `invoices/[id]`, `invoices/[id]/edit`). When a page streams with its own `<Suspense>`, give the boundary the *same* skeleton with `header={false}` — a seal inside a page whose route skeleton is a sketch flickers between the two. `/receivables` renders its heading outside the boundary so the slowest query in the app doesn't block it.

`RouteStamp` + `CubityStampLoader` show the Cubity seal while a navigation is pending. It waits `SHOW_DELAY_MS` before appearing, so a fast navigation goes straight to the route's own skeleton without a full-screen flash. The seal plays one of three random reveals **once**, then loops a circling arc (`cubity-orbit`), a breathing stamp (`cubity-breathe`), and a pulsing caption, so a long wait never looks frozen — keep any new loader state looping. `RouteStamp` watches pathname *and* the query string (so filter navigations clear it) and reads `useSearchParams`, which is why it sits inside a `Suspense` boundary in the root layout.

## Checklist for a typical change

1. Read the relevant Next.js guide under `node_modules/next/dist/docs/` (per `AGENTS.md`) if touching framework behavior.
2. Use `routes.ts` helpers, `money.ts` for amounts, `company.ts` for company facts.
3. Gate receivables writes in the UI *and* in the action.
4. Invalidate the cache tag via `revalidateClient` / `revalidateInvoices`.
5. Schema change → new hand-written folder in `prisma/migrations/`; don't run it locally.
6. `npx tsc --noEmit` and `npm run lint`.
7. Update `docs/APP.md` (matching section + changelog entry) in the same turn.
8. Don't commit or push unless asked.
