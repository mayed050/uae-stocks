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
    body: JSON.stringify({ symbols: { tickers: Object.values(KEYS).map((k) => k.replace('-', ':')) }, columns: COLS }),
  })
  const j = await r.json()
  const bySym = Object.fromEntries(Object.entries(KEYS).map(([k, v]) => [v.replace('-', ':'), k]))
  console.log('rows', j.totalCount, (j.data ?? []).length, j.error ?? '')
  for (const row of j.data ?? []) {
    const [ex, pay, amt, exN, amtN] = row.d
    console.log(`${bySym[row.s] ?? row.s} ex=${d(ex)} pay=${d(pay)} amt=${amt} | next ex=${d(exN)} amt=${amtN}`)
  }
} catch (e) {
  console.log('TV ERR', e.message)
}

const DOCS = [
  ['MASHREQ-AGM', 'https://www.mashreq.com/-/jssmedia/pdfs/aboutus/investors/2026/AGM-Results-2026.ashx'],
  ['FAB-AGM', 'https://www.bankfab.com/en-ae/about-fab/group/in-the-media/fab-shareholders-approve-record-dividend-agm'],
  ['ADNIC-AGM', 'https://adnic.ae/-/adnic-shareholders-approve-cash-dividends-of-47-at-the-annual-general-meeting'],
  ['DANA-table', 'https://www.danagas.com/?p=6424'],
  ['GFH-BHB', 'https://bahrainbourse.com/NewAttachments/26032026080747/26032026080747_File1.pdf'],
  ['AIRARABIA-PR', 'https://press.airarabia.com/air-arabia-shareholders-approve-30-dividend-distribution-at-annual-general-meeting/'],
  ['EMAARDEV-div', 'https://properties.emaar.com/en/investor-relations/emaar-development-pjsc/dividends/'],
  ['EMAARDEV-PR', 'https://www.emaar.com/en/press-release-listing/emaar-development-announces-100-dividend-payout-of-aed-4-billion-us-1-1-billion'],
  ['ADIB-AGM', 'https://www.adib.ae/en/news/2026/mar/annual-general-assembly'],
  ['NMDCENR-div', 'https://www.nmdc-energy.com/en/investor-relations/share-information/dividends/'],
  ['BURJEEL-AGMnotice', 'https://burjeelholdings.com/wp-content/uploads/2026/03/Invitation-to-Attend-AGM.pdf'],
  ['DTC-PR', 'https://www.dubaitaxi.ae/en/post/dtc-shareholders-approve-fy-2025-final-dividend-at-annual-general-meeting'],
  ['DTC-div', 'https://www.dubaitaxi.ae/en/investor-relations/dividends'],
  ['DTC-AGMres', 'https://feeds.dfm.ae/documents/2026/Apr/7/549fb1c3-510f-437d-bb45-18e1ae969ae8/DTC%20BODRES%2008%2004%20202.pdf'],
  ['DFM-AGMad', 'https://feeds.dfm.ae/documents/2026/Mar/03/f46fe01e-87a3-473f-a4f4-cf4e38297300/AGM_PressAd_EN2026_web.pdf'],
  ['ALDAR-Q1', 'https://www.aldar.com/en/news-and-media/aldar-q1-fy-2026-financial-results'],
  ['WAHA-facts', 'http://wahacapital.ae/investor-relations/fact-sheet'],
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
    const all = text.split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean)
    const HOT = /(record|entitlement|ex-?\s?div|regist|closing|payment|paid|distribut|last (day|date)|eligib|on or before|cum|الاستحقاق|لالستحقاق|بدون|سجل)/i
    const lines = [...all.filter((l) => HOT.test(l) && (/2026|\/26\b|\/2026/.test(l) || DATE.test(l))), ...all.filter((l) => HOT.test(l) && !DATE.test(l)).slice(0, 6), ...all.filter((l) => /fils|per share/i.test(l)).slice(0, 4)]
    const title = text.split('\n').map((l) => l.trim()).find((l) => l.length > 20)?.slice(0, 140) ?? ''
    console.log(`\n== ${name} [${r.status} ${ct.split(';')[0]} ${buf.length}B] ${title}`)
    for (const l of [...new Set(lines)].slice(0, 26)) console.log('  ' + l.slice(0, 260))
  } catch (e) {
    console.log(`\n== ${name} ERR ${e.message}`)
  }
}
