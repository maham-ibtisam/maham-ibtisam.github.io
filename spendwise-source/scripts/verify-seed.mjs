// Verifies Maham's real October 2026 seed data in src/lib/seed.ts:
// 60 items, total Rs 199,619. Run: npm run verify-seed
import { readFileSync } from 'node:fs'

const src = readFileSync(new URL('../src/lib/seed.ts', import.meta.url), 'utf8')
const rows = [...src.matchAll(/^\s*\['([^']+)',\s*(\d+),/gm)]
const total = rows.reduce((s, [, , amt]) => s + Number(amt), 0)

console.log(`Seed rows: ${rows.length}, total: Rs ${total.toLocaleString('en-PK')}`)
if (rows.length !== 60 || total !== 199619) {
  console.error('FAIL: expected 60 items / Rs 199,619')
  process.exit(1)
}
console.log('OK: seed matches the real October 2026 list.')
