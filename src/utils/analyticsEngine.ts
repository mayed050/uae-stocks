import type {
  DripPoint,
  HealthBand,
  PortfolioHolding,
  SmartAlert,
  StockRecord,
  StockSymbol,
  StressScenario,
  TrendDirection,
} from "@/types";

export const HOLDINGS_STORAGE_KEY = "emirati-capital:holdings:v1";

export type FinancialHealth = {
  score: number;
  band: HealthBand;
  breakdown: {
    valuation: number;
    roe: number;
    solvency: number;
    growth: number;
    payoutSafety: number;
  };
};

export type TrendIndicator = {
  direction: TrendDirection;
  score: number;
  qualifiers: string[];
};

export type DividendSustainabilityRating = {
  rating: "مستدام" | "مقبول" | "تحت المراقبة" | "مرتفع المخاطر";
  score: number;
  payoutRatio: number;
  cashflowToDebt: number;
  summary: string;
};

export type PortfolioMetrics = {
  totalCost: number;
  marketValue: number;
  unrealizedPnL: number;
  annualIncome: number;
  weightedYield: number;
  concentrationAlerts: SmartAlert[];
  allocation: Array<{
    symbol: StockSymbol;
    value: number;
    weight: number;
    annualIncome: number;
  }>;
};

export function getExpectedTrend(stock: StockRecord): TrendIndicator {
  const health = calculateFinancialHealthScore(stock);
  const valuationSupport = stock.fundamentals.pe <= 10 ? 1.2 : stock.fundamentals.pe <= 16 ? 0.6 : -0.5;
  const earnings = normalize(stock.fundamentals.netProfitGrowth, -20, 35) * 2 - 1;
  const revenue = normalize(stock.fundamentals.revenueGrowth, -15, 35) * 1.4 - 0.7;
  const liquidity = stock.prices.tradeValue >= 100_000_000 ? 0.7 : stock.prices.tradeValue < 5_000_000 ? -0.8 : 0;
  const momentum = clamp(stock.prices.changePercent / 8, -1, 1);
  const score = round((health.score - 50) / 18 + valuationSupport + earnings + revenue + liquidity + momentum, 2);
  const qualifiers = [
    `الصحة المالية ${health.band} بدرجة ${health.score}/100`,
    stock.fundamentals.netProfitGrowth >= 0
      ? `نمو الأرباح موجب ${stock.fundamentals.netProfitGrowth.toFixed(1)}%`
      : `الأرباح تحت ضغط ${stock.fundamentals.netProfitGrowth.toFixed(1)}%`,
    stock.prices.tradeValue >= 100_000_000 ? "سيولة جلسة مرتفعة" : "السيولة تحتاج متابعة",
  ];

  if (score >= 3) return { direction: "صاعد", score, qualifiers };
  if (score >= 1.3) return { direction: "مستقر إيجابي", score, qualifiers };
  if (score > -1) return { direction: "محايد", score, qualifiers };
  if (score > -2.5) return { direction: "ضاغط", score, qualifiers };
  return { direction: "متذبذب", score, qualifiers };
}

export function calculateDividendSustainability(stock: StockRecord): DividendSustainabilityRating {
  const payoutRatio = stock.fundamentals.payoutRatio;
  const debtProxy = Math.max(stock.fundamentals.revenueAED * Math.max(stock.fundamentals.debtToEquity, 0.05), 1);
  const cashflowToDebt = stock.fundamentals.freeCashFlowAED / debtProxy;
  const payoutScore = payoutRatio <= 55 ? 38 : payoutRatio <= 75 ? 30 : payoutRatio <= 90 ? 18 : 8;
  const cashScore = cashflowToDebt >= 0.18 ? 32 : cashflowToDebt >= 0.08 ? 24 : cashflowToDebt >= 0 ? 14 : 4;
  const growthScore = stock.fundamentals.netProfitGrowth >= 10 ? 20 : stock.fundamentals.netProfitGrowth >= 0 ? 14 : 6;
  const yieldScore = stock.fundamentals.dividendYield >= 7 ? 4 : stock.fundamentals.dividendYield >= 4 ? 10 : 7;
  const score = Math.round(clamp(payoutScore + cashScore + growthScore + yieldScore, 0, 100));

  if (score >= 78) {
    return {
      rating: "مستدام",
      score,
      payoutRatio,
      cashflowToDebt: round(cashflowToDebt, 3),
      summary: "التوزيع مدعوم بهامش أمان جيد في الأرباح والتدفقات وفق نموذج اللقطة.",
    };
  }

  if (score >= 62) {
    return {
      rating: "مقبول",
      score,
      payoutRatio,
      cashflowToDebt: round(cashflowToDebt, 3),
      summary: "التوزيع قابل للاستمرار مع الحاجة لمتابعة الأرباح والتدفقات القادمة.",
    };
  }

  if (score >= 45) {
    return {
      rating: "تحت المراقبة",
      score,
      payoutRatio,
      cashflowToDebt: round(cashflowToDebt, 3),
      summary: "نسبة التوزيع أو التدفقات تقلل هامش الأمان وتحتاج متابعة.",
    };
  }

  return {
    rating: "مرتفع المخاطر",
    score,
    payoutRatio,
    cashflowToDebt: round(cashflowToDebt, 3),
    summary: "التوزيع مرتفع مقارنة بمؤشرات التدفق أو النمو المتاحة في اللقطة.",
  };
}

