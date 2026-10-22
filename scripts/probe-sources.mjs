// فحص مؤقت (للقراءة فقط) لمصادر البيانات من خوادم GitHub — يُحذف بعد الاستخدام.
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
const tv = async (tickers, columns) => {
  const r = await fetch('https://scanner.tradingview.com/global/scan', {
    method: 'POST', headers: { 'User-Agent': UA, 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbols: { tickers }, columns }),
  })
  return { status: r.status, body: await r.text() }
}
console.log('== 1) المؤشرات')
for (const t of [['DFM:DFMGI'], ['ADX:FADGI'], ['ADX:ADI'], ['ADX:FTFADGI']]) {
  const r = await tv(t, ['close', 'change', 'name', 'description'])
  console.log(t[0], r.status, r.body.slice(0, 200))
}
console.log('== 2) حقول التوزيعات في TradingView (كل حقل منفردًا)')
const cols = ['dividends_yield_current', 'dividends_yield', 'dps_common_stock_prim_issue_fy', 'dividends_per_share_fq',
  'dividend_ex_date_recent', 'dividend_ex_date_upcoming', 'dividend_payment_date_recent', 'dividend_payment_date_upcoming',
  'dividend_amount_recent', 'dividend_amount_upcoming', 'dividends_frequency', 'dividend_payout_ratio_ttm',
  'ex_dividend_date', 'dividend_payment_date', 'price_52_week_high', 'price_52_week_low', 'earnings_per_share_basic_ttm',
  'return_on_equity', 'total_revenue_ttm', 'net_income_ttm']
for (const c of cols) {
  const r = await tv(['DFM:DEWA', 'DFM:EMAAR', 'ADX:FAB', 'ADX:ADNOCGAS'], [c])
  let v = r.body.slice(0, 160)
  try { const j = JSON.parse(r.body); v = j.error ? 'ERROR ' + j.error : JSON.stringify(j.data?.map((d) => [d.s, d.d[0]])) } catch {}
  console.log(c.padEnd(32), r.status, v)
}
console.log('== 3) سجل أسعار Yahoo لأسهم أبوظبي')
for (const s of ['FAB.AD', 'ADNOCGAS.AD', 'FAB.AE', 'ALDAR.AD', 'DEWA.AE']) {
  const r = await fetch(`https://query2.finance.yahoo.com/v8/finance/chart/${s}?interval=1d&range=1mo`, { headers: { 'User-Agent': UA } })
  const t = await r.text()
  let info = t.slice(0, 120)
  try { const j = JSON.parse(t); const res = j.chart?.result?.[0]; info = res ? `points=${res.timestamp?.length} exch=${res.meta?.exchangeName} cur=${res.meta?.currency} price=${res.meta?.regularMarketPrice}` : 'error ' + JSON.stringify(j.chart?.error) } catch {}
  console.log(s.padEnd(14), r.status, info)
}
console.log('== 4) إتاحة مواقع الإفصاحات (الحالة فقط)')
for (const u of ['https://www.dfm.ae/', 'https://www.adx.ae/', 'https://www.dfm.ae/the-exchange/news-disclosures/disclosures', 'https://www.adx.ae/english/pages/newsandannouncements/announcements.aspx']) {
  try { const r = await fetch(u, { headers: { 'User-Agent': UA }, redirect: 'follow' }); console.log(r.status, u, (await r.text()).length + ' bytes') } catch (e) { console.log('ERR', u, e.message) }
}
