import { stocksConfig } from "@/config/stocks.config";
import type { AnalystTarget, DividendPoint, HistoricalPoint, StockRecord, Swot } from "@/types";

type StockSeed = Pick<StockRecord, "symbol" | "prices" | "fundamentals" | "dividend">;

const modelSource =
  "نطاقات القيمة والسلاسل التاريخية الممتدة مشتقة داخليا من لقطة 2026-05-27، وليست تغطية محللين أو أسعارا حية.";

const seeds: StockSeed[] = [
  {
    symbol: "DEWA",
    prices: price(2.61, 2.62, -0.01, -0.382, 2.67, 2.61, 3.15, 2.55, 38_370_441, 100_503_069.89, 1_631, 130_500_000_000, "2026-05-25"),
    fundamentals: fund(14.91, 0.18, 27.5, 10.18, 26.25, 33.33, 7.0, 8.75, 27.5, 21_887, 11_240, 0.47, 70.83, 4.75),
    dividend: div(0.062, 0.12, 4.75, "2026-04-09", "2026-04-10", "2026-04-20", 70.83),
  },
  {
    symbol: "SALIK",
    prices: price(5.35, 5.45, -0.1, -1.835, 5.65, 5.35, 6.96, 4.96, 24_853_429, 133_956_144.77, 1_512, 40_125_000_000, "2026-05-25"),
    fundamentals: fund(25.85, 0.21, 23.4, 101.89, 50.49, 3.07, 23.9, 1.55, 23.4, 2_092, 2_091, 2.52, 89.61, 4.14),
    dividend: div(0.118712, 0.22, 4.14, "2026-04-16", "2026-04-17", "2026-04-27", 89.61),
  },
  {
    symbol: "TALABAT",
    prices: price(1.1, 0.976, 0.124, 12.705, 1.12, 1.0, 1.49, 0.627, 280_738_624, 302_766_620.08, 3_749, 25_617_064_687.5, "2026-05-25"),
    fundamentals: fund(15.18, 0.07, 19.4, 13.5, 11.84, 13.6, 84.8, 1.61, 13.8, 673.46, 631.73, 0.22, 53.51, 6.01),
    dividend: div(0.07, 0.07, 6.01, "2026-04-21", "2026-04-22", "2026-05-12", 53.51),
  },
  {
    symbol: "DIB",
    prices: price(7.4, 7.32, 0.08, 1.093, 7.65, 7.4, 10.2, 6.97, 11_213_747, 83_970_162.61, 1_041, 53_581_508_389.8, "2026-05-25"),
    fundamentals: fund(7.5, 0.99, -6.9, 15.11, 55.36, 12.88, 1.4, 7.13, -7.5, -43_601, -43_997, 0.39, 4.39, 4.73),
    dividend: div(0.35, 0.35, 4.73, "2026-04-09", "2026-04-10", "2026-04-16", 4.39),
  },
  {
    symbol: "EMIRATESNBD",
    prices: price(27.62, 27.62, 0, 0, 28.72, 27.62, 37.4, 20.6, 5_706_603, 158_945_731.58, 1_875, 174_464_443_747.86, "2026-05-25"),
    fundamentals: fund(7.37, 3.75, 7.6, 17.84, 48.18, 49.09, 9.3, 23.65, 7.5, -151_918, -152_617, 1.26, 28.24, 3.62),
    dividend: div(1, 1, 3.62, "2026-02-25", "2026-02-26", "2026-03-02", 28.24),
  },
  {
    symbol: "DU",
    prices: price(11.2, 11.28, -0.08, -0.709, 11.5, 11.2, 11.6, 8.31, 3_556_204, 40_093_268.38, 686, 50_768_547_076.8, "2026-05-25"),
    fundamentals: fund(16.83, 0.67, 15.7, 33.1, 18.68, 16.17, 8.5, 3.02, 15.7, 5_583, 3_514, 0.2, 87.15, 5.71),
    dividend: div(0.4, 0.64, 5.71, "2026-04-07", "2026-04-08", "2026-04-29", 87.15),
  },
  {
    symbol: "EMPOWER",
    prices: price(1.59, 1.59, 0, 0, 1.62, 1.58, 1.96, 1.48, 3_883_358, 6_189_177.97, 336, 15_900_000_000, "2026-05-25"),
    fundamentals: fund(15.04, 0.11, 20.6, 33.63, 30.2, 3.51, 7.1, 1.06, 20.7, 1_893, 1_431, 1.68, 82.75, 5.5),
    dividend: div(0.0875, 0.09, 5.5, "2026-04-02", "2026-04-03", "2026-04-23", 82.75),
  },
  {
    symbol: "EMAAR",
    prices: price(11.78, 11.48, 0.3, 2.613, 11.98, 11.7, 17.26, 10.16, 47_967_512, 566_324_607.2, 3_548, 104_120_944_421.22, "2026-05-25"),
    fundamentals: fund(5.5, 2.14, 32.2, 24.73, 36.43, 51.86, 33.4, 18.89, 32.1, 31_973, 30_982, 0.1, 59.19, 8.49),
    dividend: div(1, 1, 8.49, "2026-04-02", "2026-04-03", "2026-04-22", 59.19),
  },
  {
    symbol: "TECOM",
    prices: price(3.3, 3.27, 0.03, 0.917, 3.41, 3.3, 4.15, 2.89, 241_450, 800_562.44, 102, 16_500_000_000, "2026-05-25"),
    fundamentals: fund(7.75, 0.43, 64.1, 29.41, 72.7, 2.93, 16.5, 2.13, 64.1, 2_021, 1_335, 0.71, 39.46, 5.45),
    dividend: div(0.088, 0.18, 5.45, "2026-03-17", "2026-03-18", "2026-03-27", 39.46),
  },
  {
    symbol: "NMDCENR",
    prices: price(2.97, 2.83, 0.14, 4.947, 2.97, 2.85, 3.33, 2.2, 4_591_502, 13_523_082.93, 206, 14_850_000_000, "2026-05-27"),
    fundamentals: fund(10.14, 0.29, 1.2, 28.82, 7.34, 19.89, 24, 1.46, 1.2, 2_264, 1_690, 0.15, 54.67, 5.39),
    dividend: div(0.16005, 0.16, 5.39, "2026-03-11", "2026-03-12", "2026-04-02", 54.67),
  },
  {
    symbol: "EAND",
    prices: price(18.04, 18.48, -0.44, -2.381, 18.74, 18.04, 20.95, 15.4, 19_242_464, 348_516_615.58, 1_583, 156_889_442_160, "2026-05-27"),
    fundamentals: fund(13.2, 1.37, -13.7, 23.44, 15.77, 75.41, 21.9, 11.89, -13.7, 29_081, 20_350, 1.21, 68.1, 5.21),
    dividend: div(0.47, 0.94, 5.21, "2026-04-07", "2026-04-08", "2026-04-23", 68.1),
  },
  {
    symbol: "ADNOCDIST",
    prices: price(3.93, 3.85, 0.08, 2.078, 3.95, 3.85, 4.14, 3.08, 19_564_733, 76_791_608.6, 820, 49_125_000_000, "2026-05-27"),
    fundamentals: fund(16.79, 0.23, 16.6, 110.41, 8.08, 36.26, 3.1, 2.93, 16.6, 3_931, 2_864, 2.42, 88.83, 5.23),
    dividend: div(0.051425, 0.21, 5.23, "2026-05-20", "2026-05-21", "2026-06-09", 88.83),
  },
  {
    symbol: "ADNOCGAS",
    prices: price(3.43, 3.35, 0.08, 2.388, 3.43, 3.32, 3.95, 2.85, 116_074_678, 397_138_890.1, 1_521, 263_257_377_501, "2026-05-27"),
    fundamentals: fund(14.4, 0.24, -2.1, 20.18, 27.84, 65.66, -6.8, 18.28, -2.1, 6_091, 2_568, 0, 88.31, 5.23),
    dividend: div(0.045, 0.18, 5.23, "2026-05-19", "2026-05-20", "2026-06-05", 88.31),
  },
  {
    symbol: "ADNOCDRILL",
    prices: price(5.96, 5.96, 0, 0, 6.03, 5.94, 6.35, 4.1, 50_237_200, 299_479_822.85, 1_366, 95_360_000_000, "2026-05-27"),
    fundamentals: fund(17.83, 0.33, 6.2, 35.49, 29.31, 18.22, 14.9, 5.34, 6, 2_145, 1_339, 0.47, 71.79, 4.04),
    dividend: div(0.060252, 0.24, 4.04, "2026-05-14", "2026-05-15", "2026-06-06", 71.79),
  },
  {
    symbol: "FAB",
    prices: price(16.8, 16.92, -0.12, -0.709, 17.24, 16.8, 17.76, 12.9, 15_570_599, 262_190_048.26, 1_147, 185_599_893_158, "2026-05-27"),
    fundamentals: fund(9.12, 1.84, 17.4, 15.75, 60.63, 33.55, 16.3, 20.34, 16.5, -20_112, -21_000, 1.82, 42.85, 4.76),
    dividend: div(0.8, 0.8, 4.76, "2026-03-17", "2026-03-18", "2026-04-10", 42.85),
  },
  {
    symbol: "ADCB",
    prices: price(13.7, 13.42, 0.28, 2.086, 13.88, 13.56, 14.35, 9.95, 15_693_492, 215_153_711.84, 1_429, 108_396_807_227, "2026-05-27"),
    fundamentals: fund(8.89, 1.54, 27.6, 15.48, 58.67, 20.01, 16.8, 11.74, 27.1, -56_460, -56_458, 1.66, 45.35, 4.6),
    dividend: div(0.63, 0.63, 4.6, "2026-03-11", "2026-03-12", "2026-04-02", 45.35),
  },
  {
    symbol: "ADIB",
    prices: price(20.46, 19.52, 0.94, 4.816, 20.46, 20.2, 21.3, 14.2, 7_177_811, 146_595_957.34, 1_427, 74_310_720_000, "2026-05-27"),
    fundamentals: fund(11.54, 1.77, 13.3, 25.21, 54.07, 11.91, 14.8, 6.44, 12.2, -43_131, -43_417, 0.21, 56.99, 4.74),
    dividend: div(0.9705, 0.97, 4.74, "2026-03-12", "2026-03-13", "2026-04-03", 56.99),
  },
  {
    symbol: "ADNIC",
    prices: price(7.4, 7.4, 0, 0, 7.41, 7.38, 8.1, 5.75, 4_438, 32_804.71, 7, 4_218_000_000, "2026-05-27"),
    fundamentals: fund(9.32, 0.79, 4.6, 12.99, 4.24, 10.66, -13.2, 0.45252, 4.6, 226.64, 199.15, 0.18, 59.2, 6.35),
    dividend: div(0.47, 0.47, 6.35, "2026-03-17", "2026-03-18", "2026-04-09", 59.2),
  },
];

