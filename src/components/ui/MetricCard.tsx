import { clsx } from "clsx";
import { Badge } from "@/components/ui/Badge";

export function MetricCard({
  label,
  value,
  hint,
  tone = "slate",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "slate" | "green" | "red" | "blue" | "yellow" | "orange";
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-500">{label}</p>
        <Badge tone={tone}>متابعة</Badge>
      </div>
      <p className={clsx("number mt-3 text-2xl font-bold", tone === "green" && "text-emerald-700", tone === "red" && "text-rose-700", tone === "blue" && "text-blue-800")}>
        {value}
      </p>
      {hint ? <p className="mt-2 text-xs leading-5 text-slate-500">{hint}</p> : null}
    </div>
  );
}
