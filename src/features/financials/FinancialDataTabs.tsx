import type { FinRecord, Stock } from '@/data'
import { OfficialLink, Section, Stats } from './parts'
import { dateAr, dec, money, officialLinks, pct, tone } from './finFormat'

const DEFS =
  'الأرقام كما يصنّفها مزوّد البيانات وقد تختلف تعريفاتها عن القوائم المنشورة (الإيرادات في البنوك مثلًا تشمل إجمالي دخل الفوائد)؛ المرجع القوائم المالية المدققة.'

/** مجموعة «البيانات والتقارير»: آخر 12 شهرًا، والتقييم، والميزانية، والسجلان السنوي والربعي، والتقارير الرسمية. */
export default function FinancialDataTabs({ stock, fin }: { stock: Stock; fin: FinRecord }) {
  const links = officialLinks(stock)
  const src = `المصدر: TradingView — حتى ${dateAr(fin.asof)}.`
  const maxNet = Math.max(1, ...fin.fy.map((r) => Math.abs(r.net ?? 0)))

  return (
    <>
      <Section title="آخر 12 شهرًا" source={src}>
        <Stats
          items={[
            { label: 'الإيرادات', value: money(fin.ttm.rev) },
            { label: 'صافي الربح', value: money(fin.ttm.net), tone: tone(fin.ttm.net) },
            { label: 'ربحية السهم المخفّفة', value: dec(fin.ttm.eps, 3) },
            { label: 'الأرباح قبل الفوائد والضرائب والإهلاك', value: money(fin.ttm.ebitda) },
            { label: 'التدفق النقدي الحر', value: money(fin.ttm.fcf), tone: tone(fin.ttm.fcf) },
            { label: 'هامش الربح الإجمالي', value: pct(fin.ttm.grossM) },
            { label: 'هامش الربح التشغيلي', value: pct(fin.ttm.opM) },
            { label: 'هامش صافي الربح', value: pct(fin.ttm.netM) },
            { label: 'العائد على حقوق الملكية', value: pct(fin.ttm.roe) },
            { label: 'العائد على الأصول', value: pct(fin.ttm.roa) },
          ]}
        />
      </Section>

      <Section title="مؤشرات التقييم" source={src}>
        <Stats
          items={[
            { label: 'مكرر الربحية', value: dec(stock.pe, 2) },
            { label: 'السعر إلى القيمة الدفترية', value: dec(fin.val.pb, 2) },
            { label: 'السعر إلى المبيعات', value: dec(fin.val.ps, 2) },
            { label: 'قيمة المنشأة إلى EBITDA', value: dec(fin.val.evEbitda, 2) },
            { label: 'نسبة التوزيع من الأرباح (آخر سنة مالية)', value: pct(fin.val.payout) },
          ]}
        />
      </Section>

      <Section title="المركز المالي — آخر ميزانية ربعية" source={src}>
        <Stats
          items={[
            { label: 'إجمالي الأصول', value: money(fin.bal.assets) },
            { label: 'إجمالي المطلوبات', value: money(fin.bal.liab) },
            { label: 'حقوق الملكية', value: money(fin.bal.equity) },
            { label: 'إجمالي الدين', value: money(fin.bal.debt) },
            { label: 'النقد والاستثمارات قصيرة الأجل', value: money(fin.bal.cash) },
            { label: 'صافي الدين', value: money(fin.bal.netDebt), hint: fin.bal.netDebt != null && fin.bal.netDebt < 0 ? 'النقد يفوق الدين' : undefined },
            { label: 'القيمة الدفترية للسهم', value: dec(fin.bal.bvps, 3) },
            { label: 'نسبة التداول', value: dec(fin.bal.curRatio, 2) },
            { label: 'الدين إلى حقوق الملكية', value: dec(fin.bal.de, 2) },
          ]}
        />
      </Section>

      {fin.fy.length > 0 && (
        <Section title="السجل السنوي" source={`${src} ${DEFS}`}>
          <div className="fin-tablewrap" tabIndex={0} role="region" aria-label="جدول السجل المالي السنوي">
            <table className="fin-table">
              <thead>
                <tr>
                  <th>السنة المالية</th><th>الإيرادات</th><th>صافي الربح</th><th>ربحية السهم</th><th>التوزيع للسهم</th><th>إجمالي الأصول</th><th>التدفق النقدي الحر</th>
                </tr>
              </thead>
              <tbody>
                {fin.fy.map((r) => (
                  <tr key={r.y}>
                    <th scope="row">{r.y}</th>
                    <td>{money(r.rev)}</td>
                    <td>
                      <span className="fin-bar-cell">
                        <span className={'fin-bar ' + (tone(r.net) ?? '')} style={{ width: `${(Math.abs(r.net ?? 0) / maxNet) * 100}%` }} aria-hidden />
                        <span>{money(r.net)}</span>
                      </span>
                    </td>
                    <td>{dec(r.eps, 3)}</td>
                    <td>{dec(r.dps, 3)}</td>
                    <td>{money(r.assets)}</td>
                    <td className={tone(r.fcf)}>{money(r.fcf)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {fin.fq && fin.fq.length > 0 && (
        <Section title="السجل الربعي" source={`${src} تسميات الأرباع مُتحقَّق منها: مجموع أرباع آخر سنة مالية يطابق رقمها السنوي.`}>
          <div className="fin-tablewrap" tabIndex={0} role="region" aria-label="جدول السجل المالي الربعي">
            <table className="fin-table">
              <thead>
                <tr><th>الربع</th><th>الإيرادات</th><th>صافي الربح</th><th>صافي الربح مقارنةً بالربع نفسه من العام السابق</th></tr>
              </thead>
              <tbody>
                {fin.fq.map((r, i) => {
                  const lastYear = fin.fq?.[i + 4]?.net
                  const yoy = r.net != null && lastYear != null && lastYear > 0 ? ((r.net - lastYear) / lastYear) * 100 : null
                  return (
                    <tr key={r.q}>
                      <th scope="row" dir="ltr">{r.q}</th>
                      <td>{money(r.rev)}</td>
                      <td className={tone(r.net)}>{money(r.net)}</td>
                      <td className={tone(yoy)}>{pct(yoy, true)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      <Section title="التقارير المالية الرسمية">
        <p className="fin-note">
          القوائم المالية المدققة والتقارير السنوية وتقارير الحوكمة والاستدامة تنشرها الشركة في صفحتها على موقع السوق. لا تستضيف
          المنصة نسخًا منها، تفاديًا لعرض نسخة قديمة أو غير مطابقة.
          {fin.rel.last && <> آخر إعلان نتائج: <b>{dateAr(fin.rel.last)}</b>.</>}
        </p>
        <OfficialLink {...links.company} />
      </Section>
    </>
  )
}
