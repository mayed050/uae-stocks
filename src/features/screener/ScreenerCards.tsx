/**
 * المستكشف على الشاشات الصغيرة: بطاقة لكل سهم بدل جدول من تسعة أعمدة يتطلّب تمريرًا أفقيًا.
 * الترتيب من قائمة منسدلة (لا عناوين أعمدة هنا)، ويبقى محفوظًا في الرابط كما في الجدول.
 */
import { ArrowDownWideNarrow, ArrowUpNarrowWide } from 'lucide-react'
import { CAT_LABEL } from '@/data'
import type { Stock } from '@/data'
import Avatar from '@/components/Avatar'
import { cell } from '@/components/ui/cell'
import type { SortKey } from '@/search'
import { PortfolioToggle, PriceCell } from './ScreenerGrid'

const SORTS: [SortKey, string][] = [
  ['mcap', 'القيمة السوقية'],
  ['yield', 'العائد'],
  ['change', 'التغيّر اليومي'],
  ['pe', 'مكرر الربحية'],
  ['price', 'السعر'],
  ['name', 'الاسم'],
]

function Change({ v }: { v: number | null | undefined }) {
  if (typeof v !== 'number') return <span className="na">—</span>
  const cls = v > 0 ? 'chg up' : v < 0 ? 'chg down' : 'chg'
  return <span className={cls} dir="ltr">{v > 0 ? '▲ +' : v < 0 ? '▼ ' : ''}{Math.abs(v).toFixed(2)}%</span>
}

export default function ScreenerCards({
  rows,
  sort,
  desc,
  onSort,
  onOpen,
}: {
  rows: Stock[]
  sort: SortKey
  desc: boolean
  onSort: (k: SortKey, desc: boolean) => void
  onOpen: (s: Stock) => void
}) {
  return (
    <>
      <div className="scr-sortbar">
        <label>
          ترتيب حسب
          <select value={sort} onChange={(e) => { const k = e.target.value as SortKey; onSort(k, k !== 'name') }}>
            {SORTS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </label>
        <button className="grid-iconbtn" onClick={() => onSort(sort, !desc)} aria-label={desc ? 'الترتيب تنازلي — اضغط للتصاعدي' : 'الترتيب تصاعدي — اضغط للتنازلي'}>
          {desc ? <ArrowDownWideNarrow size={17} aria-hidden /> : <ArrowUpNarrowWide size={17} aria-hidden />}
        </button>
      </div>

      <ul className="scr-cards" aria-label={`نتائج المستكشف — ${rows.length} سهمًا`}>
        {rows.map((s) => (
          <li key={s.sym} className="scr-card">
            <button className="scr-card-main" onClick={() => onOpen(s)}>
              <Avatar sym={s.sym} size={34} />
              <span className="scr-card-id">
                <span className="scr-card-name">{s.name.split('—')[0]?.trim()}</span>
                <span className="scr-card-sym">{s.sym} · <span className={'exch ex-' + s.ex}>{s.ex}</span></span>
              </span>
              <span className="scr-card-price">
                <b><PriceCell s={s} /></b>
                <Change v={s.change} />
              </span>
              <span className="scr-card-meta">
                <span>العائد <b>{cell(s.div.yld)}</b></span>
                <span>القيمة <b>{cell(s.mcap)}</b></span>
                <span>P/E <b>{cell(s.pe)}</b></span>
                <span className={'ribbon cat-' + s.cat}>{CAT_LABEL[s.cat]}</span>
              </span>
            </button>
            <PortfolioToggle sym={s.sym} />
          </li>
        ))}
      </ul>
    </>
  )
}
