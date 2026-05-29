/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, useMemo } from 'react'
import type { ReactNode } from 'react'
import { SEED } from './data'
import type { Dataset, Stock } from './data'
import { getAnnualPs, parseYield, parseAmount, MONTHS_AR } from './format'
import { upcoming, isAlert, parseISO } from './lib'
import type { Upcoming } from './lib'

export interface PortfolioItem {
  sym: string
  amount: number
  shares: number
  stock: Stock
  price: number
  annualPs: number
  yield: number
  expectedAnnualDiv: number
}

interface StoreValue {
  stocks: Stock[]
  lastUpdated: string | null
  source: string
  loading: boolean
  portfolio: { sym: string; amount: number; shares: number }[]
  goal: number
  setGoal: (g: number) => void
  addStock: (sym: string, defaultAmount?: number) => void
  deleteStock: (sym: string) => void
  updateAmount: (sym: string, amt: number) => void
  updateShares: (sym: string, shs: number) => void
  isInPortfolio: (sym: string) => boolean
  togglePortfolioStock: (sym: string) => void
}

const Ctx = createContext<StoreValue>({
  stocks: SEED.stocks,
  lastUpdated: SEED.lastUpdated,
  source: SEED.source,
  loading: true,
  portfolio: [],
  goal: 1000,
  setGoal: () => {},
  addStock: () => {},
  deleteStock: () => {},
  updateAmount: () => {},
  updateShares: () => {},
  isInPortfolio: () => false,
  togglePortfolioStock: () => {},
})

export function StocksProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Dataset>(SEED)
  const [loading, setLoading] = useState(true)

  // 1. شحن بيانات المحفظة المخزنة مسبقاً أو تعيين قيم افتراضية نموذجية
  const [portfolio, setPortfolio] = useState<{ sym: string; amount: number; shares: number }[]>(() => {
    const saved = localStorage.getItem('dividend_portfolio')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) return parsed
      } catch {
        // العودة للافتراضي في حال حدوث مشكلة
      }
    }
    // محفظة نموذجية افتراضية لعرض البيانات بشكل مبهر
    return [
      { sym: 'DEWA', amount: 15000, shares: 15000 / 2.61 },
      { sym: 'EMIRATESNBD', amount: 30000, shares: 30000 / 27.62 },
      { sym: 'EMAAR', amount: 25000, shares: 25000 / 11.78 }
    ]
  })

  // 2. شحن الهدف المالي للمستثمر
  const [goal, setGoal] = useState<number>(() => {
    const saved = localStorage.getItem('dividend_goal')
    return saved ? parseFloat(saved) : 1000
  })

  useEffect(() => {
    let alive = true
    fetch(`${import.meta.env.BASE_URL}data.json`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('no data.json'))))
      .then((json: Dataset) => {
        if (alive && json?.stocks?.length) setData(json)
      })
      .catch(() => {
        /* يبقى الاعتماد على البيانات المُضمَّنة */
      })
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  // حفظ المحفظة والهدف في التخزين المحلي
  useEffect(() => {
    if (!loading && data.stocks.length > 0) {
      localStorage.setItem('dividend_portfolio', JSON.stringify(portfolio))
    }
  }, [portfolio, loading, data])

  useEffect(() => {
    localStorage.setItem('dividend_goal', String(goal))
  }, [goal])

  // دوال تعديل المحفظة
  const addStock = (sym: string, defaultAmount = 10000) => {
    const stock = data.stocks.find(s => s.sym === sym)
    if (!stock) return
    const price = stock.price ?? 1.0
    setPortfolio(prev => {
      if (prev.some(p => p.sym === sym)) return prev // مضاف مسبقاً
      return [
        ...prev,
        {
          sym,
          amount: defaultAmount,
          shares: price > 0 ? defaultAmount / price : 0
        }
      ]
    })
  }

  const deleteStock = (sym: string) => {
    setPortfolio(prev => prev.filter(p => p.sym !== sym))
  }

  const updateAmount = (sym: string, amt: number) => {
    setPortfolio(prev => prev.map(p => {
      if (p.sym !== sym) return p
      const stock = data.stocks.find(s => s.sym === sym)
      const price = stock?.price ?? 1.0
      return {
        sym,
        amount: amt,
        shares: price > 0 ? amt / price : 0
      }
    }))
  }

  const updateShares = (sym: string, shs: number) => {
    setPortfolio(prev => prev.map(p => {
      if (p.sym !== sym) return p
      const stock = data.stocks.find(s => s.sym === sym)
      const price = stock?.price ?? 1.0
      return {
        sym,
        amount: shs * price,
        shares: shs
      }
    }))
  }

  const isInPortfolio = (sym: string) => {
    return portfolio.some(p => p.sym === sym)
  }

  const togglePortfolioStock = (sym: string) => {
    if (isInPortfolio(sym)) {
      deleteStock(sym)
    } else {
      addStock(sym)
    }
  }

  return (
    <Ctx.Provider value={{
      stocks: data.stocks,
      lastUpdated: data.lastUpdated,
      source: data.source,
      loading,
      portfolio,
      goal,
      setGoal,
      addStock,
      deleteStock,
      updateAmount,
      updateShares,
      isInPortfolio,
      togglePortfolioStock
    }}>
      {children}
    </Ctx.Provider>
  )
}

export function useStocks() {
  return useContext(Ctx)
}

