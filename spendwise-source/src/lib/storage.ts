import { DEFAULT_CATEGORIES } from './categories'
import { SEED_VERSION, assertSeedTotal, buildSeedExpenses } from './seed'
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
  return { version: SEED_VERSION, expenses, categories: DEFAULT_CATEGORIES, currency: 'PKR' }
}

/** Add any seed expenses missing from an older stored copy (e.g. a new
 * month was added to the seed after the user's first visit). Items the
 * user added themselves are never touched, and seed items are only merged
 * once per seed version, so a seed item the user deliberately deleted
 * after that version is not resurrected. */
export function mergeMissingSeedExpenses(expenses: Expense[]): Expense[] {
  const known = new Set(expenses.map((e) => e.id))
  const missing = buildSeedExpenses().filter((e) => !known.has(e.id))
  return missing.length ? [...missing, ...expenses] : expenses
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
      // Merge in seed expenses added in a later seed version (e.g. November
      // was added after a user first opened the October-only app).
      const storedVersion = typeof parsed.version === 'number' ? parsed.version : 1
      const expenses =
        storedVersion < SEED_VERSION ? mergeMissingSeedExpenses(parsed.expenses) : parsed.expenses
      const store: Store = { ...parsed, expenses, categories, currency: parsed.currency || 'PKR', version: SEED_VERSION }
      if (expenses !== parsed.expenses) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
      }
      return store
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
