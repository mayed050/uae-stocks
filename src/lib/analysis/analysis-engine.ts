import type {
  AnalystOpinion,
  Confidence,
  DataSource,
  DividendEvent,
  DividendSustainability,
  Financials,
  MarketQuote,
  Metric,
  RiskLevel,
  StockAnalysis,
  TrendLabel,
} from "@/lib/types";
import type { StockConfig } from "@/config/stocks.config";
import { formatPercent, unavailableText } from "@/lib/format";

type AnalysisInput = {
  config: StockConfig;
  quote: MarketQuote;
  financials: Financials;
  dividends: DividendEvent[];
  disclosures: {
    date: string;
    title: string;
  }[];
  analyst: AnalystOpinion;
};

const analysisSource: DataSource = {
  name: "محرك تحليل داخلي",
  kind: "تحليل استنتاجي",
  official: false,
};

export function buildStockAnalysis(input: AnalysisInput): StockAnalysis {
  const score = buildScore(input);
  const riskLevel = buildRiskLevel(input, score);
  const trend = buildTrendLabel(score, riskLevel);
  const dividendSustainability = buildDividendSustainability(input.financials);
  const dataConfidence = buildDataConfidence(input);
  const tags = buildTags(input, riskLevel, dividendSustainability);
  const quickAssessment = buildQuickAssessment(input, riskLevel);
  const strengths = buildStrengths(input);
  const weaknesses = buildWeaknesses(input);
  const risks = buildRisks(input, riskLevel);

  return {
    trend: metric(trend, trend, "يحتاج تحقق", [
      "يعتمد الاتجاه على آخر لقطة سعرية ومؤشرات مالية متاحة، مع غياب أداء 3 أشهر الرسمي وآراء محللين موثقة داخل اللقطة.",
    ].join(" ")),
    riskLevel,
    dataConfidence,
    score,
    tags,
    quickAssessment,
    strengths,
    weaknesses,
    risks,
    highLevelSummary: buildHighLevelSummary(input, trend, riskLevel, dividendSustainability),
    threeMonthRationale: buildThreeMonthRationale(input, trend),
    financialPosition: buildFinancialPosition(input),
    dividendSustainability,
  };
}

function buildScore({ quote, financials }: AnalysisInput): number {
  let score = 0;

  const daily = quote.dailyChangePercent.value;
  if (daily !== null && daily >= 3) score += 1.5;
  else if (daily !== null && daily >= 1) score += 0.75;
  else if (daily !== null && daily <= -3) score -= 1.5;
  else if (daily !== null && daily <= -1) score -= 0.75;

  const revenueGrowth = financials.revenueGrowth.value;
  if (revenueGrowth !== null && revenueGrowth >= 15) score += 2;
  else if (revenueGrowth !== null && revenueGrowth > 0) score += 1;
  else if (revenueGrowth !== null && revenueGrowth < 0) score -= 1.5;

  const profitGrowth = financials.netProfitGrowth.value;
  if (profitGrowth !== null && profitGrowth >= 15) score += 2;
  else if (profitGrowth !== null && profitGrowth > 0) score += 1;
  else if (profitGrowth !== null && profitGrowth < 0) score -= 2;

  const roe = financials.roe.value;
  if (roe !== null && roe >= 20) score += 1;
  else if (roe !== null && roe < 10) score -= 0.75;

  const dividendYield = financials.dividendYield.value;
  if (dividendYield !== null && dividendYield >= 4) score += 0.75;

  const payoutRatio = financials.payoutRatio.value;
  if (payoutRatio !== null && payoutRatio >= 90) score -= 1.25;
  else if (payoutRatio !== null && payoutRatio <= 60) score += 0.5;

  const debt = financials.debtToEquity.value;
  if (debt !== null && debt > 2) score -= 1;
  else if (debt !== null && debt <= 0.5) score += 0.5;

  const tradeValue = quote.tradeValue.value;
  if (tradeValue !== null && tradeValue >= 100_000_000) score += 0.75;
  else if (tradeValue !== null && tradeValue < 1_000_000) score -= 1;

  return Number(score.toFixed(2));
}

