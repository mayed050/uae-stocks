import { useMemo } from 'react'
import type { Stock } from '@/data'
import { getAnnualPs } from '@/format'
import { useStocks } from './StocksProvider'

export interface PortfolioItem {
  sym: string
  amount: number
  shares: number
  cost: number
  stock: Stock
  price: number
  annualPs: number
  yield: number
  expectedAnnualDiv: number
  marketValue: number   // القيمة السوقية الحالية = الكمية × السعر
  gain: number          // ربح/خسارة غير محقق = القيمة السوقية − التكلفة
  gainPct: number
  yieldOnCost: number   // العائد على التكلفة = التوزيع السنوي ÷ التكلفة
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
    updateCost,
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
      const cost = typeof p.cost === 'number' ? p.cost : p.amount
      const marketValue = p.shares * price
      const gain = marketValue - cost
      const gainPct = cost > 0 ? (gain / cost) * 100 : 0
      const yieldOnCost = cost > 0 ? (expectedAnnualDiv / cost) * 100 : 0

      return {
        ...p,
        cost,
        stock,
        price,
        annualPs,
        yield: calculatedYield,
        expectedAnnualDiv,
        marketValue,
        gain,
        gainPct,
        yieldOnCost
      }
    }).filter(Boolean) as PortfolioItem[]
  }, [portfolio, stocks])

  const totalInvested = useMemo(() => items.reduce((sum, item) => sum + item.amount, 0), [items])
  const totalCost = useMemo(() => items.reduce((sum, item) => sum + item.cost, 0), [items])
  const totalMarketValue = useMemo(() => items.reduce((sum, item) => sum + item.marketValue, 0), [items])
  const totalGain = totalMarketValue - totalCost
  const totalGainPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0
  const totalAnnualDividends = useMemo(() => items.reduce((sum, item) => sum + item.expectedAnnualDiv, 0), [items])
  const weightedYield = useMemo(() => {
    if (totalInvested === 0) return 0
    return (totalAnnualDividends / totalInvested) * 100
  }, [totalInvested, totalAnnualDividends])
  const yieldOnCost = totalCost > 0 ? (totalAnnualDividends / totalCost) * 100 : 0
  const monthlyAverage = totalAnnualDividends / 12

  return {
    items,
    totalInvested,
    totalCost,
    totalMarketValue,
    totalGain,
    totalGainPct,
    totalAnnualDividends,
    weightedYield,
    yieldOnCost,
    monthlyAverage,
    goal,
    setGoal,
    addStock,
    deleteStock,
    updateAmount,
    updateShares,
    updateCost,
    isInPortfolio,
    togglePortfolioStock,
    stocks,
    loading
  }
}
