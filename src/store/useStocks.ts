import { useQuery } from '@tanstack/react-query'
import { useShallow } from 'zustand/react/shallow'
import { datasetQuery } from './queries'
import { usePortfolioStore } from './portfolioStore'

/**
 * الواجهة الموحّدة لطبقة الحالة: بيانات السوق (TanStack Query) + المحفظة (Zustand).
 * تحافظ على شكل الواجهة السابقة فلا تتغيّر المكوّنات المستهلكة.
 */
export function useStocks() {
  const { data, isFetching, dataUpdatedAt } = useQuery(datasetQuery)
  const { portfolio, goal } = usePortfolioStore(useShallow((s) => ({ portfolio: s.portfolio, goal: s.goal })))
  const { setGoal, add, remove, setAmount, setShares, setCost } = usePortfolioStore(
    useShallow((s) => ({ setGoal: s.setGoal, add: s.add, remove: s.remove, setAmount: s.setAmount, setShares: s.setShares, setCost: s.setCost })),
  )

  const priceOf = (sym: string) => data.stocks.find((s) => s.sym === sym)?.price ?? 1.0
  const isInPortfolio = (sym: string) => portfolio.some((p) => p.sym === sym)

  return {
    stocks: data.stocks,
    indices: data.indices,
    lastUpdated: data.lastUpdated,
    source: data.source,
    // «تحميل» = أول جلب لم يكتمل بعد (البيانات المعروضة ما زالت المُضمَّنة)
    loading: isFetching && dataUpdatedAt === 0,
    portfolio,
    goal,
    setGoal,
    addStock: (sym: string, defaultAmount = 10000) => {
      if (data.stocks.some((s) => s.sym === sym)) add(sym, priceOf(sym), defaultAmount)
    },
    deleteStock: remove,
    updateAmount: (sym: string, amt: number) => setAmount(sym, amt, priceOf(sym)),
    updateShares: (sym: string, shs: number) => setShares(sym, shs, priceOf(sym)),
    updateCost: setCost,
    isInPortfolio,
    togglePortfolioStock: (sym: string) => (isInPortfolio(sym) ? remove(sym) : add(sym, priceOf(sym), 10000)),
  }
}
