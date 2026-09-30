# Architecture

For the full engineering guide (domain rules, cache tags, roles, PDFs, motion), see `CLAUDE.md`. For screens and product behavior, see `docs/APP.md`. This file is the map.

## Folder map
```
src/
├── app/
│   ├── page.tsx            ← workspace hub (product cards; Receivables card opens role popup)
│   ├── layout.tsx          ← root layout; RouteStamp inside Suspense
│   ├── globals.css         ← Tailwind + the single motion block at the end (cb-* classes)
│   ├── receivables/        ← dues app: AppShell, role gate, force-dynamic, preferredRegion sin1
│   └── invoices/           ← invoice maker: InvoiceShell, no role gate (except receivables bridge)
├── components/             ← forms (*-form.tsx), shells, charts.tsx (hand-written SVG),
│                             screen-skeletons.tsx, cubity-stamp-loader.tsx, route-stamp.tsx, ui/ (shadcn)
└── lib/
    ├── actions.ts          ← receivables server actions (accountant-gated)
    ├── invoice-actions.ts  ← invoice CRUD, never writes Client/LedgerEntry
    ├── invoice-ledger-actions.ts ← invoice↔receivables bridge (accountant-gated)
    ├── service-actions.ts  ← service catalog writes
    ├── role-actions.ts     ← enter as accountant/engineer, log out
    ├── queries.ts / invoice-queries.ts / service-queries.ts ← cached reads
    ├── data-cache.ts       ← cachedQuery(): unstable_cache + reviveDates()
    ├── revalidate.ts       ← revalidateClient / revalidateInvoices / revalidateServices
    ├── ledger.ts           ← all balance math (activeEntries, openDues FIFO, aging, snapshot)
    ├── money.ts / dates.ts ← poisha + Tk formatting; Asia/Dhaka dates
    ├── pdf.ts              ← three PDFs (statement, outstanding summary, invoice)
    ├── routes.ts           ← every path helper
    ├── company.ts          ← company facts + DEFAULT_PAYMENT
    ├── workspace-role.ts   ← role cookie + password check (secret lives here)
    └── db.ts               ← Prisma client, pooled URL params
prisma/                     ← schema.prisma + hand-written migrations
scripts/prisma-env.mjs      ← env-name mapping for Prisma CLI
android/, ios/              ← WebView wrappers of the live site
public/seals/               ← paid/partial/unpaid stamp artwork
.cursor/rules, .cursor/skills/add-cubity-product ← Cursor rules + add-a-product recipe
.github/workflows/db-backup.yml ← nightly pg_dump
```

## Pages / routes
The full route table is in `CLAUDE.md` → "Screen map" and `docs/APP.md` → "Screens". In short:
- `/receivables` (dashboard), `/receivables/clients[/new|/[id][/edit|/due|/pay|/discount|/statement]]`, `/receivables/settings`, `/receivables/reports/outstanding`
- `/invoices`, `/invoices/new[?from=id]`, `/invoices/[id][/edit|/discount|/client|/ledger|/pdf]`, `/invoices/services`
- PDF endpoints are `route.ts` handlers. Old `/clients` and `/reports/outstanding` redirect in `next.config.ts`.

## Data models (`prisma/schema.prisma`)
- `Client` has many `LedgerEntry` (`type` "DUE" | "PAYMENT", poisha, promised snapshot, optional `invoiceId`, `voidedAt`) and many `ClientEvent` (DISCOUNT_SET / DISCOUNT_REMOVED / ENTRY_VOIDED). It stores `discountAmount`, `nextPromisedDate`, and `nextPromisedAmount`.
- `Invoice` has many `InvoiceLine` (name/amount snapshot) and many `InvoicePayment`, and an optional `clientId` pointing to `Client`. The paid total is **derived**, never stored.
- `Service`: the shared catalog (archive, not delete).
- `CompanyPayment`: a singleton (`id: "default"`) holding the bKash/bank details for PDFs.
- No balances are stored anywhere; every total is computed.

## Data flow
Form (client component, `useActionState` + `SubmitButton`) → server action → role check (receivables) → validate (zod / whole-Tk regex) → balance checks read **Prisma directly** → Prisma write (often in a transaction with a `ClientEvent`) → `revalidateClient/Invoices/Services()` (updateTag + revalidatePath) → `redirect()`.
Reads: page (server component) → `queries.ts` → React `cache()` + `cachedQuery()` (tag, 300s) → `reviveDates()` → `ledger.ts` math → render.

## Integrations
| Service | Where in code | Notes |
|---|---|---|
| Neon Postgres | `src/lib/db.ts`, `prisma/` | Production only; no dev branch |
| Vercel | `next.config.ts`, route segment config | Auto-deploy from `main` |
| GitHub Actions | `.github/workflows/db-backup.yml` | Read-only nightly dump |
| WhatsApp / phone | `whatsappHref`, `telHref` in `src/lib/ledger.ts` | BD `01…` → `880…` |
