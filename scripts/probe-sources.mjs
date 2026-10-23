// فحص مؤقت (للقراءة فقط): مسارات واجهات DFM/ADX البرمجية من شيفرة مواقعها العامة.
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
const get = async (u) => { try { const r = await fetch(u, { headers: { 'User-Agent': UA } }); return { s: r.status, t: await r.text() } } catch (e) { return { s: 'ERR', t: e.message } } }
const uniq = (a) => [...new Set(a)]
// DFM (Nuxt): مسارات api2.dfm.ae في حزم JavaScript
const page = await get('https://www.dfm.ae/the-exchange/news-disclosures/disclosures')
const js = uniq((page.t.match(/\/_nuxt\/[A-Za-z0-9_-]+\.js/g) ?? [])).slice(0, 40)
let hits = []
for (const f of js) {
  const r = await get('https://www.dfm.ae' + f)
  hits.push(...(r.t.match(/["'`](\/(?:web|mw|efsah|sf)\/v1\/[^"'`\s]{2,80})["'`]/g) ?? []))
  hits.push(...(r.t.match(/(?:Command|command)["']?\s*[:=]\s*["'][A-Za-z]{3,40}["']/g) ?? []))
  hits.push(...(r.t.match(/["'][^"'\s]*(?:ividend|orporate[A-Za-z]*ction|ntitlement)[^"'\s]*["']/g) ?? []).slice(0, 5))
}
console.log('DFM js files', js.length, '\nDFM endpoints:', uniq(hits).slice(0, 60).join(' | '))
// ADX (Next.js): بيانات الصفحة ومسارات apigateway
const adx = await get('https://www.adx.ae/english/pages/newsandannouncements/announcements.aspx')
const nd = adx.t.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
console.log('ADX __NEXT_DATA__ size', nd ? nd[1].length : 0, nd ? nd[1].slice(0, 400) : '')
const chunks = uniq((adx.t.match(/\/_next\/static\/chunks\/[A-Za-z0-9/_.-]+\.js/g) ?? [])).slice(0, 40)
hits = []
for (const c of chunks) {
  const r = await get('https://www.adx.ae' + c)
  hits.push(...(r.t.match(/apigateway\.adx\.ae[^"'`\s]{0,120}/g) ?? []))
  hits.push(...(r.t.match(/["'`]\/adx\/[a-z0-9/_.-]{3,120}["'`]/gi) ?? []))
}
console.log('ADX chunks', chunks.length, '\nADX endpoints:', uniq(hits).slice(0, 60).join(' | '))
