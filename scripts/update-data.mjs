// يجلب أسعار أسهم سوق دبي (DFM) من Yahoo Finance وأسعار أسهم سوق أبوظبي (ADX) من TradingView تلقائياً ويحدّث public/data.json.
// التشغيل: node scripts/update-data.mjs   (يتطلب Node 18+ لوجود fetch المدمج)

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const OUT = resolve(ROOT, 'public/data.json')
const SEED = resolve(ROOT, 'src/seed.json')

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// جلب الأسعار من Yahoo Finance لأسهم دبي (DFM)
async function fetchYahooQuote(symbol) {
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    symbol,
  )}?interval=1d&range=1d`
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  const meta = json?.chart?.result?.[0]?.meta
  if (!meta || typeof meta.regularMarketPrice !== 'number') throw new Error('no price')
  return {
    price: meta.regularMarketPrice,
    time: meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000) : new Date(),
    currency: meta.currency,
  }
}

// جلب الأسعار من TradingView لأسهم أبوظبي (ADX)
async function fetchTvQuote(symbol) {
  const url = `https://www.tradingview.com/symbols/${encodeURIComponent(symbol)}/`
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const html = await res.text()

  const offersIdx = html.indexOf('"offers"')
  if (offersIdx === -1) throw new Error('no offers block found')

  const slice = html.slice(offersIdx, offersIdx + 300)
  const match = slice.match(/"price"\s*:\s*"([0-9.]+)"/)
  if (!match) throw new Error('no price found in offers block')

  return {
    price: parseFloat(match[1]),
    time: new Date(),
    currency: 'AED',
  }
}

function isoDate(d) {
  return d.toISOString().slice(0, 10)
}

async function main() {
  const basePath = existsSync(OUT) ? OUT : SEED
  const data = JSON.parse(readFileSync(basePath, 'utf8'))

  let ok = 0
  let fail = 0
  for (const s of data.stocks) {
    if (!s.priceAuto) continue

    // 1. تحديث أسهم دبي المالي (DFM)
    if (s.ex === 'DFM' && s.yahoo) {
      try {
        const q = await fetchYahooQuote(s.yahoo)
        s.price = Math.round(q.price * 1000) / 1000
        s.asof = isoDate(q.time)
        ok++
        console.log(`✓ DFM: ${s.sym.padEnd(12)} ${s.price} ${q.currency}`)
      } catch (e) {
        fail++
        console.warn(`✗ DFM: ${s.sym.padEnd(12)} ${e.message} — أبقيت القيمة السابقة`)
      }
    }
    // 2. تحديث أسهم سوق أبوظبي للأوراق المالية (ADX)
    else if (s.ex === 'ADX' && s.tradingview) {
      try {
        const q = await fetchTvQuote(s.tradingview)
        s.price = Math.round(q.price * 1000) / 1000
        s.asof = isoDate(q.time)
        ok++
        console.log(`✓ ADX: ${s.sym.padEnd(12)} ${s.price} ${q.currency}`)
      } catch (e) {
        fail++
        console.warn(`✗ ADX: ${s.sym.padEnd(12)} ${e.message} — أبقيت القيمة السابقة`)
      }
    }
    await sleep(300)
  }

  data.lastUpdated = new Date().toISOString()
  data.source = ok > 0 ? 'yahoo+tradingview' : 'manual'

  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, JSON.stringify(data, null, 2) + '\n', 'utf8')
  console.log(`\nاكتمل: ${ok} نجاح، ${fail} فشل. كُتب إلى ${OUT}`)

  // فشل كامل في جلب أي سعر يُعدّ خطأً ليظهر في سجل CI.
  if (ok === 0) process.exit(1)
}

main().catch(e => {
  console.error('خطأ غير متوقع:', e)
  process.exit(1)
})

