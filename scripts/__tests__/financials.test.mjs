import { describe, it, expect } from 'vitest'
import { FIN_COLS, parseFinRow, quarterLabels } from '../lib.mjs'

// صف بترتيب FIN_COLS من قيم مسمّاة — بقية الأعمدة null
const row = (vals) => FIN_COLS.map((c) => (c in vals ? vals[c] : null))
const ts = (iso) => Date.parse(iso + 'T12:00:00Z') / 1000

// أرقام إعمار الفعلية من TradingView (فحص 2026-10-24): مجموع أرباع 2025 = الإيراد السنوي 2025
const EMAAR = {
  total_revenue_ttm: 54861695000, net_income_ttm: 18500000000, total_assets_fq: 192985243000, isin: 'AEE000301011',
  total_shares_outstanding: 8838730257, float_shares_percent_current: 70.27140000000003,
  earnings_release_date: ts('2026-08-07'), earnings_release_next_date: ts('2026-11-11'),
  fiscal_period_fy_h: [2025, 2024, 2023, 2022, 2021, 2020, 2019],
  total_revenue_fy_h: [50838105000, 37011492000, 28162056000, 25808838000, 28509461000, 18226142000, 25705819000],
  net_income_fy_h: [17599179000, 13513938000, 11629238000, 6832049000, 3800661000, 2109199999.9999998, 6200029000],
  dps_common_stock_prim_issue_fy_h: [1, 1, 0.5, 0.25, 0.15, 0.1, 0],
  total_revenue_fq_h: [11790314000, 12670963000, 16760405999.999998, 13640012000, 10042458000, 10395230000, 12317487000, 9734472000, 7927532000],
  net_income_fq_h: [3672649000, 4997205000, 6146182000, 4373220000, 3370625000, 3709152000, 4991018000, 3182594000, 2419433000],
}

describe('quarterLabels', () => {
  it('يسمّي آخر ربع انتهى قبل الإعلان بأسبوعين على الأقل', () => {
    expect(quarterLabels('2026-08-07', 3)).toEqual([{ q: 2, y: 2026 }, { q: 1, y: 2026 }, { q: 4, y: 2025 }])
    // إعلان بعد يومين من نهاية الربع الأول = نتائج السنة السابقة لا الربع الأول
    expect(quarterLabels('2026-04-02', 1)).toEqual([{ q: 4, y: 2025 }])
  })
  it('بلا تاريخ لا تسميات', () => {
    expect(quarterLabels(null, 4)).toBeNull()
  })
})

describe('parseFinRow', () => {
  it('يبني السجل السنوي بسنواته ويكتفي بست سنوات، الأحدث أولًا', () => {
    const f = parseFinRow(row(EMAAR))
    expect(f.fy).toHaveLength(6)
    expect(f.fy[0]).toMatchObject({ y: 2025, rev: 50838105000, net: 17599179000, dps: 1 })
    expect(f.fy[5].y).toBe(2020)
    expect(f.own).toEqual({ shares: 8838730257, float: null, floatPct: 70.27, isin: 'AEE000301011' })
    expect(f.rel).toEqual({ last: '2026-08-07', next: '2026-11-11' })
  })

  it('يقبل السجل الربعي حين يطابق مجموع أرباع السنة رقمها السنوي', () => {
    const f = parseFinRow(row(EMAAR))
    expect(f.fq.map((r) => r.q)).toEqual(['Q2 2026', 'Q1 2026', 'Q4 2025', 'Q3 2025', 'Q2 2025', 'Q1 2025', 'Q4 2024', 'Q3 2024'])
    expect(f.fq[0]).toEqual({ q: 'Q2 2026', rev: 11790314000, net: 3672649000 })
  })

  it('يُسقط السجل الربعي إن لم تتطابق التسميات (لا تسمية تخمينية)', () => {
    // إعلان مزعوم في مارس يزيح التسميات ربعًا فلا يطابق المجموع
    const f = parseFinRow(row({ ...EMAAR, earnings_release_date: ts('2026-05-10') }))
    expect(f.fq).toBeNull()
    expect(f.fy).toHaveLength(6)
  })

  it('يُرجع null لسهم بلا أي بيانات مالية', () => {
    expect(parseFinRow(row({ isin: 'AE000' }))).toBeNull()
    expect(parseFinRow(undefined)).toBeNull()
  })
})
