import type { MarketCode, StockConfig } from "@/config/stocks.config";

export type Confidence =
  | "موثوق جدًا"
  | "موثوق"
  | "يحتاج تحقق"
  | "غير متوفر";

export type SourceKind =
  | "سوق رسمي"
  | "إفصاح رسمي"
  | "تقرير مالي"
  | "علاقات المستثمرين"
  | "مصدر مالي ثانوي"
  | "تحليل استنتاجي"
  | "بيانات تجريبية"
  | "غير متوفر";

export type DataSource = {
  name: string;
  kind: SourceKind;
  url?: string;
  updatedAt?: string;
  official: boolean;
};

export type Metric<T> = {
  value: T | null;
  display: string;
  source: DataSource;
  confidence: Confidence;
  note?: string;
  isMock?: boolean;
};

export type TrendLabel =
  | "اتجاه إيجابي محتمل"
  | "اتجاه مستقر مائل للصعود"
  | "اتجاه محايد"
  | "اتجاه مستقر مائل للضغط"
  | "اتجاه سلبي يحتاج إلى متابعة"
  | "اتجاه متذبذب عالي المخاطر";

export type RiskLevel = "منخفض" | "متوسط" | "مرتفع" | "مرتفع جدًا";

export type DividendSustainability =
  | "استدامة مرتفعة"
  | "استدامة متوسطة"
  | "استدامة تحتاج إلى متابعة"
  | "توزيعات مرتفعة بمخاطر أعلى"
  | "غير قابل للتقييم بسبب نقص البيانات";

export type MarketQuote = {
  lastPrice: Metric<number>;
  dailyChange: Metric<number>;
  dailyChangePercent: Metric<number>;
  high: Metric<number>;
  low: Metric<number>;
  volume: Metric<number>;
  tradeValue: Metric<number>;
  trades: Metric<number>;
  marketCap: Metric<number>;
  lastSessionDate: Metric<string>;
  performanceWeek: Metric<number>;
  performanceMonth: Metric<number>;
  performanceThreeMonths: Metric<number>;
  performanceYtd: Metric<number>;
};

export type Financials = {
  pe: Metric<number>;
  eps: Metric<number>;
  epsGrowth: Metric<number>;
  roe: Metric<number>;
  netMargin: Metric<number>;
  revenue: Metric<string>;
  revenueGrowth: Metric<number>;
  netProfit: Metric<string>;
  netProfitGrowth: Metric<number>;
  operatingCashFlow: Metric<string>;
  freeCashFlow: Metric<string>;
  debtToEquity: Metric<number>;
  payoutRatio: Metric<number>;
  dividendYield: Metric<number>;
};

export type DividendEvent = {
  stockSymbol: string;
  market: MarketCode;
  amount: Metric<string>;
  yield: Metric<number>;
  announcementDate: Metric<string>;
  generalAssemblyDate: Metric<string>;
  lastEntitlementDate: Metric<string>;
  exDividendDate: Metric<string>;
  recordDate: Metric<string>;
  paymentDate: Metric<string>;
  type: Metric<string>;
  payoutRatio: Metric<number>;
  historicalComparison: Metric<string>;
  sustainability: DividendSustainability;
  source: DataSource;
};

export type Disclosure = {
  stockSymbol: string;
  title: string;
  date: string;
  url?: string;
  source: DataSource;
};

export type AnalystOpinion = {
  averageTarget: Metric<number>;
  highestTarget: Metric<number>;
  lowestTarget: Metric<number>;
  analystCount: Metric<number>;
  consensus: Metric<"إيجابي" | "محايد" | "سلبي">;
  rationale: Metric<string>;
  updatedAt: Metric<string>;
  source: DataSource;
  reliability: Confidence;
};

export type ChartPoint = {
  label: string;
  price?: number;
  volume?: number;
  tradeValue?: number;
  revenue?: number;
  netProfit?: number;
  dividend?: number;
  yield?: number;
  isMock?: boolean;
};

export type StockAnalysis = {
  trend: Metric<TrendLabel>;
  riskLevel: RiskLevel;
  dataConfidence: Confidence;
  score: number;
  tags: string[];
  quickAssessment: string[];
  strengths: string[];
  weaknesses: string[];
  risks: string[];
  highLevelSummary: string;
  threeMonthRationale: string;
  financialPosition: string;
  dividendSustainability: DividendSustainability;
};

export type StockSnapshot = {
  config: StockConfig;
  quote: MarketQuote;
  financials: Financials;
  dividends: DividendEvent[];
  disclosures: Disclosure[];
  analyst: AnalystOpinion;
  analysis: StockAnalysis;
  charts: {
    priceThreeMonths: ChartPoint[];
    liquidity: ChartPoint[];
    financials: ChartPoint[];
    dividends: ChartPoint[];
  };
};

export type MarketDataset = {
  generatedAt: string;
  lastOfficialSession: string;
  dataMode: "official-snapshot" | "mock-development" | "unavailable";
  dataWarning: string;
  stocks: StockSnapshot[];
};

export type AlertSeverity = "red" | "orange" | "yellow" | "blue" | "gray";

export type StockAlert = {
  stockSymbol: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  type:
    | "dividend"
    | "disclosure"
    | "price"
    | "volume"
    | "financials"
    | "analyst"
    | "classification"
    | "data"
    | "source-conflict";
};
