---
name: add-cubity-product
description: Adds a Cubity workspace product beside Receivables and Invoice maker — App Router folder, path helpers in routes.ts, hub card on /, and docs/APP.md. Use when adding a product, tool, workspace card, new folder under src/app, or turning a placeholder such as Invoice maker into a live product.
---

# Add a Cubity product

Cubity is a **workspace hub**, not a single app. Each product owns `src/app/<slug>/`. Receivables is the live example. Invoice maker is the empty placeholder.

## Before writing

1. Read `docs/APP.md` (Architecture + Screens).
2. Read `src/lib/routes.ts`, `src/app/page.tsx`, and `src/app/invoices/page.tsx`.
3. Decide: **fill Invoice maker** (`/invoices` already exists) or **add a new slug**. Do not create a second invoices product.

## Checklist

- [ ] Path helpers in `src/lib/routes.ts` (object like `receivables` / `invoices`)
- [ ] Folder `src/app/<slug>/` with at least `page.tsx`
- [ ] Hub card in `src/app/page.tsx` using those helpers
- [ ] Chrome: `SiteChrome` on hub-style screens; `AppShell` only if this product needs receivables-style bottom nav
- [ ] Office copy from `@/lib/company` — do not restype the address
- [ ] `docs/APP.md` screens + architecture + changelog (today's date)

## Paths

```ts
export const invoices = {
  root: "/invoices",
};
```

Every link and `redirect` uses the helper. No string literals like `"/invoices"` in components.

Do not reuse `/receivables` or old `/clients` URLs.

## Hub card

Copy the `products` entry shape in `src/app/page.tsx`:

- `ready: true` — live product. Receivables wraps the card in `RoleGate` because that product is gated. **Do not** wrap a new product in `RoleGate` unless the user asked for accountant/engineer on it.
- `ready: false` — placeholder `Link` to the coming-soon page (Invoice maker).

While a product is a placeholder, keep `ready: false`. Flip it when the first real screen ships.

## Roles

Receivables role cookie is workspace-wide today, but the popup and `AppShell` "view only" label are receivables-specific.

- New product with **no** role story: skip `RoleGate`, `requireAccountant`, and `AppShell`.
- New product that **should** gate writes: reuse `getWorkspaceRole` / `requireAccountant` from `@/lib/workspace-role`. Still hide and server-block. Ask before sharing the accountant password prompt copy.

## Placeholder page

Match `src/app/invoices/page.tsx`: `SiteChrome`, teal icon circle, "Coming next", one-line promise, `Button` back to `hubPath`.

## Done

Update `docs/APP.md` in the same turn. Do not commit or push unless the user asked.
