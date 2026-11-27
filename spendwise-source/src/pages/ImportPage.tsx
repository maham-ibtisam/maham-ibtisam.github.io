import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Card, EmptyState, GhostButton, PrimaryButton, inputCls, labelCls } from '../components/ui'
import { parseExpenseText } from '../lib/parse'
import type { Category, ParsedRow } from '../lib/types'
import { formatMoney, todayISO } from '../lib/utils'

const EXAMPLE = `Rainbow grocery = 9500
Buns = 450
Eggs = 280
Lettuce = 250
Kids items = 350
Water bill = 4500
Shawarma = 1000`

export default function ImportPage({
  categories,
  onSave,
  onSaved,
}: {
  categories: Category[]
  onSave: (rows: ParsedRow[], date: string) => void
  onSaved: (message: string) => void
}) {
  const [text, setText] = useState('')
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [date, setDate] = useState(todayISO())

  function parse() {
    const parsed = parseExpenseText(text)
    setRows(parsed)
  }

  const total = rows.reduce((s, r) => s + (r.amount ?? 0), 0)
  const missingAmount = rows.filter((r) => r.amount === null).length

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900">WhatsApp Expense Import</h2>
        <p className="text-sm text-slate-500">
          Paste expense lines copied from WhatsApp — one per line. Nothing is saved until you review and confirm below.
        </p>
      </div>

      <Card>
        <label className={labelCls} htmlFor="import-text">Paste expenses</label>
        <textarea
          id="import-text"
          className={`${inputCls} min-h-40 font-mono`}
          placeholder={EXAMPLE}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <PrimaryButton onClick={parse}>Parse &amp; preview</PrimaryButton>
          <GhostButton onClick={() => setText(EXAMPLE)}>Load example</GhostButton>
          <GhostButton onClick={() => { setText(''); setRows([]) }}>Clear</GhostButton>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Supported: <code>Item = 500</code> · <code>Item - 500</code> · <code>Item: 500</code> · <code>Item 500</code>
        </p>
      </Card>

      {rows.length > 0 && (
        <Card>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-900">Preview — check before saving</h3>
              <p className="text-xs text-slate-500">Edit any row. Rows without an amount are left blank — fill one in or remove the row.</p>
            </div>
            <div>
              <label className={labelCls} htmlFor="import-date">Date for all items</label>
              <input id="import-date" className={inputCls} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.id} className="grid grid-cols-[1fr_110px_36px] items-center gap-2 rounded-xl border border-slate-200 p-2 sm:grid-cols-[1fr_130px_150px_36px]">
                <input
                  className={inputCls}
                  value={r.description}
                  aria-label="Item name"
                  onChange={(e) => setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, description: e.target.value } : x)))}
                />
                <input
                  className={inputCls}
                  type="number"
                  min="1"
                  placeholder="Amount"
                  aria-label="Amount"
                  value={r.amount ?? ''}
                  onChange={(e) =>
                    setRows((rs) =>
                      rs.map((x) => (x.id === r.id ? { ...x, amount: e.target.value ? Number(e.target.value) : null } : x)),
                    )
                  }
                />
                <select
                  className={`${inputCls} col-span-3 sm:col-span-1`}
                  aria-label="Category"
                  value={r.categoryId}
                  onChange={(e) => setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, categoryId: e.target.value } : x)))}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <button
                  aria-label={`Remove ${r.description}`}
                  onClick={() => setRows((rs) => rs.filter((x) => x.id !== r.id))}
                  className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                {r.amount === null && (
                  <p className="col-span-3 text-xs font-medium text-amber-700">⚠ Amount not detected — please add it or remove this row.</p>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
            <p className="text-sm text-slate-600">
              {rows.length} items · Total <strong className="text-slate-900">{formatMoney(total)}</strong>
              {missingAmount > 0 ? ` · ${missingAmount} row(s) missing an amount` : ''}
            </p>
            <PrimaryButton
              disabled={rows.length === 0 || missingAmount > 0 || rows.some((r) => !r.description.trim())}
              onClick={() => {
                onSave(rows, date)
                onSaved(`Imported ${rows.length} expenses — total ${formatMoney(total)}.`)
                setRows([])
                setText('')
              }}
            >
              Confirm &amp; save {rows.length} expenses
            </PrimaryButton>
          </div>
        </Card>
      )}

      {rows.length === 0 && <EmptyState title="No preview yet" body="Paste your WhatsApp list above and tap “Parse & preview”. You can edit, remove, or correct every row before anything is saved." />}
    </div>
  )
}
