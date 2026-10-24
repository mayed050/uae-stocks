// يحدّث public/financials.json: البيانات المالية التفصيلية لكل الأسهم المغطّاة من TradingView Scanner —
// آخر 12 شهرًا، وآخر ميزانية ربعية، والسجل السنوي (6 سنوات) والربعي (8 أرباع)، والأداء والمؤشرات الفنية،
// وعدد الأسهم والأسهم الحرة، وتاريخا آخر إعلان نتائج والإعلان المتوقع.
// ما تعذّر جلبه يبقى بآخر قيمة محفوظة بتاريخها ولا يُحذف.
// التشغيل: node scripts/fetch-financials.mjs   (يتطلب Node 18+)

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { FIN_COLS, TV_SCAN_URL, parseFinRow, stockKey, isoDate } from './lib.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const DATA = resolve(ROOT, 'public/data.json')
const OUT = resolve(ROOT, 'public/financials.json')

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'

async function main() {
  const { stocks } = JSON.parse(readFileSync(DATA, 'utf8'))
  const prev = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')).stocks ?? {} : {}
  const keyOf = new Map(stocks.map((s) => [stockKey(s).replace('-', ':'), s.sym]))

  const res = await fetch(TV_SCAN_URL, {
    method: 'POST',
    headers: { 'User-Agent': UA, 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbols: { tickers: [...keyOf.keys()] }, columns: FIN_COLS }),
  })
  if (!res.ok) throw new Error(`TradingView HTTP ${res.status}`)
  const json = await res.json()

  const today = isoDate(new Date())
  const out = { ...prev }
  let ok = 0
  for (const item of Array.isArray(json?.data) ? json.data : []) {
    const sym = keyOf.get(item.s)
    const f = sym ? parseFinRow(item.d) : null
    if (!f) continue
    out[sym] = { asof: today, ...f }
    ok++
  }
  // لا تُبقى سجلات لأسهم لم تعد في القائمة
  for (const sym of Object.keys(out)) if (!stocks.some((s) => s.sym === sym)) delete out[sym]

  const missing = stocks.filter((s) => !out[s.sym]).map((s) => s.sym)
  const withQ = Object.values(out).filter((f) => f.fq).length
  writeFileSync(OUT, JSON.stringify({ updated: new Date().toISOString(), source: 'tradingview', stocks: out }) + '\n', 'utf8')
  console.log(`اكتمل: ${ok}/${stocks.length} سهمًا محدّثًا، ${withQ} بسجل ربعي مُتحقَّق${missing.length ? ` — بلا بيانات: ${missing.join(', ')}` : ''}`)
  if (ok === 0) process.exit(1)
}

main().catch((e) => {
  console.error('فشل جلب البيانات المالية:', e.message)
  process.exit(1)
})
