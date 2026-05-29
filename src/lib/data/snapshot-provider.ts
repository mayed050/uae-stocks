import "server-only";

import fs from "node:fs";
import path from "node:path";
import { stocksConfig } from "@/config/stocks.config";
import { buildStockAnalysis } from "@/lib/analysis/analysis-engine";
import { buildMockDividendHistory, buildMockPriceHistory } from "@/lib/data/mock-history";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
  formatPlainPercent,
  parseFirstNumber,
  parseGrowth,
  parseNumber,
  unavailableText,
} from "@/lib/format";
import type {
  AnalystOpinion,
  Confidence,
  DataSource,
  Disclosure,
  DividendEvent,
  DividendSustainability,
  Financials,
  MarketDataset,
  MarketQuote,
  Metric,
  StockSnapshot,
} from "@/lib/types";

type RawRecord = Record<string, unknown>;

type RawSnapshot = {
  today?: string;
  dfm_date?: string;
  dfm_url?: string;
  dfm_market?: Record<string, RawRecord>;
  dfm_ratios?: Record<string, RawRecord>;
  dfm_dividends?: Record<string, RawRecord>;
  adx_status?: RawRecord;
  adx_market?: Record<string, RawRecord>;
  adx_dividends?: Record<string, RawRecord[]>;
  disclosures?: Record<string, RawRecord>;
  fundamentals?: Record<string, RawRecord>;
};

const snapshotPath = path.resolve(process.cwd(), "..", "uae_dividend_watch_data_2026-05-27.json");

export function getMarketDataset(): MarketDataset {
  const raw = readSnapshot();
  const generatedAt = raw?.today ?? new Date().toISOString().slice(0, 10);
  const lastOfficialSession = raw
    ? `DFM: ${raw.dfm_date ?? unavailableText}، ADX: ${String(raw.adx_status?.systemTimestamp ?? unavailableText)}`
    : unavailableText;

  const stocks = stocksConfig.map((config) => {
    const quote = buildQuote(config.symbol, config.market, raw);
    const financials = buildFinancials(config.symbol, config.market, raw);
    const disclosures = buildDisclosures(config.symbol, config.market, raw);
    const analyst = buildUnavailableAnalyst();
    const dividends = buildDividends(config.symbol, config.market, raw, quote, financials);

    const analysis = buildStockAnalysis({
      config,
      quote,
      financials,
      dividends,
      disclosures,
      analyst,
    });

    const dividendSustainability = analysis.dividendSustainability;

    return {
      config,
      quote,
      financials,
      dividends: dividends.map((dividend) => ({
        ...dividend,
        sustainability: dividendSustainability,
      })),
      disclosures,
      analyst,
      analysis,
      charts: {
        priceThreeMonths: buildMockPriceHistory(
          config.symbol,
          quote.lastPrice.value,
          quote.dailyChangePercent.value,
        ),
        liquidity: [
          {
            label: "الحجم",
            volume: quote.volume.value ?? undefined,
          },
          {
            label: "قيمة التداول",
            tradeValue: quote.tradeValue.value ?? undefined,
          },
        ],
        financials: [
          {
            label: "آخر 12 شهر",
            revenue: parseMoneyText(financials.revenue.value),
            netProfit: parseMoneyText(financials.netProfit.value),
          },
        ],
        dividends: buildMockDividendHistory(config.symbol, financials.dividendYield.value),
      },
    } satisfies StockSnapshot;
  });

  return {
    generatedAt,
    lastOfficialSession,
    dataMode: raw ? "official-snapshot" : "unavailable",
    dataWarning: raw
      ? "تعتمد الأسعار والتداول والإفصاحات والتوزيعات على لقطة محلية بتاريخ 27/05/2026. بيانات الرسوم التاريخية المعلمة هي: بيانات تجريبية لغرض التطوير وليست بيانات سوق فعلية."
      : "غير متوفر من المصدر الرسمي. لم يتم العثور على ملف اللقطة المحلي.",
    stocks,
  };
}

