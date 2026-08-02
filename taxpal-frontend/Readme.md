# TaxPal — Dashboard

Personal Finance & Tax Estimator for Freelancers. Angular 17, standalone components, Tailwind CSS.

## Run it

```bash
npm install
npm start
```

Then open `http://localhost:4200`. The app redirects `/` → `/dashboard`.

## What's in this drop

- `src/app/pages/dashboard` — the dashboard page (topbar, KPI cards, charts, transactions)
- `src/app/components/sidebar` — TaxPal sidebar with routerLink navigation + user profile footer
- `src/app/components/summary-card` — reusable KPI card (Income / Expenses / Balance / Tax)
- `src/app/components/income-expense-chart` — animated bar chart with Year/Quarter/Month toggle
- `src/app/components/expense-donut-chart` — SVG donut chart with category legend
- `src/app/components/transactions-table` — searchable, filterable transactions table
- `src/app/services/ui-state.service.ts` — tiny signal-based service that opens/closes the
  mobile sidebar drawer (the hamburger button in the dashboard topbar and the sidebar's
  close button both talk to this)

## Not included on purpose

Per the brief, **Income and Expense pages are not generated** — they already exist in your
project. The sidebar links to `/income` and `/expense` via `routerLink` as requested; you just
need to make sure those routes are registered in your app's route table. See the comments in
`src/app/app.routes.ts` — merge that file's `dashboard` route into your existing routes array
(or vice versa) so everything resolves from one router config.

The sidebar also links to `/budget`, `/tax-estimator`, `/reports`, and `/settings` since they're
listed in the nav — wire those up to your existing pages the same way once they're ready.

## Theme tokens

Defined in `tailwind.config.js`:

- `primary.500` `#7C3AED` (brand purple)
- `primary.100` / `lavender` `#F3E8FF` (light lavender accent)
- Card radius: `rounded-2xl` (18px)
- Shadows: `shadow-card` / `shadow-card-hover` (soft purple-tinted shadows used on hover)

Fonts: **Plus Jakarta Sans** for headings/display, **Inter** for body and table data, loaded
from Google Fonts in `src/index.html`.
