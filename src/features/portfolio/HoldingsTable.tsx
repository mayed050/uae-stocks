import type { Stock } from '@/data'
import type { PortfolioItem } from '@/store/usePortfolio'
import { exportCsv } from '@/export'
import Avatar from '@/components/Avatar'

/** ملخّص مقاييس المحفظة + زر تصدير CSV + جدول إدارة الحيازات التفاعلي. */
export default function HoldingsTable({
  items,
  loading,
  totalMarketValue,
  totalCost,
  totalGain,
  totalGainPct,
  yieldOnCost,
  onOpen,
  updateAmount,
  updateShares,
  updateCost,
  deleteStock,
}: {
  items: PortfolioItem[]
  loading: boolean
  totalMarketValue: number
  totalCost: number
  totalGain: number
  totalGainPct: number
  yieldOnCost: number
  onOpen: (s: Stock) => void
  updateAmount: (sym: string, amt: number) => void
  updateShares: (sym: string, shs: number) => void
  updateCost: (sym: string, cost: number) => void
  deleteStock: (sym: string) => void
}) {
  return (
    <>
      {items.length > 0 && (
        <div className="p-summary-row">
          <div className="p-summary-metrics">
            <span>القيمة السوقية: <b>{Math.round(totalMarketValue).toLocaleString('en-US')}</b></span>
            <span>التكلفة: <b>{Math.round(totalCost).toLocaleString('en-US')}</b></span>
            <span>ربح/خسارة: <b className={'p-gain ' + (totalGain >= 0 ? 'up' : 'down')}>{totalGain >= 0 ? '+' : ''}{Math.round(totalGain).toLocaleString('en-US')} ({totalGainPct.toFixed(1)}%)</b></span>
            <span>العائد على التكلفة: <b className="good">{yieldOnCost.toFixed(2)}%</b></span>
          </div>
          <button
            className="chip"
            onClick={() => exportCsv(
              `محفظتي-${new Date().toISOString().slice(0, 10)}`,
              ['السهم', 'الرمز', 'السوق', 'السعر الحالي', 'عدد الأسهم', 'التكلفة', 'القيمة السوقية', 'ربح/خسارة', 'العائد على التكلفة %', 'التوزيع السنوي المتوقع'],
              items.map((it) => [
                (it.stock.name.split('—')[0] ?? '').trim(), it.sym, it.stock.ex,
                it.price.toFixed(2), Math.round(it.shares), Math.round(it.cost),
                Math.round(it.marketValue), Math.round(it.gain),
                it.yieldOnCost.toFixed(2), Math.round(it.expectedAnnualDiv),
              ]),
            )}
            title="تصدير المحفظة إلى ملف Excel/CSV"
          >
            ⬇️ تصدير CSV
          </button>
        </div>
      )}

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
              <th>تكلفة الشراء (درهم)</th>
              <th>ربح/خسارة</th>
              <th>الأرباح السنوية المتوقعة</th>
              <th>إجراء</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="td-loading">جاري تحميل البيانات...</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={10}>
                  <div className="empty">المحفظة فارغة حالياً. ابحث عن سهم في القائمة أعلاه وقم بإضافته للبدء في الحساب!</div>
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.sym}>
                  <td>
                    <button
                      className="cellname linkbtn"
                      onClick={() => onOpen(item.stock)}
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
                  <td>
                    <input
                      type="number"
                      className="p-input"
                      value={Math.round(item.cost) || ''}
                      onChange={(e) => updateCost(item.sym, Math.max(0, parseFloat(e.target.value) || 0))}
                      title="إجمالي ما دفعته لشراء هذه الحيازة"
                    />
                  </td>
                  <td className={'cell-gain ' + (item.gain >= 0 ? 'up' : 'down')}>
                    {item.gain >= 0 ? '+' : ''}{Math.round(item.gain).toLocaleString('en-US')}
                    <span className="pct">({item.gainPct.toFixed(1)}%)</span>
                  </td>
                  <td className="cell-div">
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
    </>
  )
}
