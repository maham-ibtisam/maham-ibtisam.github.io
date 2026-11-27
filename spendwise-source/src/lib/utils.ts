import type { Expense } from './types'

export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

export function todayISO(): string {
  // Local calendar date in Asia/Karachi — avoids UTC date shifts.
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}`
}

export function formatDate(exp: Pick<Expense, 'date' | 'displayDate'>): string {
  if (exp.displayDate) return exp.displayDate
  const [y, m, d] = exp.date.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatMoney(amount: number, currency = 'PKR'): string {
  const n = Math.round(amount)
  if (currency === 'PKR') return `Rs ${n.toLocaleString('en-PK')}`
  return `${currency} ${n.toLocaleString('en-PK')}`
}

export function monthKey(dateISO: string): string {
  return dateISO.slice(0, 7) // YYYY-MM
}

export function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
}

export function prevMonthKey(key: string): string {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function sum(expenses: Expense[]): number {
  return expenses.reduce((s, e) => s + e.amount, 0)
}

export function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null
  return ((current - previous) / previous) * 100
}

export function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

export function expensesToCsv(expenses: Expense[], categoryName: (id: string) => string): string {
  const header = 'Date,Description,Category,Amount (PKR),Quantity,Merchant,Notes'
  const lines = expenses.map((e) =>
    [
      e.date,
      escapeCsv(e.description),
      escapeCsv(categoryName(e.categoryId)),
      String(e.amount),
      e.quantity != null ? String(e.quantity) : '',
      escapeCsv(e.merchant ?? ''),
      escapeCsv(e.notes ?? ''),
    ].join(','),
  )
  return [header, ...lines].join('\n')
}

export function downloadFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
