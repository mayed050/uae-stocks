// فحص مؤقت (للقراءة فقط): هل يوفّر TradingView الأسماء العربية والقطاعات لكامل السوق الإماراتي؟
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
const scan = async (body) => {
  const r = await fetch('https://scanner.tradingview.com/uae/scan', { method: 'POST', headers: { 'User-Agent': UA, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  return r.json()
}
const cols = ['name', 'description', 'local_description', 'type', 'subtype', 'sector', 'industry', 'exchange', 'market_cap_basic', 'close', 'volume', 'dividends_yield_current']
for (const lang of ['ar', 'en']) {
  const j = await scan({ columns: cols, range: [0, 600], options: { lang } })
  if (j.error) { console.log(lang, 'ERROR', j.error); continue }
  const rows = j.data ?? []
  console.log(`== lang=${lang} total=${j.totalCount}`)
  const count = (i) => { const m = {}; rows.forEach((d) => { m[d.d[i]] = (m[d.d[i]] ?? 0) + 1 }); return JSON.stringify(m) }
  if (lang === 'ar') { console.log('types', count(3)); console.log('subtypes', count(4)); console.log('sectors', count(5)) }
  for (const sym of ['DFM:EMAAR', 'ADX:FAB', 'DFM:DEWA', 'ADX:ETISALAT', 'DFM:SHUAA', 'ADX:RAKCEC', 'NASDAQDUBAI:DPW']) {
    const d = rows.find((x) => x.s === sym)
    console.log(sym, d ? JSON.stringify(d.d.slice(0, 7)) : 'n/a')
  }
  const noVol = rows.filter((d) => !d.d[10]).length
  const noCap = rows.filter((d) => !d.d[8]).length
  console.log('without volume:', noVol, 'without mcap:', noCap)
}
