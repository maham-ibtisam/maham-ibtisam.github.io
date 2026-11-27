import { Plus, Trash2, Wand2 } from 'lucide-react'
import { useState } from 'react'
import { suggestCategory } from '../lib/categorize'
import type { Category, Expense } from '../lib/types'
import { todayISO, uid } from '../lib/utils'
import { GhostButton, PrimaryButton, inputCls, labelCls } from './ui'

export interface ExpenseDraft {
  description: string
  amount: number
  categoryId: string
  date: string
  quantity?: number
  notes?: string
  merchant?: string
}

interface Row {
  key: string
  description: string
  amount: string
  categoryId: string
  date: string
  quantity: string
  notes: string
  merchant: string
  categoryTouched: boolean
  suggestion: string | null
}

function blankRow(date: string): Row {
  return {
    key: uid(),
    description: '',
    amount: '',
    categoryId: 'grocery',
    date,
    quantity: '',
    notes: '',
    merchant: '',
    categoryTouched: false,
    suggestion: null,
  }
}

function rowFromExpense(e: Expense): Row {
  return {
    key: e.id,
    description: e.description,
    amount: String(e.amount),
    categoryId: e.categoryId,
    date: e.date,
    quantity: e.quantity != null ? String(e.quantity) : '',
    notes: e.notes ?? '',
    merchant: e.merchant ?? '',
    categoryTouched: true,
    suggestion: null,
  }
}

export default function ExpenseForm({
  categories,
  initial,
  submitLabel,
  onSave,
  onCancel,
}: {
  categories: Category[]
  initial?: Expense | null
  submitLabel: string
  onSave: (drafts: ExpenseDraft[]) => void
  onCancel?: () => void
}) {
  const [rows, setRows] = useState<Row[]>(() =>
    initial ? [rowFromExpense(initial)] : [blankRow(todayISO())],
  )
  const [error, setError] = useState('')

  function updateRow(key: string, patch: Partial<Row>) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  }

  function onDescription(key: string, value: string) {
    const suggestion = value.trim().length >= 2 ? suggestCategory(value) : null
    setRows((rs) =>
      rs.map((r) => {
        if (r.key !== key) return r
        const next: Row = { ...r, description: value, suggestion }
        // Auto-apply a confident suggestion only until the user picks a category by hand.
        if (!r.categoryTouched && suggestion) next.categoryId = suggestion
        return next
      }),
    )
  }

  function submit() {
    const drafts: ExpenseDraft[] = []
    for (const [i, r] of rows.entries()) {
      if (!r.description.trim()) {
        setError(`Row ${i + 1}: item ka naam likhein.`)
        return
      }
      const amount = Number(r.amount)
      if (!r.amount || Number.isNaN(amount) || amount <= 0) {
        setError(`Row ${i + 1}: sahi amount (0 se zyada) likhein.`)
        return
      }
      if (!r.date) {
        setError(`Row ${i + 1}: date select karein.`)
        return
      }
      const qty = r.quantity ? Number(r.quantity) : undefined
      if (r.quantity && (Number.isNaN(qty) || (qty as number) <= 0)) {
        setError(`Row ${i + 1}: quantity sahi likhein.`)
        return
      }
      const d: ExpenseDraft = {
        description: r.description.trim(),
        amount,
        categoryId: r.categoryId,
        date: r.date,
      }
      if (qty) d.quantity = qty
      if (r.notes.trim()) d.notes = r.notes.trim()
      if (r.merchant.trim()) d.merchant = r.merchant.trim()
      drafts.push(d)
    }
    setError('')
    onSave(drafts)
    if (!initial) setRows([blankRow(todayISO())])
  }

  return (
    <div className="space-y-4">
      {rows.map((r, i) => (
        <div key={r.key} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">
              {initial ? 'Edit expense' : `Item ${i + 1}`}
            </span>
            {!initial && rows.length > 1 && (
              <button
                type="button"
                aria-label="Remove row"
                onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}
                className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          <label className={labelCls} htmlFor={`desc-${r.key}`}>Item name *</label>
          <input
            id={`desc-${r.key}`}
            className={inputCls}
            placeholder="e.g. Eggs, Milk, School fee..."
            value={r.description}
            onChange={(e) => onDescription(r.key, e.target.value)}
          />
          {r.suggestion && !r.categoryTouched && (
            <p className="mt-1 flex items-center gap-1 text-xs text-green-700">
              <Wand2 className="h-3 w-3" />
              Suggested category: {categories.find((c) => c.id === r.suggestion)?.name ?? r.suggestion} — change kar sakti hain.
            </p>
          )}
          {r.suggestion && r.categoryTouched && r.suggestion !== r.categoryId && (
            <button
              type="button"
              onClick={() => updateRow(r.key, { categoryId: r.suggestion as string, categoryTouched: false })}
              className="mt-1 flex items-center gap-1 text-xs text-green-700 underline"
            >
              <Wand2 className="h-3 w-3" />
              Suggestion use karein: {categories.find((c) => c.id === r.suggestion)?.name}
            </button>
          )}

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} htmlFor={`amt-${r.key}`}>Amount (PKR) *</label>
              <input
                id={`amt-${r.key}`}
                className={inputCls}
                type="number"
                min="1"
                inputMode="decimal"
                placeholder="500"
                value={r.amount}
                onChange={(e) => updateRow(r.key, { amount: e.target.value })}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor={`date-${r.key}`}>Date *</label>
              <input
                id={`date-${r.key}`}
                className={inputCls}
                type="date"
                value={r.date}
                onChange={(e) => updateRow(r.key, { date: e.target.value })}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor={`cat-${r.key}`}>Category</label>
              <select
                id={`cat-${r.key}`}
                className={inputCls}
                value={r.categoryId}
                onChange={(e) => updateRow(r.key, { categoryId: e.target.value, categoryTouched: true })}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor={`qty-${r.key}`}>Quantity (optional)</label>
              <input
                id={`qty-${r.key}`}
                className={inputCls}
                type="number"
                min="1"
                inputMode="decimal"
                placeholder="1"
                value={r.quantity}
                onChange={(e) => updateRow(r.key, { quantity: e.target.value })}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor={`mer-${r.key}`}>Merchant / vendor (optional)</label>
              <input
                id={`mer-${r.key}`}
                className={inputCls}
                placeholder="e.g. Rahat Store"
                value={r.merchant}
                onChange={(e) => updateRow(r.key, { merchant: e.target.value })}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor={`note-${r.key}`}>Notes (optional)</label>
              <input
                id={`note-${r.key}`}
                className={inputCls}
                placeholder="e.g. weekly grocery"
                value={r.notes}
                onChange={(e) => updateRow(r.key, { notes: e.target.value })}
              />
            </div>
          </div>
        </div>
      ))}

      {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {!initial && (
          <GhostButton onClick={() => setRows((rs) => [...rs, blankRow(todayISO())])}>
            <span className="inline-flex items-center gap-1.5"><Plus className="h-4 w-4" /> Add another item</span>
          </GhostButton>
        )}
        <PrimaryButton onClick={submit} className="flex-1 sm:flex-none">{submitLabel}</PrimaryButton>
        {onCancel && <GhostButton onClick={onCancel}>Cancel</GhostButton>}
      </div>
    </div>
  )
}
