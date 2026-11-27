import { categoryById } from './categories'
import type { Category, Expense } from './types'
import { monthKey, pctChange, prevMonthKey, sum, todayISO } from './utils'

export interface MonthStats {
  key: string
  total: number
  count: number
  items: number
  avgDaily: number
  daysWithSpending: number
}

export function monthStats(expenses: Expense[], key: string): MonthStats {
  const inMonth = expenses.filter((e) => monthKey(e.date) === key)
  const days = new Set(inMonth.map((e) => e.date)).size
  const [y, m] = key.split('-').map(Number)
  const daysInMonth = new Date(y, m, 0).getDate()
  return {
    key,
    total: sum(inMonth),
    count: inMonth.length,
    items: inMonth.reduce((s, e) => s + (e.quantity ?? 1), 0),
    avgDaily: daysInMonth ? sum(inMonth) / daysInMonth : 0,
    daysWithSpending: days,
  }
}

export function categoryTotals(expenses: Expense[], categories: Category[]) {
  const total = sum(expenses)
  const byCat = new Map<string, number>()
  for (const e of expenses) byCat.set(e.categoryId, (byCat.get(e.categoryId) ?? 0) + e.amount)
  return [...byCat.entries()]
    .map(([id, amount]) => ({
      id,
      name: categoryById(categories, id).name,
      color: categoryById(categories, id).color,
      amount,
      pct: total ? (amount / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
}

export function dailyTotals(expenses: Expense[], key: string) {
  const byDay = new Map<string, number>()
  for (const e of expenses.filter((x) => monthKey(x.date) === key)) {
    byDay.set(e.date, (byDay.get(e.date) ?? 0) + e.amount)
  }
  return [...byDay.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, amount]) => ({ date, day: Number(date.slice(8, 10)), amount }))
}

export function monthlyTrend(expenses: Expense[], months = 6) {
  const keys: string[] = []
  let k = monthKey(todayISO())
  for (let i = 0; i < months; i++) {
    keys.unshift(k)
    k = prevMonthKey(k)
  }
  return keys.map((key) => {
    const [y, m] = key.split('-').map(Number)
    return {
      key,
      month: new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: 'short' }),
      total: sum(expenses.filter((e) => monthKey(e.date) === key)),
    }
  })
}

export interface Insight {
  text: string
  kind: 'up' | 'down' | 'info'
}

/** Insights generated ONLY from real stored data. Empty array when data is missing. */
export function buildInsights(expenses: Expense[], categories: Category[], currentKey: string): Insight[] {
  const out: Insight[] = []
  const cur = expenses.filter((e) => monthKey(e.date) === currentKey)
  const prevKey = prevMonthKey(currentKey)
  const prev = expenses.filter((e) => monthKey(e.date) === prevKey)
  if (cur.length === 0) return out
  const curTotal = sum(cur)
  const prevTotal = sum(prev)
  if (prev.length > 0 && prevTotal > 0) {
    const change = pctChange(curTotal, prevTotal)
    if (change !== null) {
      const dir = change >= 0 ? 'increased' : 'decreased'
      out.push({
        text: `Total spending ${dir} by ${Math.abs(change).toFixed(0)}% compared to last month (${prevTotal.toLocaleString('en-PK')} → ${curTotal.toLocaleString('en-PK')} PKR).`,
        kind: change >= 0 ? 'up' : 'down',
      })
    }
    // Category movers
    const curCats = categoryTotals(cur, categories)
    const prevCats = new Map(categoryTotals(prev, categories).map((c) => [c.id, c.amount]))
    for (const c of curCats.slice(0, 3)) {
      const p = prevCats.get(c.id)
      if (p !== undefined && p > 0) {
        const ch = pctChange(c.amount, p)
        if (ch !== null && Math.abs(ch) >= 5) {
          out.push({
            text: `Your ${c.name} spending ${ch >= 0 ? 'increased' : 'decreased'} by ${Math.abs(ch).toFixed(0)}% compared to last month.`,
            kind: ch >= 0 ? 'up' : 'down',
          })
        }
      }
    }
  }
  const cats = categoryTotals(cur, categories)
  if (cats.length > 0) {
    out.push({ text: `${cats[0].name} is your highest spending category this month (${cats[0].pct.toFixed(0)}% of total).`, kind: 'info' })
    if (cats.length > 1) {
      out.push({ text: `${cats[1].name} is your second-largest spending category.`, kind: 'info' })
    }
  }
  const days = dailyTotals(expenses, currentKey)
  if (days.length > 0) {
    const top = [...days].sort((a, b) => b.amount - a.amount)[0]
    const [y, m, d] = top.date.split('-').map(Number)
    const label = new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })
    out.push({ text: `Your highest spending day was ${label} (${top.amount.toLocaleString('en-PK')} PKR).`, kind: 'info' })
  }
  return out
}
