import { useState } from 'react'
import { symColor } from '../format'
import { TRADINGVIEW_LOGO_MAP } from '@/data/logos'
import type { Stock } from '@/data'
import { useStocks } from '@/store'

// خريطة الرمز → الشعار مبنية مرة لكل نسخة بيانات (لا بحث خطّي لكل أفاتار)
const logoCache = new WeakMap<Stock[], Map<string, string>>()
function logoFor(stocks: Stock[], sym: string): string | undefined {
  let m = logoCache.get(stocks)
  if (!m) {
    m = new Map(stocks.filter((s) => s.logo).map((s) => [s.sym, s.logo as string]))
    logoCache.set(stocks, m)
  }
  return m.get(sym)
}

export default function Avatar({ sym, size = 40 }: { sym: string; size?: number }) {
  const { stocks } = useStocks()
  const cleanSym = sym.replace(/\d+$/, '').toUpperCase()
  const logoUrl = TRADINGVIEW_LOGO_MAP[cleanSym] ?? logoFor(stocks, sym)
  
  const [imgFailed, setImgFailed] = useState(false)

  // ستايل الحاوية الدائرية للأيقونة
  const avatarStyle: React.CSSProperties = {
    background: symColor(cleanSym),
    width: size,
    height: size,
    fontSize: size * 0.38,
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: 800,
    overflow: 'hidden',
    flexShrink: 0,
    border: '1px solid var(--line)',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    transition: 'all 0.15s ease'
  }

  if (logoUrl && !imgFailed) {
    return (
      <span className="avatar" style={avatarStyle} aria-label={sym}>
        <img
          src={logoUrl}
          alt={sym}
          onError={() => setImgFailed(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            background: '#fff',
            padding: '2px'
          }}
        />
      </span>
    )
  }

  // عند تعذّر الشعار: حرفان من الرمز على لون ثابت مشتق منه (نمط المنصات المالية الاحترافية)
  return (
    <span className="avatar" style={{ ...avatarStyle, fontSize: size * 0.34, letterSpacing: '0.02em' }} aria-label={sym} title={sym}>
      {cleanSym.slice(0, 2)}
    </span>
  )
}
