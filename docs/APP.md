# Cubity

Internal workspace for **Cubity Engineering & Construction Company**. The home screen is a product hub. **Receivables** is live (client dues, payments, statements). **Invoice maker** is live (service list, invoices, PDF). New tools should get their own folder under `src/app/` and a card on `/`.

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
| `/receivables/clients` | Search and filter clients (all / with dues / overdue / settled). Opening this from Receivables Home shows the Cubity seal appearing (paint-in, bloom, or rise — picked at random) while the list loads from the database, and the seal keeps moving for as long as the wait lasts. |
| `/receivables/clients/new` | Add a client: name and phone required, email and address optional (accountant only) |
| `/receivables/clients/[id]` | Ledger, outstanding, next promise (date and amount), call/WhatsApp, PDF. Accountant gets Edit, Discount, Add due, and Log payment in one grid. Discount shows "None yet" or the amount. A ledger line is **voided**, never deleted: it stays in the list struck through with the date and reason, and stops counting. **Account history** below the ledger lists discount changes and voided lines |
| `/receivables/clients/[id]/edit` | Edit the client: name and phone required; email, address, company, site, and notes optional (accountant only) |
| `/receivables/clients/[id]/discount` | Set or remove the account discount (accountant only). Whole Tk, cannot exceed the billed total. The screen shows billed, discount, total after discount, paid, and still due as you type. Saving updates the client page, the dashboard, and the due-statement PDF. Remove discount clears it |
| `/receivables/clients/[id]/due` | Add a due / site visit (accountant only) |
| `/receivables/clients/[id]/pay` | Log a payment (accountant only) |
| `/receivables/clients/[id]/statement` | Download that client's due statement PDF (file named like `Azizul-Hakim-due-statement.pdf`), including bKash and bank payment details |
| `/receivables/settings` | Edit the bKash number and bank account printed on due statements (accountant only) |
| `/receivables/reports/outstanding` | Download a company-wide outstanding PDF |
| `/invoices` | Every invoice, newest first, grouped by the day it was created (Today, Yesterday, then the date). Search by client or invoice number. Bottom nav: Invoices, Services, and New. No accountant gate. |
| `/invoices/new` | New invoice in cards: Invoice (invoice ID in three parts — start, middle, end — all editable; the middle starts as the year and month, so September 2026 is 2609; **the end part is optional**, so `CC420-2609-C01` and `CC420-2609` are both fine, plus the issue date), Discount (optional whole Tk, directly under the invoice card, taken off the service total; clear it to remove), Bill to (client, optional phone, project, address), Services (tap to pick, amount box opens), Payment (optional first receipt: amount and date, with Nothing yet / Half / Full amount chips), Notes. A sticky bar shows what is still due and the Create button. `?from=<id>` pre-fills a new bill from another invoice (a fresh ID, payments are not copied, date is today) |
| `/invoices/[id]` | The invoice shown like the PDF, plus a **Client ledger** card (which receivables client this bill belongs to, and whether it is on their ledger) and a Payments card to record another receipt (amount, date, optional note) or remove one. The document lists every receipt with its date, then billed, discount when set, total after discount, paid, and still due, and a Cubity stamp: green Paid, purple Partial payment, or red Unpaid. Buttons: Edit, Discount, New from this, Download. Discount shows "None yet" or the amount. Delete sits below and asks for confirmation first |
| `/invoices/[id]/discount` | Set or remove this invoice's discount. Whole Tk, cannot exceed the service total or drop the total below what is already paid. The screen shows billed, discount, total after discount, paid, and still due as you type. Saving updates the invoice screen and the PDF. Remove discount clears it |
| `/invoices/[id]/client` | Two tabs. **New client** (the default when nothing is linked) adds the person to Receivables using the invoice's own name, phone, address, and site/project, all editable, and links the bill in one step; it refuses if another client already uses that phone number. **Someone on the ledger** picks an existing client, searchable by name or phone with the likely match first. Removing an existing link is its own separate button. accountant only |
| `/invoices/[id]/ledger` | Put the bill on that client's ledger: due date (defaults to the issue date) and an optional promised date. Shows what they will owe after it is added. accountant only |
| `/invoices/[id]/edit` | Change the invoice ID, client, or the selected services and amounts. Payments stay as they are. Saving is blocked if the new total is below what has already been paid, or if the bill is already on a client's ledger and the total would change |
| `/invoices/[id]/pdf` | Download that invoice PDF. The file is `Invoice-{ID}-Paid.pdf`, `Invoice-{ID}-Unpaid.pdf`, or `Invoice-{ID}-PartialPaid.pdf`. Each receipt is listed once, in the amount-due box, with its date. Under the particulars, total amount, paid, and total due sit beside the Cubity stamp (green Paid, purple Partial payment, or red Unpaid). The ID is printed under INVOICE in the letterhead |
| `/invoices/services` | Add a service at the top, then rename, set its usual amount, or remove each one in the list (remove shows Undo). **The list is the office list, shared by every phone.** A phone that still has the old on-device list is offered a one-time "add these to the office list" card. Defaults are the five design services |