export const stocksData: StockRecord[] = seeds.map(createStock);

export const DATASET_INFO = {
  brandAr: "إماراتي كابيتال",
  brandEn: "Emirati Capital",
  snapshotDate: "2026-05-27",
  dfmSessionDate: "2026-05-25",
  adxSessionDate: "2026-05-27",
  mode: "لقطة ثابتة وليست أسعارا حية",
  disclaimer:
    "المعلومات المعروضة لأغراض المتابعة والتعليم فقط، ولا تعد توصية شراء أو بيع أو دعوة لاتخاذ قرار استثماري.",
};

export function getStockBySymbol(symbol: string): StockRecord | undefined {
  return stocksData.find((stock) => stock.symbol === symbol.toUpperCase());
}

export function getSectors() {
  return Array.from(new Set(stocksData.map((stock) => stock.sector)));
}

function price(
  last: number,
  previousClose: number,
  change: number,
  changePercent: number,
  high: number,
  low: number,
  high52: number,
  low52: number,
  volume: number,
  tradeValue: number,
  trades: number,
  marketCap: number,
  lastUpdated: string,
): StockRecord["prices"] {
  return { last, previousClose, change, changePercent, high, low, high52, low52, volume, tradeValue, trades, marketCap, lastUpdated };
}

function fund(
  pe: number,
  eps: number,
  epsGrowth: number,
  roe: number,
  netMargin: number,
  revenueBn: number,
  revenueGrowth: number,
  netProfitBn: number,
  netProfitGrowth: number,
  operatingCashFlowMn: number,
  freeCashFlowMn: number,
  debtToEquity: number,
  payoutRatio: number,
  dividendYield: number,
): StockRecord["fundamentals"] {
  return {
    pe,
    eps,
    epsGrowth,
    roe,
    netMargin,
    revenueAED: revenueBn * 1_000_000_000,
    revenueDisplay: `${revenueBn.toLocaleString("en-US", { maximumFractionDigits: 2 })}B AED`,
    revenueGrowth,
    netProfitAED: netProfitBn * 1_000_000_000,
    netProfitDisplay: `${netProfitBn.toLocaleString("en-US", { maximumFractionDigits: 2 })}B AED`,
    netProfitGrowth,
    operatingCashFlowAED: operatingCashFlowMn * 1_000_000,
    freeCashFlowAED: freeCashFlowMn * 1_000_000,
    debtToEquity,
    payoutRatio,
    dividendYield,
  };
}

