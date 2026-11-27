import { Camera, ImagePlus, RotateCw, Trash2, Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import Tesseract from 'tesseract.js'
import { Card, EmptyState, GhostButton, PrimaryButton, inputCls, labelCls } from '../components/ui'
import { parseExpenseLine } from '../lib/parse'
import type { Category, ParsedRow } from '../lib/types'
import { formatMoney, todayISO } from '../lib/utils'

/**
 * Smart Scanner — 100% free, local OCR (Tesseract.js, no API key).
 * Images are processed in the browser only and never uploaded anywhere.
 * Temporary image data is deleted when you remove it or leave the page.
 *
 * OCR worker / core / language files are self-hosted under /tesseract/
 * (see scripts/setup-ocr-assets.mjs). If those assets are unavailable,
 * Tesseract falls back to its default loading — and any failure shows a
 * clear error with a manual-entry fallback instead of inventing data.
 */
export default function ScannerPage({
  categories,
  onSave,
  onSaved,
}: {
  categories: Category[]
  onSave: (rows: ParsedRow[], date: string) => void
  onSaved: (message: string) => void
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [rotation, setRotation] = useState(0)
  const [status, setStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [rawText, setRawText] = useState('')
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [date, setDate] = useState(todayISO())
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const dragRef = useRef<HTMLDivElement>(null)

  // Delete temp image data when leaving the scanner.
  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl)
    }
  }, [imageUrl])

  function loadFile(file: File | undefined | null) {
    if (!file) return
    if (!/^image\/(jpeg|png|webp|jpg)$/.test(file.type)) {
      setError('Please choose a JPG, PNG or WEBP image.')
      setStatus('error')
      return
    }
    if (imageUrl) URL.revokeObjectURL(imageUrl)
    setImageUrl(URL.createObjectURL(file))
    setRotation(0)
    setRows([])
    setRawText('')
    setError('')
    setStatus('idle')
  }

  function preprocess(dataUrl: string, rotateDeg: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const maxSide = 1600
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        const rad = (rotateDeg * Math.PI) / 180
        const swapped = rotateDeg % 180 !== 0
        canvas.width = swapped ? h : w
        canvas.height = swapped ? w : h
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('Canvas not supported'))
        ctx.translate(canvas.width / 2, canvas.height / 2)
        ctx.rotate(rad)
        ctx.drawImage(img, -w / 2, -h / 2, w, h)
        // Grayscale + contrast enhancement, basic noise reduction.
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const px = data.data
        for (let i = 0; i < px.length; i += 4) {
          const g = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]
          const c = Math.max(0, Math.min(255, (g - 128) * 1.4 + 128))
          px[i] = c
          px[i + 1] = c
          px[i + 2] = c
        }
        ctx.putImageData(data, 0, 0)
        resolve(canvas.toDataURL('image/png'))
      }
      img.onerror = () => reject(new Error('Could not read this image.'))
      img.src = dataUrl
    })
  }

  async function runOcr() {
    if (!imageUrl) return
    setStatus('processing')
    setProgress(0)
    setError('')
    try {
      const processed = await preprocess(imageUrl, rotation)
      const base = import.meta.env.BASE_URL
      // Tesseract.js v5: workerPath is a file, corePath and langPath are
      // directories. Self-hosted assets live in public/tesseract/.
      const localOptions = {
        workerPath: `${base}tesseract/worker.min.js`,
        corePath: `${base}tesseract`,
        langPath: `${base}tesseract/`,
        cacheMethod: 'none' as const,
      }
      let result
      try {
        result = await Tesseract.recognize(processed, 'eng', {
          logger: (m) => {
            if (m.status === 'recognizing text') setProgress(Math.round((m.progress ?? 0) * 100))
          },
          ...localOptions,
        })
      } catch {
        // Self-hosted assets unavailable — try Tesseract's default loading once.
        result = await Tesseract.recognize(processed, 'eng', {
          logger: (m) => {
            if (m.status === 'recognizing text') setProgress(Math.round((m.progress ?? 0) * 100))
          },
        })
      }
      const text = result.data.text ?? ''
      setRawText(text)
      const overall = (result.data.confidence ?? 0) / 100
      const parsed = text
        .split(/\r?\n/)
        .map((l) => parseExpenseLine(l))
        .filter((r): r is ParsedRow => r !== null)
        .map((r) => ({ ...r, confidence: r.amount !== null ? overall : 0.3 }))
      setRows(parsed)
      setStatus(parsed.length ? 'done' : 'error')
      if (!parsed.length) setError('No items with prices were recognised. Try a clearer, well-lit photo — or add the items manually below.')
    } catch (e) {
      console.error(e)
      setStatus('error')
      setError('OCR failed (the scan could not be read). Please try a clearer photo, or add the items manually with Add Expense.')
    }
  }

  function removeImage() {
    if (imageUrl) URL.revokeObjectURL(imageUrl)
    setImageUrl(null)
    setRows([])
    setRawText('')
    setStatus('idle')
    setError('')
  }

  const total = rows.reduce((s, r) => s + (r.amount ?? 0), 0)
  const missing = rows.filter((r) => r.amount === null).length

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Smart Scanner</h2>
        <p className="text-sm text-slate-500">
          Take a photo of a grocery list or receipt — items and prices are read on your device only, never uploaded. Review everything before saving.
        </p>
      </div>

      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => loadFile(e.target.files?.[0])} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => loadFile(e.target.files?.[0])} />

      <Card>
        <div
          ref={dragRef}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            loadFile(e.dataTransfer.files?.[0])
          }}
          onPaste={(e) => {
            const item = [...e.clipboardData.items].find((i) => i.type.startsWith('image/'))
            if (item) loadFile(item.getAsFile())
          }}
          tabIndex={0}
          className="rounded-2xl border-2 border-dashed border-slate-300 p-6 text-center"
        >
          {imageUrl ? (
            <div className="space-y-3">
              <img src={imageUrl} alt="Grocery list to scan" className="mx-auto max-h-80 rounded-xl object-contain" style={{ transform: `rotate(${rotation}deg)` }} />
              <div className="flex flex-wrap justify-center gap-2">
                <GhostButton onClick={() => setRotation((r) => (r + 90) % 360)}>
                  <span className="inline-flex items-center gap-1.5"><RotateCw className="h-4 w-4" /> Rotate</span>
                </GhostButton>
                <GhostButton onClick={removeImage}>
                  <span className="inline-flex items-center gap-1.5"><Trash2 className="h-4 w-4" /> Remove / retake</span>
                </GhostButton>
                <PrimaryButton onClick={runOcr} disabled={status === 'processing'}>
                  {status === 'processing' ? `Scanning… ${progress}%` : 'Scan this photo'}
                </PrimaryButton>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <ImagePlus className="mx-auto h-10 w-10 text-green-600" />
              <p className="font-semibold text-slate-700">Take a picture or upload from gallery</p>
              <p className="text-xs text-slate-500">JPG, PNG or WEBP · drag &amp; drop here, or paste an image (Ctrl+V)</p>
              <div className="flex flex-wrap justify-center gap-2">
                <PrimaryButton onClick={() => cameraRef.current?.click()}>
                  <span className="inline-flex items-center gap-1.5"><Camera className="h-4 w-4" /> Take photo</span>
                </PrimaryButton>
                <GhostButton onClick={() => fileRef.current?.click()}>
                  <span className="inline-flex items-center gap-1.5"><Upload className="h-4 w-4" /> Upload photo</span>
                </GhostButton>
              </div>
            </div>
          )}
        </div>
        {status === 'processing' && (
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-2 bg-green-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
        {status === 'error' && error && (
          <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">{error}</p>
        )}
        <p className="mt-3 text-xs text-slate-500">
          Free OCR (Tesseract.js, open source). No API key, no paid service, no image leaves your browser. Printed lists read best; handwriting can be misread — always review the table below.
        </p>
      </Card>

      {rows.length > 0 && (
        <Card>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-900">Recognised items — review &amp; edit</h3>
              <p className="text-xs text-slate-500">Low-confidence rows are flagged. Amounts left blank were not read confidently — fill them in, don’t guess.</p>
            </div>
            <div>
              <label className={labelCls} htmlFor="scan-date">Date for all items</label>
              <input id="scan-date" className={inputCls} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.id} className="grid grid-cols-[1fr_110px_36px] items-center gap-2 rounded-xl border border-slate-200 p-2 sm:grid-cols-[1fr_130px_150px_36px]">
                <div>
                  <input
                    className={inputCls}
                    value={r.description}
                    aria-label="Item name"
                    onChange={(e) => setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, description: e.target.value } : x)))}
                  />
                  {r.confidence !== null && r.confidence < 0.6 && (
                    <p className="mt-1 text-xs font-medium text-amber-700">⚠ Low confidence — please check this row.</p>
                  )}
                </div>
                <input
                  className={inputCls}
                  type="number"
                  min="1"
                  placeholder="Amount"
                  aria-label="Amount"
                  value={r.amount ?? ''}
                  onChange={(e) => setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, amount: e.target.value ? Number(e.target.value) : null } : x)))}
                />
                <select
                  className={`${inputCls} col-span-3 sm:col-span-1`}
                  aria-label="Category"
                  value={r.categoryId}
                  onChange={(e) => setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, categoryId: e.target.value } : x)))}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <button aria-label={`Remove ${r.description}`} onClick={() => setRows((rs) => rs.filter((x) => x.id !== r.id))} className="rounded-lg p-2 text-red-600 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
            <p className="text-sm text-slate-600">
              {rows.length} items · Total <strong className="text-slate-900">{formatMoney(total)}</strong>
              {missing > 0 ? ` · ${missing} row(s) missing an amount` : ''}
            </p>
            <PrimaryButton
              disabled={rows.length === 0 || missing > 0}
              onClick={() => {
                onSave(rows, date)
                onSaved(`Scanned & saved ${rows.length} expenses — total ${formatMoney(total)}.`)
                removeImage()
              }}
            >
              Confirm &amp; save {rows.length} expenses
            </PrimaryButton>
          </div>
          {rawText && (
            <details className="mt-3 text-xs text-slate-500">
              <summary className="cursor-pointer font-medium text-slate-600">Show raw OCR text</summary>
              <pre className="mt-2 whitespace-pre-wrap rounded-xl bg-slate-50 p-3">{rawText}</pre>
            </details>
          )}
        </Card>
      )}

      {rows.length === 0 && status !== 'processing' && (
        <EmptyState title="No scanned items yet" body="Upload a clear photo of a list or receipt and tap “Scan this photo”. If the scan misses something, you can always add it manually from Add Expense." />
      )}
    </div>
  )
}
