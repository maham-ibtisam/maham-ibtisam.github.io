# SpendWise — Personal Expense Tracker & Smart Spending Insights

A beautiful, modern, fully functional personal expense tracker. Record daily
expenses, categorise spending, compare months, and get real insights — all
free, with no paid APIs and no account needed.

**Live site (after GitHub Pages deploy):** https://maham-ibtisam.github.io/spendwise/

## Features

- **Dashboard** — this month / last month / this week totals, transactions,
  items, average daily spending, highest category, recent transactions, plus
  monthly trend (line), category donut, current-vs-previous month (bar) and
  daily spending charts. Month/year filter.
- **Add Expense** — name, amount (PKR), category, date (defaults to today),
  quantity, notes, merchant. Multi-item transactions, edit/delete, instant
  confirmation toast. Smart rule-based category suggestions (milk/eggs →
  Grocery, KFC → Food & Dining, school fee → Education, etc.) — you can
  always override; uncertain items are never silently assigned.
- **History** — search, filter by category/month/date range, sort by
  newest/oldest/highest/lowest, grouped by date with daily totals, edit/delete.
- **Analytics & Insights** — month-over-month % change, category totals and
  %, daily average, weekly spending, highest day/category, compare any two
  months. Insights are generated **only from your real stored data**.
- **WhatsApp Import** — paste lines like `Rainbow grocery = 9500`,
  `Buns = 450`, `Eggs - 280`, `Item: 500`, `Item 500`. Preview, edit, remove
  rows, pick a date, see the total — saved only when you confirm.
- **Smart Scanner** — photograph a grocery list or receipt. Free, local OCR
  with [Tesseract.js](https://github.com/naptha/tesseract.js) (open source).
  No API key, no paid service, images never leave your browser. Review and
  edit every recognised item before saving; blank amounts are never invented.
- **Settings** — currency (default PKR), category management (add/edit/delete
  custom categories), CSV export, JSON backup, JSON restore (merge or replace
  — never silently overwritten), clear all data with confirmation.

## Data & privacy

- **Storage:** browser `localStorage`, key `spendwise-v1`. Data survives
  refresh/reopen in the same browser. There is no backend on GitHub Pages.
- **Seed data:** on first run only, the app loads Maham's real October 2026
  expenses — 60 items, **Rs 199,619** (verified by `npm run verify-seed`).
  No fake/demo transactions are ever added. Items whose exact October day
  was not recorded use 2026-10-15 internally and display as “Oct 2026”.
- **Backup:** export CSV or a full JSON backup from Settings regularly —
  localStorage is per-browser, so a backup is the only way to move data to
  another device.
- **Modular storage:** all persistence lives in `src/lib/storage.ts`
  (`StorageAdapter` interface). Swap that file later for Supabase or another
  cloud database without touching the pages.

## Tech stack

React 19 + TypeScript + Vite, Tailwind CSS v4, Recharts, Lucide icons,
Tesseract.js v5. Currency PKR, dates DD MMM YYYY, timezone Asia/Karachi.

## Run locally

```bash
npm install
npm run setup-ocr   # copies/downloads self-hosted Tesseract assets into public/tesseract/
npm run dev         # http://localhost:5173/spendwise/
npm run build       # production build -> dist/
npm run verify-seed # checks the Oct 2026 seed: 60 items / Rs 199,619
```

## Deploy (GitHub Pages)

Push to `main` — `.github/workflows/deploy.yml` runs `npm ci`, `setup-ocr`,
`verify-seed` and `npm run build`, then deploys `dist/` with
`actions/deploy-pages`. The Vite `base` is `/spendwise/`, so the project site
is `https://maham-ibtisam.github.io/spendwise/`. In the repository, enable
**Settings → Pages → Build and deployment → GitHub Actions**.

## Project structure

```
src/
  App.tsx                 # state, navigation, toast, storage wiring
  lib/
    types.ts  categories.ts  categorize.ts   # rule-based suggestions
    seed.ts   storage.ts   utils.ts  parse.ts # WhatsApp/OCR line parsing
    analytics.ts  categoryIcons.ts
  components/
    ui.tsx  ExpenseForm.tsx   # multi-row add/edit form
  pages/
    Dashboard.tsx  AddExpensePage.tsx  History.tsx  Analytics.tsx
    ImportPage.tsx  ScannerPage.tsx  SettingsPage.tsx
```
