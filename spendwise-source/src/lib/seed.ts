import { suggestCategoryOrOther } from './categorize'
import type { Expense } from './types'

/**
 * Maham's REAL October 2026 expenses — the only seed data in the app.
 * No fake/demo transactions are ever added.
 *
 * [description, amount PKR, ISO date, display label (only for undated items)]
 * Undated October items use 2026-10-15 internally for month maths, but the
 * UI shows "Oct 2026" via displayDate — no specific day is invented.
 * Verified total: Rs 199,619 across 60 items (see scripts/verify-seed.mjs).
 */
const SEED_ROWS: Array<[string, number, string, string?]> = [
  ['Cock & Bull + Kulfi', 1100, '2026-10-01'],
  ['Eggs Bread', 500, '2026-10-02'],
  ['Groceries', 5000, '2026-10-03'],
  ['KFC', 2700, '2026-10-03'],
  ['KFC + Cokes', 2500, '2026-10-04'],
  ['Apple Bananas + Eggs', 2000, '2026-10-04'],
  ['Maida Sugar Bread Medicine', 1640, '2026-10-05'],
  ['Shamim Baji', 500, '2026-10-06'],
  ['Chai', 500, '2026-10-06'],
  // October 2026, exact day not recorded
  ['Cakes and Bakes', 505, '2026-10-15', 'Oct 2026'],
  ['Cakes and Bakes Milk', 343, '2026-10-15', 'Oct 2026'],
  ['Cock and Bull', 1000, '2026-10-15', 'Oct 2026'],
  ['Quetta Chai', 400, '2026-10-15', 'Oct 2026'],
  ['Eggs 2 Bread', 800, '2026-10-15', 'Oct 2026'],
  ['Sunday Market Grocery + Chicken', 6000, '2026-10-15', 'Oct 2026'],
  ['Eggs', 290, '2026-10-15', 'Oct 2026'],
  ['Atta + Oil', 3000, '2026-10-15', 'Oct 2026'],
  ['Ahmad Birthday Cake + Gifts', 1500, '2026-10-15', 'Oct 2026'],
  ['Stationary', 650, '2026-10-15', 'Oct 2026'],
  ['Bahir Wali Maid', 2000, '2026-10-15', 'Oct 2026'],
  ['Sakina', 1000, '2026-10-15', 'Oct 2026'],
  ['Ahmad School Fee', 80000, '2026-10-15', 'Oct 2026'],
  ['Milkman', 11750, '2026-10-15', 'Oct 2026'],
  ['My Water', 4750, '2026-10-15', 'Oct 2026'],
  ['Sui', 990, '2026-10-15', 'Oct 2026'],
  ['Wasa Bill', 11180, '2026-10-15', 'Oct 2026'],
  ['Rox Package', 5000, '2026-10-15', 'Oct 2026'],
  ['Internet', 2274, '2026-10-15', 'Oct 2026'],
  ['Hashir Monthly', 1000, '2026-10-15', 'Oct 2026'],
  ['SNGPL', 1080, '2026-10-15', 'Oct 2026'],
  ['Subscriptions', 7037, '2026-10-15', 'Oct 2026'],
  ['Mali', 2000, '2026-10-15', 'Oct 2026'],
  ['Locker', 6000, '2026-10-15', 'Oct 2026'],
  ['Locker Tax', 960, '2026-10-15', 'Oct 2026'],
  ['Rahat Store Eggs Snacks', 400, '2026-10-15', 'Oct 2026'],
  ['Whites Shirts for Kids', 1500, '2026-10-15', 'Oct 2026'],
  ['Quetta Chai Paratha', 650, '2026-10-15', 'Oct 2026'],
  ['Cakes and Bakes', 560, '2026-10-15', 'Oct 2026'],
  ['Quetta Chai Paratha', 400, '2026-10-15', 'Oct 2026'],
  ['Cock and Bull', 1000, '2026-10-15', 'Oct 2026'],
  ['Eggs Bread', 550, '2026-10-15', 'Oct 2026'],
  ['Kulfi', 450, '2026-10-15', 'Oct 2026'],
  ['Hawk Sports Uniform', 4600, '2026-10-15', 'Oct 2026'],
  ['Karachi Roll Paratha', 500, '2026-10-15', 'Oct 2026'],
  ['Pampers', 1450, '2026-10-15', 'Oct 2026'],
  ['Ganiya Api Beti', 5000, '2026-10-15', 'Oct 2026'],
  ['Hair Cuts Bachon K', 1000, '2026-10-15', 'Oct 2026'],
  ['Eggs', 270, '2026-10-15', 'Oct 2026'],
  ['Bread', 240, '2026-10-15', 'Oct 2026'],
  ['Burger Patties', 700, '2026-10-15', 'Oct 2026'],
  ['School Snack Fries Corns Juice', 2000, '2026-10-15', 'Oct 2026'],
  ['eSIM', 1100, '2026-10-15', 'Oct 2026'],
  ['Park', 600, '2026-10-15', 'Oct 2026'],
  ['Cock and Bull', 2000, '2026-10-15', 'Oct 2026'],
  ['Kulfi', 300, '2026-10-15', 'Oct 2026'],
  ['Dry Milk + Eggs Bread', 2600, '2026-10-15', 'Oct 2026'],
  ['Uro Store', 800, '2026-10-15', 'Oct 2026'],
  ['Sabzi Basic', 1000, '2026-10-15', 'Oct 2026'],
  ['Saim', 1000, '2026-10-15', 'Oct 2026'],
  ['Sakkina for Ground Jaru', 1000, '2026-10-15', 'Oct 2026'],
]

export const SEED_TOTAL = 199619
export const SEED_COUNT = 60

export function buildSeedExpenses(): Expense[] {
  const now = new Date().toISOString()
  return SEED_ROWS.map(([description, amount, date, displayDate], i) => {
    const id = `seed-${String(i + 1).padStart(2, '0')}`
    const expense: Expense = {
      id,
      description,
      amount,
      categoryId: suggestCategoryOrOther(description),
      date,
      transactionId: id,
      createdAt: now,
      updatedAt: now,
    }
    if (displayDate) expense.displayDate = displayDate
    return expense
  })
}

/** Runtime guard: fail loudly in dev if the seed ever drifts from the real total. */
export function assertSeedTotal(expenses: Expense[]): void {
  const total = expenses.reduce((s, e) => s + e.amount, 0)
  if (expenses.length !== SEED_COUNT || total !== SEED_TOTAL) {
    console.error(`Seed mismatch: ${expenses.length} items, total Rs ${total} (expected ${SEED_COUNT} / Rs ${SEED_TOTAL})`)
  }
}
