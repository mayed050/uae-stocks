export const unavailableText = "غير متوفر من المصدر الرسمي";

const numberFormatter = new Intl.NumberFormat("ar-AE", {
  maximumFractionDigits: 2,
});

const compactFormatter = new Intl.NumberFormat("ar-AE", {
  notation: "compact",
  maximumFractionDigits: 2,
});

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return unavailableText;
  return numberFormatter.format(value);
}

export function formatCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return unavailableText;
  return compactFormatter.format(value);
}

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return unavailableText;
  return `${formatCompact(value)} د.إ`;
}

export function formatCurrencyFull(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return unavailableText;
  return `${numberFormatter.format(value)} د.إ`;
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return unavailableText;
  const sign = value > 0 ? "+" : "";
  return `${sign}${numberFormatter.format(value)}%`;
}

export function formatPlainPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return unavailableText;
  return `${numberFormatter.format(value)}%`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return unavailableText;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("ar-AE", {
    timeZone: "Asia/Dubai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(parsed);
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return unavailableText;
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);

  return new Intl.DateTimeFormat("ar-AE", {
    timeZone: "Asia/Dubai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

export function percentClass(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "text-slate-500";
  if (value > 0) return "text-emerald-700";
  if (value < 0) return "text-rose-700";
  return "text-slate-600";
}

export function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;

  const normalized = String(value).replace(/,/g, "").replace(/%/g, "").trim();
  if (!normalized || normalized === "-" || normalized.toLowerCase() === "n/a") return null;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseGrowth(value: unknown): number | null {
  const text = String(value ?? "");
  const match = text.match(/([+-]\d+(?:\.\d+)?)%/);
  return match ? parseNumber(match[1]) : null;
}

export function parseFirstNumber(value: unknown): number | null {
  const text = String(value ?? "");
  const match = text.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  return match ? parseNumber(match[0]) : null;
}
