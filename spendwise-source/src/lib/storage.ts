import { DEFAULT_CATEGORIES } from './categories'
import { assertSeedTotal, buildSeedExpenses } from './seed'
import type { Category, Expense, Store } from './types'

export const STORAGE_KEY = 'spendwise-v1'

/**
 * Modular storage layer.
 * Today this is browser localStorage (GitHub Pages has no backend).
 * To move to Supabase later, replace only this file's load/save
 * implementations — every page/component uses this interface.
 */
export interface StorageAdapter {
  load(): Store
  save(store: Store): void
  clear(): void
}

function defaultStore(): Store {
  const expenses = buildSeedExpenses()
  assertSeedTotal(expenses)
  return { version: 1, expenses, categories: DEFAULT_CATEGORIES, currency: 'PKR' }
}

function isValidStore(v: unknown): v is Store {
  if (!v || typeof v !== 'object') return false
  const s = v as Partial<Store>
  return Array.isArray(s.expenses) && Array.isArray(s.categories)
}

export const localStorageAdapter: StorageAdapter = {
  load(): Store {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) {
        // First run only: seed with Maham's real October 2026 expenses.
        const store = defaultStore()
        localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
        return store
      }
      const parsed: unknown = JSON.parse(raw)
      if (!isValidStore(parsed)) return defaultStore()
      // Merge in any new default categories added in later versions.
      const known = new Set(parsed.categories.map((c) => c.id))
      const categories: Category[] = [
        ...parsed.categories,
        ...DEFAULT_CATEGORIES.filter((c) => !known.has(c.id)),
      ]
      return { ...parsed, categories, currency: parsed.currency || 'PKR' }
    } catch {
      return defaultStore()
    }
  },
  save(store: Store): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
    } catch {
      // Storage full / private mode — data stays in memory for this session.
      console.error('SpendWise: could not save to localStorage')
    }
  },
  clear(): void {
    localStorage.removeItem(STORAGE_KEY)
  },
}

export function newExpense(partial: {
  description: string
  amount: number
  categoryId: string
  date: string
  quantity?: number
  notes?: string
  merchant?: string
  transactionId?: string
  displayDate?: string
}): Expense {
  const now = new Date().toISOString()
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
  const expense: Expense = {
    id,
    description: partial.description,
    amount: partial.amount,
    categoryId: partial.categoryId,
    date: partial.date,
    transactionId: partial.transactionId ?? id,
    createdAt: now,
    updatedAt: now,
  }
  if (partial.quantity != null) expense.quantity = partial.quantity
  if (partial.notes) expense.notes = partial.notes
  if (partial.merchant) expense.merchant = partial.merchant
  if (partial.displayDate) expense.displayDate = partial.displayDate
  return expense
}
