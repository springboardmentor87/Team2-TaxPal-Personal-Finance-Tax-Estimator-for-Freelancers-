# TaxPal — Angular 17 (Standalone Components)

This is a full conversion of the original **Next.js 16 / React 19** TaxPal
frontend to **Angular 17** using standalone components (no NgModules).

## Getting started

```bash
npm install
npm start        # ng serve, runs on http://localhost:4200
```

```bash
npm run build     # production build to dist/taxpal-angular
```

## Structure

```
src/
  index.html            root document (fonts, favicons, meta tags)
  styles.css            global Tailwind + design tokens (OKLCH colors, radii)
  main.ts                bootstrapApplication entry point
  app/
    app.component.ts     root shell (<router-outlet/>)
    app.routes.ts         "/" -> redirect "/income", "/income", "/expense"
    app.config.ts         router + lucide-angular icon providers
    models/
      transaction.model.ts     Transaction, TransactionStatus, CATEGORIES
    services/
      dashboard-data.service.ts  seed data + formatCurrency/formatDate
    utils/
      cn.ts                clsx + tailwind-merge helper
      icons.ts             central lucide icon registry
    components/
      sidebar/              nav drawer (routerLink/routerLinkActive)
      topbar/                search, notifications, profile
      summary-cards/         income-page KPI cards
      expense-summary-cards/ expense-page KPI cards
      add-income-card/       reactive form: add income
      add-expense-card/      reactive form: add expense
      transactions-table/    desktop table + mobile list, delete action
      ui/button/              shadcn-style button (kept for parity, cva-based)
    pages/
      income/                IncomePageComponent (route: /income)
      expense/               ExpensePageComponent (route: /expense)
```

## Mapping from the original Next.js project

| Next.js / React                          | Angular 17                                             |
|-------------------------------------------|----------------------------------------------------------|
| `app/layout.tsx`                          | `src/index.html` + `app.component.ts`                    |
| `app/page.tsx` (redirect to `/income`)    | `app.routes.ts` (`redirectTo: 'income'`)                 |
| `app/income/page.tsx`, `app/expense/...`  | `pages/income`, `pages/expense`                           |
| `next/link` `<Link>`                      | `RouterLink` / `RouterLinkActive`                          |
| `useState` / `useMemo`                    | component class fields + plain methods (recalculated on change) |
| `"use client"` form state (`useState`)    | Angular Reactive Forms (`FormBuilder`, `formGroup`)        |
| `lucide-react` icons                      | `lucide-angular` (`<lucide-icon name="...">`)              |
| `cn()` (`clsx` + `tailwind-merge`)        | identical `cn()` helper, ported as-is                       |
| Tailwind v4 (`@theme inline`, oklch vars) | Tailwind v3 config mapping the same CSS variables/oklch values |
| `components/ui/button.tsx` (base-ui + cva)| `components/ui/button/button.component.ts` (native `<button>` + cva) |

## Notes on functional parity

- All UI, spacing, colors (including the exact OKLCH values and dark-mode
  variables), and responsive breakpoints are preserved 1:1 via the ported
  Tailwind design tokens.
- Form validation logic (amount must be a positive number, description must
  be non-empty) is preserved exactly, including the client-side error
  messaging.
- Each page keeps its own local transaction list, seeded fresh from the same
  mock dataset — matching the original behavior where navigating between
  `/income` and `/expense` unmounts/remounts independent React state.
- One quirk from the original source was preserved intentionally: the
  "Add Income" form (`add-income-card`) emits `type: "expense"` on submit,
  just like the original `add-income-card.tsx` did. If this was a bug in the
  original app rather than intentional, it's a one-line fix in
  `add-income-card.component.ts` (`type: 'income'`).

## Dependencies of note

- `lucide-angular` — icon set (equivalent of `lucide-react`)
- `class-variance-authority`, `clsx`, `tailwind-merge` — same utility libs as
  the original project
- `@angular/forms` — Reactive Forms for the Add Income / Add Expense forms