Old `/clients` and `/reports/outstanding` URLs redirect into `/receivables/...`. Product paths live in `src/lib/routes.ts`.

## Architecture

The site is a **workspace**, not a single app. Each product owns a folder:

- `src/app/page.tsx` — hub cards
- `src/app/receivables/` — dues app (`AppShell` header + bottom nav)
- `src/app/invoices/` — invoice maker (`InvoiceShell` header + bottom nav, no role gate). Uses the same colors, cards, and wording as Receivables
- `src/components/site-chrome.tsx` — Cubity header + office footer for hub and non-receivables screens
- `src/lib/routes.ts` — path helpers so links do not hard-code product URLs
- `src/lib/workspace-role.ts` — accountant vs engineer role cookie and password check (code-only, no env vars)

To add another product later: create `src/app/<name>/`, add paths in `routes.ts`, and put a card on `/`.

### Accountant and engineer

Clicking Receivables on the hub (or opening `/receivables` with no role yet) shows a popup:

- **Accountant** — password required, then full add/edit access
- **Engineer** — no password, view-only

The chosen role stays in an httpOnly cookie until you tap **Log out** in the Receivables header. Opening Receivables again goes straight in and does not ask for the password. Server actions and add/edit routes reject engineers even if they hit the URL directly.

## Features

### Client profiles

- Required: name, phone
- Optional on add: email, address
- Company, site/project, and notes can be filled later on edit. The accountant opens **Edit** on the client page for the name, phone, and the rest. **Discount** sits in the same button grid as Edit, Add due, and Log payment. It is whole Tk, cannot be more than the amount billed, and can be removed. Outstanding, the dashboard, and the due statement use billed minus that discount
- Call (`tel:`) and WhatsApp on the profile. WhatsApp opens that client's chat with the message "Assalamualaikum" and nothing else. Bangladesh `01…` numbers are sent as `880…`.

### Dues and payments

- Add what became due and how much was collected on the spot
- Remaining amount is calculated live
- Promised date is **optional**. Clients often leave without naming a day, so it can be left blank: the balance still counts towards what the office is owed, and the client shows as **Unscheduled** instead of appearing in the overdue or upcoming queues. Add the date later on the client page when they do promise one
- Promised amount is optional: leave it blank for the full leftover, or enter a smaller installment (e.g. Tk 100 outstanding, Tk 50 promised in 7 days)
- Later partial payments update the running balance and the next promised date and amount
- Log payment is a short phone form: amount, date, method; an optional promised date and amount if there is a leftover. No payment notes.
- Overpayment is allowed and shown as advance/credit
- Payment methods: cash, bank transfer, bKash, Nagad, Rocket, cheque, other
- Ledger shows a running balance. An entry is **voided, not deleted**: the line stays for the record with the date and an optional reason, shows struck through on the screen and `VOIDED` on the statement, and counts for nothing. Voiding a payment puts the money back on what they owe
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

Every screen has its own loading state, so a tap opens the new screen immediately rather than leaving the old one up while the database answers. Most screens show a grey sketch of what is coming (the dashboard sketches the hero card, the rings and the charts, and its heading is real from the first moment). Opening Clients, a client account, or an invoice shows the **Cubity seal** instead. The full-screen seal that used to appear on every tap now waits about a fifth of a second first, so it only shows up when a screen really is slow.

Opening Clients (or a client account) from Home shows the **Cubity seal** only while the database is still loading. It disappears as soon as the page is ready. The seal reveals itself once, then a teal arc circles it and the stamp breathes for as long as the screen is still coming, so a slow load never looks frozen. Switching filters on the client list counts as loading too, so the seal clears the moment those results arrive. Same on the website and in the Android app. Receivables and Invoice maker both run in Singapore, next to the Neon database. The invoice list and an open invoice show the same seal only while that query is still running.

