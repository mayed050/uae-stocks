// فحص مؤقت (للقراءة فقط): ما المتاح فعلًا من بيانات مالية وإفصاحات وملكية وحوكمة لأسهم السوقين.
import { writeFileSync, mkdirSync } from 'node:fs'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36'
const out = []
const log = (...a) => out.push(a.join(' '))
const short = (v) => {
  if (Array.isArray(v)) return `[${v.length}] ` + JSON.stringify(v.slice(0, 12))
  if (typeof v === 'string') return JSON.stringify(v.slice(0, 160))
  return JSON.stringify(v)
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ── A) TradingView: كل حقل منفردًا (حقل غير معروف يُفشل الطلب كله) ──
const TICKERS = ['DFM:EMAAR', 'ADX:FAB', 'DFM:DEWA', 'ADX:ALDAR']
const FIELDS = [
  'total_revenue_fy', 'total_revenue_ttm', 'total_revenue_fq', 'net_income_fy', 'net_income_fq', 'gross_profit_fy', 'oper_income_fy',
  'ebitda', 'ebitda_fy', 'earnings_per_share_fy', 'earnings_per_share_basic_fy', 'earnings_per_share_diluted_fy', 'earnings_per_share_diluted_ttm',
  'total_assets_fq', 'total_assets_fy', 'total_liabilities_fq', 'total_liabilities_fy', 'total_equity_fq', 'total_equity_fy',
  'total_debt_fq', 'total_debt_fy', 'cash_n_short_term_invest_fq', 'cash_n_equivalents_fq', 'net_debt_fq',
  'return_on_equity', 'return_on_equity_fq', 'return_on_equity_fy', 'return_on_assets', 'return_on_assets_fq', 'return_on_invested_capital',
  'gross_margin', 'gross_margin_ttm', 'gross_margin_fy', 'operating_margin', 'operating_margin_ttm', 'operating_margin_fy',
  'net_margin', 'net_margin_ttm', 'net_margin_fy', 'debt_to_equity', 'debt_to_equity_fq', 'current_ratio', 'current_ratio_fq', 'quick_ratio',
  'price_book_ratio', 'price_book_fq', 'price_sales_ratio', 'price_sales_current', 'enterprise_value_current', 'enterprise_value_fq',
  'enterprise_value_ebitda_ttm', 'dividends_per_share_fq', 'dividends_per_share_fy', 'dividend_payout_ratio_ttm', 'dividend_payout_ratio_fy',
  'dps_common_stock_prim_issue_fy', 'total_shares_outstanding_fundamental', 'total_shares_outstanding', 'float_shares_outstanding',
  'float_shares_outstanding_current', 'float_shares_percent_current', 'number_of_employees', 'number_of_employees_fy',
  'earnings_release_date', 'earnings_release_next_date', 'earnings_release_trading_date_fq', 'earnings_release_next_trading_date_fq',
  'earnings_per_share_forecast_next_fq', 'revenue_forecast_next_fq', 'total_revenue_yoy_growth_fy', 'total_revenue_yoy_growth_ttm',
  'net_income_yoy_growth_fy', 'earnings_per_share_diluted_yoy_growth_fy', 'fundamental_currency_code', 'currency', 'isin', 'country',
  'business_description', 'web_site_url', 'website', 'ceo', 'founded', 'location', 'fiscal_period_end', 'fiscal_year_end',
  'free_cash_flow_fy', 'free_cash_flow_ttm', 'cash_f_operating_activities_fy', 'capital_expenditures_fy', 'book_value_per_share_fq',
  'net_interest_income_fy', 'interest_income_fy', 'total_deposits_fq', 'loans_net_fq', 'beta_1_year', 'Volatility.M', 'RSI', 'SMA50', 'SMA200',
  'Perf.W', 'Perf.1M', 'Perf.3M', 'Perf.YTD', 'Perf.Y', 'average_volume_30d_calc', 'relative_volume_10d_calc',
  // تواريخ ومصفوفات تاريخية
  'total_revenue_fy_h', 'net_income_fy_h', 'earnings_per_share_basic_fy_h', 'earnings_per_share_diluted_fy_h', 'total_assets_fy_h',
  'total_equity_fy_h', 'total_debt_fy_h', 'total_revenue_fq_h', 'net_income_fq_h', 'fiscal_period_fy_h', 'fiscal_period_fq_h',
  'fiscal_period_end_fy_h', 'fiscal_period_end_fq_h', 'dps_common_stock_prim_issue_fy_h', 'dividends_per_share_fy_h', 'gross_margin_fy_h',
  'net_margin_fy_h', 'return_on_equity_fy_h', 'earnings_release_date_fq_h', 'free_cash_flow_fy_h', 'cash_f_operating_activities_fy_h',
]
log('==== A) TradingView uae/scan — حقل بحقل', TICKERS.join(' '))
const okFields = []
for (const f of FIELDS) {
  try {
    const r = await fetch('https://scanner.tradingview.com/uae/scan', {
      method: 'POST',
      headers: { 'User-Agent': UA, 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbols: { tickers: TICKERS }, columns: [f] }),
    })
    const t = await r.text()
    if (!r.ok) { log(`✗ ${f} HTTP ${r.status} ${t.slice(0, 90)}`); continue }
    const j = JSON.parse(t)
    const vals = (j.data ?? []).map((row) => `${row.s}=${short(row.d?.[0])}`)
    const any = (j.data ?? []).some((row) => row.d?.[0] !== null && row.d?.[0] !== undefined)
    if (any) okFields.push(f)
    log(`${any ? '✓' : '·'} ${f} :: ${vals.join(' | ')}`)
  } catch (e) { log(`✗ ${f} ERR ${e.message}`) }
  await sleep(150)
}
log('OK FIELDS:', okFields.join(','))