function div(
  lastAmount: number,
  annualDividend: number,
  yieldPercent: number,
  entitlementDate: string,
  exDate: string,
  paymentDate: string,
  payoutRatio: number,
): StockRecord["dividend"] {
  return { lastAmount, annualDividend, yieldPercent, entitlementDate, exDate, paymentDate, payoutRatio };
}

function createStock(seed: StockSeed): StockRecord {
  const config = stocksConfig.find((stock) => stock.symbol === seed.symbol);
  if (!config) {
    throw new Error(`Missing stock config for ${seed.symbol}`);
  }

  const base: Omit<StockRecord, "historicalPrices" | "historicalDividends" | "swot" | "modelTarget" | "sourceLabels"> = {
    ...config,
    prices: seed.prices,
    fundamentals: seed.fundamentals,
    dividend: seed.dividend,
  };

  const withHistory = {
    ...base,
    historicalPrices: buildPriceHistory(seed),
    historicalDividends: buildDividendHistory(seed),
    sourceLabels: [
      `${config.market} snapshot ${seed.prices.lastUpdated}`,
      "Fundamentals snapshot from local 2026-05-27 dataset",
      modelSource,
    ],
  };

  const modelTarget = buildModelTarget(withHistory);
  const swot = buildSwot(withHistory);

  return {
    ...withHistory,
    swot,
    modelTarget,
  };
}

