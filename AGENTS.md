<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Database needs confirmation

Local dev uses the production Neon database. A write from this machine changes live Cubity data.

Never change database data or schema unless the user clearly agreed in the current message.

Do not run inserts, updates, deletes, seeds, `prisma migrate`, `prisma db push`, or server actions that write clients, dues, payments, or payment settings until they say yes.

Reading data and editing application code are fine. If a task needs a live write, stop and ask: "This writes to the live database. Should I go ahead?"
