// يجلب بيانات السوق الحقيقية يوميًا (السعر، التغيّر، الافتتاح/الأعلى/الأدنى، الحجم)
// ويحدّث public/data.json و src/data/seed.json.
//
// المصدر الأساسي: TradingView Scanner (يغطّي DFM و ADX بأعمدة OHLCV كاملة).
// مصادر احتياطية متدرّجة: Yahoo لأسهم دبي، والرمز المجرّد ADX:<sym> لأبوظبي.
// الأساسيات المنسّقة يدويًا (mcap, pe, eps, net, التوزيعات) تبقى كما هي.
// التشغيل: node scripts/update-data.mjs   (يتطلب Node 18+)

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
const num = (x) => (typeof x === 'number' && isFinite(x) ? x : null)

// TradingView يُرجع القيمة السوقية بالدولار لهذه الأسواق؛ نحوّلها إلى الدرهم.
const USD_AED = 3.6725
function fmtMcap(n) {
  if (n >= 1e9) return (n / 1e9 >= 100 ? Math.round(n / 1e9) : round(n / 1e9, 1)) + ' مليار'
  if (n >= 1e6) return Math.round(n / 1e6) + ' مليون'
  return String(Math.round(n))
}

const TV_COLS = ['close', 'change', 'open', 'high', 'low', 'volume', 'market_cap_basic', 'price_earnings_ttm']

