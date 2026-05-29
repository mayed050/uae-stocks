import { useEffect, useMemo, useState } from 'react'
import type { Stock } from '../data'
import { useStocks } from '../store'
import { getAnnualPs, fmtAmount, MONTHS_AR } from '../format'
import { parseISO } from '../lib'
import Avatar from '../components/Avatar'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, LabelList
} from 'recharts'

const PALETTE = ['#3aa0ff', '#7c5cff', '#21c98b', '#ffb020', '#ff5a72', '#36c5d8', '#e26bd0', '#9bd13a']

export default function Portfolio({ onOpen }: { onOpen: (s: Stock) => void }) {
  const { stocks: DATA, loading } = useStocks()

  // 1. شحن بيانات المحفظة المخزنة مسبقاً أو تعيين قيم افتراضية نموذجية
  const [portfolio, setPortfolio] = useState<{ sym: string; amount: number; shares: number }[]>(() => {
    const saved = localStorage.getItem('dividend_portfolio')
    if (saved) {
      try {
        return JSON.parse(saved)
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

  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  // حفظ المحفظة والهدف في التخزين المحلي
  useEffect(() => {
    if (!loading && DATA.length > 0) {
      localStorage.setItem('dividend_portfolio', JSON.stringify(portfolio))
    }
  }, [portfolio, loading, DATA])

  useEffect(() => {
    localStorage.setItem('dividend_goal', String(goal))
  }, [goal])

  // 3. حساب تفاصيل المحفظة والأسهم
  const items = useMemo(() => {
    return portfolio.map(p => {
      const stock = DATA.find(s => s.sym === p.sym)
      if (!stock) return null
      const price = stock.price ?? 1.0 // سعر افتراضي في حال عدم وجود سعر
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
    }).filter(Boolean) as {
      sym: string
      amount: number
      shares: number
      stock: Stock
      price: number
      annualPs: number
      yield: number
      expectedAnnualDiv: number
    }[]
  }, [portfolio, DATA])

  // 4. المجاميع والمؤشرات الكلية
  const totalInvested = useMemo(() => items.reduce((sum, item) => sum + item.amount, 0), [items])
  const totalAnnualDividends = useMemo(() => items.reduce((sum, item) => sum + item.expectedAnnualDiv, 0), [items])
  const weightedYield = useMemo(() => {
    if (totalInvested === 0) return 0
    return (totalAnnualDividends / totalInvested) * 100
  }, [totalInvested, totalAnnualDividends])
  const monthlyAverage = totalAnnualDividends / 12

  // تحديث مبلغ الاستثمار (وإعادة حساب عدد الأسهم تلقائياً)
  const updateAmount = (sym: string, amt: number) => {
    setPortfolio(prev => prev.map(p => {
      if (p.sym !== sym) return p
      const stock = DATA.find(s => s.sym === sym)
      const price = stock?.price ?? 1.0
      return {
        sym,
        amount: amt,
        shares: price > 0 ? amt / price : 0
      }
    }))
  }

  // تحديث عدد الأسهم (وإعادة حساب مبلغ الاستثمار تلقائياً)
  const updateShares = (sym: string, shs: number) => {
    setPortfolio(prev => prev.map(p => {
      if (p.sym !== sym) return p
      const stock = DATA.find(s => s.sym === sym)
      const price = stock?.price ?? 1.0
      return {
        sym,
        amount: shs * price,
        shares: shs
      }
    }))
  }

  // حذف سهم من المحفظة
  const deleteStock = (sym: string) => {
    setPortfolio(prev => prev.filter(p => p.sym !== sym))
  }

  // إضافة سهم جديد للمحفظة
  const addStock = (sym: string) => {
    const stock = DATA.find(s => s.sym === sym)
    if (!stock) return
    const price = stock.price ?? 1.0
    const defaultAmount = 10000
    setPortfolio(prev => [
      ...prev,
      {
        sym,
        amount: defaultAmount,
        shares: price > 0 ? defaultAmount / price : 0
      }
    ])
    setSearchQuery('')
    setShowDropdown(false)
  }

  // تصفية نتائج البحث للأسهم المتاحة للإضافة
  const availableStocks = useMemo(() => {
    return DATA.filter(s => 
      !portfolio.some(p => p.sym === s.sym) &&
      (s.sym.toLowerCase().includes(searchQuery.toLowerCase()) || 
       s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  }, [portfolio, DATA, searchQuery])

  // 5. إعداد البيانات للرسوم البيانية
  // أ. تنوع القطاعات في المحفظة
  const sectorData = useMemo(() => {
    const m = new Map<string, number>()
    items.forEach(item => {
      m.set(item.stock.sector, (m.get(item.stock.sector) ?? 0) + item.amount)
    })
    return [...m.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }, [items])

  // ب. جدول التدفق النقدي المتوقع للأرباح شهرياً
  const monthlyData = useMemo(() => {
    const months = new Array(12).fill(0)
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
      `}</style>

      <div className="page-head">
        <h1>حاسبة محفظة التوزيعات الذكية</h1>
        <p>خطط وقم بمحاكاة أرباحك السنوية والشهرية بناءً على مبالغ استثمارك في الأسهم الإماراتية</p>
      </div>

      {/* بطاقات الإحصائيات الكلية للمحفظة */}
      <div className="stats">
        <div className="stat">
          <div className="n" style={{ color: 'var(--brand)' }}>{totalInvested.toLocaleString('en-US')} درهم</div>
          <div className="l">إجمالي المبالغ المستثمرة</div>
          <div className="stat-sub">{items.length} شركات مضافة</div>
        </div>
        <div className="stat">
          <div className="n" style={{ color: 'var(--good)' }}>{Math.round(totalAnnualDividends).toLocaleString('en-US')} درهم</div>
          <div className="l">الأرباح السنوية المتوقعة</div>
          <div className="stat-sub">بمتوسط {Math.round(monthlyAverage).toLocaleString('en-US')} درهم شهرياً</div>
        </div>
        <div className="stat">
          <div className="n" style={{ color: 'var(--warn)' }}>{weightedYield.toFixed(2)}%</div>
          <div className="l">عائد توزيعات المحفظة الإجمالي</div>
          <div className="stat-sub">متوسط مرجح للعائد النقدي</div>
        </div>
      </div>

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

      {/* قسم الرسوم البيانية التفاعلية */}
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
                <Tooltip contentStyle={tipStyle} formatter={(val) => [`${val} درهم`, 'توزيعات مستلمة']} />
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
                    <button key={s.sym} className="p-dropdown-item" onClick={() => addStock(s.sym)}>
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
            <select style={{ width: 220 }} onChange={(e) => { if(e.target.value !== '') addStock(e.target.value); e.target.value = '' }}>
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
            {items.length === 0 ? (
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

const tipStyle = {
  background: 'var(--panel-solid)',
  border: '1px solid var(--line)',
  borderRadius: 12,
  color: 'var(--txt)',
  fontSize: 13,
}
