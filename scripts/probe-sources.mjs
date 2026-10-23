// فحص مؤقت (للقراءة فقط): TAQA في لوحة أوراق ADX الرسمية، ومسارات التوزيعات في DFM.
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
const H = { 'User-Agent': UA, Accept: 'application/json', Origin: 'https://www.adx.ae', Referer: 'https://www.adx.ae/' }
const get = async (u, h = H) => { try { const r = await fetch(u, { headers: h }); return { s: r.status, t: await r.text() } } catch (e) { return { s: 'ERR', t: e.message } } }
const A = 'https://apigateway.adx.ae'
for (const p of ['/adx/marketwatch/1.0/securityBoard/marketwatch', '/adx/marketwatch/1.0/marketSummary', '/adx/marketwatch/1.0/securityOverview?symbol=TAQA', '/adx/marketwatch/1.0/securityOverview?symbol=FAB', '/adx/marketwatch/1.0/securityOverview/TAQA']) {
  const r = await get(A + p)
  const taqa = r.t.includes('TAQA') ? (r.t.match(/.{0,200}TAQA.{0,300}/)?.[0] ?? '') : 'no TAQA'
  console.log(p, r.s, r.t.length, '|', r.t.slice(0, 160).replace(/\s+/g, ' '), '|', taqa.slice(0, 500))
}
const D = { 'User-Agent': UA, Accept: 'application/json', Origin: 'https://www.dfm.ae', Referer: 'https://www.dfm.ae/' }
for (const p of ['/web/widgets/v1/dividends', '/web/widgets/v1/dividend', '/mw/v1/dividends', '/web/sf/v1/dividends', '/web/widgets/v1/data?Command=GetDividends', '/efsah/v1/disclosures?symbol=AIRARABIA']) {
  const r = await get('https://api2.dfm.ae' + p, D)
  console.log('DFM', p, r.s, r.t.length, '|', r.t.slice(0, 300).replace(/\s+/g, ' '))
}
