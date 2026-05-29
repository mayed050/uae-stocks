import { useMemo, useState } from 'react'
import { CAT_LABEL } from '../data'
import type { Stock, Exchange, Category } from '../data'
import { useStocks } from '../store'
import { parseYield, parseAmount } from '../format'
import Avatar from '../components/Avatar'

const NA = 'يلزم التحقق'
type SortKey = 'name' | 'price' | 'pe' | 'yield' | 'mcap'

function cell(x: string | number | null | undefined) {
  return x === null || x === undefined || x === '' ? <span className="na">{NA}</span> : x
}

export default function Screener({ onOpen }: { onOpen: (s: Stock) => void }) {
  const { stocks: DATA } = useStocks()
  const [q, setQ] = useState('')
  const [ex, setEx] = useState<'all' | Exchange>('all')
  const [cat, setCat] = useState<'all' | Category>('all')
  const [sort, setSort] = useState<SortKey>('mcap')
  const [dir, setDir] = useState<1 | -1>(-1)

  const sectors = useMemo(() => [...new Set(DATA.map((s) => s.sector))], [DATA])
  const [sector, setSector] = useState<'all' | string>('all')

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase()
    let list = DATA.filter((s) => {
      if (ex !== 'all' && s.ex !== ex) return false
      if (cat !== 'all' && s.cat !== cat) return false
      if (sector !== 'all' && s.sector !== sector) return false
      if (term && !(s.name + ' ' + s.sym + ' ' + s.sector).toLowerCase().includes(term)) return false
      return true
    })
    const val = (s: Stock): number | string => {
      switch (sort) {
        case 'name': return s.name
        case 'price': return s.price ?? -1
        case 'pe': return s.pe ?? Number.MAX_SAFE_INTEGER
        case 'yield': return parseYield(s.div.yld) ?? -1
        case 'mcap': return parseAmount(s.mcap) ?? -1
      }
    }
    return [...list].sort((a, b) => {
      const av = val(a), bv = val(b)
      if (typeof av === 'string' || typeof bv === 'string')
        return String(av).localeCompare(String(bv), 'ar') * dir
      return (av - bv) * dir
    })
  }, [DATA, q, ex, cat, sector, sort, dir])

  function toggleSort(k: SortKey) {
    if (sort === k) setDir((d) => (d === 1 ? -1 : 1))
    else { setSort(k); setDir(k === 'name' ? 1 : -1) }
  }
  const arrow = (k: SortKey) => (sort === k ? (dir === 1 ? ' ▲' : ' ▼') : '')

  return (
    <div className="view">
      <div className="page-head">
        <h1>مستكشف الأسهم</h1>
        <p>كل المؤشرات المالية لـ {DATA.length} سهمًا — اضغط أي صف للتفاصيل الكاملة</p>
      </div>

      <div className="controls">
        <div className="search">
          <span>🔍</span>
          <input placeholder="ابحث بالاسم أو الرمز أو القطاع…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="chips">
          {([['all', 'كل الأسواق'], ['DFM', 'دبي'], ['ADX', 'أبوظبي']] as const).map(([v, l]) => (
            <button key={v} className="chip" aria-pressed={ex === v} onClick={() => setEx(v as typeof ex)}>{l}</button>
          ))}
        </div>
        <div className="chips">
          {([['all', 'كل التصنيفات'], ['income', 'دخل مستقر'], ['growth', 'نمو'], ['risk', 'مخاطر أعلى']] as const).map(([v, l]) => (
            <button key={v} className="chip" aria-pressed={cat === v} onClick={() => setCat(v as typeof cat)}>{l}</button>
          ))}
        </div>
        <select value={sector} onChange={(e) => setSector(e.target.value)}>
          <option value="all">كل القطاعات</option>
          {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="tablewrap">
        <table className="screener">
          <thead>
            <tr>
              <th className="sortable" onClick={() => toggleSort('name')}>السهم{arrow('name')}</th>
              <th>السوق</th>
              <th className="sortable" onClick={() => toggleSort('price')}>السعر{arrow('price')}</th>
              <th className="sortable" onClick={() => toggleSort('pe')}>P/E{arrow('pe')}</th>
              <th>EPS</th>
              <th className="sortable" onClick={() => toggleSort('mcap')}>القيمة السوقية{arrow('mcap')}</th>
              <th>صافي الربح</th>
              <th className="sortable" onClick={() => toggleSort('yield')}>العائد{arrow('yield')}</th>
              <th>التصنيف</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.sym} onClick={() => onOpen(s)} className="rowlink">
                <td>
                  <span className="cellname">
                    <Avatar sym={s.sym} size={30} />
                    <span>
                      <span className="cn-name">{s.name}</span>
                      <span className="cn-sym">{s.sym}</span>
                    </span>
                  </span>
                </td>
                <td><span className={'exch ex-' + s.ex}>{s.ex}</span></td>
                <td>{cell(s.price !== null ? s.price.toFixed(2) : null)}</td>
                <td>{cell(s.pe)}</td>
                <td>{cell(s.eps)}</td>
                <td>{cell(s.mcap)}</td>
                <td>{cell(s.net)}</td>
                <td>{cell(s.div.yld)}</td>
                <td><span className={'ribbon cat-' + s.cat}>{CAT_LABEL[s.cat]}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && <div className="empty">لا توجد نتائج مطابقة.</div>}
    </div>
  )
}
