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

Name and phone are required to create a client. Email and address are optional. Company, site/project, and notes are only on the edit screen.

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
| `/clients` | Search and filter clients (all / with dues / overdue / settled). Opening this from Home shows the Cubity survey-stamp loader while the list loads from the database. |
| `/clients/new` | Add a client: name and phone required, email and address optional |
| `/clients/[id]` | Ledger, outstanding, promised date, call/WhatsApp, PDF, delete |
| `/clients/[id]/edit` | Edit profile |
| `/clients/[id]/due` | Add a due / site visit (billed + paid now + promised date) |
| `/clients/[id]/pay` | Log a payment (amount, date, method; promised date only if money remains) |
| `/clients/[id]/statement` | Download that client's due statement PDF (file named like `Azizul-Hakim.pdf`) |
| `/reports/outstanding` | Download a company-wide outstanding PDF |

## Features

### Client profiles

- Required: name, phone
- Optional on add: email, address
- Company, site/project, and notes can be filled later on edit
- Call (`tel:`) and WhatsApp links on the profile (Bangladesh `01…` numbers are sent as `880…`)

### Dues and payments

- Add what became due and how much was collected on the spot
- Remaining amount is calculated live
- Promised date is required whenever money is still outstanding after the save
- Later partial payments update the running balance and the next promised date
- Log payment is a short phone form: amount, date, method; promised date only if leftover. No payment notes.
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

Bottom navigation on phones: Home, Clients, company PDF (asks to confirm before download), Add client (center plus).

Opening Clients (or a client account) from Home shows a **survey-stamp loader**: the Cubity seal iris-reveals and stamps in, compass rings spin, and a scan line reads the logo while the database catches up. Same animation on the website and in the Android app.

### PDFs

- Per-client **due statement**: letterhead with logo on the left and two-line company name, title, and issue date on the right; no header address. Outstanding panel with billed/paid/promised, a gap before the ledger, **Pending** column, and outstanding amounts in red. Footer uses location, phone, and email icons.
- Company **outstanding receivables** list with office address and phones
- Both downloads ask for confirmation first (Not now / Download). Same dialog on the website and in the Android app.

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
5. Open https://cubity-app.vercel.app

Local: copy `.env.example` to `.env` / `.env.local` and paste your Neon URLs. `npm run dev` then uses the same cloud database.

## Android APK

There is a native-looking Android wrapper in `android/`. It is a fullscreen WebView of the live site with a **fixed teal status bar**, Cubity splash and icon, and no Chrome address bar. The page cannot pan sideways. Call / WhatsApp open the real phone apps. PDF statements go to Downloads.

The built file is **`dist/Cubity.apk`** (install from Files / a share; allow unknown sources). Needs internet. It is not on Play Store.

Rebuild after changing the wrapper:

```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk@17
cd android && ./gradlew assembleRelease
cp app/build/outputs/apk/release/app-release.apk ../dist/Cubity.apk
```

The APK always loads `https://cubity-app.vercel.app/`. **Most changes do not need a new APK.** Screens, spacing, forms, PDFs, and data updates go live on Vercel; close and reopen Cubity (or pull to refresh) and the phone shows them.

Install a new `dist/Cubity.apk` only when the Android shell itself changes: icon, splash, status bar, keyboard lifting, or the package. I will say so when that happens.

On this Mac there is a Pixel 7 emulator named **Cubity_Phone**. Boot it, then install:

```bash
export ANDROID_SDK_ROOT=/opt/homebrew/share/android-commandlinetools
export PATH="$ANDROID_SDK_ROOT/emulator:$ANDROID_SDK_ROOT/platform-tools:$PATH"
emulator -avd Cubity_Phone -gpu auto
adb install -r dist/Cubity.apk
adb shell am start -n com.cubity.receivables/.MainActivity
```

## Agent rules

Cursor always applies:

- Update this file whenever the app changes
- Never `git commit` or `git push` unless you confirm in chat

## Changelog

- 2026-09-16 — Added a Cubity-logo survey-stamp loader while Clients (and client accounts) load from the database, and a confirm dialog before any PDF download. Both work on the website and in the Android app without a new APK.
- 2026-09-16 — Opened up the clients list and client account pages with more space, quieter type, and larger tap targets. The add-client form now lifts above the Android keyboard so Address stays visible.
- 2026-09-16 — Stopped sideways pan in the Android app, pinned a teal status bar so scroll no longer covers the clock, made dashboard rings shrink to the phone width, and used a solid app header.
- 2026-09-16 — Set up a Pixel 7 emulator (`Cubity_Phone`) on this Mac so the APK can be installed and checked locally.
- 2026-09-16 — Added an Android APK wrapper (`dist/Cubity.apk`) that opens the live site in a fullscreen WebView with Cubity splash, icon, and no browser chrome.
- 2026-09-16 — Named each client due-statement download after the client (`Azizul-Hakim.pdf`) instead of a generic statement filename.
- 2026-09-16 — Tightened PDF table padding so Pending is not clipped, darkened footer type, and bumped body type one size for phone reading.
- 2026-09-16 — Simplified Log payment for phones: dropped the note field, stacked large inputs, and only ask for the next promised date when money is still due.
- 2026-09-16 — Simplified Add client for phones: only name, phone, optional email and address. Dropped company, site, and notes from that screen; larger fields and a full-width Create button.
- 2026-09-16 — Clipped the PDF letterhead logo to a circle so the square frame around the JPEG no longer shows.
- 2026-09-16 — Moved the due-statement header company name, title, and issue date to the right, leaving the logo on the left.
- 2026-09-16 — Restyled the client due-statement PDF: logo-only header on the left, company name plus a smaller title on the right, no header address, taller outstanding box so the promised date no longer clips, Balance renamed to Pending, and outstanding amounts in red. Footer address is centered and larger.
- 2026-09-16 — Pointed Prisma at Neon’s `DATABASE_URL_UNPOOLED` (instead of a custom `DIRECT_URL`) so Vercel builds succeed with the env vars Neon already injects.
- 2026-09-16 — Switched Prisma from SQLite to Neon Postgres (`DATABASE_URL` + `DIRECT_URL`) so Vercel builds can run `prisma migrate deploy`.
- 2026-09-16 — Documented how to deploy on Vercel with Neon Postgres (SQLite cannot run on Vercel).
- 2026-09-16 — Rebuilt the home summary with colorful rings, donut, 6-month line chart, aging capsule, and largest-balance bars; made the app mobile-first (bottom nav, larger tap targets, hero money cards). Put real Cubity Sylhet office, phones, and email on the dashboard and PDFs, and removed the demo client.
- 2026-09-16 — Wrote this product doc and added Cursor rules so future changes stay documented and git commit/push wait for confirmation.
- 2026-09-16 — First version of Cubity Receivables: clients, site-visit dues, partial payments, promised dates, dashboard totals, aging, overdue/upcoming lists, branded PDFs, call/WhatsApp, and local SQLite storage.