// نقطة الرمز المنفرد (صفحة السهم في TradingView)
log('\n==== A2) TradingView /symbol')
for (const sym of ['DFM:EMAAR', 'ADX:FAB']) {
  const url = `https://scanner.tradingview.com/symbol?symbol=${sym}&fields=${FIELDS.join(',')}&no_404=true`
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA } })
    const t = await r.text()
    log(`${sym} HTTP ${r.status} len=${t.length}`)
    if (r.ok) {
      const j = JSON.parse(t)
      for (const [k, v] of Object.entries(j)) if (v !== null) log(`  ${k} = ${short(v)}`)
    } else log('  ' + t.slice(0, 200))
  } catch (e) { log(`${sym} ERR ${e.message}`) }
}

// ── B) الصفحات الرسمية: حالة، عنوان، روابط الشركات، ونوافذ الكلمات المفتاحية ──
const KW = /(shareholder|board of directors|chairman|foreign ownership|foreign limit|major|ownership|disclosure|financial statement|annual report|governance|المساهم|مجلس الإدارة|ملكية الأجانب|إفصاح)/i
async function page(name, url, extra = {}) {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html,application/json,*/*', 'Accept-Language': 'en', ...extra }, redirect: 'follow' })
    const t = await r.text()
    const title = (t.match(/<title[^>]*>([^<]*)/i) ?? [])[1] ?? ''
    log(`\n== ${name} ${r.status} ${r.url} len=${t.length} ct=${r.headers.get('content-type')} title=${title.trim().slice(0, 100)}`)
    return t
  } catch (e) { log(`\n== ${name} ERR ${e.message}`); return '' }
}
function hrefs(t, re, n = 40) {
  return [...new Set([...t.matchAll(/(?:href|src)=["']([^"']+)["']/g)].map((m) => m[1]).filter((h) => re.test(h)))].slice(0, n)
}
function windows(t, n = 30) {
  const txt = t.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, '\n').replace(/\s*\n\s*/g, '\n')
  const lines = txt.split('\n').filter(Boolean)
  const hit = []
  lines.forEach((l, i) => { if (KW.test(l)) hit.push(lines.slice(Math.max(0, i - 1), i + 3).join(' ⟂ ').slice(0, 260)) })
  return [...new Set(hit)].slice(0, n)
}
function stateKeys(t) {
  const m = t.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/) ?? t.match(/window\.__NUXT__\s*=\s*([\s\S]{0,400})/)
  if (!m) return 'no state blob'
  return m[1].slice(0, 600).replace(/\s+/g, ' ')
}

log('\n==== B) DFM')
const dfmDisc = await page('DFM disclosures', 'https://www.dfm.ae/the-exchange/news-disclosures/disclosures')
log('company links:', hrefs(dfmDisc, /company|issuer|listed/i).join(' , '))
log('documents:', hrefs(dfmDisc, /documents|\.pdf/i, 15).join(' , '))
log('state:', stateKeys(dfmDisc))
const nuxtPayload = hrefs(dfmDisc, /_payload|payload\.js|\.json/i, 10)
log('payload refs:', nuxtPayload.join(' , '))
// أنماط محتملة لصفحة الشركة
for (const p of [
  '/the-exchange/market-information/company/EMAAR/overview',
  '/the-exchange/market-information/company/EMAAR/trading/trading-summary',
  '/the-exchange/market-information/company/EMAAR/news-disclosures/disclosures',
  '/the-exchange/market-information/company/EMAAR/company-profile',
  '/the-exchange/market-information/company/EMAAR/shareholders',
  '/the-exchange/market-information/company/EMAAR/financials',
  '/en/the-exchange/market-information/company/EMAAR/overview',
]) {
  const t = await page('DFM ' + p, 'https://www.dfm.ae' + p)
  if (t.length > 2000) { windows(t, 12).forEach((w) => log('  · ' + w)); log('  links: ' + hrefs(t, /EMAAR/i, 25).join(' , ')) }
}
for (const p of ['/the-exchange/statistics-reports/foreign-ownership', '/the-exchange/market-information/foreign-ownership', '/the-exchange/statistics-reports']) {
  const t = await page('DFM ' + p, 'https://www.dfm.ae' + p)
  if (t.length > 2000) { windows(t, 8).forEach((w) => log('  · ' + w)); log('  links: ' + hrefs(t, /foreign|ownership|report/i, 20).join(' , ')) }
}

log('\n==== C) ADX')
const adxHome = await page('ADX home', 'https://www.adx.ae/')
log('company links:', hrefs(adxHome, /company|secCode|profile|issuer/i).join(' , '))
log('state:', stateKeys(adxHome))
for (const p of [
  '/main-market/company-profile/overview?secCode=FAB',
  '/main-market/company-profile/disclosures?secCode=FAB',
  '/main-market/company-profile/shareholders?secCode=FAB',
  '/main-market/company-profile/board-of-directors?secCode=FAB',
  '/main-market/company-profile/financials?secCode=FAB',
  '/english/pages/productsandservices/securities/comp/companyprofile.aspx?secCode=FAB',
]) {
  const t = await page('ADX ' + p, 'https://www.adx.ae' + p)
  if (t.length > 2000) { windows(t, 12).forEach((w) => log('  · ' + w)); log('  state: ' + stateKeys(t)) }
}

mkdirSync('probe-out', { recursive: true })
writeFileSync('probe-out/financials.txt', out.join('\n') + '\n')
console.log(out.join('\n'))
