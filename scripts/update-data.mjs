// يجلب أسعار السوقين ونِسَب التغيّر اليومي ويحدّث public/data.json و src/data/seed.json.
// مصادر متدرّجة لمرونة أعلى:
//   • DFM: Yahoo Finance (أساسي) → TradingView (احتياطي).
//   • ADX: TradingView بالرمز المُهيّأ (أساسي) → TradingView بالرمز المجرّد ADX:<sym> (احتياطي).
// أي رمز يفشل في كل المصادر يحتفظ بقيمته السابقة ويُدرَج في تقرير «بيانات متقادمة».
// التشغيل: node scripts/update-data.mjs   (يتطلب Node 18+ لوجود fetch المدمج)

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const OUT = resolve(ROOT, 'public/data.json')
const SEED = resolve(ROOT, 'src/data/seed.json')

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const round = (n, p = 2) => Math.round(n * 10 ** p) / 10 ** p
const isoDate = (d) => d.toISOString().slice(0, 10)

// ───────────────────────── مصدر Yahoo (DFM أساسي) ─────────────────────────
async function fetchYahoo(symbol) {
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    symbol,
  )}?interval=1d&range=1d`
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  const meta = json?.chart?.result?.[0]?.meta
  if (!meta || typeof meta.regularMarketPrice !== 'number') throw new Error('no price')
  const price = meta.regularMarketPrice
  const prev = typeof meta.previousClose === 'number'
    ? meta.previousClose
    : typeof meta.chartPreviousClose === 'number'
      ? meta.chartPreviousClose
      : null
  const changePct = prev ? ((price - prev) / prev) * 100 : null
  return {
    price,
    changePct,
    time: meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000) : new Date(),
    src: 'yahoo',
  }
}

// ───────────────── مصدر TradingView Scanner (دفعة واحدة) ─────────────────
// يقبل رموزًا بصيغة الشَّرطة (ADX-FAB / DFM-EMAAR) ويعيد خريطة بنفس المفاتيح.
async function fetchTvBatch(dashTickers) {
  if (!dashTickers.length) return {}
  const tickers = dashTickers.map((s) => s.replace('-', ':'))
  const res = await fetch('https://scanner.tradingview.com/global/scan', {
    method: 'POST',
    headers: { 'User-Agent': UA, 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbols: { tickers }, columns: ['close', 'change'] }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  const map = {}
  if (Array.isArray(json?.data)) {
    for (const item of json.data) {
      if (!item.s) continue
      const key = item.s.replace(':', '-')
      const price = item.d?.[0]
      const changePct = item.d?.[1]
      if (typeof price === 'number') {
        map[key] = { price, changePct: typeof changePct === 'number' ? changePct : null, src: 'tradingview' }
      }
    }
  }
  return map
}

async function main() {
  const basePath = existsSync(OUT) ? OUT : SEED
  const data = JSON.parse(readFileSync(basePath, 'utf8'))
  const autos = data.stocks.filter((s) => s.priceAuto)
  const results = new Map() // sym -> { price, changePct, time?, src }

  // 1) DFM عبر Yahoo (أساسي)
  for (const s of autos.filter((s) => s.ex === 'DFM' && s.yahoo)) {
    try {
      results.set(s.sym, await fetchYahoo(s.yahoo))
    } catch (e) {
      console.warn(`… DFM: ${s.sym} فشل Yahoo (${e.message}) — سيُجرَّب المصدر الاحتياطي`)
    }
    await sleep(250)
  }

  // 2) دفعة TradingView: ADX (أساسي) + أي DFM فشل في Yahoo (احتياطي)
  const batch1 = []
  for (const s of autos) {
    if (s.ex === 'ADX' && s.tradingview) batch1.push({ sym: s.sym, key: s.tradingview })
    else if (s.ex === 'DFM' && !results.has(s.sym)) batch1.push({ sym: s.sym, key: `DFM-${s.sym}` })
  }
  if (batch1.length) {
    try {
      const map = await fetchTvBatch(batch1.map((b) => b.key))
      for (const b of batch1) if (map[b.key]) results.set(b.sym, { ...map[b.key], time: new Date() })
    } catch (e) {
      console.warn(`… دفعة TradingView الأساسية فشلت: ${e.message}`)
    }
  }

  // 3) احتياطي ADX: الرمز المجرّد ADX:<sym> لأي سهم أبوظبي لم يُجلب بعد
  const adxMissing = autos.filter((s) => s.ex === 'ADX' && !results.has(s.sym))
  if (adxMissing.length) {
    try {
      const map = await fetchTvBatch(adxMissing.map((s) => `ADX-${s.sym}`))
      for (const s of adxMissing) {
        const hit = map[`ADX-${s.sym}`]
        if (hit) {
          results.set(s.sym, { ...hit, src: 'tradingview-alt', time: new Date() })
          console.log(`↩ ADX: ${s.sym} عُثر عليه عبر الرمز المجرّد (الرمز المُهيّأ قد يكون تغيّر)`)
        }
      }
    } catch (e) {
      console.warn(`… دفعة TradingView الاحتياطية فشلت: ${e.message}`)
    }
  }

  // 4) تطبيق النتائج + التقرير
  let ok = 0
  const stale = []
  for (const s of autos) {
    const r = results.get(s.sym)
    if (r) {
      s.price = round(r.price, 3)
      if (typeof r.changePct === 'number') s.change = round(r.changePct, 2)
      s.asof = isoDate(r.time ?? new Date())
      ok++
      const chg = typeof s.change === 'number' ? `${s.change > 0 ? '+' : ''}${s.change}%` : '—'
      console.log(`✓ ${s.ex} ${s.sym.padEnd(12)} ${s.price}  (${chg})  [${r.src}]`)
    } else {
      stale.push(s.sym)
      console.warn(`✗ ${s.ex} ${s.sym.padEnd(12)} تعذّر الجلب من كل المصادر — أبقيت القيمة السابقة`)
    }
  }

  data.lastUpdated = new Date().toISOString()
  data.source = ok > 0 ? 'yahoo+tradingview' : 'manual'

  mkdirSync(dirname(OUT), { recursive: true })
  const jsonStr = JSON.stringify(data, null, 2) + '\n'
  writeFileSync(OUT, jsonStr, 'utf8')
  if (existsSync(SEED)) writeFileSync(SEED, jsonStr, 'utf8')

  console.log(`\nاكتمل: ${ok}/${autos.length} نجاح${stale.length ? ` — متقادمة: ${stale.join(', ')}` : ''}`)
  if (ok === 0) process.exit(1) // فشل كامل يُعدّ خطأً في سجل CI
}

main().catch((e) => {
  console.error('خطأ غير متوقع:', e)
  process.exit(1)
})
