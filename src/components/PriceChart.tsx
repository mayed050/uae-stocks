/**
 * مخطط سعر احترافي على Lightweight Charts v5 (TradingView، مفتوح المصدر Apache-2.0).
 * يرسم أسعار إغلاق حقيقية فقط، ويتبع السمة (فاتح/داكن)، ويعرض قيمة النقطة تحت المؤشر.
 * يبقى شعار TradingView ظاهرًا التزامًا بشرط الإسناد في الترخيص.
 */
import { useEffect, useRef, useState } from 'react'
import { AreaSeries, ColorType, CrosshairMode, LineStyle, TickMarkType, createChart } from 'lightweight-charts'
import type { IChartApi, ISeriesApi, MouseEventParams, Time } from 'lightweight-charts'
import type { HistPoint } from '@/store/useHistory'

const css = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()

function toDate(t: Time): Date {
  if (typeof t === 'string') return new Date(t + 'T00:00:00Z')
  if (typeof t === 'number') return new Date(t * 1000)
  return new Date(Date.UTC(t.year, t.month - 1, t.day))
}

const fmtDay = new Intl.DateTimeFormat('ar-AE', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
const fmtMonth = new Intl.DateTimeFormat('ar-AE', { month: 'short', timeZone: 'UTC' })
const fmtYear = new Intl.DateTimeFormat('ar-AE', { year: 'numeric', timeZone: 'UTC' })
const fmtDom = new Intl.DateTimeFormat('ar-AE', { day: 'numeric', timeZone: 'UTC' })

function palette(up: boolean) {
  const line = up ? css('--good') : css('--bad')
  return {
    text: css('--muted'),
    grid: css('--line'),
    line,
    top: line + '40',
    bottom: line + '00',
  }
}

export default function PriceChart({ points, up, height = 260, label }: { points: HistPoint[]; up: boolean; height?: number; label: string }) {
  const box = useRef<HTMLDivElement>(null)
  const chart = useRef<IChartApi | null>(null)
  const series = useRef<ISeriesApi<'Area'> | null>(null)
  const [hover, setHover] = useState<{ date: string; price: number } | null>(null)

  // إنشاء المخطط مرة واحدة لكل حاوية
  useEffect(() => {
    const el = box.current
    if (!el) return
    const c = palette(true)
    const api = createChart(el, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: c.text,
        fontFamily: getComputedStyle(document.body).fontFamily,
        fontSize: 11,
        attributionLogo: true,
      },
      grid: { vertLines: { visible: false }, horzLines: { color: c.grid, style: LineStyle.Dashed } },
      rightPriceScale: { borderVisible: false },
      timeScale: {
        borderVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
        tickMarkFormatter: (t: Time, type: TickMarkType) => {
          const d = toDate(t)
          if (type === TickMarkType.Year) return fmtYear.format(d)
          if (type === TickMarkType.Month) return fmtMonth.format(d)
          return fmtDom.format(d)
        },
      },
      crosshair: { mode: CrosshairMode.Magnet },
      localization: { locale: 'ar-AE', timeFormatter: (t: Time) => fmtDay.format(toDate(t)), priceFormatter: (p: number) => p.toFixed(2) },
      handleScroll: false,
      handleScale: false,
    })
    const s = api.addSeries(AreaSeries, { lineWidth: 2, priceLineVisible: false, lastValueVisible: true })
    chart.current = api
    series.current = s

    const onMove = (p: MouseEventParams<Time>) => {
      const v = p.time !== undefined ? p.seriesData.get(s) : undefined
      setHover(v && 'value' in v && typeof v.value === 'number' && p.time !== undefined ? { date: fmtDay.format(toDate(p.time)), price: v.value } : null)
    }
    api.subscribeCrosshairMove(onMove)

    return () => {
      api.unsubscribeCrosshairMove(onMove)
      api.remove()
      chart.current = null
      series.current = null
    }
  }, [])

  // تحديث البيانات واللون (صاعد/هابط) عند تغيّر السهم أو الفترة أو السمة
  const [themeTick, setThemeTick] = useState(0)
  useEffect(() => {
    const obs = new MutationObserver(() => setThemeTick((n) => n + 1))
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => obs.disconnect()
  }, [])
  useEffect(() => {
    const s = series.current
    if (!s) return
    const c = palette(up)
    chart.current?.applyOptions({ layout: { textColor: c.text }, grid: { horzLines: { color: c.grid } } })
    s.applyOptions({ lineColor: c.line, topColor: c.top, bottomColor: c.bottom })
    s.setData(points.map(([time, value]) => ({ time, value })))
    chart.current?.timeScale().fitContent()
  }, [points, up, themeTick])

  const last = points[points.length - 1]
  return (
    <figure className="price-chart" style={{ height }}>
      <figcaption className="pc-legend" aria-live="polite">
        {hover ? (
          <>
            <b dir="ltr">{hover.price.toFixed(2)}</b> <span>{hover.date}</span>
          </>
        ) : last ? (
          <span>{label}</span>
        ) : null}
      </figcaption>
      <div ref={box} className="pc-canvas" role="img" aria-label={`${label}: ${points.length} نقطة إغلاق${last ? `، آخرها ${last[1].toFixed(2)} درهم بتاريخ ${last[0]}` : ''}`} />
    </figure>
  )
}