export function getStockSnapshot(symbol: string): StockSnapshot | undefined {
  return getMarketDataset().stocks.find((stock) => stock.config.symbol === symbol.toUpperCase());
}

function readSnapshot(): RawSnapshot | null {
  try {
    const content = fs.readFileSync(snapshotPath, "utf8");
    return JSON.parse(content) as RawSnapshot;
  } catch {
    return null;
  }
}

function buildQuote(symbol: string, market: "DFM" | "ADX", raw: RawSnapshot | null): MarketQuote {
  if (!raw) return unavailableQuote();

  if (market === "DFM") {
    const record = raw.dfm_market?.[symbol];
    const source = sourceOf("DFM Daily Bulletin", "سوق رسمي", true, raw.dfm_url, raw.dfm_date);
    const date = normalizeDate(record?.["Last Date"] ?? raw.dfm_date);

    return {
      lastPrice: numericMetric(parseNumber(record?.["Current Close"] ?? record?.["Last Price"]), source, "موثوق جدًا", formatNumber),
      dailyChange: numericMetric(parseNumber(record?.["Change (AED)"]), source, "موثوق جدًا", formatNumber),
      dailyChangePercent: numericMetric(parseNumber(record?.["Change %"]) ?? 0, source, "موثوق جدًا", formatPercent),
      high: numericMetric(parseNumber(record?.High), source, "موثوق جدًا", formatNumber),
      low: numericMetric(parseNumber(record?.Low), source, "موثوق جدًا", formatNumber),
      volume: numericMetric(parseNumber(record?.["Trade Volume"]), source, "موثوق جدًا", formatCompactNumber),
      tradeValue: numericMetric(parseNumber(record?.["Trade Value"]), source, "موثوق جدًا", formatCurrency),
      trades: numericMetric(parseNumber(record?.["No. of Trades"]), source, "موثوق جدًا", formatNumber),
      marketCap: numericMetric(parseNumber(record?.["Market Capitalization"]), source, "موثوق جدًا", formatCurrency),
      lastSessionDate: textMetric(date, formatDate(date), source, "موثوق جدًا"),
      performanceWeek: unavailableMetric<number>("لا تتوفر سلسلة أسبوعية رسمية داخل اللقطة الحالية."),
      performanceMonth: unavailableMetric<number>("لا يتوفر أداء شهر رسمي داخل اللقطة الحالية."),
      performanceThreeMonths: unavailableMetric<number>("لا يتوفر أداء ثلاثة أشهر رسمي داخل اللقطة الحالية."),
      performanceYtd: unavailableMetric<number>("لا يتوفر أداء منذ بداية السنة رسمي داخل اللقطة الحالية."),
    };
  }

  const record = raw.adx_market?.[symbol];
  const source = sourceOf(
    "ADX Market Watch",
    "سوق رسمي",
    true,
    `https://www.adx.ae/en/main-market/company-profile/overview?symbols=${symbol}`,
    String(raw.adx_status?.systemTimestamp ?? raw.today ?? ""),
  );
  const sessionDate = normalizeDate(raw.adx_status?.systemTimestamp ?? raw.today);

  return {
    lastPrice: numericMetric(parseNumber(record?.last ?? record?.price), source, "موثوق جدًا", formatNumber),
    dailyChange: numericMetric(parseNumber(record?.changePrice), source, "موثوق جدًا", formatNumber),
    dailyChangePercent: numericMetric(parseNumber(record?.change) ?? 0, source, "موثوق جدًا", formatPercent),
    high: numericMetric(parseNumber(record?.high), source, "موثوق جدًا", formatNumber),
    low: numericMetric(parseNumber(record?.low), source, "موثوق جدًا", formatNumber),
    volume: numericMetric(parseNumber(record?.volume), source, "موثوق جدًا", formatCompactNumber),
    tradeValue: numericMetric(parseNumber(record?.value), source, "موثوق جدًا", formatCurrency),
    trades: numericMetric(parseNumber(record?.trades), source, "موثوق جدًا", formatNumber),
    marketCap: numericMetric(parseNumber(record?.marketCap), source, "موثوق جدًا", formatCurrency),
    lastSessionDate: textMetric(sessionDate, formatDate(sessionDate), source, "موثوق جدًا"),
    performanceWeek: unavailableMetric<number>("لا تتوفر سلسلة أسبوعية رسمية داخل اللقطة الحالية."),
    performanceMonth: unavailableMetric<number>("لا يتوفر أداء شهر رسمي داخل اللقطة الحالية."),
    performanceThreeMonths: unavailableMetric<number>("لا يتوفر أداء ثلاثة أشهر رسمي داخل اللقطة الحالية."),
    performanceYtd: unavailableMetric<number>("لا يتوفر أداء منذ بداية السنة رسمي داخل اللقطة الحالية."),
  };
}

