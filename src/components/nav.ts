import type { LucideIcon } from 'lucide-react'
import { LayoutDashboard, Search, Banknote, ChartLine, Scale, BriefcaseBusiness } from 'lucide-react'

export type View = 'overview' | 'screener' | 'dividends' | 'compare' | 'portfolio' | 'financials'

/** عناصر التنقّل — مصدر واحد للشريط الجانبي (label) والشريط السفلي للجوال (short). */
export const NAV: { v: View; label: string; short: string; icon: LucideIcon }[] = [
  { v: 'overview', label: 'نظرة عامة', short: 'الرئيسية', icon: LayoutDashboard },
  { v: 'screener', label: 'مستكشف الأسهم', short: 'المستكشف', icon: Search },
  { v: 'dividends', label: 'التوزيعات', short: 'التوزيعات', icon: Banknote },
  { v: 'financials', label: 'النتائج المالية', short: 'النتائج', icon: ChartLine },
  { v: 'compare', label: 'المقارنة', short: 'المقارنة', icon: Scale },
  { v: 'portfolio', label: 'حاسبة المحفظة', short: 'المحفظة', icon: BriefcaseBusiness },
]
