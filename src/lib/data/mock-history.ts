import type { ChartPoint } from "@/lib/types";

const labels = [
  "قبل 12 أسبوع",
  "قبل 11 أسبوع",
  "قبل 10 أسابيع",
  "قبل 9 أسابيع",
  "قبل 8 أسابيع",
  "قبل 7 أسابيع",
  "قبل 6 أسابيع",
  "قبل 5 أسابيع",
  "قبل 4 أسابيع",
  "قبل 3 أسابيع",
  "قبل أسبوعين",
  "آخر جلسة",
];

export function buildMockPriceHistory(
  seed: string,
  lastPrice: number | null,
  dailyChangePercent: number | null,
): ChartPoint[] {
  if (lastPrice === null) return [];

  const drift = (dailyChangePercent ?? 0) / 120;
  const seedValue = Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0);

  return labels.map((label, index) => {
    const distance = labels.length - 1 - index;
    const wave = Math.sin((seedValue + index * 19) / 12) * 0.035;
    const price = lastPrice * (1 - distance * drift + wave);

    return {
      label,
      price: Number(price.toFixed(2)),
      isMock: true,
    };
  });
}

export function buildMockDividendHistory(seed: string, latestYield: number | null): ChartPoint[] {
  if (latestYield === null) return [];

  const base = Math.max(latestYield, 0.1);
  const seedValue = Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0);

  return ["2022", "2023", "2024", "2025", "2026"].map((label, index) => {
    const wave = Math.cos((seedValue + index * 23) / 14) * 0.35;
    const yieldValue = Math.max(0, base + wave - (4 - index) * 0.08);

    return {
      label,
      dividend: Number((yieldValue / 100).toFixed(4)),
      yield: Number(yieldValue.toFixed(2)),
      isMock: true,
    };
  });
}