function buildFinancials(symbol: string, market: "DFM" | "ADX", raw: RawSnapshot | null): Financials {
  const ratios = raw?.dfm_ratios?.[symbol];
  const fundamentals = raw?.fundamentals?.[symbol];
  const dfmRatioSource = sourceOf("DFM Ratios", "سوق رسمي", true, raw?.dfm_url, raw?.dfm_date);
  const secondarySource = sourceOf(
    "StockAnalysis",
    "مصدر مالي ثانوي",
    false,
    String(fundamentals?.url ?? ""),
    raw?.today,
  );
  const unavailable = unavailableMetric<number>();

  const peValue =
    market === "DFM"
      ? parseNumber(ratios?.["P/E Ratio"]) ?? parseNumber(fundamentals?.pe)
      : parseNumber(fundamentals?.pe);
  const peSource = market === "DFM" && parseNumber(ratios?.["P/E Ratio"]) !== null ? dfmRatioSource : secondarySource;
  const peConfidence: Confidence = peSource.official ? "موثوق جدًا" : "يحتاج تحقق";

  const epsValue = parseFirstNumber(fundamentals?.eps);
  const roeValue = parseNumber(fundamentals?.roe);
  const revenueGrowth = parseGrowth(fundamentals?.revenue);
  const netProfitGrowth = parseGrowth(fundamentals?.net_income);
  const revenueValue = cleanMoneyDisplay(fundamentals?.revenue);
  const netProfitValue = cleanMoneyDisplay(fundamentals?.net_income);
  const netMargin = calculateNetMargin(revenueValue, netProfitValue);

  const dfmYield = parseNumber(ratios?.["Dividend Yield Ratio"]);
  const secondaryYield = parseParenthesizedPercent(fundamentals?.dividend);
  const dividendYieldValue = market === "DFM" ? dfmYield ?? secondaryYield : secondaryYield;
  const dividendYieldSource = market === "DFM" && dfmYield !== null ? dfmRatioSource : secondarySource;

  return {
    pe: numericMetric(peValue, peSource, peConfidence, formatNumber),
    eps: numericMetric(epsValue, secondarySource, epsValue === null ? "غير متوفر" : "يحتاج تحقق", formatNumber),
    epsGrowth: numericMetric(parseGrowth(fundamentals?.eps), secondarySource, "يحتاج تحقق", formatPercent),
    roe: numericMetric(roeValue, secondarySource, roeValue === null ? "غير متوفر" : "يحتاج تحقق", formatPlainPercent),
    netMargin: netMargin === null ? unavailable : numericMetric(netMargin, secondarySource, "يحتاج تحقق", formatPlainPercent),
    revenue: textMetric(revenueValue, revenueValue || unavailableText, secondarySource, revenueValue ? "يحتاج تحقق" : "غير متوفر"),
    revenueGrowth: numericMetric(revenueGrowth, secondarySource, revenueGrowth === null ? "غير متوفر" : "يحتاج تحقق", formatPercent),
    netProfit: textMetric(netProfitValue, netProfitValue || unavailableText, secondarySource, netProfitValue ? "يحتاج تحقق" : "غير متوفر"),
    netProfitGrowth: numericMetric(netProfitGrowth, secondarySource, netProfitGrowth === null ? "غير متوفر" : "يحتاج تحقق", formatPercent),
    operatingCashFlow: textMetric(cleanMillionDisplay(fundamentals?.operating_cash_flow), cleanMillionDisplay(fundamentals?.operating_cash_flow) || unavailableText, secondarySource, fundamentals?.operating_cash_flow ? "يحتاج تحقق" : "غير متوفر"),
    freeCashFlow: textMetric(cleanMillionDisplay(fundamentals?.free_cash_flow), cleanMillionDisplay(fundamentals?.free_cash_flow) || unavailableText, secondarySource, fundamentals?.free_cash_flow ? "يحتاج تحقق" : "غير متوفر"),
    debtToEquity: numericMetric(parseNumber(fundamentals?.debt_equity), secondarySource, parseNumber(fundamentals?.debt_equity) === null ? "غير متوفر" : "يحتاج تحقق", formatNumber),
    payoutRatio: numericMetric(parseNumber(fundamentals?.payout_ratio), secondarySource, parseNumber(fundamentals?.payout_ratio) === null ? "غير متوفر" : "يحتاج تحقق", formatPlainPercent),
    dividendYield: numericMetric(
      dividendYieldValue,
      dividendYieldSource,
      dividendYieldValue === null ? "غير متوفر" : dividendYieldSource.official ? "موثوق جدًا" : "يحتاج تحقق",
      formatPlainPercent,
    ),
  };
}

