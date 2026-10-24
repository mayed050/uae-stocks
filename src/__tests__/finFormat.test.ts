import { describe, it, expect } from 'vitest'
import { money, pct, dec, signed, int, exchangeCode, officialLinks } from '@/features/financials/finFormat'
import { makeStock } from './factory'

// العزل الاتجاهي: الجزء الرقمي بين U+2066 و U+2069 كي لا تنتقل الإشارة داخل النص العربي
const iso = (s: string) => `⁦${s}⁩`

describe('تنسيق القيم المالية', () => {
  it('المبالغ: رقم معزول ثم الوحدة، والسالب بإشارة ناقص', () => {
    expect(money(54_861_695_000)).toBe(`${iso('54.9')} مليار`)
    expect(money(-63_373_441_000)).toBe(`${iso('−63.4')} مليار`)
    expect(money(null)).toBe('—')
  })
  it('النسب والأرقام بإشارة صريحة عند الطلب', () => {
    expect(pct(2.284, true)).toBe(iso('+2.28%'))
    expect(pct(-4.46)).toBe(iso('−4.46%'))
    expect(signed(-0.1234)).toBe(iso('−0.123'))
    expect(dec(1.5, 2)).toBe(iso('1.50'))
    expect(int(8838730257)).toBe(iso('8,838,730,257'))
  })
})

describe('الروابط الرسمية', () => {
  it('رمز السوق من مفتاح TradingView حين يختلف عن رمز المنصة', () => {
    expect(exchangeCode(makeStock({ sym: 'MASHREQ', ex: 'DFM', tradingview: 'DFM-MASQ' }))).toBe('MASQ')
    expect(exchangeCode(makeStock({ sym: 'EMAAR', ex: 'DFM' }))).toBe('EMAAR')
  })
  it('صفحة الشركة في سوق دبي بالعربية، وموقع سوق أبوظبي لأسهمه', () => {
    expect(officialLinks(makeStock({ sym: 'EMAAR', ex: 'DFM' })).company.url).toBe(
      'https://www.dfm.ae/ar/the-exchange/market-information/company/EMAAR/trading',
    )
    expect(officialLinks(makeStock({ sym: 'FAB', ex: 'ADX' })).company.url).toBe('https://www.adx.ae/')
  })
})
