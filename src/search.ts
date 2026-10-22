/**
 * معاملات الرابط (search params) — تحقّق متسامح: أي قيمة غير صالحة تُهمَل بصمت
 * فيبقى الرابط المشارَك صالحًا للفتح دائمًا بدل صفحة خطأ.
 */
import type { Category, Exchange } from '@/data'
import { SECTOR_TITLES } from '@/data/sectors'

export type SortKey = 'name' | 'price' | 'change' | 'pe' | 'yield' | 'mcap'
export type DisplayMode = 'list' | 'sectors'

/** معاملات عامة لكل الصفحات: ?stock=EMAAR يفتح بطاقة السهم فوق أي صفحة. */
export interface RootSearch {
  stock?: string
}

/** فلاتر المستكشف — القيم الافتراضية لا تُكتب في الرابط فيبقى قصيرًا. */
export interface ScreenerSearch {
  q?: string
  ex?: Exchange
  cat?: Category
  sector?: string
  sort?: SortKey
  dir?: 'asc' | 'desc'
  view?: DisplayMode
}

function oneOf<T extends string>(v: unknown, allowed: readonly T[]): T | undefined {
  return typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : undefined
}

export function validateRootSearch(raw: Record<string, unknown>): RootSearch {
  const stock = typeof raw.stock === 'string' ? raw.stock.toUpperCase() : undefined
  return stock && /^[A-Z0-9]{1,20}$/.test(stock) ? { stock } : {}
}

export function validateScreenerSearch(raw: Record<string, unknown>): ScreenerSearch {
  const q = typeof raw.q === 'string' ? raw.q.trim().slice(0, 80) : ''
  const out: ScreenerSearch = {
    q: q || undefined,
    ex: oneOf(raw.ex, ['DFM', 'ADX'] as const),
    cat: oneOf(raw.cat, ['income', 'growth', 'risk'] as const),
    sector: oneOf(raw.sector, SECTOR_TITLES),
    sort: oneOf(raw.sort, ['name', 'price', 'change', 'pe', 'yield', 'mcap'] as const),
    dir: oneOf(raw.dir, ['asc', 'desc'] as const),
    view: oneOf(raw.view, ['list', 'sectors'] as const),
  }
  // حذف المفاتيح الفارغة كي لا تظهر في الرابط
  return Object.fromEntries(Object.entries(out).filter(([, v]) => v !== undefined))
}

export type FinancialsTab = 'overview' | 'financial' | 'governance' | 'ownership'

/** صفحة النتائج المالية: السهم المختار والمجموعة النشطة. */
export interface FinancialsSearch {
  sym?: string
  tab?: FinancialsTab
}

export function validateFinancialsSearch(raw: Record<string, unknown>): FinancialsSearch {
  const sym = typeof raw.sym === 'string' ? raw.sym.toUpperCase() : undefined
  const out: FinancialsSearch = {
    sym: sym && /^[A-Z0-9]{1,20}$/.test(sym) ? sym : undefined,
    tab: oneOf(raw.tab, ['overview', 'financial', 'governance', 'ownership'] as const),
  }
  return Object.fromEntries(Object.entries(out).filter(([, v]) => v !== undefined))
}