function buildDividends(
  symbol: string,
  market: "DFM" | "ADX",
  raw: RawSnapshot | null,
  quote: MarketQuote,
  financials: Financials,
): DividendEvent[] {
  if (!raw) return [];

  if (market === "DFM") {
    const record = raw.dfm_dividends?.[symbol];
    if (!record) return [];

    const source = sourceOf(
      "DFM Dividends Distribution Summary",
      "سوق رسمي",
      true,
      "https://www.dfm.ae/en/investing/services/dividends-distribution-summary",
      raw.today,
    );

    return [
      {
        stockSymbol: symbol,
        market,
        amount: textMetric(String(record.Dividend ?? ""), String(record.Dividend ?? unavailableText), source, "موثوق جدًا"),
        yield: financials.dividendYield,
        announcementDate: unavailableMetric<string>("تاريخ إعلان التوزيع غير مفصول في جدول DFM داخل اللقطة."),
        generalAssemblyDate: dateMetric(record["AGM Date"], source),
        lastEntitlementDate: dateMetric(record["Entitlement Date"], source),
        exDividendDate: dateMetric(record["X-Dividend Date"], source),
        recordDate: dateMetric(record["Settlement Date"], source),
        paymentDate: dateMetric(record["Payment Date"], source),
        type: textMetric("نقدي", "نقدي", source, "موثوق جدًا"),
        payoutRatio: financials.payoutRatio,
        historicalComparison: unavailableMetric<string>("المقارنة التاريخية غير متوفرة من المصدر الرسمي داخل اللقطة."),
        sustainability: "غير قابل للتقييم بسبب نقص البيانات",
        source,
      },
    ];
  }

  const records = raw.adx_dividends?.[symbol] ?? [];
  const source = sourceOf("ADX Cash Dividend Summary", "سوق رسمي", true, "https://www.adx.ae/en/market-summary/cash-dividends", raw.today);

  return records.map((record) => {
    const amountValue = parseNumber(record.DividendPerShare);
    const price = quote.lastPrice.value;
    const calculatedYield =
      amountValue !== null && price !== null && price > 0
        ? Number(((amountValue / price) * 100).toFixed(2))
        : null;
    const yieldSource = sourceOf("حساب داخلي من ADX", "تحليل استنتاجي", false, String(record.NewURL ?? ""), raw.today);

    return {
      stockSymbol: symbol,
      market,
      amount: textMetric(
        amountValue === null ? null : `${amountValue} د.إ/سهم`,
        amountValue === null ? unavailableText : `${formatNumber(amountValue)} د.إ/سهم`,
        source,
        amountValue === null ? "غير متوفر" : "موثوق جدًا",
      ),
      yield: numericMetric(calculatedYield, yieldSource, calculatedYield === null ? "غير متوفر" : "موثوق", formatPlainPercent),
      announcementDate: unavailableMetric<string>("تاريخ إعلان التوزيع غير مفصول في ملخص ADX داخل اللقطة."),
      generalAssemblyDate: dateMetric(record.MeetingDate, source),
      lastEntitlementDate: dateMetric(record.LastDate, source),
      exDividendDate: dateMetric(record.ExDate, source),
      recordDate: dateMetric(record.RegistryDate, source),
      paymentDate: dateMetric(record.PaymentDate, source),
      type: textMetric("نقدي", "نقدي", source, "موثوق جدًا"),
      payoutRatio: financials.payoutRatio,
      historicalComparison: unavailableMetric<string>("المقارنة التاريخية غير متوفرة من المصدر الرسمي داخل اللقطة."),
      sustainability: "غير قابل للتقييم بسبب نقص البيانات" as DividendSustainability,
      source,
    };
  });
}

