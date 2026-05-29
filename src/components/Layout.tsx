"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity,
  Calculator,
  CalendarDays,
  FileText,
  GitCompare,
  Home,
  Menu,
  Moon,
  PieChart,
  ShieldAlert,
  Sun,
  Table2,
  X,
} from "lucide-react";
import { TickerTape } from "@/components/TickerTape";

const navItems = [
  { href: "/", label: "نظرة عامة", icon: Home },
  { href: "/stocks", label: "مستكشف الأسهم", icon: Table2 },
  { href: "/dividends", label: "التوزيعات", icon: CalendarDays },
  { href: "/outlook", label: "الاتجاه", icon: Activity },
  { href: "/portfolio", label: "حاسبة المحفظة", icon: PieChart },
  { href: "/calculator", label: "حاسبة الأمان", icon: Calculator },
  { href: "/compare", label: "المقارنة", icon: GitCompare },
  { href: "/report", label: "التقرير", icon: FileText },
];

type Theme = "light" | "dark";

export function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "dark";
    const saved = window.localStorage.getItem("emirati-capital:theme");
    return saved === "light" || saved === "dark" ? saved : "dark";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("emirati-capital:theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((value) => (value === "dark" ? "light" : "dark"));

  return (
    <div className="min-h-screen" dir="rtl">
      <TickerTape />

      <header className="app-header no-print sticky top-0 z-40 border-b backdrop-blur-2xl lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <BrandMark />
            <BrandText />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeButton theme={theme} onClick={toggleTheme} compact />
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              className="icon-button"
              aria-label="فتح القائمة"
            >
              {open ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
            </button>
          </div>
        </div>
      </header>

      <div className="layout-grid mx-auto grid w-full max-w-[1560px] lg:grid-cols-[1fr_290px]">
        <aside
          dir="rtl"
          className={`app-sidebar no-print fixed inset-y-0 right-0 z-50 w-[290px] p-4 shadow-2xl transition lg:sticky lg:top-0 lg:col-start-2 lg:row-start-1 lg:block lg:h-screen lg:translate-x-0 lg:shadow-none ${
            open ? "block translate-x-0" : "hidden translate-x-full"
          }`}
        >
          <div className="mb-7 flex items-center justify-between gap-3">
            <Link href="/" className="flex min-w-0 items-center gap-3" onClick={() => setOpen(false)}>
              <BrandMark />
              <BrandText />
            </Link>
            <button type="button" onClick={() => setOpen(false)} className="icon-button lg:hidden" aria-label="إغلاق القائمة">
              <X size={18} aria-hidden />
            </button>
          </div>

          <nav className="grid gap-2" aria-label="التنقل الرئيسي">
            {navItems.map((item) => {
              const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`sidebar-link ${active ? "sidebar-link-active" : ""}`}
                >
                  <item.icon size={19} aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-6">
            <ThemeButton theme={theme} onClick={toggleTheme} />
          </div>

          <div className="liability-box mt-6 rounded-lg p-4 text-sm leading-7">
            <div className="mb-2 flex items-center gap-2 font-black">
              <ShieldAlert size={18} aria-hidden />
              إخلاء مسؤولية
            </div>
            <p>
              ليست هذه اللوحة توصية شراء أو بيع. القراءات مبنية على لقطة ثابتة ونماذج داخلية للمقارنة والمتابعة فقط، مع
              دمج تجربة مشروع uae-stocks في واجهة إماراتي كابيتال.
            </p>
          </div>

          <p className="mt-auto px-2 pt-5 text-xs font-bold text-[color:var(--muted)]">
            بيانات 2026-05-27 و2026-05-29 للمعلومات فقط
          </p>
        </aside>

        <main dir="rtl" className="min-w-0 px-4 py-5 md:px-6 lg:col-start-1 lg:row-start-1 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function ThemeButton({ theme, onClick, compact = false }: { theme: Theme; onClick: () => void; compact?: boolean }) {
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={onClick}
      className={compact ? "icon-button" : "sidebar-link w-full"}
      aria-label={isDark ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن"}
    >
      {isDark ? <Sun size={18} aria-hidden /> : <Moon size={18} aria-hidden />}
      {compact ? null : <span>{isDark ? "الوضع الفاتح" : "الوضع الداكن"}</span>}
    </button>
  );
}

function BrandMark() {
  return (
    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-sky-500 to-violet-500 text-sm font-black text-white shadow-lg shadow-sky-800/20">
      UAE
    </span>
  );
}

function BrandText() {
  return (
    <span className="min-w-0 w-44 max-w-[calc(100vw-8rem)] text-right md:w-auto md:max-w-none">
      <span className="block truncate text-sm font-black text-[color:var(--foreground)] sm:text-base md:text-lg">
        إماراتي كابيتال
      </span>
      <span className="block truncate text-xs font-bold text-[color:var(--muted)]">منصة الأسهم الإماراتية</span>
    </span>
  );
}