### PDFs

- Per-client **due statement**: letterhead with logo on the left and two-line company name, title, and issue date on the right; no header address. Outstanding panel with billed/paid/promised (and next installment if they promised only part of the balance). When a discount is set, the panel and the totals under the ledger also show Discount and Total after discount, and the amount still pending is the billed total minus discount minus what was paid. A gap before the ledger, **Pending** column, and outstanding amounts in red. Particulars wrap onto a second line when long. Due / Paid / Pending headers sit on the same left edge as their amounts. Below the ledger, **payment instructions** show a bKash personal wallet and an NRB bank transfer card (real logos plus account details). Footer uses location, phone, and email icons.
- Payment details are edited at `/receivables/settings` (gear in the receivables header). Defaults: bKash `01973 914236`; NRB Bank, Sylhet Main Branch, MD TAREK AHMED, A/C `7087010002828`, routing `290913794`.
- Company **outstanding receivables** list with office address and phones
- **Invoice PDF**: same letterhead, teal table, amount-due panel, bKash and bank cards, and office footer as the due statement. Every receipt is listed once, in the amount-due box, with its date. Under the particulars, the total amount is shown in bold, then paid and total due, beside a Cubity stamp: green Paid, purple Partial payment, or red Unpaid. File name is `Invoice-{ID}-Paid.pdf`, `Invoice-{ID}-Unpaid.pdf`, or `Invoice-{ID}-PartialPaid.pdf`.
- Both downloads ask for confirmation first (Not now / Download). Same dialog on the website and in the Android app.

### Extra (beyond the original request)

These exist because construction collections usually fail on follow-up, not on the first visit:

- Overdue and upcoming-promise queues
- Aging buckets so old money is obvious
- Call and WhatsApp from the profile. WhatsApp's message is only "Assalamualaikum".
- Site/project on the client
- Payment method tracking
- Company-wide PDF
- Search and status filters
- Credit if a client pays more than they owe

## Data

Prisma + **Neon Postgres** in production (SQLite only worked on this machine):

- `Client` — profile fields + `nextPromisedDate` + `nextPromisedAmount` (poisha; the installment they said they will bring next)
- `LedgerEntry` — `DUE` or `PAYMENT`, amount in poisha (Tk × 100), date, method, note, promised date and amount snapshot, the invoice it came from, and `voidedAt` / `voidReason` when it has been cancelled. Nothing removes a row
- `ClientEvent` — account history that is not money: discount set, discount removed, entry voided. Saved with the change it describes so a balance can never move with nothing to explain it
- `Service` — the office service catalog: name, optional usual amount, order, and archived date. An invoice keeps its own copy of the service name and amount, so renaming or removing a service never rewrites a bill already sent

Schema: `prisma/schema.prisma`. Migrations: `prisma/migrations/`. Env template: `.env.example` (`DATABASE_URL` pooled, `DATABASE_URL_UNPOOLED` direct).

### Read cache

Page reads (client list, one client, invoice list, one invoice, the service list, payment details) go through the Next.js data cache in `src/lib/data-cache.ts`, so repeat visits skip the database. Each read is tagged (`db:clients`, `db:invoices`, `db:payment`, `db:services`), and the invalidation helpers live in `src/lib/revalidate.ts`. Every server action that writes calls `updateTag` for its tag, so a saved due, payment, or invoice shows up on the very next screen. Edits made outside the app (Prisma Studio, SQL console) show up within 5 minutes. Server actions that check balances before writing still read the database directly. When you add a new write, call `updateTag` with the matching tag.

The Prisma pool uses up to 5 connections per server instance (`src/lib/db.ts`) so parallel queries do not wait on each other.

### Daily backup

A GitHub Action (`.github/workflows/db-backup.yml`) copies the whole Neon database every night at 3:00 AM Sylhet time. It only reads; it never changes data. Each copy is a `pg_dump` file named `cubity-YYYY-MM-DD.dump`, kept for 90 days on that run's page under **GitHub → Actions → Database backup**. It is not in the code or the commit history. **Run workflow** on that page makes a copy on demand.

It needs the repo secret `DATABASE_URL_UNPOOLED` (the direct Neon URL, host without `-pooler`). The repo must stay private, because anyone who can see Actions can download the files.

To restore, download a copy and load it into a **new** Neon branch or database, never straight over the live one:

