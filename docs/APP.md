# Cubity

Internal workspace for **Cubity Engineering & Construction Company**. The home screen is a product hub. **Receivables** is live (client dues, payments, statements). **Invoice maker** is a placeholder for the next product. New tools should get their own folder under `src/app/` and a card on `/`.

**Office:** Manru Shopping City, Office 243, 1st Floor, Chowhatta, Sylhet  
**Phones:** 01973-914236, 01711-331406, 01782-161432  
**Email:** contact.cubity@gmail.com

Currency is shown as **Tk** (Bangladeshi Taka). Data lives in **Neon Postgres**. The receivables UI is **mobile-first** (thumb-zone bottom nav, large tap targets, hero money cards).

## Run locally

Copy `.env.example` to `.env` and paste Neon `DATABASE_URL` (pooled) plus `DATABASE_URL_UNPOOLED` (direct). Then:

```bash
npm install
npx prisma migrate deploy
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or the port Next.js prints if 3000 is busy).

Name and phone are required to create a client. Email and address are optional. Company, site/project, and notes are only on the edit screen.

Opening **Receivables** asks whether you are the **accountant** or an **engineer**. The accountant password is checked in code (not the database). Engineers get a view-only app: they can read clients, ledgers, and PDFs, and they can call or WhatsApp, but they cannot add, edit, or delete.

## Core story

1. Site visit: client was supposed to pay Tk 10,000, paid Tk 3,000, promised the remaining Tk 7,000 for Saturday.
2. Log that as a due of 10,000, payment of 3,000, remaining 7,000. Promised date = Saturday. If they will only bring 3,000 on Saturday, set promised amount to 3,000.
3. On Saturday they pay Tk 5,000 and keep Tk 2,000 due for another day.
4. Log a payment of 5,000 and a new promised date for the leftover 2,000.
5. Dashboard total outstanding drops as money comes in. The client PDF lists every due, every payment, dates, and what is still pending.

## Screens

| Where | What it does |
| --- | --- |
| `/` Workspace | Cubity header and office footer. Two product cards: Receivables (opens a role popup) and Invoice maker |
| `/receivables` | Cash summary: hero total, rings, donut mix, 6-month billed vs collected line, aging capsule, largest balances, overdue/upcoming queues, office stamp. Blocked until a role is chosen. Engineers see view-only (no add client). |
| `/receivables/clients` | Search and filter clients (all / with dues / overdue / settled). Opening this from Receivables Home shows the Cubity seal appearing (paint-in, bloom, or rise — picked at random) while the list loads from the database. |
| `/receivables/clients/new` | Add a client: name and phone required, email and address optional (accountant only) |
| `/receivables/clients/[id]` | Ledger, outstanding, next promise (date and amount), call/WhatsApp, PDF; accountant can edit, add due, pay, delete |
| `/receivables/clients/[id]/edit` | Edit profile (accountant only) |
| `/receivables/clients/[id]/due` | Add a due / site visit (accountant only) |
| `/receivables/clients/[id]/pay` | Log a payment (accountant only) |
| `/receivables/clients/[id]/statement` | Download that client's due statement PDF (file named like `Azizul-Hakim.pdf`), including bKash and bank payment details |
| `/receivables/settings` | Edit the bKash number and bank account printed on due statements (accountant only) |
| `/receivables/reports/outstanding` | Download a company-wide outstanding PDF |
| `/invoices` | Invoice maker placeholder until that product is built |

Old `/clients` and `/reports/outstanding` URLs redirect into `/receivables/...`. Product paths live in `src/lib/routes.ts`.

## Architecture

The site is a **workspace**, not a single app. Each product owns a folder:

- `src/app/page.tsx` — hub cards
- `src/app/receivables/` — dues app (`AppShell` header + bottom nav)
- `src/app/invoices/` — invoice maker (placeholder until it is built)
- `src/components/site-chrome.tsx` — Cubity header + office footer for hub and non-receivables screens
- `src/lib/routes.ts` — path helpers so links do not hard-code product URLs
- `src/lib/workspace-role.ts` — accountant vs engineer role cookie and password check (code-only, no env vars)

To add another product later: create `src/app/<name>/`, add paths in `routes.ts`, and put a card on `/`.

### Accountant and engineer

Clicking Receivables on the hub (or opening `/receivables` with no role yet) shows a popup:

- **Accountant** — password required, then full add/edit access
- **Engineer** — no password, view-only

The chosen role is stored in an httpOnly cookie for 30 days. Click Receivables on the hub again to switch. Server actions and add/edit routes reject engineers even if they hit the URL directly.

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
- Promised amount is optional: leave it blank for the full leftover, or enter a smaller installment (e.g. Tk 100 outstanding, Tk 50 promised in 7 days)
- Later partial payments update the running balance and the next promised date and amount
- Log payment is a short phone form: amount, date, method; promised date and optional amount if leftover. No payment notes.
- Overpayment is allowed and shown as advance/credit
- Payment methods: cash, bank transfer, bKash, Nagad, Rocket, cheque, other
- Ledger shows a running balance; entries can be deleted
- Promised date and amount can be changed on the client page without logging money

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

Bottom navigation on phones (inside receivables): Home, Clients, company PDF (asks to confirm before download), Add client (center plus, accountant only). The Cubity mark in that header returns to the workspace hub. The gear opens payment details (bKash and bank account) for the accountant. Engineers see “view only” in the header and no add, edit, settings, or delete controls.

Opening Clients (or a client account) from Home shows the **Cubity seal appearing** while the database catches up: paint-in, bloom from the cube, or rise from the bottom — one of the three at random. Same on the website and in the Android app.

### PDFs

- Per-client **due statement**: letterhead with logo on the left and two-line company name, title, and issue date on the right; no header address. Outstanding panel with billed/paid/promised (and next installment if they promised only part of the balance), a gap before the ledger, **Pending** column, and outstanding amounts in red. Particulars wrap onto a second line when long. Due / Paid / Pending headers sit on the same left edge as their amounts. Below the ledger, **payment instructions** show a bKash personal wallet and an NRB bank transfer card (real logos plus account details). Footer uses location, phone, and email icons.
- Payment details are edited at `/receivables/settings` (gear in the receivables header). Defaults: bKash `01973 914236`; NRB Bank, Sylhet Main Branch, MD TAREK AHMED, A/C `7087010002828`, routing `290913794`.
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

- `Client` — profile fields + `nextPromisedDate` + `nextPromisedAmount` (poisha; the installment they said they will bring next)
- `LedgerEntry` — `DUE` or `PAYMENT`, amount in poisha (Tk × 100), date, method, note, promised date and amount snapshot

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

The APK always loads `https://cubity-app.vercel.app/`. That is now the workspace hub; Receivables is one tap from there. **Most changes do not need a new APK.** Screens, spacing, forms, PDFs, and data updates go live on Vercel; close and reopen Cubity (or pull to refresh) and the phone shows them.

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

