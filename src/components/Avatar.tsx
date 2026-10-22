import { useState } from 'react'
import { symColor } from '../format'
import { TRADINGVIEW_LOGO_MAP } from '@/data/logos'

export default function Avatar({ sym, size = 40 }: { sym: string; size?: number }) {
  const cleanSym = sym.replace(/\d+$/, '').toUpperCase()
  const logoUrl = TRADINGVIEW_LOGO_MAP[cleanSym]
  
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
