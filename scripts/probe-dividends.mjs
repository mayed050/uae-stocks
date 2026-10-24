// فحص مؤقت (للقراءة فقط): تواريخ توزيعات 2026 للأنصاري ومصرف أبوظبي الإسلامي والواحة كابيتال من وثائقها الرسمية.
import { execFileSync } from 'node:child_process'
import { writeFileSync, mkdirSync } from 'node:fs'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36'
const out = []
const log = (...a) => out.push(a.join(' '))
const KW = /(entitle|record date|registry|register|ex-?\s?dividend|payment|distribut|dividend|general assembly|AGM|fils|per share|استحقاق|الأحقية|سجل|توزيع|صرف|الجمعية|فلس)/i

async function grab(name, url, { follow = null } = {}) {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: '*/*', 'Accept-Language': 'en,ar' }, redirect: 'follow' })
    const buf = Buffer.from(await r.arrayBuffer())
    const ct = r.headers.get('content-type') ?? ''
    const isPdf = ct.includes('pdf') || buf.subarray(0, 4).toString() === '%PDF'
    let text
    if (isPdf) {
      writeFileSync('/tmp/doc.pdf', buf)
      text = execFileSync('pdftotext', ['-layout', '/tmp/doc.pdf', '-'], { maxBuffer: 1 << 26 }).toString()
    } else {
      text = buf.toString('utf8').replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, '\n').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&')
    }
    log(`\n== ${name} [${r.status} ${isPdf ? 'pdf' : ct} ${buf.length}B] ${r.url}`)
    const lines = text.split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean)
    const keep = new Set()
    lines.forEach((l, i) => { if (KW.test(l)) for (let k = i - 1; k <= i + 2; k++) if (k >= 0 && k < lines.length) keep.add(k) })
    for (const i of [...keep].sort((a, b) => a - b).slice(0, 70)) log('  ' + lines[i].slice(0, 260))
    if (!isPdf) {
      const hrefs = [...new Set([...buf.toString('utf8').matchAll(/href=["']([^"']+)["']/g)].map((m) => m[1]))]
      const docs = hrefs.filter((h) => /\.pdf|agam|uploads|dividend|general-assembly|annual-general/i.test(h)).slice(0, 30)
      if (docs.length) log('  links: ' + docs.join(' , '))
      if (follow) {
        const base = new URL(r.url)
        for (const h of docs.filter((d) => follow.test(d)).slice(0, 4)) await grab(`${name} → ${h.split('/').pop()}`, new URL(h, base).href)
      }
    }
  } catch (e) {
    log(`\n== ${name} ERR ${e.message}`)
  }
}

// مصرف أبوظبي الإسلامي: دعوة الجمعية العمومية (مارس 2026) وبيان إقرار التوزيع
await grab('ADIB-invite-2026', 'https://www.adib.ae/-/media/project/adib/adibsite/docs/investor-relations/agm/2026/agm-invitation.pdf')
await grab('ADIB-AGM-news', 'https://www.adib.ae/en/news/2026/mar/annual-general-assembly')
await grab('ADIB-GA-page', 'https://www.adib.ae/en/investor-relations/shareholders/general-assembly-meetings', { follow: /agm\/2026\/(?!sept).*\.pdf/i })

// الواحة كابيتال: صفحة الجمعية العمومية ووثائقها
await grab('WAHA-AGM-page', 'https://wahacapital.com/annual-general-assembly-meeting', { follow: /agam/i })
await grab('WAHA-AGM-page-www', 'https://www.wahacapital.com/annual-general-assembly-meeting', { follow: /agam/i })
await grab('WAHA-mubasher', 'https://english.mubasher.info/news/4577507/Waha-Capital-to-pay-10-fils-share-for-2025/')

// الأنصاري للخدمات المالية: تغطية إقرار توزيع 2025 (لا يصل الفحص إلى إفصاحات سوق دبي مباشرة)
await grab('ANSARI-KT', 'https://www.khaleejtimes.com/business/al-ansari-financial-services-shareholders-approve-dh297m-dividend-for-2025?amp=1')
await grab('ANSARI-WAM', 'https://www.wam.ae/en/article/bzecjwf-ansari-financial-services%E2%80%99-shareholders-approve')
await grab('ANSARI-IR', 'https://alansarifinancial.com/investor-relations/', { follow: /\.pdf/i })

mkdirSync('probe-out', { recursive: true })
writeFileSync('probe-out/dividends.txt', out.join('\n') + '\n')
