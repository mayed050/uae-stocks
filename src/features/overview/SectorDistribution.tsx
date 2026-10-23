import { ChartPie } from 'lucide-react'
import { PALETTE } from '@/constants/ui'
import { ChartSlot } from '@/components/LazySlot'
import { LazySectorPie } from '@/components/lazy'

/** لوحة توزيع هيكل السوق حسب القطاعات (مخطط دائري + مفتاح ألوان). */
export default function SectorDistribution({ sectorData }: { sectorData: { name: string; value: number }[] }) {
  return (
    <div className="panel o-sector-panel">
      <h3 className="panel-h o-h-underline">
        <ChartPie size={16} className="ico" aria-hidden /> توزيع هيكل السوق حسب القطاعات
      </h3>
      <div className="o-sector-wrap">
        <div className="o-sector-chart">
          <ChartSlot height={180}>
            <LazySectorPie sectorData={sectorData} />
          </ChartSlot>
        </div>
        <div className="legend o-sector-legend">
          {sectorData.map((d, i) => (
            <span key={d.name} className="legend-item">
              <i style={{ background: PALETTE[i % PALETTE.length] }} />
              {d.name} ({d.value})
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
