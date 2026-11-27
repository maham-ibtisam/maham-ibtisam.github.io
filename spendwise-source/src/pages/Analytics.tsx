import { TrendingDown, TrendingUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { buildInsights, categoryTotals, dailyTotals, monthStats } from '../lib/analytics'
import type { Category, Expense } from '../lib/types'
import { formatMoney, monthKey, monthLabel, pctChange, prevMonthKey, todayISO } from '../lib/utils'
import { Card, EmptyState, StatCard, inputCls, labelCls } from '../components/ui'

export default function Analytics({
  expenses,
  categories,
  currency,
}: {
  expenses: Expense[]
  categories: Category[]
  currency: string
}) {
  const months = useMemo(
    () => [...new Set(expenses.map((e) => monthKey(e.date)))].sort().reverse(),
    [expenses],
  )
  const latest = months[0] ?? monthKey(todayISO())
  const [monthA, setMonthA] = useState(latest)
  const [monthB, setMonthB] = useState(() => prevMonthKey(latest))

  const a = monthStats(expenses, monthA)
  const b = monthStats(expenses, monthB)
  const change = pctChange(a.total, b.total)
  const cats = categoryTotals(expenses.filter((e) => monthKey(e.date) === monthA), categories)
  const days = dailyTotals(expenses, monthA)
  const topDay = days.length ? [...days].sort((x, y) => y.amount - x.amount)[0] : null
  const insights = buildInsights(expenses, categories, monthA)
  const weekTotal = expenses
    .filter((e) => {
      const d = new Date(`${e.date}T00:00:00`)
      const now = new Date(`${todayISO()}T00:00:00`)
      return (now.getTime() - d.getTime()) / 86400000 <= 6 && d <= now
    })
    .reduce((s, e) => s + e.amount, 0)

  if (expenses.length === 0) {
    return <EmptyState title="No data for analytics yet" body="Add expenses and insights will appear here — only from your real data, never invented." />
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-slate-900">Analytics &amp; Insights</h2>

      <Card>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="cmp-a">Month A (current)</label>
            <select id="cmp-a" className={inputCls} value={monthA} onChange={(e) => setMonthA(e.target.value)}>
              {months.map((k) => (
                <option key={k} value={k}>{monthLabel(k)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="cmp-b">Month B (compare with)</label>
            <select id="cmp-b" className={inputCls} value={monthB} onChange={(e) => setMonthB(e.target.value)}>
              {months.map((k) => (
                <option key={k} value={k}>{monthLabel(k)}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label={monthLabel(monthA)} value={formatMoney(a.total, currency)} sub={`${a.count} transactions`} />
          <StatCard label={monthLabel(monthB)} value={formatMoney(b.total, currency)} sub={`${b.count} transactions`} />
          <StatCard
            label="Change"
            value={change === null ? '—' : `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`}
            sub={change === null ? 'No previous-month data to compare' : change >= 0 ? 'Higher than comparison month' : 'Lower than comparison month'}
          />
          <StatCard label="Daily average" value={formatMoney(a.avgDaily, currency)} sub={`${monthLabel(monthA)}`} />
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="This week" value={formatMoney(weekTotal, currency)} sub="Last 7 days" />
        <StatCard label="Highest day" value={topDay ? formatMoney(topDay.amount, currency) : '—'} sub={topDay ? `Day ${topDay.day} ${monthLabel(monthA)}` : ''} />
        <StatCard label="Highest category" value={cats[0]?.name ?? '—'} sub={cats[0] ? formatMoney(cats[0].amount, currency) : ''} />
        <StatCard label="Total items" value={String(a.items)} sub={`${a.count} transactions in ${monthLabel(monthA)}`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="mb-3 font-semibold text-slate-900">Category breakdown — {monthLabel(monthA)}</h3>
          {cats.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">No spending in this month.</p>
          ) : (
            <>
              <div className="h-52">
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
              <ul className="mt-2 space-y-2">
                {cats.map((c) => (
                  <li key={c.id}>
                    <div className="flex justify-between text-sm">
                      <span>{c.name}</span>
                      <span className="font-semibold">{c.pct.toFixed(1)}% · {formatMoney(c.amount, currency)}</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-slate-100">
                      <div className="h-2 rounded-full" style={{ width: `${c.pct}%`, backgroundColor: c.color }} />
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>

        <Card>
          <h3 className="mb-3 font-semibold text-slate-900">Month comparison</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: monthLabel(monthB), total: b.total },
                { name: monthLabel(monthA), total: a.total },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} />
                <Tooltip formatter={(v) => formatMoney(Number(v), currency)} />
                <Bar dataKey="total" fill="#16a34a" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-sm text-slate-600">
            {change === null ? (
              'No comparison data for the second month.'
            ) : change >= 0 ? (
              <><TrendingUp className="h-4 w-4 text-red-500" /> Spending is {Math.abs(change).toFixed(1)}% higher than {monthLabel(monthB)}.</>
            ) : (
              <><TrendingDown className="h-4 w-4 text-green-600" /> Spending is {Math.abs(change).toFixed(1)}% lower than {monthLabel(monthB)}.</>
            )}
          </p>
        </Card>
      </div>

      <Card>
        <h3 className="mb-3 font-semibold text-slate-900">Insights — from your data only</h3>
        {insights.length === 0 ? (
          <p className="text-sm text-slate-500">
            Not enough data for insights yet. Add a second month of expenses and month-over-month comparisons will appear here.
          </p>
        ) : (
          <ul className="space-y-2">
            {insights.map((ins, i) => (
              <li key={i} className="rounded-xl bg-green-50 px-3 py-2.5 text-sm text-slate-700">💡 {ins.text}</li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
