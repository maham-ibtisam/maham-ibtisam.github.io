// Downloads/copies the free, open-source Tesseract.js runtime assets so the
// Smart Scanner is self-hosted (no CDN needed at runtime, no API key).
// - worker.min.js: copied from node_modules/tesseract.js/dist
// - core files: all tesseract.js-core files (lstm + simd-lstm, js + wasm)
// - eng.traineddata.gz: LSTM-only English data from tesseract-ocr/tessdata_fast
//   (Apache 2.0), gzipped locally — Tesseract.js v5 loads
//   `${langPath}eng.traineddata.gz` by default.
// Run: npm run setup-ocr   (also run automatically in GitHub Actions)
import { copyFileSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'public', 'tesseract')
mkdirSync(out, { recursive: true })

const nm = join(root, 'node_modules')
copyFileSync(join(nm, 'tesseract.js', 'dist', 'worker.min.js'), join(out, 'worker.min.js'))
for (const f of readdirSync(join(nm, 'tesseract.js-core'))) {
  if (/^tesseract-core-/.test(f)) copyFileSync(join(nm, 'tesseract.js-core', f), join(out, f))
}

const langGz = join(out, 'eng.traineddata.gz')
if (!existsSync(langGz)) {
  const url = 'https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/main/eng.traineddata'
  console.log('Downloading eng.traineddata (tessdata_fast) ...')
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to download eng.traineddata: ${res.status}`)
  writeFileSync(langGz, gzipSync(Buffer.from(await res.arrayBuffer())))
}
console.log('OCR assets ready in public/tesseract/')