function buildPriceHistory(seed: StockSeed): HistoricalPoint[] {
  const labels = ["يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر", "يناير", "فبراير", "مارس", "أبريل", "مايو"];
  const baseDate = new Date(Date.UTC(2025, 5, 1));
  const codeSeed = seed.symbol.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const trend = clamp((seed.fundamentals.revenueGrowth + seed.fundamentals.netProfitGrowth + seed.prices.changePercent) / 300, -0.12, 0.16);
  const range = Math.max(seed.prices.high52 - seed.prices.low52, seed.prices.last * 0.08);

  return labels.map((label, index) => {
    const wave = Math.sin((index + codeSeed % 7) * 0.9) * range * 0.12;
    const drift = (index - (labels.length - 1)) * seed.prices.last * trend * 0.08;
    const rawPrice = index === labels.length - 1 ? seed.prices.last : seed.prices.last + wave + drift;
    const priceValue = clamp(rawPrice, seed.prices.low52, seed.prices.high52);
    const volumeWave = 0.78 + ((codeSeed + index * 17) % 41) / 100;
    const date = new Date(Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth() + index, 1)).toISOString().slice(0, 10);

    return {
      date,
      label,
      price: round(priceValue, 3),
      volume: Math.max(1, Math.round(seed.prices.volume * volumeWave)),
    };
  });
}

