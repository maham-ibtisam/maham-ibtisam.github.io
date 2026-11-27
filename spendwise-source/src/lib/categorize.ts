/**
 * Rule-based smart categorization. No AI, no API.
 * Returns a category id, or null when nothing matches confidently —
 * callers must then let the user pick (never silently assign uncertain).
 * Rules are checked in priority order: specific phrases first.
 */
const RULES: Array<{ categoryId: string; keywords: string[] }> = [
  { categoryId: 'education', keywords: ['school fee', 'school', 'books', 'stationary', 'stationery', 'tuition', 'exam fee'] },
  { categoryId: 'healthcare', keywords: ['medicine', 'doctor', 'hospital', 'pharmacy', 'clinic', 'lab test'] },
  { categoryId: 'utilities', keywords: ['electricity', 'sui', 'sngpl', 'wasa', 'internet', 'water bill', 'gas bill', 'bill', 'rox package', 'esim', 'water', 'sewerage'] },
  { categoryId: 'household', keywords: ['maid', 'sakina', 'shamim', 'saim', 'mali', 'locker', 'sakkina', 'jaru', 'cleaning', 'plumber', 'electrician'] },
  { categoryId: 'family', keywords: ['ahmad', 'hashir', 'kids', 'pampers', 'birthday', 'gift', 'ganiya', 'toy', 'park', 'uniform', 'baby'] },
  { categoryId: 'food', keywords: ['kfc', 'cock', 'bull', 'kulfi', 'chai', 'paratha', 'roll', 'shawarma', 'pizza', 'burger', 'restaurant', 'cake', 'bakes', 'dining', 'cafe', 'coffee'] },
  { categoryId: 'travelling', keywords: ['petrol', 'fuel', 'careem', 'uber', 'parking', 'taxi', 'bus fare', 'train', 'flight', 'toll'] },
  { categoryId: 'entertainment', keywords: ['movie', 'cinema', 'subscription', 'netflix', 'spotify', 'game'] },
  { categoryId: 'personal', keywords: ['hair cut', 'haircut', 'salon', 'barber', 'shampoo'] },
  { categoryId: 'shopping', keywords: ['shirt', 'shoes', 'clothes', 'shopping', 'dress'] },
  { categoryId: 'grocery', keywords: ['grocery', 'milk', 'egg', 'bread', 'atta', 'flour', 'rice', 'sugar', 'maida', 'sabzi', 'vegetable', 'fruit', 'apple', 'banana', 'chicken', 'snack', 'store', 'market', 'dry milk', 'corn', 'lettuce', 'buns', 'oil', 'ghee', 'daal', 'spice'] },
]

export function suggestCategory(description: string): string | null {
  const text = description.toLowerCase()
  for (const rule of RULES) {
    if (rule.keywords.some((k) => text.includes(k))) return rule.categoryId
  }
  return null
}

/** Suggested category, falling back to 'other' only when the caller
    explicitly wants a default (e.g. seed data). UI entry forms use
    suggestCategory() directly so an uncertain item stays unassigned. */
export function suggestCategoryOrOther(description: string): string {
  return suggestCategory(description) ?? 'other'
}
