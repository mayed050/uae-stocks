import { useState, useMemo } from 'react'
import type { Stock } from '@/data'
import { usePortfolio } from '@/store'
import { fmtAmount, MONTHS_AR } from '@/format'
import { parseISO } from '@/lib'
import Avatar from '@/components/Avatar'
import PortfolioIntel from './PortfolioIntel'
import StatCard from '@/components/ui/StatCard'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, LabelList, AreaChart, Area
} from 'recharts'

import { PALETTE, TIP_STYLE as tipStyle } from '@/constants/ui'

export default function Portfolio({ onOpen }: { onOpen: (s: Stock) => void }) {
  const {
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
    stocks,
    loading
  } = usePortfolio()

  // 1. حقول البحث والإدخال لقائمة الإضافة
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  // 2. حالات محاكي خطة إعادة استثمار الأرباح (DRIP Simulator States)
  const [dripYears, setDripYears] = useState<number>(10)
  const [dripMonthly, setDripMonthly] = useState<number>(1000)
  const [dripPriceGrowth, setDripPriceGrowth] = useState<number>(4) // 4% نمو سعر السهم
  const [dripDivGrowth, setDripDivGrowth] = useState<number>(3)     // 3% نمو التوزيعات السنوي

  // تصفية نتائج البحث للأسهم المتاحة للإضافة
  const availableStocks = useMemo(() => {
    return stocks.filter(s => 
      !isInPortfolio(s.sym) &&
      (s.sym.toLowerCase().includes(searchQuery.toLowerCase()) || 
       s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  }, [stocks, searchQuery, isInPortfolio])

  // 3. إعداد البيانات للرسوم البيانية للمحفظة
  // أ. تنوع القطاعات في المحفظة
  const sectorData = useMemo(() => {
    const m = new Map<string, number>()
    items.forEach(item => {
      m.set(item.stock.sector, (m.get(item.stock.sector) ?? 0) + item.amount)
    })
    return [...m.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }, [items])

  // 3.ب. مستشار المحفظة الذكي "الفارابي" (Al-Farabi AI Portfolio Advisor)
  const advisorOutput = useMemo(() => {
    if (items.length === 0) {
      return {
        title: '🔮 الفارابي بانتظار إعداد المحفظة',
        text: 'قم بالبحث وإضافة أسهم استثمارية وتعيين كمياتها أدناه، وسيقوم الفارابي فوراً بتحليل تنويعك القطاعي وعوائدك المرجحة وتقديم نصائح تخصيص أصول مخصصة وحقيقية.',
        rating: 'بانتظار البيانات'
      }
    }

    let title = '🔮 مستشار المحفظة الذكي (الفارابي)'
    let text = 'محفظتك تظهر أداءً متزناً، استمر في إعادة استثمار توزيعاتك لتشهد قوة الفائدة المركبة.'
    let rating = 'متوازنة'

    const maxSector = sectorData.length > 0 ? sectorData[0] : null
    const maxSectorPct = maxSector && totalInvested > 0 ? (maxSector.value / totalInvested) * 100 : 0
    const companyCount = items.length

    if (companyCount === 1) {
      title = '⚠️ تنبيه: تركز استثماري عالي الخطورة'
      text = `تحتوي محفظتك حالياً على سهم شركة واحدة فقط وهي (${items[0].sym}). من الحكمة الاستثمارية لتأمين رأس مالك توزيع استثماراتك على 3 إلى 5 شركات في قطاعات مختلفة لتجنب مخاطر التذبذب الفردي المفاجئ.`
      rating = 'مخاطر عالية'
    } else if (maxSector && maxSectorPct > 55) {
      title = '⚠️ تنبيه: تركز قطاعي مرتفع'
      text = `تتركز استثماراتك بشكل كبير جداً بنسبة ${maxSectorPct.toFixed(1)}% في قطاع واحد وهو (${maxSector.name}). لتفادي أزمات القطاعات الفردية، ننصحك بتوجيه سيولتك الاستثمارية القادمة نحو قطاعات دفاعية ومستقرة أخرى مثل قطاع المرافق والخدمات أو قطاع الطاقة.`
      rating = 'تركز مرتفع'
    } else if (weightedYield < 4) {
      title = '💡 توصية: تعزيز عائد توزيعات المحفظة'
      text = `متوسط عائد توزيعات محفظتك المرجح الحالي (${weightedYield.toFixed(2)}%) يقل عن متوسط السوق الإماراتي البالغ 5.5%. ننصح بزيادة حصتك في أسهم ريادية ذات عوائد ممتازة (مثل إعمار العقارية، بنك دبي الإسلامي، أو أدنوك للتوزيع) لرفع التدفقات النقدية.`
      rating = 'عائد منخفض'
    } else if (weightedYield > 8.5) {
      title = '⚠️ تنبيه: عوائد محفظة مرتفعة وحساسة'
      text = `عائد محفظتك المرجح مرتفع للغاية (${weightedYield.toFixed(2)}%). تذكر دوماً أن العوائد الفوق طبيعية ترتبط غالباً بمخاطر أعلى أو حساسية شديدة للدورات الاقتصادية (مثل أسهم العقارات). ننصح بدمج حصص مستقرة كحماية.`
      rating = 'عوائد حساسة'
    } else if (companyCount >= 3 && sectorData.length >= 2) {
      title = '🎉 محفظة متوازنة وممتازة'
      text = `أداء استثنائي مذهل! محفظتك متوازنة للغاية وموزعة بذكاء على قطاعات متعددة بعائد مرجح يبلغ (${weightedYield.toFixed(2)}%). نوصي بالاستمرار في استثمار مبالغ إضافية دورية وإعادة ضخ الأرباح لتفعيل أثر كرة الثلج الرائع.`
      rating = 'متوازنة جداً'
    }

    return { title, text, rating }
  }, [items, sectorData, totalInvested, weightedYield])

  // 3.جـ. خريطة أهداف الحياة المغطاة بالأرباح (Gamified Lifestyle Milestones)
  const lifestyleMilestones = useMemo(() => {
    const list = [
      { id: 'coffee', name: '☕ قهوتك اليومية مغطاة بالكامل', cost: 1800, desc: 'يعادل 5 دراهم يومياً لتأمين كوب كرك دافئ أو قهوة متميزة.' },
      { id: 'bills', name: '⚡ فواتير الخدمات مغطاة بالكامل', cost: 6000, desc: 'يعادل 500 درهم شهرياً لتأمين فواتير الإنترنت، الكهرباء، والمياه.' },
      { id: 'fuel', name: '🚗 قسط النقل والوقود مغطى', cost: 14400, desc: 'يعادل 1,200 درهم شهرياً لتغطية استهلاك الوقود والمواصلات بالكامل.' },
      { id: 'travel', name: '✈️ السفرة العائلية السنوية مغطاة', cost: 30000, desc: 'يعادل 2,500 درهم شهرياً لتأمين عطلة سنوية مميزة خارج البلاد مع العائلة.' },
      { id: 'rent', name: '🏡 إيجار منزلك السنوي مغطى بالكامل', cost: 72000, desc: 'يعادل 6,000 درهم شهرياً لتغطية بند السكن بالكامل من مكاسب محفظتك!' }
    ]

    return list.map(m => {
      const pct = Math.min(100, Math.round((totalAnnualDividends / m.cost) * 100))
      return {
        ...m,
        pct,
        unlocked: totalAnnualDividends >= m.cost
      }
    })
  }, [totalAnnualDividends])

  // ب. جدول التدفق النقدي المتوقع للأرباح شهرياً
  const monthlyData = useMemo(() => {
    const months = new Array<number>(12).fill(0)
    items.forEach(item => {
      const payDate = parseISO(item.stock.div.pay)
      const nextPayDate = parseISO(item.stock.div.nextPay)
      const payoutMonths: number[] = []

      if (payDate) payoutMonths.push(payDate.getMonth())
      if (nextPayDate) payoutMonths.push(nextPayDate.getMonth())

      // نصف سنوي
      if (item.stock.div.freq === 'نصف سنوي' && payoutMonths.length === 1) {
        payoutMonths.push((payoutMonths[0] + 6) % 12)
      }
      // ربعي
      if ((item.stock.div.freq === 'ربعي' || item.stock.div.ps?.includes('ربع')) && payoutMonths.length >= 1) {
        const first = payoutMonths[0]
        payoutMonths.push((first + 3) % 12, (first + 6) % 12, (first + 9) % 12)
      }

      const uniqueMonths = [...new Set(payoutMonths)]
      if (uniqueMonths.length > 0) {
        const payoutPerActiveMonth = item.expectedAnnualDiv / uniqueMonths.length
        uniqueMonths.forEach(m => {
          months[m] += payoutPerActiveMonth
        })
      } else {
        // توزيع افتراضي بالتساوي على الـ 12 شهراً في حال لم يُحدد تاريخ
        months.forEach((_, m) => {
          months[m] += item.expectedAnnualDiv / 12
        })
      }
    })

    return MONTHS_AR.map((m, i) => ({
      name: m,
      amount: Math.round(months[i])
    }))
  }, [items])

  // جـ. حسابات محاكاة خطة الـ DRIP على مدار السنوات
  const dripData = useMemo(() => {
    const data = []
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

    for (let y = 1; y <= dripYears; y++) {
      const priceGrowthFactor = 1 + dripPriceGrowth / 100
      const divGrowthFactor = Math.pow(1 + dripDivGrowth / 100, y)
      const annualYield = currentYieldDecimal * divGrowthFactor

      // 1. حساب مسار الكاش (بدون إعادة استثمار)
      const divCash = capCash * annualYield
      cumulativeDivCash += divCash
      capCash = capCash * priceGrowthFactor + dripMonthly * 12
      const cashWealth = capCash + cumulativeDivCash

      // 2. حساب مسار الـ DRIP (مع إعادة استثمار الأرباح فوراً)
      const divDrip = capDrip * annualYield
      capDrip = capDrip * priceGrowthFactor + divDrip + dripMonthly * 12
      const dripWealth = capDrip

      data.push({
        year: `سنة ${y}`,
        cashWealth: Math.round(cashWealth),
        dripWealth: Math.round(dripWealth),
        snowballBenefit: Math.max(0, Math.round(dripWealth - cashWealth))
      })
    }
    return data
  }, [totalInvested, weightedYield, dripYears, dripMonthly, dripPriceGrowth, dripDivGrowth])

  // حساب مؤشر كرة الثلج النهائي
  const finalDripWealth = dripData[dripData.length - 1]?.dripWealth ?? 0
  const finalCashWealth = dripData[dripData.length - 1]?.cashWealth ?? 0
  const snowballEffectValue = Math.max(0, finalDripWealth - finalCashWealth)

  // نسبة تحقيق الهدف المالي
  const progressPercent = Math.min(100, Math.round((monthlyAverage / goal) * 100))

  return (
    <div className="view">
      {/* تنسيقات مخصصة للتكامل وحقول الإدخال بشكل جمالي */}
      <style>{`
        .p-input {
          background: var(--chip);
          border: 1px solid var(--line);
          color: var(--txt);
          border-radius: 8px;
          padding: 6px 10px;
          width: 120px;
          font-family: inherit;
          font-weight: 600;
          text-align: center;
          outline: none;
          transition: border-color 0.15s;
        }
        .p-input:focus {
          border-color: var(--brand);
        }
        .del-btn {
          background: transparent;
          border: 1px solid transparent;
          color: var(--muted2);
          cursor: pointer;
          font-size: 16px;
          padding: 6px;
          border-radius: 8px;
          transition: 0.15s;
        }
        .del-btn:hover {
          color: var(--bad);
          background: rgba(255, 90, 114, 0.1);
        }
        .p-search-container {
          position: relative;
          width: 320px;
        }
        .p-dropdown {
          position: absolute;
          top: 105%;
          left: 0;
          right: 0;
          background: var(--panel-solid);
          border: 1px solid var(--line);
          border-radius: 12px;
          box-shadow: var(--shadow);
          z-index: 100;
          max-height: 250px;
          overflow-y: auto;
        }
        .p-dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 10px 12px;
          border: 0;
          background: transparent;
          color: var(--txt);
          cursor: pointer;
          text-align: right;
          font-family: inherit;
          border-bottom: 1px solid var(--line);
        }
        .p-dropdown-item:hover {
          background: var(--chip);
        }
        .p-progress-bar {
          height: 10px;
          background: var(--chip);
          border-radius: 99px;
          overflow: hidden;
          margin: 12px 0 6px;
        }
        .p-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--brand), var(--brand2));
          border-radius: 99px;
          transition: width 0.3s ease;
        }
        
        /* تنسيقات محاكي DRIP */
        .drip-ctrl-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }
        .drip-slider-box {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .drip-slider-header {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: var(--muted);
        }
        .drip-slider {
          -webkit-appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 99px;
          background: var(--line);
          outline: none;
          cursor: pointer;
        }
        .drip-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--brand);
          cursor: pointer;
          transition: transform 0.1s ease;
        }
        .drip-slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }

        /* ستايل لوحة ذكاء المحفظة والحرية المالية */
        .intel-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 20px;
          margin: 20px 0;
        }
        .ai-advisor-card {
          background: linear-gradient(135deg, rgba(255, 176, 32, 0.04), rgba(124, 92, 255, 0.03));
          border: 1px solid rgba(255, 176, 32, 0.25);
          border-radius: var(--radius);
          padding: 20px;
          position: relative;
          overflow: hidden;
          box-shadow: var(--shadow);
          text-align: right;
        }
        .ai-advisor-header {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 800;
          font-size: 14.5px;
          color: var(--warn);
          border-bottom: 1px solid var(--line);
          padding-bottom: 10px;
          margin-bottom: 12px;
        }
        .ai-pulse-dot {
          width: 8px;
          height: 8px;
          background-color: var(--warn);
          border-radius: 50%;
          display: inline-block;
          animation: ai-pulse 1.8s infinite;
        }
        @keyframes ai-pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 176, 32, 0.7); }
          70% { transform: scale(1.15); box-shadow: 0 0 0 6px rgba(255, 176, 32, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 176, 32, 0); }
        }
        .roadmap-card {
          background: var(--panel);
          border: 1px solid var(--line);
          border-radius: var(--radius);
          padding: 20px;
          box-shadow: var(--shadow);
          text-align: right;
        }
        .roadmap-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 12px;
          background: var(--chip);
          border: 1px solid var(--line);
          margin-bottom: 8px;
          transition: all 0.2s;
          text-align: right;
        }
        .roadmap-item.unlocked {
          background: rgba(33, 201, 139, 0.04);
          border-color: rgba(33, 201, 139, 0.25);
          box-shadow: 0 0 10px rgba(33, 201, 139, 0.05);
        }
        .roadmap-item:last-child {
          margin-bottom: 0;
        }
        
        @media print {
          /* إخفاء جميع العناصر التفاعلية وعناصر التنقل */
          .sidebar, .theme-toggle-floating, .p-search-container,
          .del-btn, .controls, .print-btn, .disclaimer,
          .intel-grid, .drip-ctrl-grid, .chart-grid,
          .p-progress-bar ~ div, select { display: none !important; }
          
          /* تبسيط التخطيط للطباعة */
          body { background: #fff !important; color: #000 !important; font-size: 12px !important; }
          .main { padding: 0 !important; max-width: 100% !important; }
          
          /* تنسيق البطاقات والجداول */
          .panel, .stat, .tablewrap {
            border: 1px solid #ccc !important;
            background: #fff !important;
            box-shadow: none !important;
            color: #000 !important;
            break-inside: avoid;
          }
          .stats { page-break-after: avoid; }
          .n, .l, .stat-sub, .panel-h, th, td, h1, h3 { color: #000 !important; }
          
          /* حقول الإدخال تُعرض كنص عادي */
          input.p-input {
            border: none !important;
            background: transparent !important;
            color: #000 !important;
            font-weight: 700 !important;
            padding: 0 !important;
            width: auto !important;
            text-align: right !important;
          }

          /* ترويسة التقرير المطبوع */
          .page-head::before {
            content: "تقرير محفظة توزيعات الأسهم الإماراتية";
            display: block;
            font-size: 18px;
            font-weight: 800;
            margin-bottom: 4px;
          }
          .print-btn { display: none !important; }
        }
      `}</style>

      <div className="page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--line)', paddingBottom: '14px', marginBottom: '22px' }}>
        <div>
          <h1 style={{ margin: 0 }}>حاسبة محفظة التوزيعات الذكية</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)' }}>خطط وقم بمحاكاة أرباحك السنوية والشهرية بناءً على مبالغ استثمارك في الأسهم الإماراتية</p>
        </div>
        <button
          onClick={() => window.print()}
          className="print-btn"
          style={{
            background: 'linear-gradient(120deg, var(--brand), var(--brand2))',
            color: '#fff',
            border: 0,
            borderRadius: '10px',
            padding: '9px 16px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: 'var(--shadow)',
            transition: 'transform 0.1s ease'
          }}
          title="حفظ طباعة التقرير الاستثماري للمحفظة كملف PDF"
        >
          <span>🖨️ تصدير التقرير (PDF)</span>
        </button>
      </div>

      {/* بطاقات الإحصائيات الكلية للمحفظة */}
      <div className="stats">
        <StatCard
          color="var(--brand)"
          value={`${totalInvested.toLocaleString('en-US')} درهم`}
          label="إجمالي المبالغ المستثمرة"
          sub={`${items.length} شركات مضافة`}
        />
        <StatCard
          color="var(--good)"
          value={`${Math.round(totalAnnualDividends).toLocaleString('en-US')} درهم`}
          label="الأرباح السنوية المتوقعة"
          sub={`بمتوسط ${Math.round(monthlyAverage).toLocaleString('en-US')} درهم شهرياً`}
        />
        <StatCard
          color="var(--warn)"
          value={`${weightedYield.toFixed(2)}%`}
          label="عائد توزيعات المحفظة الإجمالي"
          sub="متوسط مرجح للعائد النقدي"
        />
      </div>

      {/* حالة المحفظة الفارغة */}
      {items.length === 0 && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 20, padding: '60px 20px', textAlign: 'center',
          background: 'var(--panel)', borderRadius: 20, border: '1px dashed var(--line)',
          margin: '24px 0'
        }}>
          <div style={{ fontSize: 56 }}>📂</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>محفظتك فارغة</div>
            <div style={{ color: 'var(--muted)', fontSize: 13.5, maxWidth: 360, lineHeight: 1.7 }}>
              ابحث عن أسهم في الحقل أدناه وأضفها لتبدأ في تتبع توزيعاتك وحساب دخلك الشهري المتوقع.
            </div>
          </div>
          <div style={{
            background: 'linear-gradient(120deg, var(--brand), var(--brand2))',
            color: '#fff', padding: '10px 22px', borderRadius: 12,
            fontSize: 13.5, fontWeight: 700,
            boxShadow: '0 4px 16px rgba(58,160,255,0.3)', animation: 'pulse-glow 2s infinite'
          }}>↓ ابحث عن سهم وأضفه أدناه</div>
        </div>
      )}

      {/* 🔮 لوحة ذكاء المحفظة والحرية المالية (مستشار الفارابي + خريطة الأهداف) */}
      {items.length > 0 && (
        <PortfolioIntel advisorOutput={advisorOutput} milestones={lifestyleMilestones} />
      )}

      {/* قسم تتبع الهدف المالي للمستثمر */}
      <div className="panel" style={{ marginBottom: 20 }}>
        <h3 className="panel-h">🎯 مستهدف التوزيعات الشهري</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13.5 }}>
              نسبة تحقيق المستهدف المالي الشهري:
            </p>
            <div className="p-progress-bar">
              <div className="p-progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)' }}>
              <span>{Math.round(monthlyAverage).toLocaleString('en-US')} درهم / شهرياً</span>
              <span>{progressPercent}% من الهدف ({goal.toLocaleString('en-US')} درهم)</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13.5, color: 'var(--muted)' }}>حدد هدفك الشهري:</span>
            <input
              type="number"
              className="p-input"
              value={goal || ''}
              onChange={(e) => setGoal(Math.max(0, parseFloat(e.target.value) || 0))}
            />
            <span style={{ fontSize: 13.5 }}>درهم</span>
          </div>
        </div>
        {progressPercent < 100 ? (
          <div style={{ marginTop: 14, fontSize: 13, color: 'var(--muted2)' }}>
            💡 لسد الفجوة وتحقيق هدفك ({goal - Math.round(monthlyAverage)} درهم إضافي شهرياً)، تحتاج إلى استثمار ما يقارب <b>{Math.round(((goal - monthlyAverage) * 12) / (weightedYield > 0 ? weightedYield / 100 : 0.05)).toLocaleString('en-US')} درهم</b> في أسهم ذات عائد متوسط {weightedYield > 0 ? weightedYield.toFixed(1) : '5'}%.
          </div>
        ) : (
          <div style={{ marginTop: 14, fontSize: 13, color: 'var(--good)', fontWeight: 600 }}>
            🎉 تهانينا! لقد تجاوزت أرباح محفظتك الشهرية مستهدفك المالي المخطط له!
          </div>
        )}
      </div>

      {/* قسم الرسوم البيانية التفاعلية للمحفظة */}
      {items.length > 0 && (
        <div className="chart-grid">
          {/* مخطط القطاعات */}
          <div className="panel">
            <h3 className="panel-h">توزيع قطاعات المحفظة (%)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={sectorData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={2}>
                  {sectorData.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} stroke="var(--panel-solid)" />
                  ))}
                </Pie>
                <Tooltip contentStyle={tipStyle} formatter={(val) => [`${fmtAmount(Number(val))} درهم`, 'حجم الاستثمار']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="legend">
              {sectorData.map((d, i) => (
                <span key={d.name} className="legend-item">
                  <i style={{ background: PALETTE[i % PALETTE.length] }} />
                  {d.name} ({Math.round((d.value / totalInvested) * 100)}%)
                </span>
              ))}
            </div>
          </div>

          {/* مخطط التدفق النقدي الشهري */}
          <div className="panel">
            <h3 className="panel-h">التدفق النقدي الشهري المتوقع للمحفظة (درهم)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData} margin={{ top: 18 }}>
                <CartesianGrid vertical={false} stroke="var(--line)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--muted)', fontSize: 11 }} interval={0} angle={-35} textAnchor="end" height={60} />
                <YAxis tick={{ fill: 'var(--muted)', fontSize: 12 }} />
                <Tooltip contentStyle={tipStyle} formatter={(val) => [`${String(val)} درهم`, 'توزيعات مستلمة']} />
                <Bar dataKey="amount" fill="#7c5cff" radius={[6, 6, 0, 0]}>
                  {monthlyData.some(d => d.amount > 0) && (
                    <LabelList dataKey="amount" position="top" formatter={(val) => typeof val === 'number' && val > 0 ? String(val) : ''} fill="var(--txt)" fontSize={9} />
                  )}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ===================== محاكي DRIP التفاعلي المتقدم ===================== */}
      {items.length > 0 && (
        <div className="panel" style={{ margin: '24px 0' }}>
          <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: '12px', marginBottom: '18px' }}>
            <h3 className="panel-h" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              ❄️ محاكي أثر إعادة استثمار الأرباح (DRIP Snowball Simulator)
            </h3>
            <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '13px' }}>
              شاهد كيف تنمو ثروتك ومحفظتك بشكل أسي على المدى الطويل عند إعادة استثمار أرباح الأسهم بدلاً من سحبها
            </p>
          </div>

          {/* شبكة التحكم بالمدخلات */}
          <div className="drip-ctrl-grid">
            <div className="drip-slider-box">
              <div className="drip-slider-header">
                <span>⏳ أفق الاستثمار</span>
                <span style={{ fontWeight: 700, color: 'var(--brand)' }}>{dripYears} سنة</span>
              </div>
              <input 
                type="range" 
                min="3" 
                max="30" 
                className="drip-slider" 
                value={dripYears}
                onChange={(e) => setDripYears(parseInt(e.target.value))}
              />
            </div>

            <div className="drip-slider-box">
              <div className="drip-slider-header">
                <span>💵 مساهمة شهرية إضافية</span>
                <span style={{ fontWeight: 700, color: 'var(--good)' }}>{dripMonthly.toLocaleString('en-US')} د.إ</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="15000" 
                step="500" 
                className="drip-slider" 
                value={dripMonthly}
                onChange={(e) => setDripMonthly(parseInt(e.target.value))}
              />
            </div>

            <div className="drip-slider-box">
              <div className="drip-slider-header">
                <span>📈 نمو سعر الأسهم سنويًا</span>
                <span style={{ fontWeight: 700, color: 'var(--warn)' }}>{dripPriceGrowth}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="12" 
                step="0.5" 
                className="drip-slider" 
                value={dripPriceGrowth}
                onChange={(e) => setDripPriceGrowth(parseFloat(e.target.value))}
              />
            </div>

            <div className="drip-slider-box">
              <div className="drip-slider-header">
                <span>💸 نمو التوزيعات سنويًا</span>
                <span style={{ fontWeight: 700, color: 'var(--brand2)' }}>{dripDivGrowth}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="10" 
                step="0.5" 
                className="drip-slider" 
                value={dripDivGrowth}
                onChange={(e) => setDripDivGrowth(parseFloat(e.target.value))}
              />
            </div>
          </div>

          {/* لوحة المؤشرات السريعة للمحاكاة */}
          <div className="stats" style={{ margin: '0 0 20px' }}>
            <StatCard
              style={{ background: 'rgba(255, 255, 255, 0.02)' }}
              valueStyle={{ color: '#fff', fontSize: '22px' }}
              value={`${finalCashWealth.toLocaleString('en-US')} درهم`}
              label="ثروة سحب الأرباح نقداً (Cash)"
              sub="توزيعات مسحوبة وغير مستثمرة"
            />
            <StatCard
              style={{ background: 'rgba(124, 92, 255, 0.05)', border: '1px solid rgba(124, 92, 255, 0.2)' }}
              valueStyle={{ color: 'var(--brand2)', fontSize: '22px' }}
              value={`${finalDripWealth.toLocaleString('en-US')} درهم`}
              label="ثروة إعادة الاستثمار (DRIP)"
              sub="توزيعات يعاد ضخها فورياً بالسوق"
            />
            <StatCard
              style={{ background: 'rgba(33, 201, 139, 0.06)', border: '1px solid rgba(33, 201, 139, 0.2)' }}
              valueStyle={{ color: 'var(--good)', fontSize: '22px' }}
              value={`+${snowballEffectValue.toLocaleString('en-US')} درهم`}
              label="🔥 عائد أثر كرة الثلج الإضافي"
              sub="مكاسب خالصة من قوة الفائدة المركبة"
            />
          </div>

          {/* الرسم البياني لنمو الثروة */}
          <div style={{ width: '100%', height: 320, marginTop: 14 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dripData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorDrip" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--brand2)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--brand2)" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--muted2)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="var(--muted2)" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
                <XAxis dataKey="year" tick={{ fill: 'var(--muted)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} tickFormatter={(val: number) => `${val / 1000}k`} />
                <Tooltip 
                  contentStyle={tipStyle} 
                  formatter={(val, name) => [
                    `${Number(val).toLocaleString('en-US')} درهم`,
                    name === 'dripWealth' ? 'إعادة الاستثمار (DRIP)' : 'سحب الأرباح كاش'
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="dripWealth" 
                  stroke="var(--brand2)" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorDrip)" 
                  name="dripWealth"
                />
                <Area 
                  type="monotone" 
                  dataKey="cashWealth" 
                  stroke="var(--muted2)" 
                  strokeWidth={1.5}
                  fillOpacity={1} 
                  fill="url(#colorCash)" 
                  name="cashWealth"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', fontSize: '12px', color: 'var(--muted)', marginTop: '8px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <i style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--brand2)', display: 'inline-block' }} /> 
              المحفظة مع إعادة استثمار الأرباح (DRIP)
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <i style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--muted2)', display: 'inline-block' }} /> 
              المحفظة مع سحب الأرباح نقداً (Cash)
            </span>
          </div>
        </div>
      )}

      {/* جدول إدارة المحفظة التفاعلي */}
      <h2 className="sec"><span className="dot" style={{ background: 'var(--brand2)' }} /> أصول المحفظة والحاسبة الآلية</h2>

      <div className="controls">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
          <div className="p-search-container">
            <div className="search" style={{ width: '100%' }}>
              <span>🔍</span>
              <input
                placeholder="ابحث عن سهم لإضافته للمحفظة..."
                value={searchQuery}
                onFocus={() => setShowDropdown(true)}
                onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true) }}
              />
            </div>
            {showDropdown && searchQuery && (
              <div className="p-dropdown">
                {availableStocks.length === 0 ? (
                  <div style={{ padding: 12, color: 'var(--muted2)', fontSize: 13, textAlign: 'center' }}>لا توجد نتائج مطابقة أو تم إضافة السهم بالفعل.</div>
                ) : (
                  availableStocks.map(s => (
                    <button key={s.sym} className="p-dropdown-item" onClick={() => { addStock(s.sym); setSearchQuery(''); setShowDropdown(false); }}>
                      <Avatar sym={s.sym} size={24} />
                      <span style={{ fontWeight: 600 }}>{s.sym}</span>
                      <span style={{ color: 'var(--muted2)', fontSize: 12, flex: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{s.name}</span>
                      <span className="exch">{s.ex}</span>
                    </button>
                  ))
                )}
              </div>
            )}
            {showDropdown && (
              <div 
                style={{ position: 'fixed', inset: 0, zIndex: 90 }} 
                onClick={() => setShowDropdown(false)}
              />
            )}
          </div>
          {searchQuery === '' && availableStocks.length > 0 && (
            <select style={{ width: 220 }} onChange={(e) => { if(e.target.value !== '') { addStock(e.target.value); }; e.target.value = '' }}>
              <option value="">أضف سهماً سريعا من القائمة...</option>
              {availableStocks.map(s => (
                <option key={s.sym} value={s.sym}>{s.sym} — {s.name.split('—')[0]}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>السهم</th>
              <th>سعر السهم الحالي</th>
              <th>العائد السنوي (%)</th>
              <th>التوزيع السنوي/سهم</th>
              <th>مبلغ الاستثمار (درهم)</th>
              <th>عدد الأسهم المملوكة</th>
              <th>الأرباح السنوية المتوقعة</th>
              <th>إجراء</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '30px' }}>جاري تحميل البيانات...</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className="empty">المحفظة فارغة حالياً. ابحث عن سهم في القائمة أعلاه وقم بإضافته للبدء في الحساب!</div>
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.sym}>
                  <td>
                    <button 
                      className="cellname" 
                      onClick={() => onOpen(item.stock)}
                      style={{ background: 'transparent', border: 0, color: 'inherit', padding: 0, font: 'inherit', cursor: 'pointer', textAlign: 'right' }}
                    >
                      <Avatar sym={item.sym} size={28} />
                      <span>
                        <span className="cn-name">{item.stock.name.split('—')[0]}</span>
                        <span className="cn-sym">{item.sym} <span className={'exch ex-' + item.stock.ex}>{item.stock.ex}</span></span>
                      </span>
                    </button>
                  </td>
                  <td>{item.price > 1 ? `${item.price.toFixed(2)} درهم` : 'يلزم التحقق'}</td>
                  <td>{item.yield > 0 ? `${item.yield.toFixed(1)}%` : '—'}</td>
                  <td>{item.annualPs > 0 ? `${item.annualPs.toFixed(3)} درهم` : '—'}</td>
                  <td>
                    <input
                      type="number"
                      className="p-input"
                      value={Math.round(item.amount) || ''}
                      onChange={(e) => updateAmount(item.sym, Math.max(0, parseFloat(e.target.value) || 0))}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="p-input"
                      value={Math.round(item.shares) || ''}
                      onChange={(e) => updateShares(item.sym, Math.max(0, parseFloat(e.target.value) || 0))}
                    />
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--good)' }}>
                    {Math.round(item.expectedAnnualDiv).toLocaleString('en-US')} درهم
                  </td>
                  <td>
                    <button 
                      className="del-btn" 
                      onClick={() => deleteStock(item.sym)}
                      title="احذف من المحفظة"
                      aria-label="حذف"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