function buildTrendLabel(score: number, riskLevel: RiskLevel): TrendLabel {
  if (riskLevel === "مرتفع جدًا") return "اتجاه متذبذب عالي المخاطر";
  if (score >= 4) return "اتجاه إيجابي محتمل";
  if (score >= 2) return "اتجاه مستقر مائل للصعود";
  if (score > -1) return "اتجاه محايد";
  if (score > -3) return "اتجاه مستقر مائل للضغط";
  return "اتجاه سلبي يحتاج إلى متابعة";
}

function buildRiskLevel({ quote, financials, config }: AnalysisInput, score: number): RiskLevel {
  let risk = 0;

  const daily = quote.dailyChangePercent.value;
  if (daily !== null && Math.abs(daily) >= 5) risk += 2;
  else if (daily !== null && Math.abs(daily) >= 3) risk += 1;

  const tradeValue = quote.tradeValue.value;
  if (tradeValue !== null && tradeValue < 1_000_000) risk += 2;
  else if (tradeValue !== null && tradeValue < 10_000_000) risk += 1;

  const payout = financials.payoutRatio.value;
  if (payout !== null && payout >= 90) risk += 1;

  const debt = financials.debtToEquity.value;
  if (debt !== null && debt > 2) risk += 1;

  if (config.sector.includes("العقار") || config.sector.includes("التأمين")) risk += 1;
  if (score <= -3) risk += 1;

  if (risk >= 4) return "مرتفع جدًا";
  if (risk >= 2) return "مرتفع";
  if (risk >= 1) return "متوسط";
  return "منخفض";
}

function buildDividendSustainability(financials: Financials): DividendSustainability {
  const payout = financials.payoutRatio.value;
  const debt = financials.debtToEquity.value;
  const profitGrowth = financials.netProfitGrowth.value;
  const freeCashFlow = financials.freeCashFlow.value;

  if (payout === null && freeCashFlow === null) {
    return "غير قابل للتقييم بسبب نقص البيانات";
  }

  if ((payout !== null && payout >= 90) || (debt !== null && debt > 2)) {
    return "توزيعات مرتفعة بمخاطر أعلى";
  }

  if (payout !== null && payout >= 75) {
    return "استدامة تحتاج إلى متابعة";
  }

  if (payout !== null && payout <= 60 && (profitGrowth === null || profitGrowth >= 0)) {
    return "استدامة مرتفعة";
  }

  return "استدامة متوسطة";
}

function buildDataConfidence({ quote, financials }: AnalysisInput): Confidence {
  const hasOfficialPrice = quote.lastPrice.confidence === "موثوق جدًا";
  const hasSecondaryFundamentals =
    financials.eps.confidence === "يحتاج تحقق" ||
    financials.roe.confidence === "يحتاج تحقق" ||
    financials.revenue.confidence === "يحتاج تحقق";

  if (hasOfficialPrice && !hasSecondaryFundamentals) return "موثوق جدًا";
  if (hasOfficialPrice) return "موثوق";
  return "يحتاج تحقق";
}

function buildTags(
  { config, quote, financials }: AnalysisInput,
  riskLevel: RiskLevel,
  dividendSustainability: DividendSustainability,
): string[] {
  const tags = new Set<string>();
  const yieldValue = financials.dividendYield.value;
  const revenueGrowth = financials.revenueGrowth.value;
  const profitGrowth = financials.netProfitGrowth.value;
  const tradeValue = quote.tradeValue.value;

  if (yieldValue !== null && yieldValue >= 4 && riskLevel !== "مرتفع جدًا") {
    tags.add("أسهم دخل نقدي مستقرة");
  }

  if (
    (revenueGrowth !== null && revenueGrowth > 10) ||
    (profitGrowth !== null && profitGrowth > 10)
  ) {
    tags.add("أسهم نمو مع توزيعات مقبولة");
  }

  if (["البنوك", "البنوك الإسلامية", "الاتصالات", "المرافق"].includes(config.sector)) {
    tags.add("أسهم قيادية ذات مركز مالي قوي");
  }

  if (tradeValue !== null && tradeValue >= 100_000_000) {
    tags.add("أسهم ذات سيولة تداول مرتفعة");
  }

  if ((profitGrowth !== null && profitGrowth < 0) || (revenueGrowth !== null && revenueGrowth < 0)) {
    tags.add("أسهم تحتاج إلى متابعة بسبب ضعف النمو أو ضغط الأرباح");
  }

  if (dividendSustainability === "توزيعات مرتفعة بمخاطر أعلى") {
    tags.add("أسهم توزيعات مرتفعة بمخاطر أعلى");
  }

  if (riskLevel === "منخفض" || riskLevel === "متوسط") {
    tags.add("أسهم مرشحة للاستقرار خلال الثلاثة أشهر القادمة");
  }

  if (riskLevel === "مرتفع" || riskLevel === "مرتفع جدًا") {
    tags.add("أسهم مرشحة للتذبذب العالي");
  }

  return Array.from(tags);
}

