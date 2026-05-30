import { useMemo } from 'react'
import type { Stock } from '@/data'
import { getAnnualPs } from '@/format'
import { useStocks } from './StocksProvider'

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
