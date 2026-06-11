// منطق المحفظة الحسابي النقي — مستخرَج من Portfolio.tsx ليكون قابلاً للاختبار باستقلال عن React.
import type { PortfolioItem } from '@/store/usePortfolio'
import { parseISO } from '@/lib'
import { MONTHS_AR } from '@/format'
import type { AdvisorOutput, LifestyleMilestone } from './PortfolioIntel'

export interface SectorSlice { name: string; value: number }

/** تنوع القطاعات في المحفظة، مرتّبًا تنازليًا حسب حجم الاستثمار. */
export function computeSectorData(items: PortfolioItem[]): SectorSlice[] {
  const m = new Map<string, number>()
  items.forEach(item => {
    m.set(item.stock.sector, (m.get(item.stock.sector) ?? 0) + item.amount)
  })
  return [...m.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
}

/** مستشار المحفظة «الفارابي»: قراءة وصفية محايدة لتركيبة المحفظة — ليست توصية استثمارية. */
export function computeAdvisorOutput(
  items: PortfolioItem[],
  sectorData: SectorSlice[],
  totalInvested: number,
  weightedYield: number,
): AdvisorOutput {
  if (items.length === 0) {
    return {
      title: '🔮 بانتظار إعداد المحفظة',
      text: 'أضِف أسهماً وعيّن كمياتها أدناه، وستظهر هنا قراءة وصفية لتنويعك القطاعي وعائدك المرجّح — لأغراض تثقيفية فقط، دون أي توصية بالشراء أو البيع.',
      rating: 'بانتظار البيانات'
    }
  }

  let title = '🔮 قراءة وصفية للمحفظة'
  let text = 'تركيبة المحفظة تبدو متوازنة نسبياً عبر القطاعات. هذه قراءة وصفية لأغراض التثقيف فقط — تحقّق دائماً من المصادر الرسمية.'
  let rating = 'متوازنة'

  const maxSector = sectorData.length > 0 ? sectorData[0] : null
  const maxSectorPct = maxSector && totalInvested > 0 ? (maxSector.value / totalInvested) * 100 : 0
  const companyCount = items.length

  if (companyCount === 1) {
    title = '⚠️ ملاحظة: تركّز في سهم واحد'
    text = `المحفظة مكوّنة حالياً من سهم واحد فقط (${items[0]?.sym}). من منظور تثقيفي عام، يقلّل توزيع الاستثمارات على عدّة شركات وقطاعات من أثر تذبذب سهم منفرد. هذه ملاحظة وصفية لا توصية.`
    rating = 'تركّز مرتفع'
  } else if (maxSector && maxSectorPct > 55) {
    title = '⚠️ ملاحظة: تركّز قطاعي مرتفع'
    text = `تتركّز ${maxSectorPct.toFixed(1)}% من المحفظة في قطاع واحد (${maxSector.name}). عموماً، يرتبط التركّز القطاعي العالي بحساسية أكبر لأحداث ذلك القطاع. قراءة وصفية لأغراض التثقيف فقط.`
    rating = 'تركّز قطاعي'
  } else if (weightedYield < 4) {
    title = '💡 ملاحظة: عائد توزيعات منخفض نسبياً'
    text = `العائد المرجّح الحالي للمحفظة (${weightedYield.toFixed(2)}%) أقل من متوسط مرجعي للسوق الإماراتي يقارب 5.5%. هذه مقارنة وصفية لأغراض التثقيف فقط، وليست توصية بشراء أسهم بعينها.`
    rating = 'عائد منخفض'
  } else if (weightedYield > 8.5) {
    title = '⚠️ ملاحظة: عائد مرتفع وحسّاس'
    text = `العائد المرجّح للمحفظة مرتفع (${weightedYield.toFixed(2)}%). عموماً، قد ترتبط العوائد المرتفعة جداً بمخاطر أعلى أو حساسية للدورات الاقتصادية. قراءة وصفية لا توصية.`
    rating = 'عائد حسّاس'
  } else if (companyCount >= 3 && sectorData.length >= 2) {
    title = '🎉 توزيع متوازن عبر القطاعات'
    text = `المحفظة موزّعة على عدّة قطاعات بعائد مرجّح يبلغ ${weightedYield.toFixed(2)}%. هذه قراءة وصفية لتركيبة المحفظة لأغراض التثقيف فقط — دون أي توصية استثمارية.`
    rating = 'متوازنة'
  }

  return { title, text, rating }
}

/** خريطة أهداف الحياة المغطاة بالأرباح (Gamified Lifestyle Milestones). */
export function computeLifestyleMilestones(totalAnnualDividends: number): LifestyleMilestone[] {
  const list = [
    { id: 'coffee', name: '☕ قهوتك اليومية مغطاة بالكامل', cost: 1800, desc: 'يعادل 5 دراهم يومياً لتأمين كوب كرك دافئ أو قهوة متميزة.' },
    { id: 'bills', name: '⚡ فواتير الخدمات مغطاة بالكامل', cost: 6000, desc: 'يعادل 500 درهم شهرياً لتأمين فواتير الإنترنت، الكهرباء، والمياه.' },
    { id: 'fuel', name: '🚗 قسط النقل والوقود مغطى', cost: 14400, desc: 'يعادل 1,200 درهم شهرياً لتغطية استهلاك الوقود والمواصلات بالكامل.' },
    { id: 'travel', name: '✈️ السفرة العائلية السنوية مغطاة', cost: 30000, desc: 'يعادل 2,500 درهم شهرياً لتأمين عطلة سنوية مميزة خارج البلاد مع العائلة.' },
    { id: 'rent', name: '🏡 إيجار منزلك السنوي مغطى بالكامل', cost: 72000, desc: 'يعادل 6,000 درهم شهرياً لتغطية بند السكن بالكامل من مكاسب محفظتك!' }
  ]

  return list.map(m => {
    const pct = Math.min(100, Math.round((totalAnnualDividends / m.cost) * 100))
    return { ...m, pct, unlocked: totalAnnualDividends >= m.cost }
  })
}

/** التدفق النقدي المتوقع للأرباح شهريًا، موزّعًا على أشهر الدفع المعلنة أو بالتساوي عند غيابها. */
export function computeMonthlyFlow(items: PortfolioItem[]): { name: string; amount: number }[] {
  const months = new Array<number>(12).fill(0)
  items.forEach(item => {
    const payDate = parseISO(item.stock.div.pay)
    const nextPayDate = parseISO(item.stock.div.nextPay)
    const payoutMonths: number[] = []

    if (payDate) payoutMonths.push(payDate.getMonth())
    if (nextPayDate) payoutMonths.push(nextPayDate.getMonth())

    // نصف سنوي
    if (item.stock.div.freq === 'نصف سنوي' && payoutMonths.length === 1) {
      payoutMonths.push(((payoutMonths[0] ?? 0) + 6) % 12)
    }
    // ربعي
    if ((item.stock.div.freq === 'ربعي' || item.stock.div.ps?.includes('ربع')) && payoutMonths.length >= 1) {
      const first = payoutMonths[0] ?? 0
      payoutMonths.push((first + 3) % 12, (first + 6) % 12, (first + 9) % 12)
    }

    const uniqueMonths = [...new Set(payoutMonths)]
    if (uniqueMonths.length > 0) {
      const payoutPerActiveMonth = item.expectedAnnualDiv / uniqueMonths.length
      uniqueMonths.forEach(m => {
        months[m] = (months[m] ?? 0) + payoutPerActiveMonth
      })
    } else {
      // توزيع افتراضي بالتساوي على الـ 12 شهراً في حال لم يُحدد تاريخ
      months.forEach((_, m) => {
        months[m] = (months[m] ?? 0) + item.expectedAnnualDiv / 12
      })
    }
  })

  return MONTHS_AR.map((m, i) => ({
    name: m,
    amount: Math.round(months[i] ?? 0)
  }))
}

export interface DripPoint {
  year: string
  cashWealth: number
  dripWealth: number
  snowballBenefit: number
}

export interface DripParams {
  totalInvested: number
  weightedYield: number
  years: number
  monthly: number
  priceGrowth: number
  divGrowth: number
}

/** محاكاة خطة إعادة استثمار الأرباح (DRIP) مقابل سحبها نقدًا على مدار السنوات. */
export function computeDripSeries({ totalInvested, weightedYield, years, monthly, priceGrowth, divGrowth }: DripParams): DripPoint[] {
  const data: DripPoint[] = []
  let capCash = totalInvested
  let capDrip = totalInvested
  let cumulativeDivCash = 0

  const currentYieldDecimal = weightedYield / 100

  // إضافة سنة التأسيس (السنة 0)
  data.push({
    year: 'البداية',
    cashWealth: Math.round(capCash),
    dripWealth: Math.round(capDrip),
    snowballBenefit: 0
  })

  for (let y = 1; y <= years; y++) {
    const priceGrowthFactor = 1 + priceGrowth / 100
    const divGrowthFactor = Math.pow(1 + divGrowth / 100, y)
    const annualYield = currentYieldDecimal * divGrowthFactor

    // 1. حساب مسار الكاش (بدون إعادة استثمار)
    const divCash = capCash * annualYield
    cumulativeDivCash += divCash
    capCash = capCash * priceGrowthFactor + monthly * 12
    const cashWealth = capCash + cumulativeDivCash

    // 2. حساب مسار الـ DRIP (مع إعادة استثمار الأرباح فوراً)
    const divDrip = capDrip * annualYield
    capDrip = capDrip * priceGrowthFactor + divDrip + monthly * 12
    const dripWealth = capDrip

    data.push({
      year: `سنة ${y}`,
      cashWealth: Math.round(cashWealth),
      dripWealth: Math.round(dripWealth),
      snowballBenefit: Math.max(0, Math.round(dripWealth - cashWealth))
    })
  }
  return data
}
