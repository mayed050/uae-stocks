// فحص مؤقت (للقراءة فقط): تغطية التوزيعات لكل الأسهم + أسباب تقادم EAND/TAQA — يُحذف بعد الاستخدام.
import { readFileSync } from 'node:fs'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
const tv = async (tickers, columns) => {
  const r = await fetch('https://scanner.tradingview.com/global/scan', { method: 'POST', headers: { 'User-Agent': UA, 'Content-Type': 'application/json' }, body: JSON.stringify({ symbols: { tickers }, columns }) })
  return r.json()
}
const iso = (t) => (typeof t === 'number' ? new Date(t * 1000).toISOString().slice(0, 10) : '-')
const aed = (u) => (typeof u === 'number' ? (u * 3.6725).toFixed(4) : '-')
const data = JSON.parse(readFileSync('public/data.json', 'utf8'))
const keys = data.stocks.map((s) => ({ s, key: s.ex === 'ADX' ? (s.tradingview ?? `ADX-${s.sym}`) : `DFM-${s.sym}` }))
const cols = ['close', 'dividend_ex_date_recent', 'dividend_payment_date_recent', 'dividend_amount_recent', 'dividend_ex_date_upcoming', 'dividend_payment_date_upcoming', 'dividend_amount_upcoming']
const j = await tv(keys.map((k) => k.key.replace('-', ':')), cols)
const map = Object.fromEntries((j.data ?? []).map((d) => [d.s, d.d]))
console.log('returned', (j.data ?? []).length, 'of', keys.length)
for (const { s, key } of keys) {
  const d = map[key.replace('-', ':')]
  if (!d) { console.log(`${s.sym.padEnd(11)} MISSING (${key})`); continue }
  console.log(`${s.sym.padEnd(11)} close=${d[0]} | recent ex=${iso(d[1])} pay=${iso(d[2])} amt=${aed(d[3])} | next ex=${iso(d[4])} pay=${iso(d[5])} amt=${aed(d[6])} | manual exd=${s.div.exd} pay=${s.div.pay} ps=${s.div.ps}`)
}
console.log('== EAND/TAQA alternatives')
for (const t of ['ADX:EAND', 'ADX:TAQA', 'ADX:ETISALAT', 'ADX:TAQA.AD']) {
  const r = await tv([t], ['close', 'change', 'description', 'type', 'update_mode', 'volume'])
  console.log(t, JSON.stringify(r).slice(0, 220))
}
