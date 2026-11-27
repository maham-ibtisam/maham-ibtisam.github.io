import { buildSeedExpenses } from '../src/lib/seed.ts'
import { mergeMissingSeedExpenses } from '../src/lib/storage.ts'
import { parseExpenseText } from '../src/lib/parse.ts'
import { suggestCategory } from '../src/lib/categorize.ts'
import { monthStats } from '../src/lib/analytics.ts'
import { DEFAULT_CATEGORIES } from '../src/lib/categories.ts'

let failures = 0
function check(name: string, cond: boolean, extra = '') {
  console.log(`${cond ? 'PASS' : 'FAIL'} ${name} ${extra}`)
  if (!cond) failures++
}

const seed = buildSeedExpenses()
check('seed count = 101', seed.length === 101, `got ${seed.length}`)
check('seed total = 382623', seed.reduce((s, e) => s + e.amount, 0) === 382623)
check('seed Oct month total', monthStats(seed, '2026-10').total === 199619)
check('seed Oct count', monthStats(seed, '2026-10').count === 60)
check('seed Nov month total', monthStats(seed, '2026-11').total === 183004)
check('seed Nov count', monthStats(seed, '2026-11').count === 41)
check('seed undated displayDate', seed.filter((e) => e.displayDate === 'Oct 2026').length === 51)
check('seed Nov displayDate', seed.filter((e) => e.displayDate === 'Nov 2026').length === 41)
check('seed dated items', seed.filter((e) => !e.displayDate).length === 9)
check('seed amounts are numbers', seed.every((e) => typeof e.amount === 'number'))
// Migration: a stored October-only copy (60 items) must gain the 41 November items, keeping its own items.
const octOnly = seed.filter((e) => e.date.startsWith('2026-10'))
const merged = mergeMissingSeedExpenses(octOnly)
check('migration adds Nov to Oct-only copy', merged.length === 101, `got ${merged.length}`)
check('migration Nov total', monthStats(merged, '2026-11').total === 183004)
check('migration is idempotent', mergeMissingSeedExpenses(merged).length === 101)

const parsed = parseExpenseText(`Rainbow grocery = 9500
Buns = 450
Eggs = 280
Lettuce = 250
Kids items = 350
Water bill = 4500
Shawarma = 1000`)
check('whatsapp parse count = 7', parsed.length === 7, `got ${parsed.length}`)
check(
  'whatsapp parse total = 16330',
  parsed.reduce((s, r) => s + (r.amount ?? 0), 0) === 16330,
  `got ${parsed.reduce((s, r) => s + (r.amount ?? 0), 0)}`,
)
check('whatsapp first row', parsed[0].description === 'Rainbow grocery' && parsed[0].amount === 9500)
check('whatsapp water bill category', parsed[5].categoryId === 'utilities')

const alt = parseExpenseText('Eggs - 280\nMilk: 300\nBuns 450\n1 Dozen Eggs - 280\n2 Milk Packs - 600\nEggs = Rs. 280')
check('alt formats count = 6', alt.length === 6, `got ${alt.length}`)
check('alt formats amounts', JSON.stringify(alt.map((r) => r.amount)) === '[280,300,450,280,600,280]', JSON.stringify(alt.map((r) => r.amount)))
check('qty 1 dozen eggs', alt[3].quantity === 1 && alt[3].description === 'Eggs', JSON.stringify(alt[3]))
check('qty 2 milk packs', alt[4].quantity === 2 && alt[4].description === 'Milk Packs', JSON.stringify(alt[4]))

check('categorize milk->grocery', suggestCategory('Milk') === 'grocery')
check('categorize petrol->travelling', suggestCategory('Petrol') === 'travelling')
check('categorize KFC->food', suggestCategory('KFC') === 'food')
check('categorize school fee->education', suggestCategory('School fee') === 'education')
check('categorize unknown->null', suggestCategory('Xyzabc random') === null)
check('12 default categories', DEFAULT_CATEGORIES.length === 12)

const bad = parseExpenseText('just some words\n\n= 500')
check(
  'no amount invented: text-only line kept with blank amount, amount-only line dropped',
  bad.length === 1 && bad[0].amount === null && bad[0].description === 'just some words',
  `got ${JSON.stringify(bad)}`,
)

if (failures) {
  console.error(`${failures} FAILURES`)
  process.exit(1)
}
console.log('ALL LOGIC TESTS PASSED')
