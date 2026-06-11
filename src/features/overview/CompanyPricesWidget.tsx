import { useState } from 'react'
import type { Stock } from '@/data'
import { ADX_MOVEMENTS } from '@/data/movements'
import { getDailyData } from '@/market'

/** ودجة أسعار الشركات الجانبية بتبويبي سوقي دبي وأبوظبي. */
export default function CompanyPricesWidget({ stocks, onOpen }: { stocks: Stock[]; onOpen: (s: Stock) => void }) {
  // التحكم بتبويب حركة السوق (دبي / أبوظبي)
  const [marketTab, setMarketTab] = useState<'dubai' | 'adx'>('dubai')

  return (
    <div className="o-widget">
      <div className="o-widget-head">
        <h4 className="o-widget-h">📊 أسعار الشركات</h4>
        <div className="o-mkt-tabs">
          <button
            onClick={() => setMarketTab('dubai')}
            className={'o-mkt-tab' + (marketTab === 'dubai' ? ' active' : '')}
          >
            دبي
          </button>
          <button
            onClick={() => setMarketTab('adx')}
            className={'o-mkt-tab' + (marketTab === 'adx' ? ' active' : '')}
          >
            أبوظبي
          </button>
        </div>
      </div>

      {marketTab === 'dubai' ? (
        <div className="o-prices-scroll">
          <table className="o-mini-table">
            <thead>
              <tr>
                <th className="al-r">الاسم</th>
                <th className="al-c">السعر</th>
                <th className="al-l">التغير</th>
              </tr>
            </thead>
            <tbody>
              {stocks.filter(s => s.ex === 'DFM').map((realStock) => {
                const d = getDailyData(realStock)
                return (
                  <tr
                    key={realStock.sym}
                    onClick={() => onOpen(realStock)}
                    className="rowlink"
                  >
                    <td className="o-mini-td">
                      <span className="o-mini-name">{realStock.name.split('—')[0]}</span>
                      <span className="o-mini-sym">{realStock.sym}</span>
                    </td>
                    <td className="o-mini-price">
                      {realStock.price !== null ? realStock.price.toFixed(2) : '—'}
                    </td>
                    <td className={'o-mini-change ' + (d.isFlat ? 'flat' : d.isUp ? 'up' : 'down')}>
                      {d.pct}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <table className="o-mini-table">
          <thead>
            <tr>
              <th className="al-r">الاسم</th>
              <th className="al-c">السعر</th>
              <th className="al-l">التغير</th>
            </tr>
          </thead>
          <tbody>
            {ADX_MOVEMENTS.map((m) => {
              const realStock = stocks.find(s => s.sym.toUpperCase() === m.sym.toUpperCase())
              if (!realStock) return null
              const d = getDailyData(realStock)
              return (
                <tr
                  key={realStock.sym}
                  onClick={() => onOpen(realStock)}
                  className="rowlink"
                >
                  <td className="o-mini-td">
                    <span className="o-mini-name">{realStock.name.split('—')[0]}</span>
                    <span className="o-mini-sym">{realStock.sym}</span>
                  </td>
                  <td className="o-mini-price">
                    {realStock.price !== null ? realStock.price.toFixed(2) : '—'}
                  </td>
                  <td className={'o-mini-change ' + (d.isFlat ? 'flat' : d.isUp ? 'up' : 'down')}>
                    {d.pct}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