function buildQuickAssessment({ quote, financials }: AnalysisInput, riskLevel: RiskLevel): string[] {
  const items: string[] = [];
  const daily = quote.dailyChangePercent.value;
  const tradeValue = quote.tradeValue.value;
  const profitGrowth = financials.netProfitGrowth.value;
  const revenueGrowth = financials.revenueGrowth.value;

  if (daily !== null && daily >= 2) items.push("أداء قوي");
  else if (daily !== null && daily <= -2) items.push("ضغط سعري واضح");
  else items.push("أداء مستقر");

  if (tradeValue !== null && tradeValue >= 100_000_000) items.push("سيولة مرتفعة");
  else if (tradeValue !== null && tradeValue < 1_000_000) items.push("سيولة ضعيفة");

  if (
    (profitGrowth !== null && profitGrowth > 10) ||
    (revenueGrowth !== null && revenueGrowth > 10)
  ) {
    items.push("نمو مالي جيد");
  }

  if (profitGrowth !== null && profitGrowth < 0) items.push("ربحية تحت الضغط");
  if (riskLevel === "مرتفع" || riskLevel === "مرتفع جدًا") items.push("يحتاج إلى متابعة");

  return items;
}

function buildStrengths({ config, quote, financials }: AnalysisInput): string[] {
  const strengths = [
    `تصنيف قطاعي واضح ضمن ${config.sector}، ما يساعد على مقارنة السهم بنظرائه داخل القائمة.`,
  ];

  if (quote.tradeValue.value !== null && quote.tradeValue.value >= 100_000_000) {
    strengths.push("قيمة التداول في آخر جلسة تشير إلى حضور سيولة جيد ضمن الأسهم محل المتابعة.");
  }

  if (financials.netProfitGrowth.value !== null && financials.netProfitGrowth.value > 0) {
    strengths.push(`نمو صافي الربح المتاح في اللقطة يبلغ ${formatPercent(financials.netProfitGrowth.value)}.`);
  }

  if (financials.roe.value !== null && financials.roe.value >= 15) {
    strengths.push(`العائد على حقوق الملكية المتاح عند ${formatPercent(financials.roe.value)} وهو مستوى داعم للربحية.`);
  }

  return strengths;
}

function buildWeaknesses({ quote, financials }: AnalysisInput): string[] {
  const weaknesses: string[] = [];

  if (quote.performanceThreeMonths.value === null) {
    weaknesses.push("أداء السعر الرسمي خلال ثلاثة أشهر غير متوفر داخل اللقطة الحالية.");
  }

  if (financials.revenueGrowth.value !== null && financials.revenueGrowth.value < 0) {
    weaknesses.push(`الإيرادات المتاحة متراجعة بنسبة ${formatPercent(financials.revenueGrowth.value)}.`);
  }

  if (financials.netProfitGrowth.value !== null && financials.netProfitGrowth.value < 0) {
    weaknesses.push(`صافي الربح المتاح متراجع بنسبة ${formatPercent(financials.netProfitGrowth.value)}.`);
  }

  if (financials.payoutRatio.value !== null && financials.payoutRatio.value >= 85) {
    weaknesses.push("نسبة التوزيع مرتفعة نسبيًا، ما يقلل هامش الأمان إن تراجعت الأرباح أو التدفقات.");
  }

  if (!weaknesses.length) {
    weaknesses.push("لا تظهر نقاط ضعف جوهرية من اللقطة المتاحة، مع ضرورة الرجوع للمصادر الرسمية الأحدث.");
  }

  return weaknesses;
}

