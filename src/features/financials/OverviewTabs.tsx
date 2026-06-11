import type { Stock } from '@/data'
import { fmtAmount } from '@/format'
import type { TechnicalData, DailySessionRow } from './tradingSim'

/** مجموعة «نظرة عامة»: شبكة مقاييس التداول الرباعية + الملخص اليومي مع تصدير الإكسل. */
export default function OverviewTabs({
  stock,
  tech,
  historicalData,
}: {
  stock: Stock
  tech: TechnicalData
  historicalData: DailySessionRow[]
}) {
  // دالة تحميل ملف إكسل كـ CSV تفاعلي متوافق مع الحسابات العربية
  const handleExcelDownload = () => {
    if (historicalData.length === 0) return
    const headers = ['التاريخ', 'سعر الافتتاح', 'أعلى', 'أدنى', 'الصفقات', 'الحجم', 'القيمة', 'السعر الحالي', 'السابق', 'التغير', 'التغير %']
    // BOM في البداية حتى يفتح Excel الملف بترميز UTF-8 الصحيح للنص العربي
    const csvContent = String.fromCharCode(0xfeff) + [
      headers.join(','),
      ...historicalData.map(r => [
        r.date,
        r.open.toFixed(2),
        r.high.toFixed(2),
        r.low.toFixed(2),
        r.trades,
        r.volume,
        r.value.toFixed(2),
        r.close.toFixed(2),
        r.prevClose.toFixed(2),
        (r.change >= 0 ? '+' : '') + r.change.toFixed(2),
        `${r.changePct >= 0 ? '+' : ''}${r.changePct}%`
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `ملخص_يومي_${stock.sym}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <>
      {/* 1. تبويب التداول (شبكة المقاييس الـ 19 الرباعية) */}
      <div className="metrics-quad-grid">
        {/* العمود الأول: المقاييس السعرية الأساسية */}
        <div className="metrics-column">
          <div className="metric-cell">
            <span className="metric-label">سعر الافتتاح</span>
            <span className="metric-value">{tech.open.toFixed(3)}</span>
          </div>
          <div className="metric-cell">
            <span className="metric-label">سعر الإغلاق</span>
            <span className="metric-value">{stock.price?.toFixed(3)}</span>
          </div>
          <div className="metric-cell">
            <span className="metric-label">السعر السابق</span>
            <span className="metric-value">{tech.prevClose.toFixed(3)}</span>
          </div>
          <div className="metric-cell">
            <span className="metric-label">التغير</span>
            <span className="metric-value" style={{ color: tech.isUp ? 'var(--good)' : 'var(--bad)', direction: 'ltr' }}>
              {tech.change.toFixed(3)}
            </span>
          </div>
          <div className="metric-cell">
            <span className="metric-label">التغير في السعر %</span>
            <span className="metric-value" style={{ color: tech.isUp ? 'var(--good)' : 'var(--bad)', direction: 'ltr' }}>
              {tech.pct}
            </span>
          </div>
        </div>

        {/* العمود الثاني: المقاييس الفنية والنطاق السعري */}
        <div className="metrics-column">
          <div className="metric-cell">
            <span className="metric-label">أعلى</span>
            <span className="metric-value">{tech.high.toFixed(3)}</span>
          </div>
          <div className="metric-cell">
            <span className="metric-label">أدنى</span>
            <span className="metric-value">{tech.low.toFixed(3)}</span>
          </div>
          <div className="metric-cell">
            <span className="metric-label">52 أعلى</span>
            <span className="metric-value">{tech.yearHigh.toFixed(3)}</span>
          </div>
          <div className="metric-cell">
            <span className="metric-label">52 أدنى</span>
            <span className="metric-value">{tech.yearLow.toFixed(3)}</span>
          </div>
          <div className="metric-cell">
            <span className="metric-label">آخر صفقة</span>
            <span className="metric-value" style={{ fontSize: '11px' }}>28 مايو 2026</span>
          </div>
        </div>

        {/* العمود الثالث: الطلبات والعروض الحالية */}
        <div className="metrics-column">
          <div className="metric-cell">
            <span className="metric-label">أفضل طلب</span>
            <span className="metric-value" style={{ color: 'var(--good)' }}>{tech.bestBid.toFixed(3)}</span>
          </div>
          <div className="metric-cell">
            <span className="metric-label">حجم الطلب</span>
            <span className="metric-value">{tech.bidVol.toLocaleString()}</span>
          </div>
          <div className="metric-cell">
            <span className="metric-label">أفضل عرض</span>
            <span className="metric-value" style={{ color: 'var(--bad)' }}>{tech.bestAsk.toFixed(3)}</span>
          </div>
          <div className="metric-cell">
            <span className="metric-label">حجم العرض</span>
            <span className="metric-value">{tech.askVol.toLocaleString()}</span>
          </div>
          <div className="metric-cell">
            <span className="metric-label">سعر آخر صفقة</span>
            <span className="metric-value">{stock.price?.toFixed(3)}</span>
          </div>
        </div>

        {/* العمود الرابع: تداولات التداول الكلي والسيولة */}
        <div className="metrics-column">
          <div className="metric-cell">
            <span className="metric-label">عدد الصفقات</span>
            <span className="metric-value">{tech.trades.toLocaleString()}</span>
          </div>
          <div className="metric-cell">
            <span className="metric-label">الحجم</span>
            <span className="metric-value">{fmtAmount(tech.volume)}</span>
          </div>
          <div className="metric-cell">
            <span className="metric-label">القيمة</span>
            <span className="metric-value">{fmtAmount(tech.value)} د.إ</span>
          </div>
          <div className="metric-cell">
            <span className="metric-label">القيمة السوقية</span>
            <span className="metric-value" style={{ color: 'var(--brand)' }}>{stock.mcap ?? '—'}</span>
          </div>
        </div>
      </div>

      {/* 2. تبويب ملخص يومي */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', marginTop: '20px' }}>
        {/* الجزء العلوي: العنوان والتاريخ وزر التحميل */}
        <div className="summary-header-container">
          <button onClick={handleExcelDownload} className="excel-download-btn">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '14px' }}>📥</span>
              تحميل اكسل
            </span>
          </button>

          <div className="summary-title-section">
            <h3 className="summary-title">ملخص يومي</h3>
            <p className="summary-subtitle">MAY 30, 2026 - FEB 28, 2026</p>
          </div>
        </div>

        {/* الجزء النصي التلقائي للملخص الفوري اليومي للسهم */}
        <div style={{ padding: '14px 16px', background: 'var(--chip)', borderRadius: '10px', border: '1px solid var(--line)', fontSize: '13px', lineHeight: '1.6', color: 'var(--txt)', textAlign: 'right' }}>
          <b style={{ color: '#ff6b00', display: 'block', marginBottom: '6px', fontSize: '14px' }}>📝 نظرة تداولية سريعة لـ {stock.sym}</b>
          يتداول سهم {stock.name.split('—')[0]} اليوم بمدى تذبذب يبلغ {(tech.high - tech.low).toFixed(3)} د.إ بين أدنى سعر مسجل عند {tech.low.toFixed(3)} د.إ وأعلى سعر عند {tech.high.toFixed(3)} د.إ.
          شهدت الجلسة زخم تداول كلي بقيمة تداول بلغت {fmtAmount(tech.value)} د.إ موزعة على {tech.trades.toLocaleString()} صفقة منفذة بنجاح.
          يظهر السهم حالياً مستويات سيولة قوية مع اتجاه طلبات متوازن يدعم استقرار الحركة الفنية للسهم ضمن النطاقات الأفقية المعتادة.
        </div>

        {/* الجدول التاريخي المعرب */}
        <div className="summary-table-container">
          <table className="summary-table">
            <thead>
              <tr>
                <th>تاريخ</th>
                <th>سعر الافتتاح</th>
                <th>أعلى</th>
                <th>أدنى</th>
                <th>الصفقات</th>
                <th>الحجم</th>
                <th>القيمة</th>
                <th>السعر الحالي</th>
                <th>سابق</th>
                <th>التغير</th>
                <th>التغير في السعر %</th>
              </tr>
            </thead>
            <tbody>
              {historicalData.map((row, idx) => {
                const isUp = row.changePct > 0
                const isDown = row.changePct < 0

                return (
                  <tr key={idx}>
                    <td style={{ color: 'var(--muted)', fontWeight: 800 }}>{row.date}</td>
                    <td>{row.open.toFixed(2)}</td>
                    <td>{row.high.toFixed(2)}</td>
                    <td>{row.low.toFixed(2)}</td>
                    <td>{row.trades.toLocaleString()}</td>
                    <td>{row.volume.toLocaleString()}</td>
                    <td>{row.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td>{row.close.toFixed(2)}</td>
                    <td>{row.prevClose.toFixed(2)}</td>
                    <td style={{ color: isUp ? 'var(--good)' : isDown ? 'var(--bad)' : 'inherit' }}>
                      {isUp ? '+' : ''}{row.change.toFixed(2)}
                    </td>
                    <td>
                      <span className={`change-badge-table ${isUp ? 'up' : isDown ? 'down' : ''}`} style={{ direction: 'ltr' }}>
                        {isUp ? '▲' : isDown ? '▼' : ''} {row.changePct.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
