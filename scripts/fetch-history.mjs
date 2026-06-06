// يجلب أسعار الإغلاق التاريخية (سنة، يومي) لأسهم سوق دبي من Yahoo ويكتب public/history.json.
// سوق أبوظبي غير مغطّى تاريخيًا مجانًا، فيبقى رسمه توضيحيًا في الواجهة.
// التشغيل: node scripts/fetch-history.mjs   (يتطلب Node 18+)

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { round, isoDate } from './lib.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const DATA = resolve(ROOT, 'public/data.json')
const SEED = resolve(ROOT, 'src/data/seed.json')
const OUT = resolve(ROOT, 'public/history.json')

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// نقاط يومية لسنة: [ "YYYY-MM-DD", close ] لتقليل الحجم.
async function fetchHistory(yahooSym) {
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    yahooSym,
  )}?interval=1d&range=1y`
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  const r0 = json?.chart?.result?.[0]
  const ts = r0?.timestamp
  const closes = r0?.indicators?.quote?.[0]?.close
  if (!Array.isArray(ts) || !Array.isArray(closes)) throw new Error('no series')
  const points = []
  for (let i = 0; i < ts.length; i++) {
    const c = closes[i]
    if (typeof c === 'number' && isFinite(c)) {
      points.push([isoDate(new Date(ts[i] * 1000)), round(c, 3)])
    }
  }
  return points
}

async function main() {
  const base = existsSync(DATA) ? DATA : SEED
  const data = JSON.parse(readFileSync(base, 'utf8'))
  const dfm = data.stocks.filter((s) => s.priceAuto && s.ex === 'DFM' && s.yahoo)

  const history = {}
  let ok = 0
  const fail = []
  for (const s of dfm) {
    try {
      const pts = await fetchHistory(s.yahoo)
      if (pts.length) {
        history[s.sym] = pts
        ok++
        console.log(`✓ ${s.sym.padEnd(12)} ${pts.length} نقطة`)
      } else {
        fail.push(s.sym)
      }
    } catch (e) {
      fail.push(s.sym)
      console.warn(`✗ ${s.sym} ${e.message}`)
    }
    await sleep(250)
  }

  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, JSON.stringify({ updated: new Date().toISOString(), history }) + '\n', 'utf8')
  console.log(`\nاكتمل: ${ok}/${dfm.length} سهمًا${fail.length ? ` — تعذّر: ${fail.join(', ')}` : ''} → ${OUT}`)
  if (ok === 0) process.exit(1)
}

main().catch((e) => {
  console.error('خطأ غير متوقع:', e)
  process.exit(1)
})
