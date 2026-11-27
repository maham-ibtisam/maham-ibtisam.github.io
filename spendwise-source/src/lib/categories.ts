import type { Category } from './types'

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'grocery', name: 'Grocery', icon: 'shopping-cart', color: '#16a34a', isDefault: true },
  { id: 'travelling', name: 'Travelling', icon: 'car', color: '#0284c7', isDefault: true },
  { id: 'household', name: 'Household', icon: 'home', color: '#7c3aed', isDefault: true },
  { id: 'utilities', name: 'Utilities & Bills', icon: 'zap', color: '#ea580c', isDefault: true },
  { id: 'food', name: 'Food & Dining', icon: 'utensils', color: '#dc2626', isDefault: true },
  { id: 'family', name: 'Family & Kids', icon: 'users', color: '#db2777', isDefault: true },
  { id: 'shopping', name: 'Shopping', icon: 'shopping-bag', color: '#0891b2', isDefault: true },
  { id: 'healthcare', name: 'Healthcare', icon: 'heart-pulse', color: '#e11d48', isDefault: true },
  { id: 'education', name: 'Education', icon: 'graduation-cap', color: '#4f46e5', isDefault: true },
  { id: 'entertainment', name: 'Entertainment', icon: 'film', color: '#9333ea', isDefault: true },
  { id: 'personal', name: 'Personal Care', icon: 'sparkles', color: '#0d9488', isDefault: true },
  { id: 'other', name: 'Other', icon: 'package', color: '#64748b', isDefault: true },
]

export const CATEGORY_COLORS = [
  '#16a34a', '#0284c7', '#7c3aed', '#ea580c', '#dc2626', '#db2777',
  '#0891b2', '#e11d48', '#4f46e5', '#9333ea', '#0d9488', '#64748b',
  '#ca8a04', '#65a30d',
]

export function categoryById(categories: Category[], id: string): Category {
  return categories.find((c) => c.id === id) ?? categories.find((c) => c.id === 'other') ?? DEFAULT_CATEGORIES[11]
}
