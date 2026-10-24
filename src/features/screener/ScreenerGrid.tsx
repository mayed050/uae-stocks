/**
 * جدول المستكشف على TanStack Table v9: ترتيب متحكَّم به من الرابط، إظهار/إخفاء الأعمدة
 * (محفوظ في المتصفح)، وعناوين وروابط تعمل من لوحة المفاتيح.
 */
import { useState } from 'react'
import type { MouseEvent } from 'react'
import { Link } from '@tanstack/react-router'
import {
  columnVisibilityFeature,
  createColumnHelper,
  functionalUpdate,
  rowSortingFeature,
  tableFeatures,
  useTable,
} from '@tanstack/react-table'
import type { ColumnVisibilityState, SortingState } from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown, BriefcaseBusiness, Columns3, Plus } from 'lucide-react'
import { CAT_LABEL } from '@/data'
import type { Stock } from '@/data'
import { parseAmount, parseYield } from '@/format'
import Avatar from '@/components/Avatar'
import { cell } from '@/components/ui/cell'
import { usePortfolio, useStocks } from '@/store'
import { isStale, sessionDate } from '@/lib'
import type { SortKey } from '@/search'

// الترتيب يتم مسبقًا في المستكشف (يشترك فيه العرض القطاعي)، فالجدول يعرض الترتيب ويتحكّم به فقط.
const features = tableFeatures({ rowSortingFeature, columnVisibilityFeature })
const helper = createColumnHelper<typeof features, Stock>()

const SORTABLE: readonly string[] = ['name', 'price', 'change', 'pe', 'mcap', 'yield'] satisfies SortKey[]

/** السعر مع نقطة تنبيه إن كان أقدم من آخر جلسة (تعذّر تحديثه). */
export function PriceCell({ s }: { s: Stock }) {
  const { stocks } = useStocks()
  const stale = isStale(s, sessionDate(stocks))
  return (
    <>
      {cell(s.price?.toFixed(2) ?? null)}
      {stale && <span className="stale-dot" role="img" aria-label={`سعر متقادم بتاريخ ${s.asof}`} title={`آخر سعر متاح بتاريخ ${s.asof} — تعذّر تحديثه`} />}
    </>
  )
}

export function PortfolioToggle({ sym }: { sym: string }) {
  const { isInPortfolio, togglePortfolioStock } = usePortfolio()
  const held = isInPortfolio(sym)
  return (
    <button
      className="grid-iconbtn"
      onClick={() => togglePortfolioStock(sym)}
      aria-pressed={held}
      aria-label={held ? `إزالة ${sym} من المحفظة` : `إضافة ${sym} إلى المحفظة`}
      title={held ? 'إزالة من المحفظة' : 'إضافة إلى المحفظة'}
    >
      {held ? <BriefcaseBusiness size={16} color="var(--brand)" aria-hidden /> : <Plus size={16} aria-hidden />}
    </button>
  )
}

const columns = helper.columns([
  helper.accessor('name', {
    header: 'السهم',
    enableHiding: false,
    sortDescFirst: false, // الاسم تصاعديًا أولًا (أ ← ي)
    cell: ({ row }) => {
      const s = row.original
      return (
        <Link to="/screener" search={(prev) => ({ ...prev, stock: s.sym })} className="cellname cell-link">
          <Avatar sym={s.sym} size={30} />
          <span>
            <span className="cn-name">{s.name}</span>
            <span className="cn-sym">{s.sym}</span>
          </span>
        </Link>
      )
    },
  }),
  helper.accessor('ex', { header: 'السوق', enableSorting: false, cell: (c) => <span className={'exch ex-' + c.getValue()}>{c.getValue()}</span> }),
  helper.accessor('price', { header: 'السعر', cell: (c) => <PriceCell s={c.row.original} /> }),
  helper.accessor('change', {
    header: 'التغيّر اليومي',
    cell: (c) => {
      const v = c.getValue()
      if (typeof v !== 'number') return <span className="na">—</span>
      const cls = v > 0 ? 'chg up' : v < 0 ? 'chg down' : 'chg'
      return <span className={cls} dir="ltr">{v > 0 ? '▲ +' : v < 0 ? '▼ ' : ''}{Math.abs(v).toFixed(2)}%</span>
    },
  }),
  helper.accessor('pe', { header: 'P/E', cell: (c) => cell(c.getValue()) }),
  helper.accessor('eps', { header: 'EPS', enableSorting: false, cell: (c) => cell(c.getValue()) }),
  helper.accessor((s) => parseAmount(s.mcap), { id: 'mcap', header: 'القيمة السوقية', cell: (c) => cell(c.row.original.mcap) }),
  helper.accessor('net', { header: 'صافي الربح', enableSorting: false, cell: (c) => cell(c.getValue()) }),
  helper.accessor((s) => parseYield(s.div.yld), { id: 'yield', header: 'العائد', cell: (c) => cell(c.row.original.div.yld) }),
  helper.accessor('cat', { header: 'التصنيف', enableSorting: false, cell: (c) => <span className={'ribbon cat-' + c.getValue()}>{CAT_LABEL[c.getValue()]}</span> }),
  helper.display({ id: 'portfolio', header: 'المحفظة', cell: ({ row }) => <PortfolioToggle sym={row.original.sym} /> }),
])

