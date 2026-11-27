import { suggestCategory } from './categorize'
import type { ParsedRow } from './types'
import { uid } from './utils'

/**
 * Parse one expense line in any of these formats:
 *   Item = 500      Item - 500      Item: 500      Item 500
 *   Eggs = Rs. 280  1 Dozen Eggs - 280   2 Milk Packs - 600
 * Returns null for blank / unparseable lines (never invents an amount).
 */
export function parseExpenseLine(line: string): ParsedRow | null {
  const raw = line.trim()
  if (!raw) return null
  // Skip obvious headers / totals lines that are not items
  if (/^(total|grand total|subtotal)\b/i.test(raw) && !/[-=:]\s*\d/.test(raw)) return null

  let text = raw
    // strip leading bullets / list numbering ("- ", "• ", "1. ", "2) ") —
    // but NOT a bare leading number, which may be a quantity ("2 Milk ...")
    .replace(/^(?:[-•]\s+|\d+[.)]\s+)/, '')
    .trim()

  // Leading quantity: "2 Milk Packs - 600" / "1 Dozen Eggs 280"
  let quantity: number | undefined
  const qtyMatch = text.match(/^(\d+(?:\.\d+)?)\s+(?:x|dozen|pack|packs|kg|pcs|pieces)?\s*/i)
  // Only treat as quantity when a price separator/number follows later;
  // "2 Milk Packs - 600" -> qty 2, rest "Milk Packs - 600"
  if (qtyMatch && /[-=:]\s*(?:rs\.?\s*)?\d/.test(text.slice(qtyMatch[0].length)) ) {
    quantity = Number(qtyMatch[1])
    text = text.slice(qtyMatch[0].length).trim()
  } else if (qtyMatch && /\s\d[\d,]*\s*$/.test(text)) {
    // "2 Milk 600" — ambiguous, keep the leading number as part of the name
    // rather than guessing a quantity.
  }

  // Amount is the LAST number in the line (handles "Eggs 2 packs 500")
  const amountMatch = text.match(/(?:rs\.?\s*)?([\d,]+(?:\.\d{1,2})?)\s*$/
  )
  let amount: number | null = null
  let description = text
  if (amountMatch) {
    amount = Number(amountMatch[1].replace(/,/g, ''))
    description = text.slice(0, amountMatch.index).trim()
  }
  // Remove trailing separator left after cutting the amount: "Eggs =", "Eggs -"
  description = description.replace(/[-=:]\s*$/, '').replace(/^rs\.?\s*/i, '').trim()
  // Remove a leading "Rs." that belonged to the amount
  description = description.replace(/\s+rs\.?$/i, '').trim()
  if (!description) return null
  if (amount !== null && !(amount > 0)) amount = null

  const suggested = suggestCategory(description)
  return {
    id: uid(),
    description,
    amount,
    quantity,
    categoryId: suggested ?? 'other',
    confidence: amount !== null ? 0.9 : 0.3,
    raw,
  }
}

export function parseExpenseText(text: string): ParsedRow[] {
  return text
    .split(/\r?\n/)
    .map((l) => parseExpenseLine(l))
    .filter((r): r is ParsedRow => r !== null)
}
