// فحص مؤقت (للقراءة فقط): مطابقة تعارضات التوزيعات الـ16 مع TradingView والمصادر الرسمية.
import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
const KEYS = {"DEWA":"DFM-DEWA","DIB":"DFM-DIB","EMAAR":"DFM-EMAAR","AIRARABIA":"DFM-AIRARABIA","DTC":"DFM-DTC","EMAARDEV":"DFM-EMAARDEV","DFM":"DFM-DFM","MASHREQ":"DFM-MASQ","DIC":"DFM-DIC","GFH":"DFM-GFH","ALANSARI":"DFM-ALANSARI","FAB":"ADX-FAB","ADIB":"ADX-ADIB","ADNIC":"ADX-ADNIC","NMDCENR":"ADX-NMDCENR","ALDAR":"ADX-ALDAR","WAHAT":"ADX-WAHA","DANA":"ADX-DANA","BURJEEL":"ADX-BURJEEL"}
const COLS = ['dividend_ex_date_recent', 'dividend_payment_date_recent', 'dividend_amount_recent', 'dividend_ex_date_upcoming', 'dividend_amount_upcoming']
const d = (t) => (t ? new Date(t * 1000).toISOString().slice(0, 10) : '-')

console.log('== TradingView (uae/scan) ==')
try {
  const r = await fetch('https://scanner.tradingview.com/uae/scan', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'User-Agent': UA },
    body: JSON.stringify({ symbols: { tickers: Object.values(KEYS) }, columns: COLS }),
  })
  const j = await r.json()
  const bySym = Object.fromEntries(Object.entries(KEYS).map(([k, v]) => [v, k]))
  for (const row of j.data ?? []) {
    const [ex, pay, amt, exN, amtN] = row.d
    console.log(`${bySym[row.s.replace(':', '-')] ?? row.s} ex=${d(ex)} pay=${d(pay)} amt=${amt} | next ex=${d(exN)} amt=${amtN}`)
  }
} catch (e) {
  console.log('TV ERR', e.message)
}

const DOCS = [
  ['DEWA-circular', 'https://feeds.dfm.ae/documents/2026/Feb/10/9cdbefb4-21ee-4278-a0c5-edbf3d4f0d72/DEWA.DFM.Circular.Feb.10.2026.vFinal2.pdf'],
  ['DIC-PR', 'https://feeds.dfm.ae/documents/2026/Apr/24/71f8a401-06a0-46dc-bdca-166b40b1bb6e/DIC%20PR%20E%2024%2004%202026..pdf'],
  ['MASHREQ-AGM', 'https://www.mashreq.com/-/jssmedia/pdfs/aboutus/investors/2026/AGM-Results-2026.ashx'],
  ['FAB-AGM', 'https://www.bankfab.com/en-ae/about-fab/group/in-the-media/fab-shareholders-approve-record-dividend-agm'],
  ['ADNIC-AGM', 'https://adnic.ae/-/adnic-shareholders-approve-cash-dividends-of-47-at-the-annual-general-meeting'],
  ['DANA-table', 'https://www.danagas.com/?p=6424'],
  ['DANA-PR', 'https://www.danagas.com/wp-content/uploads/2026/04/20260420_PR-2025-Dividen-En.pdf'],
  ['ANSARI-WAM', 'https://www.wam.ae/en/article/bzecjwf-ansari-financial-services%E2%80%99-shareholders-approve'],
  ['ADX-5552276', 'https://apigateway.adx.ae/adx/cdn/1.0/content/download/5552276'],
  ['ADX-5239176', 'https://apigateway.adx.ae/adx/cdn/1.0/content/download/5239176'],
  ['ADX-4912349', 'https://apigateway.adx.ae/adx/cdn/1.0/content/download/4912349'],
  ['ADX-5256798', 'https://apigateway.adx.ae/adx/cdn/1.0/content/download/5256798'],
  ['ADX-5223526', 'https://apigateway.adx.ae/adx/cdn/1.0/content/download/5223526'],
]
const KW = /(ex-?\s?dividend|record date|entitlement|registry|closing|payment date|distribution date|last day|last date|general assembly|annual general|AGM|fils|per share|dividend|استحقاق|الأحقية|توزيع|سجل|بدون)/i
const DATE = /(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}|\d{4}-\d{2}-\d{2}|\d{1,2}(st|nd|rd|th)?\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})/i

for (const [name, url] of DOCS) {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: '*/*', Referer: url.includes('adx.ae') ? 'https://www.adx.ae/' : url } })
    const buf = Buffer.from(await r.arrayBuffer())
    const ct = r.headers.get('content-type') ?? ''
    let text
    if (ct.includes('pdf') || buf.subarray(0, 4).toString() === '%PDF') {
      writeFileSync('/tmp/doc.pdf', buf)
      text = execFileSync('pdftotext', ['-layout', '/tmp/doc.pdf', '-'], { maxBuffer: 1 << 26 }).toString()
    } else {
      text = buf.toString('utf8').replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, '\n').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&')
    }
    const lines = text.split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter((l) => l && (DATE.test(l) || KW.test(l)) && (DATE.test(l) || /fils|per share|%/.test(l)))
    const title = text.split('\n').map((l) => l.trim()).find((l) => l.length > 20)?.slice(0, 140) ?? ''
    console.log(`\n== ${name} [${r.status} ${ct.split(';')[0]} ${buf.length}B] ${title}`)
    for (const l of [...new Set(lines)].slice(0, 22)) console.log('  ' + l.slice(0, 230))
  } catch (e) {
    console.log(`\n== ${name} ERR ${e.message}`)
  }
}