const VIS_KEY = 'screener_columns'
// افتراضيًا تُخفى ربحية السهم وصافي الربح كي يتسع الجدول لشاشة الحاسوب المحمول دون قصّ؛
// تُظهر من قائمة «الأعمدة»، ويُحفظ اختيار المستخدم.
const DEFAULT_VISIBILITY: ColumnVisibilityState = { eps: false, net: false }

function loadVisibility(): ColumnVisibilityState {
  try {
    const saved = localStorage.getItem(VIS_KEY)
    if (saved === null) return DEFAULT_VISIBILITY
    const v: unknown = JSON.parse(saved)
    return v && typeof v === 'object' ? (v as ColumnVisibilityState) : DEFAULT_VISIBILITY
  } catch {
    return DEFAULT_VISIBILITY
  }
}

export default function ScreenerGrid({
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
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibilityState>(loadVisibility)
  const sorting: SortingState = [{ id: sort, desc }]

  const table = useTable({
    features,
    columns,
    data: rows,
    getRowId: (s) => s.sym,
    manualSorting: true,
    enableMultiSort: false,
    enableSortingRemoval: false,
    sortDescFirst: true,
    state: { sorting, columnVisibility },
    onSortingChange: (updater) => {
      const next = functionalUpdate(updater, sorting)[0]
      if (next && SORTABLE.includes(next.id)) onSort(next.id as SortKey, next.desc)
    },
    onColumnVisibilityChange: (updater) => {
      setColumnVisibility((prev) => {
        const next = functionalUpdate(updater, prev)
        try {
          localStorage.setItem(VIS_KEY, JSON.stringify(next))
        } catch {
          /* التخزين غير متاح */
        }
        return next
      })
    },
  })

  // النقر على الصف يفتح البطاقة؛ النقر على رابط أو زر داخله يُترك لعنصره
  const rowClick = (e: MouseEvent, s: Stock) => {
    if ((e.target as HTMLElement).closest('a,button')) return
    onOpen(s)
  }

  return (
    <>
      <details className="col-menu">
        <summary><Columns3 size={14} className="ico" aria-hidden /> الأعمدة</summary>
        <div className="col-menu-list">
          {table.getAllLeafColumns().filter((c) => c.getCanHide()).map((c) => (
            <label key={c.id}>
              <input type="checkbox" checked={c.getIsVisible()} onChange={c.getToggleVisibilityHandler()} />
              {typeof c.columnDef.header === 'string' ? c.columnDef.header : c.id}
            </label>
          ))}
        </div>
      </details>

      <div className="tablewrap">
        <table className="screener">
          <caption className="sr-only">نتائج المستكشف — {rows.length} سهمًا</caption>
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => {
                  const s = h.column.getIsSorted()
                  const Icon = s === 'asc' ? ArrowUp : s === 'desc' ? ArrowDown : ArrowUpDown
                  return (
                    <th key={h.id} aria-sort={s === 'asc' ? 'ascending' : s === 'desc' ? 'descending' : h.column.getCanSort() ? 'none' : undefined}>
                      {h.column.getCanSort() ? (
                        <button className={'sort-btn' + (s ? ' active' : '')} onClick={h.column.getToggleSortingHandler()}>
                          <table.FlexRender header={h} />
                          <Icon size={13} aria-hidden />
                        </button>
                      ) : (
                        <table.FlexRender header={h} />
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="rowlink" onClick={(e) => rowClick(e, row.original)}>
                {row.getVisibleCells().map((c) => (
                  <td key={c.id}>
                    <table.FlexRender cell={c} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