```bash
docker run --rm -v "$PWD:/b" postgres:18 pg_restore --no-owner --no-privileges -d "<new-branch-direct-url>" /b/cubity-YYYY-MM-DD.dump
```

Neon's own restore history (Branches → Restore) still works too; this copy is for when Neon itself is the problem or the mistake is older than that history.

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

## iPhone app

There is the same kind of wrapper in `ios/`. It is a fullscreen in-app browser of the live site: teal status bar, Cubity splash and icon, no Safari address bar. The page cannot pan sideways. Call and WhatsApp open the real phone apps. A PDF statement opens the iPhone share sheet so it can be saved to Files.

It always loads `https://cubity-app.vercel.app/`. Screens and data still update from Vercel. A new install is only needed when the iPhone shell itself changes.

This Mac does not have Xcode, only the command-line tools, so the app cannot be built here yet. Apple also does not allow a loose install file the way Android allows `dist/Cubity.apk`.

1. Install **Xcode** from the Mac App Store, then open `ios/Cubity.xcodeproj`.
2. Plug in the iPhone, pick it as the run destination, and set your Apple ID under Signing (a free account works; the install lasts about 7 days).
3. Press Run. The first launch on the phone needs Settings → General → VPN & Device Management → trust the developer.

A paid Apple Developer account is only needed for TestFlight or the App Store. Apple often rejects a pure website wrapper from the store.

## Motion

The app runs mostly on phones, inside the Android and iPhone wrappers, so the motion is written for a WebView rather than a desktop browser. It all lives in one block at the end of `src/app/globals.css`.

- Screens and cards **rise in** (fade plus a small lift). Lists **cascade**, one row after another, and the delay stops growing after the tenth row so a long client list does not crawl.
- Every card, tile, row, and nav icon **answers a tap** by pressing in slightly. This is the detail that makes the APK feel like an app instead of a web page.
- Headline money figures **pop** as they land. The paid bar, the aging capsule, and the largest-balance bars **sweep** out from the left.
- On the dashboard the rings and the 6-month lines **draw themselves on**, and the donut draws slice by slice.
- Only `transform`, `opacity`, and `stroke-dashoffset` are animated, nothing animates while scrolling, and each animation finishes on `transform: none` so no element is left permanently on its own compositor layer.
- A phone set to **reduce motion** gets no animation at all, only the finished screen.

## Agent rules

Cursor always applies:

- Update this file whenever the app changes
- Never `git commit` or `git push` unless you confirm in chat
- Never change the database unless you confirm in chat. Local `.env` points at the production Neon database, so a local write is a live write. The same instruction is in `AGENTS.md` for assistants outside Cursor.

When editing receivables (`src/app/receivables/`, `src/lib/routes.ts`, roles, money, `AppShell`):

- Accountant writes; engineer is view-only in the UI **and** on the server
- Show money as **Tk** via `src/lib/money.ts`
- Import paths from `src/lib/routes.ts` — do not hard-code `/receivables/...`
- Mobile-first (thumb-zone bottom nav, large tap targets)

When adding a workspace product, follow `.cursor/skills/add-cubity-product/SKILL.md` (folder under `src/app/`, helpers in `routes.ts`, card on `/`, then this file).

## Invoices

The invoice maker is open to anyone who taps the hub card. It does not ask for the accountant password — **but everything that reaches into receivables does.** Writing, editing, and deleting invoices needs no role. Linking a bill to a client, creating a client from a bill, and putting a bill on a ledger are accountant-only, blocked on the server as well as hidden in the UI, and the client link cannot be changed by editing an invoice either. Anyone without the accountant role sees the Client ledger card greyed out with "Ask the accountant to create the link", so it is clear the step exists and who does it. **A stranger or an engineer can therefore never cause a write to a client, a ledger entry, or a balance.**

The service list is stored in Postgres and shared by every phone. Each service can carry the amount the office usually charges, which fills in when you pick it on an invoice. Defaults, which can be renamed, removed, or extended on **Services**:

- Architectural Planning and Drafting
- Structural Design & Drafting
- Plumbing and Sanitary Design & Drafting
- Electrical Design & Drafting
- 3D Modeling (Building Exterior)

A saved invoice is the record that goes in the database. It stores the service name and amount at that moment, so later edits to the service list do not rewrite old invoices. Amounts are poisha, shown as **Tk**. The PDF reuses the receivables payment details (bKash and bank).

