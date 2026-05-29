import { NextResponse } from "next/server";
import { DATASET_INFO, stocksData } from "@/data/stocksData";
import { calculateDividendSustainability, calculateFinancialHealthScore, getExpectedTrend } from "@/utils/analyticsEngine";

export function GET() {
  return NextResponse.json({
    dataset: DATASET_INFO,
    count: stocksData.length,
    stocks: stocksData.map((stock) => ({
      ...stock,
      analytics: {
        health: calculateFinancialHealthScore(stock),
        trend: getExpectedTrend(stock),
        dividendSustainability: calculateDividendSustainability(stock),
      },
    })),
  });
}
