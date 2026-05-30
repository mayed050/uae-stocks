import { useMemo } from 'react'
import type { Stock } from '@/data'
import { parseYield, parseAmount, MONTHS_AR } from '@/format'
import { upcoming, isAlert, parseISO } from '@/lib'
import type { Upcoming } from '@/lib'
import { useStocks } from './StocksProvider'

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
    const counts = new Array<number>(12).fill(0)
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
