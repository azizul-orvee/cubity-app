<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — Cubity

> Start here. This is the entry point for any AI assistant or developer working on this repo.

## What this is

The internal phone-first workspace of **Cubity Engineering & Construction Company** (Chowhatta, Sylhet, Bangladesh). It is one office and one company, and it is not multi-tenant. It has two live products: **Receivables** (who owes the firm money, promised pay dates, due-statement PDFs) and **Invoice maker** (design-service invoices, installments, invoice PDFs). It is live at https://cubity-app.vercel.app, mostly opened through the Android/iOS WebView wrappers.

## Read these next

1. `docs/ai/STATUS.md` — where things stand and what's next (read first)
2. `docs/ai/CHANGELOG.md` — engineering history, newest first
3. `docs/APP.md` — **product source of truth**: screens, features, data, deploy, mobile wrappers
4. `docs/ai/PROJECT.md` — stack, commands, env var names, deploy
5. `docs/ai/ARCHITECTURE.md` — code map and data flow
6. `docs/ai/DECISIONS.md` — why things are the way they are
7. `CLAUDE.md` — the detailed engineering guide (domain model, cache tags, roles, PDFs, motion). Useful to every tool, not only Claude

## Quick facts

- **Stack:** Next.js 16 App Router, React 19, TypeScript, Prisma 6 on Neon Postgres, Tailwind 4 + shadcn/ui, zod 4, pdf-lib
- **Run locally:** `npm run dev` against the local Homebrew Postgres database `cubity_dev` (`.env`). Production Neon URLs live only in Vercel
- **Verify:** `npx tsc --noEmit` and `npm run lint` (no test suite). **Never `npm run build` locally**, because it runs `prisma migrate deploy` against production
- **Deploy:** Vercel, auto-deploys from `main` on GitHub (`azizul-orvee/cubity-app`)
- **Package manager:** npm

## Conventions

- Currency is always **Tk** (never `$`/`BDT`). Amounts are integer poisha (Tk × 100) via `src/lib/money.ts`. Dates are `Asia/Dhaka` via `src/lib/dates.ts`
- Every link and redirect uses the helpers in `src/lib/routes.ts`. Never hard-code `/receivables/...` or `/invoices/...`
- Writes are server actions (`src/lib/*-actions.ts`, `src/lib/actions.ts`). Each write invalidates its cache tag through `src/lib/revalidate.ts`
- Receivables writes are accountant-only, enforced in the UI **and** in the action (`requireAccountant()` / `redirectUnlessAccountant()`)
- The ledger is append-only: void, never delete. Every total goes through `activeEntries()` in `src/lib/ledger.ts`
- Every route has a `loading.tsx`. Motion lives in one block at the end of `src/app/globals.css`
- Copy is plain and non-accountant: "still due", "promised", "log payment"

## Don't touch without asking

- The accountant password in `src/lib/workspace-role.ts`. Don't move it to env, and don't print it anywhere
- `prisma/migrations/` history and `.github/workflows/db-backup.yml`
- `android/` and `ios/` wrappers (changes there need a new APK or app build)

## 🚫 Hard rules (MANDATORY for every AI tool)

1. **No `git commit` and no `git push` unless the user explicitly asks in that message.** Permission to commit is not permission to push. Read-only git (`status`, `log`, `diff`, `show`, `branch`) is fine. Leave finished work uncommitted.
2. **The production database is off-limits from this machine.** Local `.env` points at the local `cubity_dev` Postgres database, and writes there (dev server forms, `npm run db:migrate`, `db:push`, seeds) are fine. Never put a Neon URL back into `.env`: `src/lib/db.ts` and `scripts/prisma-env.mjs` refuse `neon.tech` URLs outside Vercel. Any write to production (raw SQL against Neon, a Neon console edit) needs the user's clear agreement in the current message. If a task needs one, stop and ask: *"This writes to the live database. Should I go ahead?"* If anything in production is created or changed while testing, restore it before finishing, verify with a read, and log the cleanup in `docs/ai/CHANGELOG.md`. Reading data, editing code, and `prisma generate` are fine.

## 📝 Documentation rules (MANDATORY for every AI tool)

This project documents itself. Whatever tool you are (Claude Code, Cursor, Copilot, Codex, etc.):

1. **Before working:** read `docs/ai/STATUS.md` and the latest entries in `docs/ai/CHANGELOG.md`.
2. **After any change, before finishing:**
   - If users can see it or the data model changed: update the matching section of `docs/APP.md` and add a line at the top of its Changelog (`- YYYY-MM-DD — summary.`). This is the plain-language product log.
   - Add a dated entry at the top of `docs/ai/CHANGELOG.md` (format below). This is the engineering log, with file paths.
   - Update `docs/ai/STATUS.md`.
   - Update `docs/ai/ARCHITECTURE.md` if the structure changed, `docs/ai/PROJECT.md` if the stack, commands, env, or deploy changed, and `docs/ai/DECISIONS.md` for any non-obvious choice.
3. Be specific and include file paths. Never write secrets: env var **names** only, and never the accountant password or customer data.

Changelog entry format (get the date from `date +%F`):

    ## YYYY-MM-DD — Short title
    **Type:** feature | fix | refactor | style | content | config | deps | deploy | docs
    **Tool:** <which AI/human>
    **What changed:**
    - <change with `file/path`>
    **Why:** <reason>
    **Notes / gotchas:** <optional, include any test-data cleanup done>
