"use client";

import { RotateCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 p-5">
      <h1 className="text-xl font-bold text-rose-950">تعذر تحميل البيانات</h1>
      <p className="mt-2 text-sm leading-7 text-rose-900">
        حدث خطأ أثناء معالجة بيانات الأسهم. الرسالة التقنية: {error.message}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg bg-rose-700 px-4 text-sm font-bold text-white hover:bg-rose-800"
      >
        <RotateCw size={16} aria-hidden />
        إعادة المحاولة
      </button>
    </div>
  );
}
