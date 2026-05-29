import Link from "next/link";
import {
  BarChart3,
  Bell,
  CalendarDays,
  GitCompare,
  Home,
  LineChart,
  Table2,
  UsersRound,
} from "lucide-react";

const navItems = [
  { href: "/", label: "الرئيسية", icon: Home },
  { href: "/stocks", label: "جميع الأسهم", icon: Table2 },
  { href: "/dividends", label: "التوزيعات", icon: CalendarDays },
  { href: "/analysts", label: "آراء المحللين", icon: UsersRound },
  { href: "/outlook", label: "اتجاه 3 أشهر", icon: LineChart },
  { href: "/compare", label: "المقارنة", icon: GitCompare },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur no-print">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:px-6 lg:flex-row lg:items-center lg:justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-[var(--primary)] text-white">
              <BarChart3 aria-hidden size={24} />
            </span>
            <span>
              <span className="block text-lg font-bold text-slate-950">مرصد الأسهم الإماراتية</span>
              <span className="block text-sm text-slate-500">DFM و ADX بقراءة عربية يومية</span>
            </span>
          </Link>

          <nav className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin" aria-label="التنقل الرئيسي">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-h-10 shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[var(--primary)]"
              >
                <item.icon size={17} aria-hidden />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">{children}</main>

      <footer className="mt-8 border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-3 px-4 py-6 text-sm leading-7 text-slate-600 md:px-6">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <Bell size={17} aria-hidden />
            تنبيه استثماري
          </div>
          <p>
            جميع البيانات والتحليلات المعروضة في هذا الموقع مقدمة لأغراض المتابعة والمعلومات العامة فقط، ولا تُعد توصية أو دعوة للشراء أو البيع أو اتخاذ أي قرار استثماري. تعتمد بعض التحليلات على بيانات تاريخية ومؤشرات مالية وآراء محللين قد تتغير بمرور الوقت. يتحمل المستخدم مسؤولية قراراته الاستثمارية، ويجب الرجوع إلى المصادر الرسمية أو مستشار مالي مرخص قبل اتخاذ أي قرار.
          </p>
        </div>
      </footer>
    </div>
  );
}