export function calculateFinancialHealthScore(stock: StockRecord): FinancialHealth {
  const valuation = scoreInverse(stock.fundamentals.pe, 5, 30, 18);
  const roe = scoreRange(stock.fundamentals.roe, 8, 30, 22);
  const solvency = scoreInverse(stock.fundamentals.debtToEquity, 0, 3, 18);
  const growth = scoreRange((stock.fundamentals.revenueGrowth + stock.fundamentals.netProfitGrowth) / 2, -15, 35, 24);
  const payoutSafety = scoreInverse(stock.fundamentals.payoutRatio, 20, 100, 18);
  const raw = valuation + roe + solvency + growth + payoutSafety;
  const score = Math.round(clamp(raw, 1, 100));

  return {
    score,
    band: healthBand(score),
    breakdown: {
      valuation: Math.round(valuation),
      roe: Math.round(roe),
      solvency: Math.round(solvency),
      growth: Math.round(growth),
      payoutSafety: Math.round(payoutSafety),
    },
  };
}

export function simulateDrip(stock: StockRecord, initialShares: number, years = 10, annualContribution = 0): DripPoint[] {
  const points: DripPoint[] = [];
  let shares = Math.max(initialShares, 0);
  let price = stock.prices.last;
  const priceGrowth = clamp((stock.fundamentals.revenueGrowth + stock.fundamentals.netProfitGrowth) / 220, -0.04, 0.08);
  const dividendGrowth = clamp(stock.fundamentals.netProfitGrowth / 180, -0.03, 0.06);
  let dividend = stock.dividend.annualDividend;

  for (let year = 1; year <= years; year += 1) {
    const dividendsReceived = shares * dividend;
    const reinvestedShares = price > 0 ? (dividendsReceived + annualContribution) / price : 0;
    shares += reinvestedShares;
    points.push({
      year,
      shares: round(shares, 2),
      portfolioValue: round(shares * price, 2),
      dividendsReceived: round(dividendsReceived, 2),
      reinvestedShares: round(reinvestedShares, 2),
    });
    price *= 1 + priceGrowth;
    dividend *= 1 + dividendGrowth;
  }

  return points;
}

export function runStressTest(holdings: PortfolioHolding[], stocks: StockRecord[]): StressScenario[] {
  const metrics = calculatePortfolioMetrics(holdings, stocks);

  return ([10, 20, 30] as const).map((dropPercent) => {
    const portfolioValue = metrics.marketValue * (1 - dropPercent / 100);
    return {
      dropPercent,
      portfolioValue: round(portfolioValue, 2),
      lossValue: round(metrics.marketValue - portfolioValue, 2),
      annualIncomeAfterDrop: round(metrics.annualIncome * (dropPercent === 30 ? 0.88 : dropPercent === 20 ? 0.94 : 0.98), 2),
    };
  });
}