function buildDividendHistory(seed: StockSeed): DividendPoint[] {
  const exDate = new Date(`${seed.dividend.exDate}T00:00:00Z`);
  const paymentDate = new Date(`${seed.dividend.paymentDate}T00:00:00Z`);
  const growthBias = clamp(seed.fundamentals.netProfitGrowth / 100, -0.12, 0.18);

  return [2023, 2024, 2025, 2026].map((year, index) => {
    const scale = 0.86 + index * 0.045 + growthBias * 0.25;
    const amount = index === 3 ? seed.dividend.annualDividend : round(seed.dividend.annualDividend * scale, 4);
    const ex = new Date(Date.UTC(year, exDate.getUTCMonth(), exDate.getUTCDate())).toISOString().slice(0, 10);
    const payment = new Date(Date.UTC(year, paymentDate.getUTCMonth(), paymentDate.getUTCDate())).toISOString().slice(0, 10);

    return {
      fiscalYear: year,
      amount,
      yield: round((amount / seed.prices.last) * 100, 2),
      exDate: ex,
      paymentDate: payment,
      source: year === 2026 ? "رسمي" : "نموذج داخلي",
    };
  });
}

function buildModelTarget(stock: Omit<StockRecord, "modelTarget" | "swot">): AnalystTarget {
  const quality =
    (stock.fundamentals.roe - 12) * 0.24 +
    stock.fundamentals.revenueGrowth * 0.11 +
    stock.fundamentals.netProfitGrowth * 0.14 +
    (stock.fundamentals.dividendYield - 4) * 0.9 -
    Math.max(stock.fundamentals.pe - 18, 0) * 0.42 -
    Math.max(stock.fundamentals.payoutRatio - 82, 0) * 0.13 -
    Math.max(stock.fundamentals.debtToEquity - 1.5, 0) * 2;
  const impliedUpside = clamp(quality / 100, -0.16, 0.26);
  const base = round(stock.prices.last * (1 + impliedUpside), 2);
  const low = round(base * 0.88, 2);
  const high = round(base * 1.14, 2);

  return {
    low,
    base,
    high,
    upsidePercent: round(((base / stock.prices.last) - 1) * 100, 2),
    label: impliedUpside > 0.08 ? "نطاق قيمة داخلي" : impliedUpside < -0.05 ? "حذر" : "محايد",
    sourceNote: modelSource,
  };
}

