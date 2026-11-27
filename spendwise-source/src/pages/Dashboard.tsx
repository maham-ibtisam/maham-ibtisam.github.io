import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { categoryTotals, dailyTotals, monthStats, monthlyTrend } from '../lib/analytics'
import { categoryById } from '../lib/categories'
import type { Category, Expense } from '../lib/types'
import { formatMoney, monthKey, monthLabel, prevMonthKey, sum, todayISO } from '../lib/utils'
import { Card, CategoryChip, EmptyState, StatCard } from '../components/ui'

export default function Dashboard({
  expenses,
  categories,
  currency,
}: {
  expenses: Expense[]
  categories: Category[]
  currency: string
}) {
  const availableMonths = useMemo(() => {
    const keys = [...new Set(expenses.map((e) => monthKey(e.date)))].sort().reverse()
    const cur = monthKey(todayISO())
    if (!keys.includes(cur)) keys.unshift(cur)
    return keys
  }, [expenses])

  const [month, setMonth] = useState(() => availableMonths[0] ?? monthKey(todayISO()))

  const inMonth = useMemo(() => expenses.filter((e) => monthKey(e.date) === month), [expenses, month])
  const stats = monthStats(expenses, month)
  const prev = monthStats(expenses, prevMonthKey(month))
  const cats = categoryTotals(inMonth, categories)
  const topCat = cats[0]
  const trend = monthlyTrend(expenses, 6)
  const daily = dailyTotals(expenses, month)

  // This week: last 7 days ending today (Karachi date)
  const weekTotal = useMemo(() => {
    const today = todayISO()
    const d = new Date(`${today}T00:00:00`)
    const start = new Date(d)
    start.setDate(d.getDate() - 6)
    const startISO = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`
    return sum(expenses.filter((e) => e.date >= startISO && e.date <= today))
  }, [expenses])

  const recent = useMemo(
    () => [...expenses].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)).slice(0, 8),
    [expenses],
  )

  const compareData = [
    { name: 'Last month', total: prev.total },
    { name: 'This month', total: stats.total },
  ]

  if (expenses.length === 0) {
    return <EmptyState title="No expenses yet" body="Add your first expense — it takes a few seconds — and the dashboard will fill in automatically." />
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-slate-900">Dashboard</h2>
        <select
          aria-label="Month filter"
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        >
          {availableMonths.map((k) => (
            <option key={k} value={k}>{monthLabel(k)}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="This month" value={formatMoney(stats.total, currency)} sub={`${stats.count} transactions`} />
        <StatCard label="Last month" value={formatMoney(prev.total, currency)} sub={monthLabel(prevMonthKey(month))} />
        <StatCard label="This week" value={formatMoney(weekTotal, currency)} sub="Last 7 days" />
        <StatCard label="Avg daily" value={formatMoney(stats.avgDaily, currency)} sub={`${monthLabel(month)} · ${stats.daysWithSpending} spending days`} />
        <StatCard label="Transactions" value={String(stats.count)} sub={`${stats.items} individual items`} />
        <StatCard label="Highest category" value={topCat ? topCat.name : '—'} sub={topCat ? formatMoney(topCat.amount, currency) : 'No data'} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="mb-1 font-semibold text-slate-900">Monthly spending trend</h3>
          <p className="mb-3 text-xs text-slate-500">Last 6 months, from your saved expenses</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} />
                <Tooltip formatter={(v) => formatMoney(Number(v), currency)} />
                <Line type="monotone" dataKey="total" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="mb-1 font-semibold text-slate-900">Category spending</h3>
          <p className="mb-3 text-xs text-slate-500">{monthLabel(month)}</p>
          {cats.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">No spending in this month.</p>
          ) : (
            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <div className="h-48 w-48 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={cats} dataKey="amount" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                      {cats.map((c) => (
                        <Cell key={c.id} fill={c.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatMoney(Number(v), currency)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="w-full space-y-1.5">
                {cats.slice(0, 6).map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                      {c.name}
                    </span>
                    <span className="font-semibold">{c.pct.toFixed(0)}% · {formatMoney(c.amount, currency)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        <Card>
          <h3 className="mb-1 font-semibold text-slate-900">This month vs last month</h3>
          <p className="mb-3 text-xs text-slate-500">{monthLabel(month)} vs {monthLabel(prevMonthKey(month))}</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={compareData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} />
                <Tooltip formatter={(v) => formatMoney(Number(v), currency)} />
                <Bar dataKey="total" fill="#16a34a" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="mb-1 font-semibold text-slate-900">Daily spending</h3>
          <p className="mb-3 text-xs text-slate-500">{monthLabel(month)}</p>
          {daily.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">No spending in this month.</p>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" fontSize={12} />
                  <YAxis fontSize={12} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} />
                  <Tooltip formatter={(v) => formatMoney(Number(v), currency)} labelFormatter={(d) => `Day ${d}`} />
                  <Bar dataKey="amount" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      <Card>
        <h3 className="mb-3 font-semibold text-slate-900">Recent transactions</h3>
        <ul className="divide-y divide-slate-100">
          {recent.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">{e.description}</p>
                <p className="text-xs text-slate-500">{e.displayDate ?? new Date(`${e.date}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <CategoryChip category={categoryById(categories, e.categoryId)} size="sm" />
                <span className="text-sm font-bold text-slate-900">{formatMoney(e.amount, currency)}</span>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
