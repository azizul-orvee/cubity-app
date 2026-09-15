# Cubity Receivables

Internal app for **Cubity Engineering & Construction Company** to track money clients still owe: dues from site visits, partial payments, promised pay dates, and printable statements.

**Office:** Manru Shopping City, Office 243, 1st Floor, Chowhatta, Sylhet  
**Phones:** 01973-914236, 01711-331406, 01782-161432  
**Email:** contact.cubity@gmail.com

Currency is shown as **Tk** (Bangladeshi Taka). Data lives in **Neon Postgres**. The UI is **mobile-first** (thumb-zone bottom nav, large tap targets, hero money cards).

## Run locally

Copy `.env.example` to `.env` and paste Neon `DATABASE_URL` (pooled) plus `DATABASE_URL_UNPOOLED` (direct). Then:

```bash
npm install
npx prisma migrate deploy
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or the port Next.js prints if 3000 is busy).

Name and phone are required to create a client. Address, email, company, site/project, and notes are optional.

## Core story

1. Site visit: client was supposed to pay Tk 10,000, paid Tk 3,000, promised the remaining Tk 7,000 for Saturday.
2. Log that as a due of 10,000, payment of 3,000, remaining 7,000, promised date = that Saturday.
3. On Saturday they pay Tk 5,000 and keep Tk 2,000 due for another day.
4. Log a payment of 5,000 and a new promised date for the leftover 2,000.
5. Dashboard total outstanding drops as money comes in. The client PDF lists every due, every payment, dates, and what is still pending.

## Screens

| Where | What it does |
| --- | --- |
| `/` Dashboard | Visual cash summary: hero total, rings, donut mix, 6-month billed vs collected line, aging capsule, largest balances, overdue/upcoming queues, office stamp |
| `/clients` | Search and filter clients (all / with dues / overdue / settled) |
| `/clients/new` | Create a client profile |
| `/clients/[id]` | Ledger, outstanding, promised date, call/WhatsApp, PDF, delete |
| `/clients/[id]/edit` | Edit profile |
| `/clients/[id]/due` | Add a due / site visit (billed + paid now + promised date) |
| `/clients/[id]/pay` | Log a payment (partial allowed; new promised date if anything remains) |
| `/clients/[id]/statement` | Download that client's due statement PDF |
| `/reports/outstanding` | Download a company-wide outstanding PDF |

## Features

### Client profiles

- Required: name, phone
- Optional: organization, email, address, current site/project, notes
- Call (`tel:`) and WhatsApp links on the profile (Bangladesh `01…` numbers are sent as `880…`)

### Dues and payments

- Add what became due and how much was collected on the spot
- Remaining amount is calculated live
- Promised date is required whenever money is still outstanding after the save
- Later partial payments update the running balance and the next promised date
- Overpayment is allowed and shown as advance/credit
- Payment methods: cash, bank transfer, bKash, Nagad, Rocket, cheque, other
- Ledger shows a running balance; entries can be deleted
- Promised date can be changed on the client page without logging money

### Dashboard

Mobile-first visual summary (not a table dump):

- Teal **hero card** with total to collect (the one number that matters)
- Three **rings**: overdue share, promised-soon share, collected vs billed this month
- **Donut** of outstanding mix: overdue / promised soon / later
- **Line chart**: billed vs collected over the last 6 months
- **Aging capsule** in color (current → 90+ days)
- Horizontal bars for largest open balances
- Overdue and upcoming queues
- Cubity office stamp (Sylhet address, three phones, email)

Bottom navigation on phones: Home, Clients, company PDF, Add client (center plus).

### PDFs

- Per-client **due statement**: letterhead with logo on the left and two-line company name, title, and issue date on the right; no header address. Outstanding panel with billed/paid/promised, a gap before the ledger, **Pending** column, and outstanding amounts in red. Footer uses location, phone, and email icons.
- Company **outstanding receivables** list with office address and phones

### Extra (beyond the original request)

These exist because construction collections usually fail on follow-up, not on the first visit:

- Overdue and upcoming-promise queues
- Aging buckets so old money is obvious
- Call / WhatsApp from the profile
- Site/project on the client
- Payment method tracking
- Company-wide PDF
- Search and status filters
- Credit if a client pays more than they owe

## Data

Prisma + **Neon Postgres** in production (SQLite only worked on this machine):

- `Client` — profile fields + `nextPromisedDate`
- `LedgerEntry` — `DUE` or `PAYMENT`, amount in poisha (Tk × 100), date, method, note, promised date snapshot

Schema: `prisma/schema.prisma`. Migrations: `prisma/migrations/`. Env template: `.env.example` (`DATABASE_URL` pooled, `DATABASE_URL_UNPOOLED` direct).

## Deploy on Vercel + Neon

1. Repo is on GitHub: `azizul-orvee/cubity-app`. Vercel should deploy on push.
2. In the Vercel project: **Storage → Neon** (or Marketplace → Neon). Create a database. That injects `DATABASE_URL` and `DATABASE_URL_UNPOOLED`.
3. You do **not** need a separate `DIRECT_URL` on Vercel. Install/build map Neon’s unpooled URL into Prisma’s `DIRECT_URL` automatically.
4. Build runs `prisma generate` then `prisma migrate deploy` then `next build`, which creates tables on Neon.
5. Open the `*.vercel.app` URL.

Local: copy `.env.example` to `.env` / `.env.local` and paste your Neon URLs. `npm run dev` then uses the same cloud database.

## Agent rules

Cursor always applies:

- Update this file whenever the app changes
- Never `git commit` or `git push` unless you confirm in chat

## Changelog

- 2026-09-16 — Clipped the PDF letterhead logo to a circle so the square frame around the JPEG no longer shows.
- 2026-09-16 — Moved the due-statement header company name, title, and issue date to the right, leaving the logo on the left.
- 2026-09-16 — Restyled the client due-statement PDF: logo-only header on the left, company name plus a smaller title on the right, no header address, taller outstanding box so the promised date no longer clips, Balance renamed to Pending, and outstanding amounts in red. Footer address is centered and larger.
- 2026-09-16 — Pointed Prisma at Neon’s `DATABASE_URL_UNPOOLED` (instead of a custom `DIRECT_URL`) so Vercel builds succeed with the env vars Neon already injects.
- 2026-09-16 — Switched Prisma from SQLite to Neon Postgres (`DATABASE_URL` + `DIRECT_URL`) so Vercel builds can run `prisma migrate deploy`.
- 2026-09-16 — Documented how to deploy on Vercel with Neon Postgres (SQLite cannot run on Vercel).
- 2026-09-16 — Rebuilt the home summary with colorful rings, donut, 6-month line chart, aging capsule, and largest-balance bars; made the app mobile-first (bottom nav, larger tap targets, hero money cards). Put real Cubity Sylhet office, phones, and email on the dashboard and PDFs, and removed the demo client.
- 2026-09-16 — Wrote this product doc and added Cursor rules so future changes stay documented and git commit/push wait for confirmation.
- 2026-09-16 — First version of Cubity Receivables: clients, site-visit dues, partial payments, promised dates, dashboard totals, aging, overdue/upcoming lists, branded PDFs, call/WhatsApp, and local SQLite storage.
