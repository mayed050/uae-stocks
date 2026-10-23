// فحص مؤقت (للقراءة فقط): مطابقة تعارضات التوزيعات الـ16 مع TradingView والمصادر الرسمية.
import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
const KEYS = {"DEWA":"DFM-DEWA","DIB":"DFM-DIB","EMAAR":"DFM-EMAAR","AIRARABIA":"DFM-AIRARABIA","DTC":"DFM-DTC","EMAARDEV":"DFM-EMAARDEV","DFM":"DFM-DFM","MASHREQ":"DFM-MASQ","DIC":"DFM-DIC","GFH":"DFM-GFH","ALANSARI":"DFM-ALANSARI","FAB":"ADX-FAB","ADIB":"ADX-ADIB","ADNIC":"ADX-ADNIC","NMDCENR":"ADX-NMDCENR","ALDAR":"ADX-ALDAR","WAHAT":"ADX-WAHA","DANA":"ADX-DANA","BURJEEL":"ADX-BURJEEL"}
const COLS = ['dividend_ex_date_recent', 'dividend_payment_date_recent', 'dividend_amount_recent', 'dividend_ex_date_upcoming', 'dividend_amount_upcoming']
const d = (t) => (t ? new Date(t * 1000).toISOString().slice(0, 10) : '-')

const DOCS = [
  ['WAHA-2026', 'https://wahacapital.com/mediacenter/detail/waha-capital-shareholders-approve-2025-dividend-distribution-at-annual-general-meeting', /2026|record|entitle|ex-|payment|fils|held/i],
  ['WAHA-media', 'https://wahacapital.com/mediacenter', /2026|dividend/i],
  ['ADIB-GA', 'https://www.adib.ae/en/investor-relations/shareholders/general-assembly-meetings', /2026|entitle|record|payment|dividend/i],
  ['ANSARI-IR', 'https://www.alansarifinancial.com/investor-relations', /2026|dividend|entitle|record/i],
  ['ANSARI-IR2', 'https://alansarifinancial.com/en/investor-relations/dividends', /2026|2025|dividend|entitle|record|ex-/i],
]
const KW = /(ex-?\s?dividend|record date|entitlement|registry|closing|payment date|distribution date|last day|last date|general assembly|annual general|AGM|fils|per share|dividend|استحقاق|الأحقية|توزيع|سجل|بدون)/i
const DATE = /(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}|\d{4}-\d{2}-\d{2}|\d{1,2}(st|nd|rd|th)?\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})/i

for (const [name, url, pat] of DOCS) {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: '*/*' } })
    const buf = Buffer.from(await r.arrayBuffer())
    const ct = r.headers.get('content-type') ?? ''
    let text
    if (ct.includes('pdf') || buf.subarray(0, 4).toString() === '%PDF') {
      writeFileSync('/tmp/doc.pdf', buf)
      text = execFileSync('pdftotext', ['-layout', '/tmp/doc.pdf', '-'], { maxBuffer: 1 << 26 }).toString()
    } else {
      text = buf.toString('utf8').replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, '\n').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/&#8211;/g, '-')
    }
    if (!(ct.includes('pdf') || buf.subarray(0, 4).toString() === '%PDF')) {
      const links = [...new Set([...buf.toString('utf8').matchAll(/href="([^"]+)"/g)].map((m) => m[1]).filter((h) => /2026|dividend|agm|general-assembly|assembly|\.pdf/i.test(h)))].slice(0, 25)
      if (links.length) console.log(`-- links(${name}): ` + links.join(' , '))
    }
    const all = text.split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean)
    const keep = new Set()
    all.forEach((l, i) => { if (pat.test(l)) for (let k = i - 2; k <= i + 2; k++) if (k >= 0 && k < all.length) keep.add(k) })
    console.log(`\n== ${name} [${r.status} ${buf.length}B]`)
    for (const i of [...keep].sort((x, y) => x - y).slice(0, 45)) console.log('  ' + all[i].slice(0, 240))
  } catch (e) {
    console.log(`\n== ${name} ERR ${e.message}`)
  }
}
