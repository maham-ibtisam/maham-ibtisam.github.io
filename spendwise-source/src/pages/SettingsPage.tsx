import { Pencil, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { Card, GhostButton, PrimaryButton, inputCls } from '../components/ui'
import { CATEGORY_COLORS } from '../lib/categories'
import { ICON_OPTIONS, iconFor } from '../lib/categoryIcons'
import type { Category, Expense, Store } from '../lib/types'
import { downloadFile, expensesToCsv } from '../lib/utils'

export default function SettingsPage({
  store,
  onCurrencyChange,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onRestore,
  onClearAll,
  onSaved,
}: {
  store: Store
  onCurrencyChange: (c: string) => void
  onAddCategory: (c: Category) => void
  onUpdateCategory: (id: string, patch: Partial<Category>) => void
  onDeleteCategory: (id: string) => void
  onRestore: (incoming: Expense[], mode: 'merge' | 'replace') => void
  onClearAll: () => void
  onSaved: (message: string) => void
}) {
  const [newName, setNewName] = useState('')
  const [newIcon, setNewIcon] = useState('package')
  const [newColor, setNewColor] = useState(CATEGORY_COLORS[0])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [pendingRestore, setPendingRestore] = useState<Expense[] | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function exportCsv() {
    downloadFile(
      'spendwise-expenses.csv',
      expensesToCsv(store.expenses, (id) => store.categories.find((c) => c.id === id)?.name ?? id),
      'text/csv',
    )
    onSaved('CSV export downloaded.')
  }

  function exportJson() {
    downloadFile('spendwise-backup.json', JSON.stringify(store, null, 2), 'application/json')
    onSaved('JSON backup downloaded — keep it safe, it restores everything.')
  }

  async function onBackupFile(file: File | undefined) {
    if (!file) return
    try {
      const parsed: unknown = JSON.parse(await file.text())
      const expenses: Expense[] = Array.isArray(parsed)
        ? (parsed as Expense[])
        : Array.isArray((parsed as { expenses?: unknown }).expenses)
          ? ((parsed as { expenses: Expense[] }).expenses)
          : []
      const valid = expenses.filter((e) => e && typeof e.description === 'string' && typeof e.amount === 'number' && e.amount > 0 && typeof e.date === 'string')
      if (!valid.length) {
        onSaved('That file has no valid expenses to restore.')
        return
      }
      setPendingRestore(valid)
    } catch {
      onSaved('Could not read that backup file — is it a SpendWise JSON backup?')
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-slate-900">Settings &amp; Data</h2>

      <Card>
        <h3 className="mb-3 font-semibold text-slate-900">Currency</h3>
        <select
          aria-label="Currency"
          className={inputCls}
          value={store.currency}
          onChange={(e) => {
            onCurrencyChange(e.target.value)
            onSaved(`Currency set to ${e.target.value}. Amounts are stored as PKR values.`)
          }}
        >
          {['PKR', 'USD', 'GBP', 'EUR', 'AED', 'SAR', 'INR'].map((c) => (
            <option key={c} value={c}>{c}{c === 'PKR' ? ' (default)' : ''}</option>
          ))}
        </select>
        <p className="mt-2 text-xs text-slate-500">Amounts are stored as numeric PKR values; changing the label does not convert past amounts.</p>
      </Card>

      <Card>
        <h3 className="mb-3 font-semibold text-slate-900">Categories</h3>
        <ul className="space-y-2">
          {store.categories.map((c) => {
            const Icon = iconFor(c.icon)
            return (
              <li key={c.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 px-3 py-2">
                {editingId === c.id ? (
                  <span className="flex flex-1 gap-2">
                    <input className={inputCls} value={editName} onChange={(e) => setEditName(e.target.value)} aria-label="Category name" />
                    <PrimaryButton onClick={() => { if (editName.trim()) onUpdateCategory(c.id, { name: editName.trim() }); setEditingId(null) }}>Save</PrimaryButton>
                    <GhostButton onClick={() => setEditingId(null)}>Cancel</GhostButton>
                  </span>
                ) : (
                  <>
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <span className="rounded-full p-1.5" style={{ backgroundColor: `${c.color}1a`, color: c.color }}>
                        <Icon className="h-4 w-4" />
                      </span>
                      {c.name}
                      {c.isDefault ? <span className="text-xs font-normal text-slate-400">default</span> : null}
                    </span>
                    <span className="flex gap-1">
                      <button aria-label={`Edit ${c.name}`} onClick={() => { setEditingId(c.id); setEditName(c.name) }} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
                        <Pencil className="h-4 w-4" />
                      </button>
                      {!c.isDefault && (
                        <button
                          aria-label={`Delete ${c.name}`}
                          onClick={() => {
                            if (window.confirm(`Delete category "${c.name}"? Its expenses will move to Other.`)) onDeleteCategory(c.id)
                          }}
                          className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </span>
                  </>
                )}
              </li>
            )
          })}
        </ul>
        <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_140px_120px_auto]">
          <input className={inputCls} placeholder="New category name" value={newName} onChange={(e) => setNewName(e.target.value)} aria-label="New category name" />
          <select className={inputCls} value={newIcon} onChange={(e) => setNewIcon(e.target.value)} aria-label="Icon">
            {ICON_OPTIONS.map((i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
          <select className={inputCls} value={newColor} onChange={(e) => setNewColor(e.target.value)} aria-label="Colour">
            {CATEGORY_COLORS.map((col) => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
          <PrimaryButton
            onClick={() => {
              if (!newName.trim()) return
              onAddCategory({ id: `cat-${Date.now().toString(36)}`, name: newName.trim(), icon: newIcon, color: newColor })
              setNewName('')
              onSaved(`Category "${newName.trim()}" added.`)
            }}
          >
            Add category
          </PrimaryButton>
        </div>
      </Card>

      <Card>
        <h3 className="mb-1 font-semibold text-slate-900">Export &amp; backup</h3>
        <p className="mb-3 text-sm text-slate-500">Your data lives in this browser’s localStorage. Export regularly — a backup is the only way to move it to another device.</p>
        <div className="flex flex-wrap gap-2">
          <PrimaryButton onClick={exportCsv}>Export CSV</PrimaryButton>
          <PrimaryButton onClick={exportJson}>Export JSON backup</PrimaryButton>
          <GhostButton onClick={() => fileRef.current?.click()}>Import JSON backup…</GhostButton>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => { void onBackupFile(e.target.files?.[0]); e.target.value = '' }} />
        </div>
        {pendingRestore && (
          <div className="mt-3 rounded-xl bg-amber-50 p-3">
            <p className="text-sm font-medium text-amber-800">
              Backup has {pendingRestore.length} valid expenses. Existing data is <strong>not</strong> overwritten silently — choose:
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <PrimaryButton
                onClick={() => { onRestore(pendingRestore, 'merge'); onSaved(`Merged ${pendingRestore.length} expenses from backup (duplicates by id skipped).`); setPendingRestore(null) }}
              >
                Merge — keep existing
              </PrimaryButton>
              <GhostButton
                onClick={() => {
                  if (window.confirm('Replace ALL current expenses with the backup? This cannot be undone.')) {
                    onRestore(pendingRestore, 'replace')
                    onSaved(`Restored ${pendingRestore.length} expenses from backup (replaced current data).`)
                    setPendingRestore(null)
                  }
                }}
              >
                Replace all
              </GhostButton>
              <GhostButton onClick={() => setPendingRestore(null)}>Cancel</GhostButton>
            </div>
          </div>
        )}
      </Card>

      <Card>
        <h3 className="mb-1 font-semibold text-red-700">Danger zone</h3>
        <p className="mb-3 text-sm text-slate-500">Clearing deletes all expenses and categories from this browser. Export a JSON backup first.</p>
        <button
          type="button"
          onClick={() => {
            if (window.confirm('Delete ALL SpendWise data from this browser? This cannot be undone.')) {
              if (window.confirm('Are you really sure? Export a backup first if you have not already.')) onClearAll()
            }
          }}
          className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
        >
          Clear all data
        </button>
      </Card>
    </div>
  )
}
