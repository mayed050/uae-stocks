import Link from "next/link";

export default function NotFound() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
      <h1 className="text-2xl font-bold text-slate-950">الصفحة غير موجودة</h1>
      <p className="mt-2 text-sm text-slate-500">لم يتم العثور على السهم أو الصفحة المطلوبة.</p>
      <Link
        href="/"
        className="mt-5 inline-flex min-h-10 items-center rounded-lg bg-[var(--primary)] px-4 text-sm font-bold text-white hover:bg-[var(--primary-dark)]"
      >
        العودة للرئيسية
      </Link>
    </div>
  );
}