function buildSwot(stock: Omit<StockRecord, "modelTarget" | "swot">): Swot {
  const strengths = [
    `تمركز واضح في قطاع ${stock.sector} مع قيمة سوقية ${formatCompactEnglish(stock.prices.marketCap)} درهم.`,
    stock.fundamentals.roe >= 18
      ? `عائد على حقوق الملكية قوي عند ${stock.fundamentals.roe.toFixed(2)}%.`
      : `ربحية حقوق ملكية قابلة للمتابعة عند ${stock.fundamentals.roe.toFixed(2)}%.`,
    stock.fundamentals.dividendYield >= 5
      ? `عائد نقدي جذاب عند ${stock.fundamentals.dividendYield.toFixed(2)}%.`
      : `سياسة توزيع موجودة مع عائد ${stock.fundamentals.dividendYield.toFixed(2)}%.`,
  ];

  const weaknesses = [
    stock.fundamentals.payoutRatio >= 82
      ? `نسبة توزيع مرتفعة عند ${stock.fundamentals.payoutRatio.toFixed(2)}% تقلل هامش الأمان.`
      : `نسبة التوزيع عند ${stock.fundamentals.payoutRatio.toFixed(2)}% تحتاج مراقبة مع تغير الأرباح.`,
    stock.fundamentals.debtToEquity >= 1.5
      ? `الرافعة المالية مرتفعة نسبيا عند ${stock.fundamentals.debtToEquity.toFixed(2)} مرة.`
      : `الحساسية التشغيلية لا تزال مرتبطة بدورة القطاع رغم رافعة مالية منضبطة.`,
    stock.prices.tradeValue < 5_000_000
      ? "سيولة التداول اليومية منخفضة، ما قد يزيد فجوة التنفيذ للمستثمر الفردي."
      : `حركة السهم اليومية ${stock.prices.changePercent.toFixed(2)}% وقد تزيد التذبذب قصير الأجل.`,
  ];

  return {
    strengths,
    weaknesses,
    opportunities: [
      sectorOpportunity(stock.sector),
      stock.fundamentals.revenueGrowth > 10
        ? `نمو الإيرادات ${stock.fundamentals.revenueGrowth.toFixed(1)}% يدعم توسع المضاعفات إذا استمر.`
        : "تحسن الهوامش أو تخفيض الإنفاق الرأسمالي قد يدعم القراءة القادمة.",
      "إعادة استثمار التوزيعات يمكن أن ترفع العائد التراكمي للمستثمر طويل الأجل.",
    ],
    threats: [
      sectorThreat(stock.sector),
      stock.fundamentals.netProfitGrowth < 0
        ? `تراجع صافي الربح ${Math.abs(stock.fundamentals.netProfitGrowth).toFixed(1)}% يضغط على الزخم.`
        : "أي تباطؤ مفاجئ في نمو الأرباح قد يضغط على التقييم.",
      "البيانات هنا لقطة ثابتة، وأي إفصاح لاحق قد يغير قراءة المخاطر.",
    ],
  };
}

function sectorOpportunity(sector: string): string {
  if (sector.includes("البنوك")) return "ارتفاع جودة الأصول ونمو الودائع منخفضة التكلفة يمكن أن يدعم ربحية القطاع المصرفي.";
  if (sector.includes("الطاقة") || sector.includes("الغاز")) return "العقود طويلة الأجل ومشاريع الطاقة الإقليمية تمنح فرصة لتحسن الرؤية التشغيلية.";
  if (sector.includes("العقار") || sector.includes("مناطق")) return "استمرار الطلب العقاري والإشغال التجاري في دبي قد يدعم التدفقات المتكررة.";
  if (sector.includes("الاتصالات")) return "الخدمات الرقمية والبيانات والمؤسسات توفر مسارات نمو خارج الصوت التقليدي.";
  if (sector.includes("التجارة")) return "توسع الطلبات الرقمية وتحسن اقتصاديات التوصيل قد يرفع جودة الأرباح.";
  return "تحسن الطلب المحلي والتشغيل الكفء يمكن أن يدعم الإيرادات والتدفقات النقدية.";
}

function sectorThreat(sector: string): string {
  if (sector.includes("البنوك")) return "تغير أسعار الفائدة أو تكلفة المخاطر قد يضغط على الهوامش وجودة الأصول.";
  if (sector.includes("الطاقة") || sector.includes("الغاز")) return "هبوط أسعار الطاقة أو تأخر المشاريع قد يضغط على الإيرادات والتدفقات.";
  if (sector.includes("العقار") || sector.includes("مناطق")) return "تباطؤ العقار أو ارتفاع الفائدة قد يؤثر في المبيعات والتقييم.";
  if (sector.includes("الاتصالات")) return "المنافسة التنظيمية والتسعيرية قد تحد من توسع الهوامش.";
  if (sector.includes("التأمين")) return "ارتفاع المطالبات أو ضعف عوائد الاستثمار قد يضغط على نتائج الاكتتاب.";
  return "التقلبات الاقتصادية والسيولة المنخفضة قد تزيد حساسية السعر قصير الأجل.";
}

function formatCompactEnglish(value: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(value);
}

function round(value: number, digits = 2): number {
  return Number(value.toFixed(digits));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