function buildDisclosures(symbol: string, market: "DFM" | "ADX", raw: RawSnapshot | null): Disclosure[] {
  const record = raw?.disclosures?.[symbol];
  if (!record) return [];

  const date = normalizeDate(record.date);
  const source = sourceOf(
    market === "DFM" ? "DFM Efsah" : "ADX Disclosures",
    "إفصاح رسمي",
    true,
    String(record.url ?? ""),
    date,
  );

  return [
    {
      stockSymbol: symbol,
      title: String(record.title ?? unavailableText),
      date,
      url: String(record.url ?? ""),
      source,
    },
  ];
}

function buildUnavailableAnalyst(): AnalystOpinion {
  const source = sourceOf("غير متوفر من المصدر الرسمي", "غير متوفر", false);

  return {
    averageTarget: unavailableMetric<number>("متوسط السعر المستهدف غير متوفر من المصدر الرسمي."),
    highestTarget: unavailableMetric<number>("أعلى سعر مستهدف غير متوفر من المصدر الرسمي."),
    lowestTarget: unavailableMetric<number>("أدنى سعر مستهدف غير متوفر من المصدر الرسمي."),
    analystCount: unavailableMetric<number>("عدد المحللين غير متوفر من المصدر الرسمي."),
    consensus: unavailableMetric<"إيجابي" | "محايد" | "سلبي">("اتجاه آراء المحللين غير متوفر من المصدر الرسمي."),
    rationale: unavailableMetric<string>("ملخص أسباب الرأي غير متوفر من المصدر الرسمي."),
    updatedAt: unavailableMetric<string>("تاريخ تحديث آراء المحللين غير متوفر من المصدر الرسمي."),
    source,
    reliability: "غير متوفر",
  };
}

function unavailableQuote(): MarketQuote {
  return {
    lastPrice: unavailableMetric<number>(),
    dailyChange: unavailableMetric<number>(),
    dailyChangePercent: unavailableMetric<number>(),
    high: unavailableMetric<number>(),
    low: unavailableMetric<number>(),
    volume: unavailableMetric<number>(),
    tradeValue: unavailableMetric<number>(),
    trades: unavailableMetric<number>(),
    marketCap: unavailableMetric<number>(),
    lastSessionDate: unavailableMetric<string>(),
    performanceWeek: unavailableMetric<number>(),
    performanceMonth: unavailableMetric<number>(),
    performanceThreeMonths: unavailableMetric<number>(),
    performanceYtd: unavailableMetric<number>(),
  };
}

