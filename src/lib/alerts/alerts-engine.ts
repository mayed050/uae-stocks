import type { StockAlert, StockSnapshot } from "@/lib/types";

export function buildAlerts(stocks: StockSnapshot[], referenceDate: string): StockAlert[] {
  return stocks.flatMap((stock) => buildStockAlerts(stock, referenceDate));
}

export function buildStockAlerts(stock: StockSnapshot, referenceDate: string): StockAlert[] {
  const alerts: StockAlert[] = [];

  for (const dividend of stock.dividends) {
    const days = daysUntil(referenceDate, dividend.lastEntitlementDate.value);
    if (days === null || days < 0) continue;

    if (days <= 7) {
      alerts.push({
        stockSymbol: stock.config.symbol,
        title: "استحقاق توزيع قريب جدًا",
        message: `آخر يوم شراء للاستحقاق خلال ${days} يوم: ${dividend.lastEntitlementDate.display}.`,
        severity: "red",
        type: "dividend",
      });
    } else if (days <= 14) {
      alerts.push({
        stockSymbol: stock.config.symbol,
        title: "استحقاق توزيع قريب",
        message: `آخر يوم شراء للاستحقاق خلال ${days} يوم: ${dividend.lastEntitlementDate.display}.`,
        severity: "orange",
        type: "dividend",
      });
    } else if (days <= 30) {
      alerts.push({
        stockSymbol: stock.config.symbol,
        title: "استحقاق توزيع خلال شهر",
        message: `آخر يوم شراء للاستحقاق خلال ${days} يوم: ${dividend.lastEntitlementDate.display}.`,
        severity: "yellow",
        type: "dividend",
      });
    }
  }

  const latestDisclosure = stock.disclosures[0];
  const disclosureAge = latestDisclosure ? daysUntil(latestDisclosure.date, referenceDate) : null;
  if (latestDisclosure && disclosureAge !== null && disclosureAge <= 14 && disclosureAge >= 0) {
    alerts.push({
      stockSymbol: stock.config.symbol,
      title: "إفصاح حديث",
      message: latestDisclosure.title,
      severity: "blue",
      type: "disclosure",
    });
  }

  const daily = stock.quote.dailyChangePercent.value;
  if (daily !== null && Math.abs(daily) >= 4) {
    alerts.push({
      stockSymbol: stock.config.symbol,
      title: "تغير سعري كبير",
      message: `التغير اليومي في آخر جلسة بلغ ${stock.quote.dailyChangePercent.display}.`,
      severity: daily > 0 ? "blue" : "orange",
      type: "price",
    });
  }

  const tradeValue = stock.quote.tradeValue.value;
  if (tradeValue !== null && tradeValue >= 250_000_000) {
    alerts.push({
      stockSymbol: stock.config.symbol,
      title: "سيولة مرتفعة في آخر جلسة",
      message: `قيمة التداول بلغت ${stock.quote.tradeValue.display}. لا يتوفر متوسط رسمي للمقارنة داخل اللقطة.`,
      severity: "blue",
      type: "volume",
    });
  }

  const latestTitle = latestDisclosure?.title.toLowerCase() ?? "";
  if (latestTitle.includes("financial result") || latestTitle.includes("results")) {
    alerts.push({
      stockSymbol: stock.config.symbol,
      title: "نتائج مالية أو إفصاح مرتبط بالأرباح",
      message: latestDisclosure?.title ?? "إفصاح مالي حديث",
      severity: "blue",
      type: "financials",
    });
  }

  if ((stock.financials.netProfitGrowth.value ?? 0) < 0) {
    alerts.push({
      stockSymbol: stock.config.symbol,
      title: "تراجع صافي الربح",
      message: `نمو صافي الربح المتاح: ${stock.financials.netProfitGrowth.display}.`,
      severity: "orange",
      type: "financials",
    });
  }

  if ((stock.financials.revenueGrowth.value ?? 0) < 0) {
    alerts.push({
      stockSymbol: stock.config.symbol,
      title: "تراجع الإيرادات",
      message: `نمو الإيرادات المتاح: ${stock.financials.revenueGrowth.display}.`,
      severity: "orange",
      type: "financials",
    });
  }

  if (stock.analyst.analystCount.value === null) {
    alerts.push({
      stockSymbol: stock.config.symbol,
      title: "آراء المحللين غير متوفرة",
      message: "غير متوفر من المصدر الرسمي داخل اللقطة الحالية.",
      severity: "gray",
      type: "analyst",
    });
  }

  if (stock.quote.performanceThreeMonths.value === null) {
    alerts.push({
      stockSymbol: stock.config.symbol,
      title: "نقص في بيانات الأداء التاريخي",
      message: "أداء ثلاثة أشهر غير متوفر من المصدر الرسمي داخل اللقطة الحالية.",
      severity: "gray",
      type: "data",
    });
  }

  if (
    stock.analysis.trend.value === "اتجاه متذبذب عالي المخاطر" ||
    stock.analysis.trend.value === "اتجاه سلبي يحتاج إلى متابعة"
  ) {
    alerts.push({
      stockSymbol: stock.config.symbol,
      title: "تغير مهم في التصنيف التحليلي",
      message: `التصنيف الحالي: ${stock.analysis.trend.display}.`,
      severity: "orange",
      type: "classification",
    });
  }

  return alerts;
}

function daysUntil(from: string | null | undefined, to: string | null | undefined): number | null {
  const fromDate = parseLooseDate(from);
  const toDate = parseLooseDate(to);
  if (!fromDate || !toDate) return null;

  const diff = toDate.getTime() - fromDate.getTime();
  return Math.floor(diff / 86_400_000);
}

function parseLooseDate(value: string | null | undefined): Date | null {
  if (!value) return null;

  const dmy = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) {
    const [, day, month, year] = dmy;
    return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
