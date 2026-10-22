import { describe, it, expect, beforeEach } from 'vitest'
import { usePortfolioStore } from '@/store/portfolioStore'

const rehydrate = () => usePortfolioStore.persist.rehydrate()

describe('usePortfolioStore — التوافق مع التخزين القديم', () => {
  beforeEach(() => localStorage.clear())

  it('يقرأ المحفظة والهدف من المفاتيح القديمة ويرحّل الحيازات بلا تكلفة', async () => {
    localStorage.setItem('dividend_portfolio', JSON.stringify([{ sym: 'DEWA', amount: 5000, shares: 2000 }]))
    localStorage.setItem('dividend_goal', '2500')
    await rehydrate()
    const s = usePortfolioStore.getState()
    expect(s.portfolio).toEqual([{ sym: 'DEWA', amount: 5000, shares: 2000, cost: 5000 }])
    expect(s.goal).toBe(2500)
  })

  it('يكتب بالشكل القديم نفسه (مصفوفة + رقم) فتبقى النسخ السابقة قادرة على القراءة', async () => {
    localStorage.setItem('dividend_portfolio', '[]')
    await rehydrate()
    usePortfolioStore.getState().add('EMAAR', 10, 1000)
    usePortfolioStore.getState().setGoal(1500)
    expect(JSON.parse(localStorage.getItem('dividend_portfolio')!)).toEqual([{ sym: 'EMAAR', amount: 1000, shares: 100, cost: 1000 }])
    expect(localStorage.getItem('dividend_goal')).toBe('1500')
  })

  it('يتجاهل بيانات تالفة ويعود للمحفظة النموذجية', async () => {
    localStorage.setItem('dividend_portfolio', '{not json')
    await rehydrate()
    expect(usePortfolioStore.getState().portfolio.map((p) => p.sym)).toEqual(['DEWA', 'EMIRATESNBD', 'EMAAR'])
  })
})

describe('usePortfolioStore — العمليات', () => {
  beforeEach(async () => {
    localStorage.setItem('dividend_portfolio', '[]')
    await rehydrate()
  })

  it('لا يكرّر سهمًا مضافًا، ويحسب الكمية من السعر', () => {
    const { add } = usePortfolioStore.getState()
    add('FAB', 20, 10000)
    add('FAB', 20, 99999)
    expect(usePortfolioStore.getState().portfolio).toEqual([{ sym: 'FAB', amount: 10000, shares: 500, cost: 10000 }])
  })

  it('تعديل الكمية يحدّث المبلغ، وتعديل التكلفة لا يمسّ الكمية', () => {
    const st = usePortfolioStore.getState()
    st.add('FAB', 20, 10000)
    st.setShares('FAB', 600, 20)
    st.setCost('FAB', 11000)
    expect(usePortfolioStore.getState().portfolio[0]).toEqual({ sym: 'FAB', amount: 12000, shares: 600, cost: 11000 })
    st.remove('FAB')
    expect(usePortfolioStore.getState().portfolio).toEqual([])
  })
})