function numericMetric(
  value: number | null,
  source: DataSource,
  confidence: Confidence,
  formatter: (value: number | null | undefined) => string,
): Metric<number> {
  return {
    value,
    display: formatter(value),
    source,
    confidence: value === null ? "غير متوفر" : confidence,
  };
}

function textMetric<T extends string>(
  value: T | null,
  display: string,
  source: DataSource,
  confidence: Confidence,
): Metric<T> {
  return {
    value,
    display: display || unavailableText,
    source,
    confidence: value ? confidence : "غير متوفر",
  };
}

function unavailableMetric<T>(note?: string): Metric<T> {
  return {
    value: null,
    display: unavailableText,
    source: sourceOf("غير متوفر من المصدر الرسمي", "غير متوفر", false),
    confidence: "غير متوفر",
    note,
  };
}

function dateMetric(value: unknown, source: DataSource): Metric<string> {
  const normalized = normalizeDate(value);
  return textMetric(normalized, formatDate(normalized), source, normalized ? "موثوق جدًا" : "غير متوفر");
}

function sourceOf(
  name: string,
  kind: DataSource["kind"],
  official: boolean,
  url?: string,
  updatedAt?: string,
): DataSource {
  return {
    name,
    kind,
    url: url || undefined,
    updatedAt: updatedAt || undefined,
    official,
  };
}

function normalizeDate(value: unknown): string {
  const text = String(value ?? "").trim();
  if (!text) return "";

  const dmy = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) {
    const [, day, month, year] = dmy;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const iso = text.match(/^(\d{4}-\d{2}-\d{2})/);
  if (iso) return iso[1];

  const parsed = new Date(text.replace(" ", "T"));
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  const parsedLoose = new Date(text);
  if (!Number.isNaN(parsedLoose.getTime())) {
    return parsedLoose.toISOString().slice(0, 10);
  }

  return text;
}

function formatCompactNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return unavailableText;

  return new Intl.NumberFormat("ar-AE", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

function parseParenthesizedPercent(value: unknown): number | null {
  const match = String(value ?? "").match(/\(([-+]?\d+(?:\.\d+)?)%\)/);
  return match ? parseNumber(match[1]) : null;
}

function cleanMoneyDisplay(value: unknown): string {
  const text = String(value ?? "").trim();
  if (!text || text === "-" || text.toLowerCase() === "n/a") return "";

  return `${text.replace(/\s+/g, " ")} د.إ`;
}

function cleanMillionDisplay(value: unknown): string {
  const text = String(value ?? "").trim();
  if (!text || text === "-" || text.toLowerCase() === "n/a") return "";

  return `${text} مليون د.إ`;
}

function parseMoneyText(value: string | null): number | undefined {
  if (!value) return undefined;

  const number = parseFirstNumber(value);
  if (number === null) return undefined;

  const upper = value.toUpperCase();
  if (upper.includes("B")) return number;
  if (upper.includes("M")) return Number((number / 1000).toFixed(2));
  return number;
}

function parseMoneyAmount(value: string | null): number | null {
  if (!value) return null;

  const number = parseFirstNumber(value);
  if (number === null) return null;

  const upper = value.toUpperCase();
  if (upper.includes("B")) return number * 1_000_000_000;
  if (upper.includes("M")) return number * 1_000_000;
  return number;
}

function calculateNetMargin(revenue: string, netProfit: string): number | null {
  const revenueAmount = parseMoneyAmount(revenue);
  const profitAmount = parseMoneyAmount(netProfit);

  if (revenueAmount === null || profitAmount === null || revenueAmount === 0) return null;
  return Number(((profitAmount / revenueAmount) * 100).toFixed(2));
}
