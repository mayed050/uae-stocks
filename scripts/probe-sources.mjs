// فحص مؤقت (للقراءة فقط): حقل الشعار وصيغة رابطه، والحقول الأساسية لأسهم غير مغطّاة.
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
const r = await fetch('https://scanner.tradingview.com/uae/scan', { method: 'POST', headers: { 'User-Agent': UA, 'Content-Type': 'application/json' },
  body: JSON.stringify({ symbols: { tickers: ['DFM:SHUAA', 'ADX:RAKCEC', 'DFM:EMAAR', 'ADX:AGTHIA'] }, columns: ['name', 'logoid', 'earnings_per_share_basic_ttm', 'return_on_equity', 'total_revenue_ttm', 'net_income_ttm', 'net_income_yoy_growth_ttm', 'no_such_column_xyz'], options: { lang: 'ar' } }) })
const j = await r.json()
console.log('status', r.status, 'error', j.error ?? '-')
for (const d of j.data ?? []) console.log(d.s, JSON.stringify(d.d))
for (const id of (j.data ?? []).map((d) => d.d[1]).filter(Boolean).slice(0, 2)) {
  for (const suf of ['--600.png', '--big.svg']) {
    const u = `https://s3-symbol-logo.tradingview.com/${id}${suf}`
    const x = await fetch(u, { headers: { 'User-Agent': UA } })
    console.log(x.status, x.headers.get('content-type'), u)
  }
}
