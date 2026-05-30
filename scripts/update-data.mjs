// يجلب أسعار أسهم سوق دبي (DFM) من Yahoo Finance وأسعار أسهم سوق أبوظبي (ADX) من TradingView Scanner API تلقائياً ويحدّث public/data.json.
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

// جلب الأسعار لجميع أسهم أبوظبي (ADX) دفعة واحدة من TradingView Scanner API الموثوقة بنظام JSON
async function fetchTvQuotesBatch(tradingviewSymbols) {
  const url = 'https://scanner.tradingview.com/global/scan'
  // تحويل الصيغة من ADX-FAB إلى الصيغة المطلوبة في الـ API وهي ADX:FAB
  const tickers = tradingviewSymbols.map(s => s.replace('-', ':'))
  
  const payload = {
    symbols: { tickers },
    columns: ['close']
  }
  
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'User-Agent': UA,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
  
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  
  const priceMap = {}
  if (Array.isArray(json?.data)) {
    for (const item of json.data) {
      if (item.s) {
        // إرجاع الصيغة الأصلية ADX-FAB كمفتاح للمطابقة
        const origKey = item.s.replace(':', '-')
        const price = item.d?.[0]
        if (typeof price === 'number') {
          priceMap[origKey] = price
        }
      }
    }
  }
  return priceMap
}

function isoDate(d) {
  return d.toISOString().slice(0, 10)
}

async function main() {
  const basePath = existsSync(OUT) ? OUT : SEED
  const data = JSON.parse(readFileSync(basePath, 'utf8'))

  // 1. تجميع كل رموز أسهم أبوظبي المطلوبة لجلبها دفعة واحدة
  const adxStocks = data.stocks.filter(s => s.priceAuto && s.ex === 'ADX' && s.tradingview)
  const adxTvSymbols = adxStocks.map(s => s.tradingview)
  
  let adxPriceMap = {}
  if (adxTvSymbols.length > 0) {
    try {
      console.log(`جاري جلب أسعار سوق أبوظبي (ADX) دفعة واحدة عبر TradingView API (${adxTvSymbols.length} سهم)...`)
      adxPriceMap = await fetchTvQuotesBatch(adxTvSymbols)
      console.log(`✓ تم جلب أسعار سوق أبوظبي بنجاح.`)
    } catch (e) {
      console.warn(`✗ فشل جلب أسعار ADX دفعة واحدة: ${e.message} — سيتم الإبقاء على الأسعار السابقة.`)
    }
  }

  let ok = 0
  let fail = 0
  
  // 2. تحديث أسعار الأسهم المدرجة
  for (const s of data.stocks) {
    if (!s.priceAuto) continue

    // أ. تحديث أسهم دبي المالي (DFM)
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
      await sleep(300) // نوم خفيف بين طلبات Yahoo لتفادي الحظر
    }
    // ب. تحديث أسهم سوق أبوظبي للأوراق المالية (ADX) من الخريطة المجلوبة دفعة واحدة
    else if (s.ex === 'ADX' && s.tradingview) {
      const price = adxPriceMap[s.tradingview]
      if (price !== undefined) {
        s.price = Math.round(price * 1000) / 1000
        s.asof = isoDate(new Date())
        ok++
        console.log(`✓ ADX: ${s.sym.padEnd(12)} ${s.price} AED`)
      } else {
        fail++
        console.warn(`✗ ADX: ${s.sym.padEnd(12)} لم يعثر على السعر في استجابة API — أبقيت القيمة السابقة`)
      }
    }
  }

  data.lastUpdated = new Date().toISOString()
  data.source = ok > 0 ? 'yahoo+tradingview-api' : 'manual'

  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, JSON.stringify(data, null, 2) + '\n', 'utf8')
  console.log(`\nاكتمل التحديث بنجاح: ${ok} نجاح، ${fail} فشل. كُتب إلى ${OUT}`)

  // فشل كامل في جلب أي سعر يُعدّ خطأً ليظهر في سجل CI.
  if (ok === 0) process.exit(1)
}

main().catch(e => {
  console.error('خطأ غير متوقع:', e)
  process.exit(1)
})