// ───────────── TradingView Scanner (أساسي — OHLCV لكل الأسهم دفعة واحدة) ─────────────
async function fetchTvBatch(dashTickers) {
  if (!dashTickers.length) return {}
  const tickers = dashTickers.map((s) => s.replace('-', ':'))
  const res = await fetch('https://scanner.tradingview.com/global/scan', {
    method: 'POST',
    headers: { 'User-Agent': UA, 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbols: { tickers }, columns: TV_COLS }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  const map = {}
  if (Array.isArray(json?.data)) {
    for (const item of json.data) {
      if (!item.s || !Array.isArray(item.d)) continue
      const [close, change, open, high, low, volume, mcap, pe] = item.d
      if (num(close) === null) continue
      const mcapUsd = num(mcap)
      map[item.s.replace(':', '-')] = {
        price: close,
        changePct: num(change),
        open: num(open),
        high: num(high),
        low: num(low),
        volume: num(volume),
        mcapAed: mcapUsd != null ? mcapUsd * USD_AED : null,
        pe: num(pe),
        src: 'tradingview',
      }
    }
  }
  return map
}

// ───────────── Yahoo Finance (احتياطي لأسهم دبي) ─────────────
async function fetchYahoo(symbol) {
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    symbol,
  )}?interval=1d&range=1d`
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  const r0 = json?.chart?.result?.[0]
  const meta = r0?.meta
  if (!meta || typeof meta.regularMarketPrice !== 'number') throw new Error('no price')
  const price = meta.regularMarketPrice
  const prev = num(meta.previousClose) ?? num(meta.chartPreviousClose)
  const q = r0?.indicators?.quote?.[0] ?? {}
  const lastNonNull = (arr) => (Array.isArray(arr) ? [...arr].reverse().find((v) => v != null) : null)
  return {
    price,
    changePct: prev ? ((price - prev) / prev) * 100 : null,
    open: num(lastNonNull(q.open)),
    high: num(meta.regularMarketDayHigh) ?? num(lastNonNull(q.high)),
    low: num(meta.regularMarketDayLow) ?? num(lastNonNull(q.low)),
    volume: num(meta.regularMarketVolume) ?? num(lastNonNull(q.volume)),
    time: meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000) : new Date(),
    src: 'yahoo',
  }
}

function applyQuote(s, r, time) {
  s.price = round(r.price, 3)
  if (r.changePct != null) s.change = round(r.changePct, 2)
  if (r.open != null) s.open = round(r.open, 3)
  if (r.high != null) s.high = round(r.high, 3)
  if (r.low != null) s.low = round(r.low, 3)
  if (r.volume != null) s.volume = Math.round(r.volume)
  // أساسيات متغيّرة يوميًا (تتبع السعر): تُحدَّث عند توفّرها من TradingView فقط
  if (r.pe != null && r.pe > 0) s.pe = round(r.pe, 1)
  if (r.mcapAed != null && r.mcapAed > 0) s.mcap = fmtMcap(r.mcapAed)
  s.asof = isoDate(time ?? r.time ?? new Date())
}

async function main() {
  const basePath = existsSync(OUT) ? OUT : SEED
  const data = JSON.parse(readFileSync(basePath, 'utf8'))
  const autos = data.stocks.filter((s) => s.priceAuto)
  const results = new Map() // sym -> { ...quote, src }

  // 1) دفعة TradingView الغنية لكل الأسهم (DFM:<sym> أو الرمز المُهيّأ لـ ADX)
  const batch = autos
    .map((s) => ({ sym: s.sym, key: s.ex === 'ADX' ? s.tradingview : `DFM-${s.sym}` }))
    .filter((b) => b.key)
  try {
    const map = await fetchTvBatch(batch.map((b) => b.key))
    for (const b of batch) if (map[b.key]) results.set(b.sym, { ...map[b.key], time: new Date() })
    console.log(`✓ TradingView: ${results.size}/${batch.length} سهم`)
  } catch (e) {
    console.warn(`… دفعة TradingView فشلت: ${e.message} — سيُجرّب الاحتياطي`)
  }

  // 2) احتياطي Yahoo لأسهم دبي التي لم تُجلب
  for (const s of autos.filter((s) => s.ex === 'DFM' && s.yahoo && !results.has(s.sym))) {
    try {
      results.set(s.sym, await fetchYahoo(s.yahoo))
      console.log(`↩ Yahoo (احتياطي): ${s.sym}`)
    } catch (e) {
      console.warn(`✗ Yahoo: ${s.sym} ${e.message}`)
    }
    await sleep(250)
  }

  // 3) احتياطي ADX بالرمز المجرّد لأي سهم أبوظبي لم يُجلب
  const adxMissing = autos.filter((s) => s.ex === 'ADX' && !results.has(s.sym))
  if (adxMissing.length) {
    try {
      const map = await fetchTvBatch(adxMissing.map((s) => `ADX-${s.sym}`))
      for (const s of adxMissing) {
        if (map[`ADX-${s.sym}`]) {
          results.set(s.sym, { ...map[`ADX-${s.sym}`], src: 'tradingview-alt', time: new Date() })
          console.log(`↩ ADX بالرمز المجرّد: ${s.sym}`)
        }
      }
    } catch (e) {
      console.warn(`… احتياطي ADX فشل: ${e.message}`)
    }
  }

  // 4) التطبيق + التقرير
  let ok = 0
  const stale = []
  for (const s of autos) {
    const r = results.get(s.sym)
    if (r) {
      applyQuote(s, r, r.time)
      ok++
      const chg = typeof s.change === 'number' ? `${s.change > 0 ? '+' : ''}${s.change}%` : '—'
      const vol = typeof s.volume === 'number' ? s.volume.toLocaleString('en-US') : '—'
      console.log(`✓ ${s.ex} ${s.sym.padEnd(12)} ${s.price}  (${chg})  حجم=${vol}  [${r.src}]`)
    } else {
      stale.push(s.sym)
      console.warn(`✗ ${s.ex} ${s.sym.padEnd(12)} تعذّر الجلب — أبقيت القيمة السابقة`)
    }
  }

  data.lastUpdated = new Date().toISOString()
  data.source = ok > 0 ? 'tradingview+yahoo' : 'manual'

  mkdirSync(dirname(OUT), { recursive: true })
  const jsonStr = JSON.stringify(data, null, 2) + '\n'
  writeFileSync(OUT, jsonStr, 'utf8')
  if (existsSync(SEED)) writeFileSync(SEED, jsonStr, 'utf8')

  console.log(`\nاكتمل: ${ok}/${autos.length} نجاح${stale.length ? ` — متقادمة: ${stale.join(', ')}` : ''}`)
  if (ok === 0) process.exit(1)
}

main().catch((e) => {
  console.error('خطأ غير متوقع:', e)
  process.exit(1)
})
