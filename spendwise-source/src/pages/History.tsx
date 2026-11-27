import { Pencil, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import ExpenseForm, { type ExpenseDraft } from '../components/ExpenseForm'
import { Card, CategoryChip, EmptyState, GhostButton, inputCls, labelCls } from '../components/ui'
import { categoryById } from '../lib/categories'
import type { Category, Expense } from '../lib/types'
import { formatDate, formatMoney, monthKey, monthLabel, sum } from '../lib/utils'

type Sort = 'newest' | 'oldest' | 'highest' | 'lowest'

export default function History({
  expenses,
  categories,
  currency,
  onUpdate,
  onDelete,
}: {
  expenses: Expense[]
  categories: Category[]
  currency: string
  onUpdate: (id: string, draft: ExpenseDraft) => void
  onDelete: (id: string) => void
}) {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const [month, setMonth] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [sort, setSort] = useState<Sort>('newest')
  const [editing, setEditing] = useState<Expense | null>(null)

  const months = useMemo(
    () => [...new Set(expenses.map((e) => monthKey(e.date)))].sort().reverse(),
    [expenses],
  )

  const filtered = useMemo(() => {
    let list = expenses.filter((e) => {
      if (q && !e.description.toLowerCase().includes(q.toLowerCase())) return false
      if (cat !== 'all' && e.categoryId !== cat) return false
      if (month !== 'all' && monthKey(e.date) !== month) return false
      if (from && e.date < from) return false
      if (to && e.date > to) return false
      return true
    })
    list = [...list].sort((a, b) => {
      if (sort === 'newest') return b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)
      if (sort === 'oldest') return a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt)
      if (sort === 'highest') return b.amount - a.amount
      return a.amount - b.amount
    })
    return list
  }, [expenses, q, cat, month, from, to, sort])

  const grouped = useMemo(() => {
    const map = new Map<string, Expense[]>()
    for (const e of filtered) {
      const key = e.displayDate ?? e.date
      map.set(key, [...(map.get(key) ?? []), e])
    }
    return [...map.entries()]
  }, [filtered])

  if (editing) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Edit expense</h2>
        <ExpenseForm
          categories={categories}
          initial={editing}
          submitLabel="Save changes"
          onSave={(drafts) => {
            if (drafts[0]) onUpdate(editing.id, drafts[0])
            setEditing(null)
          }}
          onCancel={() => setEditing(null)}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-slate-900">Expense History</h2>
      <Card>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className={labelCls} htmlFor="hist-q">Search</label>
            <input id="hist-q" className={inputCls} placeholder="Search by item name..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div>
            <label className={labelCls} htmlFor="hist-cat">Category</label>
            <select id="hist-cat" className={inputCls} value={cat} onChange={(e) => setCat(e.target.value)}>
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="hist-month">Month</label>
            <select id="hist-month" className={inputCls} value={month} onChange={(e) => setMonth(e.target.value)}>
              <option value="all">All months</option>
              {months.map((k) => (
                <option key={k} value={k}>{monthLabel(k)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="hist-from">From date</label>
            <input id="hist-from" className={inputCls} type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className={labelCls} htmlFor="hist-to">To date</label>
            <input id="hist-to" className={inputCls} type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div>
            <label className={labelCls} htmlFor="hist-sort">Sort</label>
            <select id="hist-sort" className={inputCls} value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="highest">Highest amount</option>
              <option value="lowest">Lowest amount</option>
            </select>
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-600">
          {filtered.length} transactions · Total {formatMoney(sum(filtered), currency)}
        </p>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState title="No expenses match" body="Try clearing the search or filters, or add a new expense." />
      ) : (
        grouped.map(([key, items]) => (
          <Card key={key}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">
                {items[0].displayDate ? items[0].displayDate : formatDate(items[0])}
              </h3>
              <span className="text-sm font-bold text-green-700">{formatMoney(sum(items), currency)}</span>
            </div>
            <ul className="divide-y divide-slate-100">
              {items.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {e.description}
                      {e.quantity ? <span className="ml-1 text-xs text-slate-500">× {e.quantity}</span> : null}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <CategoryChip category={categoryById(categories, e.categoryId)} size="sm" />
                      {e.merchant ? <span className="text-xs text-slate-500">{e.merchant}</span> : null}
                      {e.notes ? <span className="text-xs italic text-slate-500">{e.notes}</span> : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <span className="mr-1 text-sm font-bold text-slate-900">{formatMoney(e.amount, currency)}</span>
                    <button aria-label={`Edit ${e.description}`} onClick={() => setEditing(e)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      aria-label={`Delete ${e.description}`}
                      onClick={() => {
                        if (window.confirm(`Delete "${e.description}" (${formatMoney(e.amount, currency)})?`)) onDelete(e.id)
                      }}
                      className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        ))
      )}
      <GhostButton onClick={() => { setQ(''); setCat('all'); setMonth('all'); setFrom(''); setTo(''); }}>Clear filters</GhostButton>
    </div>
  )
}
