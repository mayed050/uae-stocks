import { notFound } from "next/navigation";
import { StockDetails } from "@/components/StockDetails";
import { getStockBySymbol, stocksData } from "@/data/stocksData";

export function generateStaticParams() {
  return stocksData.map((stock) => ({ symbol: stock.symbol }));
}

export default async function StockPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const stock = getStockBySymbol(symbol);

  if (!stock) notFound();

  return <StockDetails stock={stock} />;
}
