// فحص مؤقت (للقراءة فقط): عملة القيم في نقطة uae/scan مقارنةً بـ global/scan.
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
const cols = ['close', 'market_cap_basic', 'dividend_amount_recent', 'dividend_amount_upcoming', 'earnings_per_share_basic_ttm', 'currency', 'fundamental_currency_code']
const tickers = ['DFM:EMAAR', 'DFM:DEWA', 'ADX:FAB', 'ADX:ADNOCGAS']
for (const ep of ['uae', 'global']) {
  const r = await fetch(`https://scanner.tradingview.com/${ep}/scan`, { method: 'POST', headers: { 'User-Agent': UA, 'Content-Type': 'application/json' }, body: JSON.stringify({ symbols: { tickers }, columns: cols }) })
  const j = await r.json()
  console.log(`== ${ep}`)
  for (const d of j.data ?? []) console.log(d.s, JSON.stringify(d.d))
}
