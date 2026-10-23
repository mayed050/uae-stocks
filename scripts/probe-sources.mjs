// فحص مؤقت (للقراءة فقط): حالة TAQA، وإمكانية الوصول الآلي لإفصاحات DFM/ADX.
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
const get = async (u, h = {}) => { try { const r = await fetch(u, { headers: { 'User-Agent': UA, ...h } }); return { s: r.status, t: await r.text() } } catch (e) { return { s: 'ERR', t: e.message } } }
console.log('== TAQA')
let r = await get('https://symbol-search.tradingview.com/symbol_search/v3/?text=TAQA&hl=0&exchange=&lang=en&search_type=stocks&domain=production', { Origin: 'https://www.tradingview.com', Referer: 'https://www.tradingview.com/' })
console.log('tv search', r.s, r.t.slice(0, 600))
r = await get('https://symbol-search.tradingview.com/symbol_search/v3/?text=Abu%20Dhabi%20National%20Energy&hl=0&exchange=&lang=en&search_type=stocks&domain=production', { Origin: 'https://www.tradingview.com', Referer: 'https://www.tradingview.com/' })
console.log('tv search name', r.s, r.t.slice(0, 600))
r = await get('https://query2.finance.yahoo.com/v1/finance/search?q=TAQA&quotesCount=6&newsCount=6')
console.log('yahoo search', r.s, r.t.slice(0, 900))
console.log('== DFM/ADX endpoints')
for (const u of ['https://www.dfm.ae/the-exchange/news-disclosures/disclosures', 'https://www.adx.ae/english/pages/newsandannouncements/announcements.aspx']) {
  const p = await get(u)
  const apis = [...new Set((p.t.match(/https?:\/\/[a-z0-9.-]*(api|feeds|gateway|data)[a-z0-9.-]*\.[a-z]{2,}[^"'\s)<>]*/gi) ?? []))].slice(0, 25)
  const scripts = [...new Set((p.t.match(/<script[^>]+src="([^"]+)"/gi) ?? []))].slice(0, 10)
  console.log(u, p.s, p.t.length, '\n  apis:', apis.join(' | '), '\n  scripts:', scripts.join(' | ').slice(0, 900))
}