A bill is usually for someone who is not on the ledger yet, so **Link a client** can create the client straight from the invoice, carrying over the name, phone, address, and site/project. It refuses when another client already has that phone number, so the same person does not end up with two ledgers.

An invoice can be **linked to a receivables client** and then **added to their ledger**, which is what turns a bill into money owed. Adding it writes one due for the total after discount plus a payment for every receipt already on the invoice, each line carrying the invoice number, so the due statement says which bill it came from. A bill can only be added once, and while it sits on the ledger its total is frozen — to change it, void those ledger entries first. Linking and adding are accountant-only, even though the rest of the invoice maker is open.

- `Invoice` — number (typed ID such as `CC420-2609-C01`, or `CC420-2609` when the last part is left out), client, optional phone, address, project, issue date, optional discount, notes, and the receivables client it is linked to. **The paid total is not stored**: it is always added up from the receipts, so the screen, the PDF, the file name, and the stamp can never disagree with each other. Discount is whole Tk. Due is the service total minus discount minus what has been paid. The screen and the PDF show Discount and the total after discount when a discount is set
- `InvoiceLine` — service name snapshot and amount
- `InvoicePayment` — one receipt on that invoice: amount, date, optional note. The paid total is the sum of these receipts. A later payment is another row on the same invoice, not a new invoice

## Changelog

- 2026-09-27 — Every screen now has its own loading state, so tapping something shows that screen straight away instead of holding the previous one until the database answers. Forms and lists show a grey sketch of what is coming; the dashboard sketches its hero card, rings and charts, and its heading appears immediately while the slow query finishes underneath. The Cubity seal now only appears if a screen takes longer than a moment to open, rather than flashing on every tap.

- 2026-09-27 — The loading seal keeps moving until the screen arrives. It used to play its reveal once and then sit still, which looked frozen on a slow connection. A teal arc now circles it and the stamp breathes; a phone set to reduce motion gets a slow fade instead. Changing a client-list filter also clears the seal properly, and the safety timeout that hides it went from 8 to 20 seconds so it no longer gives up during a genuinely slow load.

- 2026-09-27 — The admin role is called **accountant** again, everywhere. Nothing about the password or the permissions changed.
- 2026-09-27 — The last part of an invoice ID (C01, C02…) is optional. Leave that box empty and the ID is just the first two parts, like `CC420-2609`, with no trailing hyphen.
- 2026-09-27 — The promised payment date is optional on a due, a payment, and when pushing an invoice onto a ledger. A client who does not name a day still counts towards what is owed and shows as Unscheduled, rather than blocking the save.

