import {
  BarChart3,
  Camera,
  History as HistoryIcon,
  LayoutDashboard,
  PlusCircle,
  Settings as SettingsIcon,
  Upload,
  Wallet,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import type { ExpenseDraft } from './components/ExpenseForm'
import { DEFAULT_CATEGORIES } from './lib/categories'
import { localStorageAdapter, newExpense } from './lib/storage'
import type { Category, Expense, ParsedRow, Store, View } from './lib/types'
import { formatMoney, monthKey, sum, todayISO, uid } from './lib/utils'
import AddExpensePage from './pages/AddExpensePage'
import Analytics from './pages/Analytics'
import Dashboard from './pages/Dashboard'
import History from './pages/History'
import ImportPage from './pages/ImportPage'
import ScannerPage from './pages/ScannerPage'
import SettingsPage from './pages/SettingsPage'

const NAV: Array<{ id: View; label: string; short: string; icon: typeof LayoutDashboard }> = [
  { id: 'dashboard', label: 'Dashboard', short: 'Home', icon: LayoutDashboard },
  { id: 'add', label: 'Add Expense', short: 'Add', icon: PlusCircle },
  { id: 'history', label: 'History', short: 'History', icon: HistoryIcon },
  { id: 'analytics', label: 'Analytics', short: 'Insights', icon: BarChart3 },
  { id: 'import', label: 'Import', short: 'Import', icon: Upload },
  { id: 'scanner', label: 'Smart Scanner', short: 'Scan', icon: Camera },
  { id: 'settings', label: 'Settings', short: 'Settings', icon: SettingsIcon },
]

export default function App() {
  const [store, setStore] = useState<Store>(() => localStorageAdapter.load())
  const [view, setView] = useState<View>('dashboard')
  const [toast, setToast] = useState('')

  useEffect(() => {
    localStorageAdapter.save(store)
  }, [store])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const { expenses, categories, currency } = store
  const thisMonthTotal = sum(expenses.filter((e) => monthKey(e.date) === monthKey(todayISO())))

  function addDrafts(drafts: ExpenseDraft[], transactionId = uid()) {
    const now = new Date().toISOString()
    const made: Expense[] = drafts.map((d) => {
      const e = newExpense({ ...d, transactionId })
      e.createdAt = now
      e.updatedAt = now
      return e
    })
    setStore((s) => ({ ...s, expenses: [...made, ...s.expenses] }))
  }

  function addParsedRows(rows: ParsedRow[], date: string) {
    const transactionId = uid()
    addDrafts(
      rows
        .filter((r) => r.amount !== null && r.description.trim())
        .map((r) => ({
          description: r.description.trim(),
          amount: r.amount as number,
          categoryId: r.categoryId,
          date,
          quantity: r.quantity,
        })),
      transactionId,
    )
  }

  function updateExpense(id: string, draft: ExpenseDraft) {
    setStore((s) => ({
      ...s,
      expenses: s.expenses.map((e) =>
        e.id === id
          ? { ...e, ...draft, quantity: draft.quantity, notes: draft.notes, merchant: draft.merchant, updatedAt: new Date().toISOString() }
          : e,
      ),
    }))
    setToast('Expense updated.')
  }

  function deleteExpense(id: string) {
    setStore((s) => ({ ...s, expenses: s.expenses.filter((e) => e.id !== id) }))
    setToast('Expense deleted.')
  }

  function restore(incoming: Expense[], mode: 'merge' | 'replace') {
    setStore((s) => {
      if (mode === 'replace') return { ...s, expenses: incoming }
      const known = new Set(s.expenses.map((e) => e.id))
      return { ...s, expenses: [...s.expenses, ...incoming.filter((e) => !known.has(e.id))] }
    })
  }

  function clearAll() {
    setStore({ version: 1, expenses: [], categories: DEFAULT_CATEGORIES, currency: 'PKR' })
    setToast('All data cleared.')
  }

  function deleteCategory(id: string) {
    setStore((s) => ({
      ...s,
      categories: s.categories.filter((c) => c.id !== id),
      expenses: s.expenses.map((e) => (e.categoryId === id ? { ...e, categoryId: 'other' } : e)),
    }))
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <button type="button" onClick={() => setView('dashboard')} className="flex items-center gap-2.5">
            <span className="rounded-xl bg-green-600 p-2 text-white">
              <Wallet className="h-5 w-5" />
            </span>
            <span className="text-left">
              <span className="block text-lg font-bold leading-tight">SpendWise</span>
              <span className="block text-[11px] text-slate-500">Personal expense tracker · PKR</span>
            </span>
          </button>
          <div className="hidden text-right sm:block">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">This month</p>
            <p className="text-base font-bold text-green-700">{formatMoney(thisMonthTotal, currency)}</p>
          </div>
          <button
            type="button"
            onClick={() => setView('add')}
            className="rounded-xl bg-green-600 px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
          >
            + Add expense
          </button>
        </div>
        {/* Desktop nav */}
        <nav className="mx-auto hidden max-w-6xl gap-1 overflow-x-auto px-4 pb-2 lg:flex" aria-label="Main navigation">
          {NAV.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => setView(n.id)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium ${
                view === n.id ? 'bg-green-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-4 sm:pt-6 lg:pb-10">
        {view === 'dashboard' && <Dashboard expenses={expenses} categories={categories} currency={currency} />}
        {view === 'add' && <AddExpensePage categories={categories} onSave={addDrafts} onSaved={setToast} />}
        {view === 'history' && (
          <History expenses={expenses} categories={categories} currency={currency} onUpdate={updateExpense} onDelete={deleteExpense} />
        )}
        {view === 'analytics' && <Analytics expenses={expenses} categories={categories} currency={currency} />}
        {view === 'import' && <ImportPage categories={categories} onSave={addParsedRows} onSaved={setToast} />}
        {view === 'scanner' && <ScannerPage categories={categories} onSave={addParsedRows} onSaved={setToast} />}
        {view === 'settings' && (
          <SettingsPage
            store={store}
            onCurrencyChange={(c) => setStore((s) => ({ ...s, currency: c }))}
            onAddCategory={(c: Category) => setStore((s) => ({ ...s, categories: [...s.categories, c] }))}
            onUpdateCategory={(id, patch) =>
              setStore((s) => ({ ...s, categories: s.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)) }))
            }
            onDeleteCategory={deleteCategory}
            onRestore={restore}
            onClearAll={clearAll}
            onSaved={setToast}
          />
        )}
        <p className="mt-8 text-center text-xs text-slate-400">
          Data is stored only in this browser (localStorage). Export a JSON backup regularly. OCR runs locally with free Tesseract.js — no API key, no uploads.
        </p>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white lg:hidden" aria-label="Mobile navigation">
        <div className="grid grid-cols-7">
          {NAV.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => setView(n.id)}
              className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${
                view === n.id ? 'text-green-700' : 'text-slate-500'
              }`}
            >
              <n.icon className="h-5 w-5" />
              {n.short}
            </button>
          ))}
        </div>
      </nav>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center justify-between gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-lg lg:bottom-6" role="status">
          <span>{toast}</span>
          <button type="button" aria-label="Dismiss" onClick={() => setToast('')} className="rounded-lg p-1 hover:bg-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
