import { clsx } from "clsx";
import type { AlertSeverity, Confidence, RiskLevel } from "@/lib/types";

type BadgeTone = "blue" | "green" | "red" | "yellow" | "slate" | "orange";

const toneClasses: Record<BadgeTone, string> = {
  blue: "border-blue-200 bg-blue-50 text-blue-800",
  green: "border-emerald-200 bg-emerald-50 text-emerald-800",
  red: "border-rose-200 bg-rose-50 text-rose-800",
  yellow: "border-yellow-200 bg-yellow-50 text-yellow-800",
  slate: "border-slate-200 bg-slate-50 text-slate-700",
  orange: "border-orange-200 bg-orange-50 text-orange-800",
};

export function Badge({
  children,
  tone = "slate",
  className,
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span className={clsx("inline-flex min-h-7 items-center rounded-full border px-2.5 text-xs font-bold", toneClasses[tone], className)}>
      {children}
    </span>
  );
}

export function confidenceTone(confidence: Confidence): BadgeTone {
  if (confidence === "موثوق جدًا") return "green";
  if (confidence === "موثوق") return "blue";
  if (confidence === "يحتاج تحقق") return "orange";
  return "slate";
}

export function riskTone(risk: RiskLevel): BadgeTone {
  if (risk === "منخفض") return "green";
  if (risk === "متوسط") return "yellow";
  if (risk === "مرتفع") return "orange";
  return "red";
}

export function alertTone(severity: AlertSeverity): BadgeTone {
  if (severity === "red") return "red";
  if (severity === "orange") return "orange";
  if (severity === "yellow") return "yellow";
  if (severity === "blue") return "blue";
  return "slate";
}
