export interface Category {
  id: string
  name: string
  /** lucide icon key, see src/lib/categoryIcons.ts */
  icon: string
  color: string
  isDefault?: boolean
}

export interface Expense {
  id: string
  description: string
  /** numeric PKR, never a formatted string */
  amount: number
  categoryId: string
  /** ISO date YYYY-MM-DD, local (Asia/Karachi) calendar date, no time shift */
  date: string
  /** Shown instead of the formatted date when the exact day is unknown,
      e.g. "Oct 2026" for Maham's undated October items. */
  displayDate?: string
  quantity?: number
  notes?: string
  merchant?: string
  transactionId: string
  createdAt: string
  updatedAt: string
}

export interface Store {
  version: number
  expenses: Expense[]
  categories: Category[]
  currency: string
}

export type View =
  | 'dashboard'
  | 'add'
  | 'history'
  | 'analytics'
  | 'import'
  | 'scanner'
  | 'settings'

export interface ParsedRow {
  id: string
  description: string
  amount: number | null
  quantity?: number
  categoryId: string
  /** 0..1 OCR / parse confidence; null when not applicable */
  confidence: number | null
  raw: string
}
