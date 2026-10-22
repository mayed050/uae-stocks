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
import { num, isoDate, TV_COLS, parseTvRow, applyQuote, INDEX_TICKERS, toIndexQuote, mergeDividend, staleStocks } from './lib.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const OUT = resolve(ROOT, 'public/data.json')
const SEED = resolve(ROOT, 'src/data/seed.json')
// تقرير المراجعة البشرية (غير مُلتزَم): يُنشر في Issue من سير العمل على main
const REVIEW = resolve(ROOT, 'review.md')

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

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
      if (!item.s) continue
      const q = parseTvRow(item.d)
      if (q) map[item.s.replace(':', '-')] = q
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


async function main() {
  const basePath = existsSync(OUT) ? OUT : SEED
  const data = JSON.parse(readFileSync(basePath, 'utf8'))
  const autos = data.stocks.filter((s) => s.priceAuto)
  const results = new Map() // sym -> { ...quote, src }

  // 1) دفعة TradingView الغنية لكل الأسهم (الرمز المُهيّأ في tradingview، وإلا <السوق>-<الرمز>)
  const batch = autos.map((s) => ({ sym: s.sym, key: s.tradingview ?? `${s.ex}-${s.sym}` }))
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
  const today = isoDate(new Date())
  let ok = 0
  const stale = []
  const divChanges = []
  const divConflicts = []
  for (const s of autos) {
    const r = results.get(s.sym)
    if (r) {
      applyQuote(s, r, r.time)
      // التوزيعات: دمج محافظ (اليدوي الموثّق يبقى، والأحدث يُضاف معلَّمًا «يلزم التحقق»)
      if (r.div) {
        const m = mergeDividend(s.div, r.div, today)
        s.div = m.div
        m.changes.forEach((c) => divChanges.push({ s, ...c }))
        m.conflicts.forEach((c) => divConflicts.push({ s, ...c }))
      }
      ok++
      const chg = typeof s.change === 'number' ? `${s.change > 0 ? '+' : ''}${s.change}%` : '—'
      const vol = typeof s.volume === 'number' ? s.volume.toLocaleString('en-US') : '—'
      console.log(`✓ ${s.ex} ${s.sym.padEnd(12)} ${s.price}  (${chg})  حجم=${vol}  [${r.src}]`)
    } else {
      stale.push(s.sym)
      console.warn(`✗ ${s.ex} ${s.sym.padEnd(12)} تعذّر الجلب — أبقيت القيمة السابقة`)
    }
  }

  // 5) المؤشران العامّان (DFMGI / FADGI) — غير حاسم: عند الفشل تبقى آخر قيمة محفوظة بتاريخها
  try {
    const codes = Object.keys(INDEX_TICKERS)
    const map = await fetchTvBatch(codes.map((c) => INDEX_TICKERS[c].tv.replace(':', '-')))
    data.indices = data.indices ?? {}
    for (const c of codes) {
      const iq = toIndexQuote(c, map[INDEX_TICKERS[c].tv.replace(':', '-')], new Date())
      if (iq) {
        data.indices[c] = iq
        console.log(`✓ مؤشر ${c.padEnd(6)} ${iq.value}  (${iq.changePct ?? '—'}%)`)
      } else {
        console.warn(`✗ مؤشر ${c} تعذّر الجلب — أبقيت القيمة السابقة`)
      }
    }
  } catch (e) {
    console.warn(`… جلب المؤشرات فشل: ${e.message}`)
  }

  writeReview(staleStocks(data.stocks), divChanges, divConflicts)

  data.lastUpdated = new Date().toISOString()
  data.source = ok > 0 ? 'tradingview+yahoo' : 'manual'

  mkdirSync(dirname(OUT), { recursive: true })
  const jsonStr = JSON.stringify(data, null, 2) + '\n'
  writeFileSync(OUT, jsonStr, 'utf8')
  if (existsSync(SEED)) writeFileSync(SEED, jsonStr, 'utf8')

  console.log(`\nاكتمل: ${ok}/${autos.length} نجاح${stale.length ? ` — متقادمة: ${stale.join(', ')}` : ''}`)
  if (ok === 0) process.exit(1)
}

/** يكتب تقرير المراجعة البشرية (Markdown) — فارغ إن لم يكن هناك ما يُراجع. */
function writeReview(staleList, changes, conflicts) {
  const name = (s) => `${s.name.split('—')[0].trim()} (${s.sym})`
  const out = []
  if (changes.length) {
    out.push('### توزيعات أُضيفت آليًا — تظهر في الموقع بعلامة «يلزم التحقق»', '',
      '| السهم | النوع | الاستبعاد | الدفع | المبلغ |', '|---|---|---|---|---|',
      ...changes.map((c) => `| ${name(c.s)} | ${c.kind === 'upcoming' ? 'قادم' : 'أحدث من اليدوي'} | ${c.ex} | ${c.pay ?? '—'} | ${c.ps ?? '—'} |`), '')
  }
  if (conflicts.length) {
    out.push('### تعارضات: أُبقيت القيمة اليدوية — يُرجى التحقق من الإفصاح الرسمي', '',
      '| السهم | الحقل | اليدوي (معروض) | TradingView |', '|---|---|---|---|',
      ...conflicts.map((c) => `| ${name(c.s)} | ${c.field} | ${c.manual} | ${c.auto} |`), '')
  }
  if (staleList.length) {
    out.push('### أسعار متقادمة — تعذّر جلبها من كل المصادر', '',
      '| السهم | آخر سعر بتاريخ | منذ (يوم) |', '|---|---|---|',
      ...staleList.map((x) => `| ${x.sym} | ${x.asof ?? '—'} | ${x.days ?? '—'} |`), '')
  }
  writeFileSync(REVIEW, out.length ? out.join('\n') : '', 'utf8')
  console.log(`\nالمراجعة: ${changes.length} توزيع آلي، ${conflicts.length} تعارض، ${staleList.length} سعر متقادم`)
}

main().catch((e) => {
  console.error('خطأ غير متوقع:', e)
  process.exit(1)
})