/** خطاف مخصص لإدارة محفظة الأسهم والعمليات الحسابية المترابطة تلقائياً */
export function usePortfolio() {
  const {
    stocks,
    portfolio,
    goal,
    setGoal,
    addStock,
    deleteStock,
    updateAmount,
    updateShares,
    isInPortfolio,
    togglePortfolioStock,
    loading
  } = useStocks()

  const items = useMemo(() => {
    return portfolio.map(p => {
      const stock = stocks.find(s => s.sym === p.sym)
      if (!stock) return null
      const price = stock.price ?? 1.0
      const annualPs = getAnnualPs(stock)
      const calculatedYield = price > 0 ? (annualPs / price) * 100 : 0
      const expectedAnnualDiv = p.shares * annualPs

      return {
        ...p,
        stock,
        price,
        annualPs,
        yield: calculatedYield,
        expectedAnnualDiv
      }
    }).filter(Boolean) as PortfolioItem[]
  }, [portfolio, stocks])

  const totalInvested = useMemo(() => items.reduce((sum, item) => sum + item.amount, 0), [items])
  const totalAnnualDividends = useMemo(() => items.reduce((sum, item) => sum + item.expectedAnnualDiv, 0), [items])
  const weightedYield = useMemo(() => {
    if (totalInvested === 0) return 0
    return (totalAnnualDividends / totalInvested) * 100
  }, [totalInvested, totalAnnualDividends])
  const monthlyAverage = totalAnnualDividends / 12

  return {
    items,
    totalInvested,
    totalAnnualDividends,
    weightedYield,
    monthlyAverage,
    goal,
    setGoal,
    addStock,
    deleteStock,
    updateAmount,
    updateShares,
    isInPortfolio,
    togglePortfolioStock,
    stocks,
    loading
  }
}

/** خطاف مخصص لاستخراج وحساب إحصائيات لوحة تحليلات السوق الإجمالية */
export function useMarketStats() {
  const { stocks: DATA } = useStocks()

  // 1. حساب إحصائيات السوق الكلية
  const stats = useMemo(() => {
    const yields = DATA.map((s) => parseYield(s.div.yld)).filter((x): x is number => x !== null)
    const avgYield = yields.length > 0 ? yields.reduce((a, b) => a + b, 0) / yields.length : 0
    const covMcap = DATA.map((s) => parseAmount(s.mcap)).filter((x): x is number => x !== null)
    const totalMcap = covMcap.reduce((a, b) => a + b, 0)

    const pes = DATA.map((s) => s.pe).filter((x): x is number => x !== null && x > 0)
    const avgPe = pes.length > 0 ? pes.reduce((a, b) => a + b, 0) / pes.length : 0

    return {
      dfm: DATA.filter((s) => s.ex === 'DFM').length,
      adx: DATA.filter((s) => s.ex === 'ADX').length,
      avgYield,
      totalMcap,
      mcapCount: covMcap.length,
      avgPe,
    }
  }, [DATA])

  // 2. تصفية التنبيهات القريبة
  const alertRows = useMemo(() => {
    return DATA.map((s) => ({ s, u: upcoming(s) }))
      .filter((r): r is { s: Stock; u: Upcoming } => r.u !== null && isAlert(r.u))
      .sort((a, b) => (a.u.n ?? 9999) - (b.u.n ?? 9999))
  }, [DATA])

  // 3. عمالقة السوق الإماراتي
  const marketGiants = useMemo(() => {
    return [...DATA]
      .map(s => ({ s, mc: parseAmount(s.mcap) ?? 0 }))
      .sort((a, b) => b.mc - a.mc)
      .slice(0, 5)
  }, [DATA])

  // 4. فرص التقييم المغرية (مكرر ربحية منخفض)
  const valuationOpportunities = useMemo(() => {
    return [...DATA]
      .filter(s => s.pe !== null && s.pe > 0)
      .sort((a, b) => (a.pe ?? 999) - (b.pe ?? 999))
      .slice(0, 5)
  }, [DATA])

  // 5. رواد عوائد التوزيعات
  const yieldLeaders = useMemo(() => {
    return [...DATA]
      .map(s => ({ s, yld: parseYield(s.div.yld) ?? 0 }))
      .filter(x => x.yld > 0)
      .sort((a, b) => b.yld - a.yld)
      .slice(0, 5)
  }, [DATA])

  // 6. توزيع قطاعات الشركات
  const sectorData = useMemo(() => {
    const m = new Map<string, number>()
    DATA.forEach((s) => m.set(s.sector, (m.get(s.sector) ?? 0) + 1))
    return [...m.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }, [DATA])

  // 7. تواريخ استحقاق التوزيعات شهرياً
  const monthData = useMemo(() => {
    const counts = new Array(12).fill(0)
    DATA.forEach((s) => {
      ;[s.div.exd, s.div.nextExd, s.div.pay, s.div.nextPay].forEach((d) => {
        const dt = parseISO(d ?? null)
        if (dt) counts[dt.getMonth()]++
      })
    })
    return MONTHS_AR.map((m, i) => ({ m, count: counts[i] }))
  }, [DATA])

  const maxYield = useMemo(() => Math.max(...DATA.map(s => parseYield(s.div.yld) ?? 0)), [DATA])
  const maxMcap = useMemo(() => Math.max(...DATA.map(s => parseAmount(s.mcap) ?? 0)), [DATA])

  return {
    stats,
    alertRows,
    marketGiants,
    valuationOpportunities,
    yieldLeaders,
    sectorData,
    monthData,
    maxYield,
    maxMcap
  }
}
