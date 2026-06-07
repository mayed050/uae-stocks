/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { SEED } from '@/data'
import type { Dataset, Stock } from '@/data'

interface StoreValue {
  stocks: Stock[]
  lastUpdated: string | null
  source: string
  loading: boolean
  portfolio: Holding[]
  goal: number
  setGoal: (g: number) => void
  addStock: (sym: string, defaultAmount?: number) => void
  deleteStock: (sym: string) => void
  updateAmount: (sym: string, amt: number) => void
  updateShares: (sym: string, shs: number) => void
  updateCost: (sym: string, cost: number) => void
  isInPortfolio: (sym: string) => boolean
  togglePortfolioStock: (sym: string) => void
}

/** حيازة في المحفظة: cost = إجمالي تكلفة الشراء (أساس التكلفة) لحساب العائد الحقيقي والربح/الخسارة. */
export interface Holding { sym: string; amount: number; shares: number; cost: number }

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
  updateCost: () => {},
  isInPortfolio: () => false,
  togglePortfolioStock: () => {},
})

export function StocksProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Dataset>(SEED)
  const [loading, setLoading] = useState(true)

  // 1. شحن بيانات المحفظة المخزنة مسبقاً أو تعيين قيم افتراضية نموذجية
  const [portfolio, setPortfolio] = useState<Holding[]>(() => {
    const saved = localStorage.getItem('dividend_portfolio')
    if (saved) {
      try {
        const parsed: unknown = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          // ترحيل: الحيازات القديمة بلا cost تأخذ التكلفة = المبلغ الحالي (ربح/خسارة = 0 مبدئيًا)
          return (parsed as Holding[]).map((p) => ({
            ...p,
            cost: typeof p.cost === 'number' ? p.cost : p.amount,
          }))
        }
      } catch {
        // العودة للافتراضي في حال حدوث مشكلة
      }
    }
    // محفظة نموذجية افتراضية لعرض البيانات بشكل مبهر
    return [
      { sym: 'DEWA', amount: 15000, shares: 15000 / 2.61, cost: 14200 },
      { sym: 'EMIRATESNBD', amount: 30000, shares: 30000 / 27.62, cost: 26500 },
      { sym: 'EMAAR', amount: 25000, shares: 25000 / 11.78, cost: 23800 }
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

  // دوال تعديل المحفظة — مغلّفة بـ useCallback لتبقى مراجعها ثابتة بين عمليات الرسم
  const addStock = useCallback((sym: string, defaultAmount = 10000) => {
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
          shares: price > 0 ? defaultAmount / price : 0,
          cost: defaultAmount
        }
      ]
    })
  }, [data])

  const deleteStock = useCallback((sym: string) => {
    setPortfolio(prev => prev.filter(p => p.sym !== sym))
  }, [])

  const updateAmount = useCallback((sym: string, amt: number) => {
    setPortfolio(prev => prev.map(p => {
      if (p.sym !== sym) return p
      const stock = data.stocks.find(s => s.sym === sym)
      const price = stock?.price ?? 1.0
      return { ...p, sym, amount: amt, shares: price > 0 ? amt / price : 0 }
    }))
  }, [data])

  const updateShares = useCallback((sym: string, shs: number) => {
    setPortfolio(prev => prev.map(p => {
      if (p.sym !== sym) return p
      const stock = data.stocks.find(s => s.sym === sym)
      const price = stock?.price ?? 1.0
      return { ...p, sym, amount: shs * price, shares: shs }
    }))
  }, [data])

  // تحديث أساس التكلفة (إجمالي تكلفة الشراء) — لا يمسّ الكمية ولا القيمة السوقية
  const updateCost = useCallback((sym: string, cost: number) => {
    setPortfolio(prev => prev.map(p => (p.sym === sym ? { ...p, cost } : p)))
  }, [])

  const isInPortfolio = useCallback((sym: string) => {
    return portfolio.some(p => p.sym === sym)
  }, [portfolio])

  const togglePortfolioStock = useCallback((sym: string) => {
    if (isInPortfolio(sym)) {
      deleteStock(sym)
    } else {
      addStock(sym)
    }
  }, [isInPortfolio, deleteStock, addStock])

  // قيمة السياق مُحفّظة — تتغيّر فقط عند تغيّر اعتماد فعلي، فلا يُعاد رسم كل المستهلكين بلا داعٍ
  const value = useMemo<StoreValue>(() => ({
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
    updateCost,
    isInPortfolio,
    togglePortfolioStock,
  }), [data, loading, portfolio, goal, addStock, deleteStock, updateAmount, updateShares, updateCost, isInPortfolio, togglePortfolioStock])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStocks() {
  return useContext(Ctx)
}
