// فحص مؤقت (للقراءة فقط): كيف تُحمَّل إفصاحات الشركة ومجلس إدارتها وملكية الأجانب في موقع سوق دبي.
import { writeFileSync, mkdirSync } from 'node:fs'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36'
const out = []
const log = (...a) => out.push(a.join(' '))
const get = async (u, h = {}) => {
  try { const r = await fetch(u, { headers: { 'User-Agent': UA, Accept: '*/*', Origin: 'https://www.dfm.ae', Referer: 'https://www.dfm.ae/', ...h } }); return { s: r.status, t: await r.text(), ct: r.headers.get('content-type') } }
  catch (e) { return { s: 'ERR', t: String(e.message), ct: '' } }
}
const uniq = (a) => [...new Set(a)]

const pg = await get('https://www.dfm.ae/the-exchange/market-information/company/EMAAR/trading')
log('== trading page', pg.s, pg.t.length)
const nd = pg.t.match(/<script[^>]*id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
log('__NUXT_DATA__ len', nd ? nd[1].length : 0)
if (nd) log(nd[1].slice(0, 2500))
const idx = [...pg.t.matchAll(/EMAAR/g)].map((m) => m.index).slice(0, 25)
for (const i of idx) log('  ctx:', pg.t.slice(Math.max(0, i - 120), i + 160).replace(/\s+/g, ' '))

const js = uniq(pg.t.match(/\/_nuxt\/[A-Za-z0-9_.-]+\.js/g) ?? [])
log('\n== bundles', js.length)
const paths = new Set(), cmds = new Set()
for (const f of js) {
  const r = await get('https://www.dfm.ae' + f)
  for (const m of r.t.matchAll(/["'`](\/(?:efsah|web|mw|sf|api)\/[^"'`\s]{2,140})["'`]/g)) paths.add(m[1])
  for (const m of r.t.matchAll(/["'`]((?:https:\/\/)?api[\w-]*\.dfm\.ae[^"'`\s]{0,140})["'`]/g)) paths.add(m[1])
  for (const m of r.t.matchAll(/["'`]([A-Za-z]{0,30}(?:Disclos|Announc|Board|Director|Owner|Foreign|Sharehold|Financial|Report|Profile|Company)[A-Za-z]{0,30})["'`]/g)) cmds.add(m[1])
  for (const m of r.t.matchAll(/(?:Command|command|cmd)\s*[:=]\s*["'`]([^"'`]{2,60})["'`]/g)) cmds.add('CMD:' + m[1])
}
log('paths:', [...paths].slice(0, 120).join('\n  '))
log('\ncmds:', [...cmds].slice(0, 200).join(', '))

// نداءات مرشّحة لأشهر الأنماط
log('\n== candidates')
const tries = [
  ['GET', 'https://api2.dfm.ae/web/widgets/v1/data?Command=GetCompanyDisclosures&Symbol=EMAAR'],
  ['GET', 'https://api2.dfm.ae/efsah/v1/disclosures?symbol=EMAAR&pageNumber=1&pageSize=10'],
  ['GET', 'https://api2.dfm.ae/efsah/v1/Disclosures?Symbol=EMAAR'],
  ['GET', 'https://api2.dfm.ae/web/sf/v1/company/EMAAR'],
  ['GET', 'https://api2.dfm.ae/mw/v1/company-profile/EMAAR'],
]
for (const [m, u] of tries) { const r = await get(u); log(m, u, r.s, r.ct, r.t.slice(0, 200).replace(/\s+/g, ' ')) }

mkdirSync('probe-out', { recursive: true })
writeFileSync('probe-out/dfm.txt', out.join('\n') + '\n')