When editing receivables (`src/app/receivables/`, `src/lib/routes.ts`, roles, money, `AppShell`):

- Accountant writes; engineer is view-only in the UI **and** on the server
- Show money as **Tk** via `src/lib/money.ts`
- Import paths from `src/lib/routes.ts` — do not hard-code `/receivables/...`
- Mobile-first (thumb-zone bottom nav, large tap targets)

When adding a workspace product, follow `.cursor/skills/add-cubity-product/SKILL.md` (folder under `src/app/`, helpers in `routes.ts`, card on `/`, then this file).

## Changelog

- 2026-09-25 — Stopped the receivables dashboard from sitting too far right on the phone. The billed-vs-collected chart was forcing the page wider than the screen, so the right margin was clipped.
- 2026-09-19 — Added a receivables Cursor rule (roles, Tk, path helpers, mobile-first) and an add-product skill so new workspace tools get an `src/app/` folder, `routes.ts` helpers, a hub card, and an APP.md update.
- 2026-09-18 — Added an Accountant / Engineer popup when opening Receivables. Accountants unlock with a password stored in code; engineers get a view-only app with add, edit, and delete hidden and blocked on the server.

- 2026-09-16 — Cropped empty space off the bKash crane PNG so the mark sits on the same left edge as the pink bar on due statements.
- 2026-09-16 — Added a promised amount next to the promised date so a client can commit to paying only part of the outstanding (app forms, client page, dashboard Coming up, and due-statement PDF).
- 2026-09-16 — Put payment instructions back under the ledger on due statements, as in the first layout, while keeping the real bKash and NRB logos.
- 2026-09-16 — Replaced the drawn bKash and NRB marks on due statements and payment settings with the real logos.
- 2026-09-16 — Added bKash and bank payment details to client due statements, with a settings screen (gear in Receivables) so the number and account can be edited. Defaults are the personal bKash `01973 914236` and the NRB Bank Sylhet Main Branch account.
- 2026-09-16 — Turned `/` into a Cubity workspace hub with Receivables and Invoice maker cards, header, and office footer. Moved the live dues app under `/receivables` so more products can sit beside it.
- 2026-09-16 — Lined up Due, Paid, and Pending headers with their amounts on the client due-statement PDF.
- 2026-09-16 — Wrapped long Particulars onto two lines on the client due-statement PDF and moved Due right so the text no longer runs into the amount columns.
- 2026-09-16 — Replaced the busy survey-stamp loader with three quieter Cubity-seal appearances (paint-in, bloom, rise), picked at random each time Clients or a client account loads.
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