export function calculatePortfolioMetrics(holdings: PortfolioHolding[], stocks: StockRecord[]): PortfolioMetrics {
  const allocation = holdings
    .map((holding) => {
      const stock = stocks.find((item) => item.symbol === holding.symbol);
      if (!stock) return null;
      const value = holding.shares * stock.prices.last;
      return {
        symbol: holding.symbol,
        value,
        weight: 0,
        annualIncome: holding.shares * stock.dividend.annualDividend,
      };
    })
    .filter((item): item is PortfolioMetrics["allocation"][number] => item !== null);

  const marketValue = allocation.reduce((sum, item) => sum + item.value, 0);
  const totalCost = holdings.reduce((sum, holding) => sum + holding.shares * holding.averageCost, 0);
  const annualIncome = allocation.reduce((sum, item) => sum + item.annualIncome, 0);
  const allocationWithWeights = allocation.map((item) => ({
    ...item,
    weight: marketValue > 0 ? (item.value / marketValue) * 100 : 0,
  }));

  return {
    totalCost: round(totalCost, 2),
    marketValue: round(marketValue, 2),
    unrealizedPnL: round(marketValue - totalCost, 2),
    annualIncome: round(annualIncome, 2),
    weightedYield: marketValue > 0 ? round((annualIncome / marketValue) * 100, 2) : 0,
    concentrationAlerts: allocationWithWeights
      .filter((item) => item.weight >= 40)
      .map((item) => ({
        id: `concentration-${item.symbol}`,
        symbol: item.symbol,
        title: "تركيز مرتفع في المحفظة",
        message: `${item.symbol} يمثل ${item.weight.toFixed(1)}% من قيمة المحفظة، أعلى من حد 40%.`,
        severity: "warning",
        type: "portfolio",
      })),
    allocation: allocationWithWeights,
  };
}

export function buildSmartAlerts(stocks: StockRecord[], referenceDate = "2026-05-29", holdings: PortfolioHolding[] = []): SmartAlert[] {
  const alerts: SmartAlert[] = [];

  for (const stock of stocks) {
    const entitlementCountdown = daysBetween(referenceDate, stock.dividend.entitlementDate);
    if (entitlementCountdown >= 0 && entitlementCountdown <= 30) {
      alerts.push({
        id: `dividend-${stock.symbol}`,
        symbol: stock.symbol,
        title: "استحقاق توزيعات قريب",
        message: `${stock.nameAr}: آخر يوم استحقاق خلال ${entitlementCountdown} يوم.`,
        severity: entitlementCountdown <= 7 ? "danger" : "warning",
        type: "dividend",
      });
    }

    const averageVolume = stock.historicalPrices.reduce((sum, point) => sum + point.volume, 0) / stock.historicalPrices.length;
    if (stock.prices.volume > averageVolume * 1.55) {
      alerts.push({
        id: `volume-${stock.symbol}`,
        symbol: stock.symbol,
        title: "نشاط تداول أعلى من المعتاد",
        message: `حجم ${stock.symbol} أعلى من متوسط السلسلة الداخلية بنحو ${((stock.prices.volume / averageVolume - 1) * 100).toFixed(0)}%.`,
        severity: "info",
        type: "volume",
      });
    }

    const health = calculateFinancialHealthScore(stock);
    if (health.score < 55) {
      alerts.push({
        id: `health-${stock.symbol}`,
        symbol: stock.symbol,
        title: "الصحة المالية تحت المراقبة",
        message: `${stock.symbol} حصل على ${health.score}/100 بسبب مزيج التقييم والنمو والتوزيع.`,
        severity: "warning",
        type: "health",
      });
    }
  }

  alerts.push({
    id: "snapshot-mode",
    title: "تنبيه مصدر البيانات",
    message: "اللوحة تعتمد على لقطة ثابتة بتاريخ 2026-05-27 وليست أسعارا حية.",
    severity: "info",
    type: "data",
  });

  return [...alerts, ...calculatePortfolioMetrics(holdings, stocks).concentrationAlerts];
}

export function healthBand(score: number): HealthBand {
  if (score >= 82) return "ممتاز";
  if (score >= 68) return "جيد";
  if (score >= 54) return "متوازن";
  return "تحت المراقبة";
}

export function healthClass(score: number): string {
  if (score >= 82) return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (score >= 68) return "text-sky-700 bg-sky-50 border-sky-200";
  if (score >= 54) return "text-amber-700 bg-amber-50 border-amber-200";
  return "text-rose-700 bg-rose-50 border-rose-200";
}

function daysBetween(from: string, to: string): number {
  const start = new Date(`${from}T00:00:00Z`).getTime();
  const end = new Date(`${to}T00:00:00Z`).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return Number.POSITIVE_INFINITY;
  return Math.ceil((end - start) / 86_400_000);
}

function scoreRange(value: number, min: number, max: number, weight: number): number {
  return normalize(value, min, max) * weight;
}

function scoreInverse(value: number, min: number, max: number, weight: number): number {
  return (1 - normalize(value, min, max)) * weight;
}

function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return clamp((value - min) / (max - min), 0, 1);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, digits = 2): number {
  return Number(value.toFixed(digits));
}
