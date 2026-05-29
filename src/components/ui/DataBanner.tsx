import { Database, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export function DataBanner({
  generatedAt,
  lastOfficialSession,
  warning,
}: {
  generatedAt: string;
  lastOfficialSession: string;
  warning: string;
}) {
  return (
    <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex gap-3">
          <ShieldAlert className="mt-1 shrink-0 text-amber-700" size={22} aria-hidden />
          <div>
            <p className="font-bold text-amber-950">تنبيه جودة البيانات</p>
            <p className="mt-1 text-sm leading-6 text-amber-900">{warning}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="yellow">تاريخ اللقطة: {generatedAt}</Badge>
          <Badge tone="slate">آخر جلسة: {lastOfficialSession}</Badge>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-amber-900">
        <Database size={15} aria-hidden />
        البيانات غير المتوفرة تظهر بالنص: “غير متوفر من المصدر الرسمي”.
      </div>
    </div>
  );
}
