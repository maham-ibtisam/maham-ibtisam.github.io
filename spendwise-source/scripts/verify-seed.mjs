// Verifies Maham's real October + November 2026 seed data in src/lib/seed.ts:
// Oct 60 items / Rs 199,619; Nov 41 items / Rs 183,004; combined 101 / Rs 382,623.
// Run: npm run verify-seed
import { readFileSync } from 'node:fs'

const src = readFileSync(new URL('../src/lib/seed.ts', import.meta.url), 'utf8')
const rows = [...src.matchAll(/^\s*\['([^']+)',\s*(\d+),/gm)]
const total = rows.reduce((s, [, , amt]) => s + Number(amt), 0)
const octRows = [...src.matchAll(/'2026-10-/g)].length
const novRows = [...src.matchAll(/'2026-11-/g)].length

console.log(`Seed rows: ${rows.length} (Oct ${octRows}, Nov ${novRows}), total: Rs ${total.toLocaleString('en-PK')}`)
if (rows.length !== 101 || total !== 382623 || octRows !== 60 || novRows !== 41) {
  console.error('FAIL: expected 101 items / Rs 382,623 (Oct 60, Nov 41)')
  process.exit(1)
}
console.log('OK: seed matches the real October + November 2026 lists.')