function buildRisks({ config, quote, financials }: AnalysisInput, riskLevel: RiskLevel): string[] {
  const risks = [
    "التحليل لا يتضمن توصية شراء أو بيع ويجب قراءته كمؤشر متابعة فقط.",
    "غياب بيانات أداء 3 أشهر الرسمية وآراء المحللين يقلل دقة الاتجاه المتوقع.",
  ];

  if (config.sector.includes("العقار")) risks.push("قطاع العقار أكثر حساسية للدورة الاقتصادية وأسعار الفائدة.");
  if (config.sector.includes("التأمين")) risks.push("قطاع التأمين يتأثر بدورات المطالبات وعوائد الاستثمار.");
  if (quote.dailyChangePercent.value !== null && Math.abs(quote.dailyChangePercent.value) >= 4) {
    risks.push("التغير اليومي الكبير يستدعي مراقبة الإفصاحات والسيولة في الجلسات التالية.");
  }
  if (financials.debtToEquity.value !== null && financials.debtToEquity.value > 2) {
    risks.push("مؤشر الدين إلى حقوق الملكية مرتفع في البيانات المتاحة.");
  }
  if (riskLevel === "مرتفع جدًا") risks.push("مستوى المخاطر التحليلي مرتفع جدًا مقارنة ببقية الأسهم محل المتابعة.");

  return risks;
}

function buildHighLevelSummary(
  { config, quote, financials }: AnalysisInput,
  trend: TrendLabel,
  riskLevel: RiskLevel,
  dividendSustainability: DividendSustainability,
): string {
  const daily = quote.dailyChangePercent.display;
  const revenue = financials.revenue.display;
  const profit = financials.netProfit.display;

  return [
    `يتداول ${config.nameAr} ضمن قراءة ${trend} وفق اللقطة المتاحة، مع تغير يومي يبلغ ${daily}.`,
    `الإيرادات المتاحة عند ${revenue} وصافي الربح عند ${profit}، بينما تظهر استدامة التوزيعات بتقييم: ${dividendSustainability}.`,
    `مستوى المخاطر التحليلي ${riskLevel}، والقراءة تظل مشروطة بتوفر بيانات أحدث للأداء التاريخي وآراء المحللين.`,
  ].join(" ");
}

function buildThreeMonthRationale({ quote, financials, disclosures }: AnalysisInput, trend: TrendLabel): string {
  const missingPerformance =
    quote.performanceThreeMonths.value === null
      ? "أداء الثلاثة أشهر الرسمي غير متوفر من المصدر الرسمي داخل اللقطة، لذلك لا يعتمد الاستنتاج على مسار سعري تاريخي كامل."
      : `أداء الثلاثة أشهر يبلغ ${quote.performanceThreeMonths.display}.`;

  const disclosureNote = disclosures.length
    ? `آخر إفصاح متاح: ${disclosures[0]?.title}.`
    : "لا توجد إفصاحات حديثة ضمن اللقطة.";

  return [
    `الاتجاه المصنف هو: ${trend}.`,
    missingPerformance,
    `نمو الإيرادات: ${financials.revenueGrowth.display}، ونمو صافي الربح: ${financials.netProfitGrowth.display}.`,
    disclosureNote,
  ].join(" ");
}

function buildFinancialPosition({ financials }: AnalysisInput): string {
  const roe = financials.roe.display;
  const debt = financials.debtToEquity.display;
  const margin = financials.netMargin.display;
  const cash = financials.operatingCashFlow.display;

  return `تظهر المؤشرات المتاحة عائدًا على حقوق الملكية عند ${roe}، وهامش صافي ربح عند ${margin}، ومؤشر دين/حقوق ملكية عند ${debt}. التدفق النقدي التشغيلي المتاح: ${cash}.`;
}

function metric<T>(
  value: T | null,
  display: string,
  confidence: Confidence,
  note?: string,
): Metric<T> {
  return {
    value,
    display: display || unavailableText,
    source: analysisSource,
    confidence,
    note,
  };
}
