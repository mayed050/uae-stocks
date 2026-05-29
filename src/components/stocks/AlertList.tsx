import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Badge, alertTone } from "@/components/ui/Badge";
import type { StockAlert } from "@/lib/types";

export function AlertList({ alerts, limit = 8 }: { alerts: StockAlert[]; limit?: number }) {
  const visible = alerts.slice(0, limit);

  if (!visible.length) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">
        لا توجد تنبيهات نشطة ضمن اللقطة الحالية.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {visible.map((alert, index) => (
        <Link
          key={`${alert.stockSymbol}-${alert.title}-${index}`}
          href={`/stocks/${alert.stockSymbol}`}
          className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-50 text-slate-600">
            <AlertCircle size={18} aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2">
              <Badge tone={alertTone(alert.severity)}>{alert.stockSymbol}</Badge>
              <strong className="text-sm text-slate-900">{alert.title}</strong>
            </span>
            <span className="mt-1 block text-sm leading-6 text-slate-600">{alert.message}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}
