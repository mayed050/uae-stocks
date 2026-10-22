import type { LucideIcon } from 'lucide-react'
import { LayoutDashboard, Search, Banknote, ChartLine, Scale, BriefcaseBusiness } from 'lucide-react'

export type View = 'overview' | 'screener' | 'dividends' | 'compare' | 'portfolio' | 'financials'
export type ViewPath = '/' | '/screener' | '/dividends' | '/financials' | '/compare' | '/portfolio'

/** عناصر التنقّل — مصدر واحد للمسارات والشريط الجانبي (label) والشريط السفلي للجوال (short). */
export const NAV: { v: View; to: ViewPath; label: string; short: string; icon: LucideIcon }[] = [
  { v: 'overview', to: '/', label: 'نظرة عامة', short: 'الرئيسية', icon: LayoutDashboard },
  { v: 'screener', to: '/screener', label: 'مستكشف الأسهم', short: 'المستكشف', icon: Search },
  { v: 'dividends', to: '/dividends', label: 'التوزيعات', short: 'التوزيعات', icon: Banknote },
  { v: 'financials', to: '/financials', label: 'النتائج المالية', short: 'النتائج', icon: ChartLine },
  { v: 'compare', to: '/compare', label: 'المقارنة', short: 'المقارنة', icon: Scale },
  { v: 'portfolio', to: '/portfolio', label: 'حاسبة المحفظة', short: 'المحفظة', icon: BriefcaseBusiness },
]

export const pathOf = (v: View): ViewPath => NAV.find((n) => n.v === v)?.to ?? '/'