- 2026-09-27 — Briefly renamed the admin role to CEO, then put it back to accountant the same day. Recorded here only so the two entries above make sense.
- 2026-09-27 — Motion across the app, built for the phone and the APK: screens and cards rise in, lists cascade, every card and tile answers a tap, money figures pop, the dashboard rings and lines draw themselves on, and bars sweep out. It all switches off for anyone whose phone asks for reduced motion.
- 2026-09-27 — Only the accountant can link a bill to a client. That was already true of the linking screens; now editing an invoice cannot change the link either, and a bill already on a ledger keeps its client. Engineers see the Client ledger card greyed out with who to ask.
- 2026-09-27 — Linking an invoice can create a brand new receivables client from the invoice's own name, phone, address, and site/project, instead of only picking someone already on the ledger. Removing a link is now its own button, so it cannot happen by accident when no client is selected.
- 2026-09-27 — An invoice can be linked to a receivables client and added to their ledger, which writes the due and any receipts already taken, and puts the invoice number on the due statement. While a bill is on the ledger its total is frozen; edit and discount say so.
- 2026-09-27 — The service list moved off the phone into the office database, so every phone sees the same services. A service can carry the amount usually charged, which fills in on a new invoice. A phone with the old on-device list is offered a one-time import.
- 2026-09-27 — Ledger entries are voided instead of deleted: the line stays, struck through with its date and reason, marked `VOIDED` on the statement, and counts for nothing. Discount changes and voided lines are listed under Account history on the client page.
- 2026-09-27 — An invoice no longer stores its paid total; it is added up from the receipts every time, so the screen, the PDF, the file name, and the paid stamp cannot drift apart.
- 2026-09-27 — Invoice paid, partial, and unpaid marks on the screen and in the PDF use the Cubity stamp artwork: a green Paid seal, a purple Partial payment banner, and a red Unpaid stamp.
- 2026-09-27 — Discount is a button next to Edit on an invoice and next to Edit, Add due, and Log payment on a client. The screen shows billed, discount, total after discount, and still due. Remove discount clears it. The PDF uses the same totals.
- 2026-09-27 — Optional discount on invoices and client accounts. It is subtracted from the billed total, and the screen and PDF show the discount and the total after discount. Receivables has an Edit button, like invoices, so the accountant can change the client name, phone, site, and the rest.
- 2026-09-27 — The invoice ID middle part is editable. New invoices fill it with the year and month (September 2026 → 2609) instead of the day and month, and it follows the issue date until you type your own.
- 2026-09-26 — Invoice PDFs show the total amount in bold under the particulars, with paid and total due beneath it. Dated receipts stay in the amount-due box.
- 2026-09-26 — Invoice payments are separate receipts with dates. Recording another payment on the same invoice lists every earlier payment on the screen and in the PDF, then the paid total and what is still due.
- 2026-09-26 — Added a nightly GitHub Action that saves a read-only copy of the Neon database for 90 days, so data can be recovered even if the Neon project is lost.
- 2026-09-25 — Made screens load faster. Database reads are cached and cleared whenever the app saves a change. The database connection pool went from 1 to 5 so queries run side by side. Saving an edited invoice checks the ID and the invoice together instead of one after the other.
- 2026-09-25 — Invoices show a Cubity seal for paid, partial, or unpaid, on the screen and in the PDF. The downloaded file is named `Invoice-{ID}-Paid`, `Unpaid`, or `PartialPaid`.
- 2026-09-25 — New invoices start as `CC420-2509-C01`. The middle four digits are the date and month (25 September → 2509) and follow the issue date. The start and end are filled in and can be changed.
- 2026-09-25 — Opening Invoice maker from the workspace no longer waits on the invoice list. The Invoices screen appears immediately, and the list fills in after the database query.
- 2026-09-25 — Added an iPhone wrapper in `ios/` that opens the live site fullscreen, matching the Android app: teal status bar, Cubity splash and icon, call and WhatsApp, and PDF share. It needs Xcode to install; there is no sideload file.
- 2026-09-25 — Invoice ID is now typed in (required, unique, capital letters / numbers / hyphens, e.g. CUB-2026-014) instead of auto-numbered. It names the PDF file and is printed as "Invoice ID" in the PDF letterhead.
- 2026-09-25 — Invoice list now only lists invoices grouped by the day they were created (no totals card or filters). Invoice detail shows the invoice like the PDF, with Edit, New from this, and Download; Call and WhatsApp were removed.
- 2026-09-25 — Restyled the invoice maker to match Receivables: same teal cards, avatars, badges, and bottom nav, plus search, filters, a sticky due bar, and quick paid amounts. No change to data, validation, or the PDF.
- 2026-09-25 — Asked for confirmation before deleting an invoice, and showed the Cubity seal on invoice screens only while the database query is still running.
- 2026-09-25 — Invoice amounts and paid amounts accept whole numbers only. Letters and fractions are rejected.
- 2026-09-25 — Added a paid amount on invoices so the screen and PDF show billed, paid, and what is still due.
- 2026-09-25 — Kept the invoice service list on the phone. Only a saved invoice is written to the database.
- 2026-09-25 — Opened Invoice maker with the five default design services, a Services screen to add or edit that list, and an invoice PDF styled like the due statement.
- 2026-09-25 — Kept the accountant signed in until they tap Log out. Opening Receivables again no longer asks for the password.
- 2026-09-25 — Stopped holding every screen for 1.4 seconds behind the Cubity seal, and run Receivables in Singapore next to the database so pages wait on a shorter query.
- 2026-09-25 — WhatsApp on a client opens the chat with only "Assalamualaikum". The long follow-up text and the PDF attachment attempt are gone.
- 2026-09-25 — Named client due statements `Name-due-statement.pdf`.
- 2026-09-25 — Told every assistant not to change the database unless you confirm first. Local dev uses the production Neon database.
- 2026-09-25 — Kept Overdue and Coming up amounts and status badges inside the card on the phone. Long client names now truncate instead of pushing the money off the right edge.
- 2026-09-25 — Fixed the Vercel build. Delete, promised-date, and payment-settings actions were returning a type the form actions cannot use, so the production deploy failed typechecking.
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
