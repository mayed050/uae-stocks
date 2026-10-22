// فحص مؤقت (للقراءة فقط): رموز TradingView الصحيحة من قائمة السوق الإماراتي كاملة — يُحذف بعد الاستخدام.
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
const r = await fetch('https://scanner.tradingview.com/uae/scan', {
  method: 'POST', headers: { 'User-Agent': UA, 'Content-Type': 'application/json' },
  body: JSON.stringify({ columns: ['name', 'description', 'close', 'exchange', 'type'], range: [0, 600] }),
})
const j = await r.json()
console.log('status', r.status, 'total', j.totalCount, 'returned', j.data?.length)
const rows = j.data ?? []
const byEx = {}
rows.forEach((d) => { byEx[d.d[3]] = (byEx[d.d[3]] ?? 0) + 1 })
console.log('by exchange', JSON.stringify(byEx))
for (const d of rows) if (/energy|taqa|mashreq|parkin|etisalat|e&/i.test(d.d[1] + ' ' + d.d[0])) console.log(d.s, '|', d.d[1], '|', d.d[2], '|', d.d[4])
