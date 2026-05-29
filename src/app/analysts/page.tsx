import Link from "next/link";
import { Badge, confidenceTone } from "@/components/ui/Badge";
import { DataBanner } from "@/components/ui/DataBanner";
import { Panel, Section } from "@/components/ui/Section";
import { getMarketDataset } from "@/lib/data/snapshot-provider";

export default function AnalystsPage() {
  const dataset = getMarketDataset();

  return (
    <div>
      <DataBanner
        generatedAt={dataset.generatedAt}
        lastOfficialSession={dataset.lastOfficialSession}
        warning={dataset.dataWarning}
      />

      <Panel className="mb-5 border-blue-200 bg-blue-50">
        <p className="text-sm leading-7 text-blue-950">
          آراء المحللين والأسعار المستهدفة ليست توصية شراء أو بيع. في اللقطة الحالية تظهر الحقول غير المتوفرة بالنص الرسمي المطلوب، لأن مصدرًا رسميًا موثقًا لآراء المحللين لم يكن ضمن ملف البيانات.
        </p>
      </Panel>

      <Section title="آراء المحللين" subtitle="متوسط السعر المستهدف، عدد المحللين، الاتجاه العام، مصدر الرأي، وموثوقية المصدر.">
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm scrollbar-thin">
          <table className="w-full min-w-[1100px] border-collapse text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                {[
                  "السهم",
                  "متوسط الهدف",
                  "أعلى هدف",
                  "أدنى هدف",
                  "عدد المحللين",
                  "الاتجاه العام",
                  "ملخص الأسباب",
                  "آخر تحديث",
                  "المصدر",
                  "الموثوقية",
                ].map((heading) => (
                  <th key={heading} className="border-b border-slate-200 px-3 py-3 text-right font-bold">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataset.stocks.map((stock) => (
                <tr key={stock.config.symbol} className="border-b border-slate-100 hover:bg-blue-50/50">
                  <td className="px-3 py-3">
                    <Link href={`/stocks/${stock.config.symbol}`} className="font-bold text-blue-800 hover:underline">
                      {stock.config.symbol}
                    </Link>
                    <div className="mt-1 text-xs text-slate-500">{stock.config.nameAr}</div>
                  </td>
                  <td className="number px-3 py-3">{stock.analyst.averageTarget.display}</td>
                  <td className="number px-3 py-3">{stock.analyst.highestTarget.display}</td>
                  <td className="number px-3 py-3">{stock.analyst.lowestTarget.display}</td>
                  <td className="number px-3 py-3">{stock.analyst.analystCount.display}</td>
                  <td className="px-3 py-3">{stock.analyst.consensus.display}</td>
                  <td className="px-3 py-3 text-slate-600">{stock.analyst.rationale.display}</td>
                  <td className="px-3 py-3">{stock.analyst.updatedAt.display}</td>
                  <td className="px-3 py-3">{stock.analyst.source.name}</td>
                  <td className="px-3 py-3">
                    <Badge tone={confidenceTone(stock.analyst.reliability)}>{stock.analyst.reliability}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}
