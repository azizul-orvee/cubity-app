# Cubity Receivables

Internal app for **Cubity Engineering & Construction Company** to track money clients still owe: dues from site visits, partial payments, promised pay dates, and printable statements.

Currency is shown as **Tk** (Bangladeshi Taka). Data is stored locally in SQLite (`prisma/dev.db`).

## Run locally

```bash
npm install
npx prisma db push
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
| `/` Dashboard | Company totals, aging, overdue list, upcoming promised payments, largest open balances |
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

- **Total to collect** and how many clients still owe
- **Overdue** — promised date already passed
- **Promised soon** — promised dates in the next 14 days
- **Collected this month** (with billed this month as context)
- Aging of outstanding: current, 1–30, 31–60, 61–90, 90+ days (from original due date, oldest dues first)
- Overdue follow-up list, upcoming promises, largest open balances

### PDFs

- Per-client **due statement**: Cubity logo, billed / paid / outstanding, full ledger with dates and notes, remaining promised date
- Company **outstanding receivables** list of everyone who still owes money

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

Prisma + SQLite:

- `Client` — profile fields + `nextPromisedDate`
- `LedgerEntry` — `DUE` or `PAYMENT`, amount in poisha (Tk × 100), date, method, note, promised date snapshot

The live database file is gitignored. Schema lives in `prisma/schema.prisma`.

## Agent rules

Cursor always applies:

- Update this file whenever the app changes
- Never `git commit` or `git push` unless you confirm in chat

## Changelog

- 2026-09-16 — Wrote this product doc and added Cursor rules so future changes stay documented and git commit/push wait for confirmation.
- 2026-09-16 — First version of Cubity Receivables: clients, site-visit dues, partial payments, promised dates, dashboard totals, aging, overdue/upcoming lists, branded PDFs, call/WhatsApp, and local SQLite storage.
