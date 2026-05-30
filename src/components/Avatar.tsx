import { useState } from 'react'
import { symColor } from '../format'
import { TRADINGVIEW_LOGO_MAP, EMOJI_MAP } from '@/data/logos'

export default function Avatar({ sym, size = 40 }: { sym: string; size?: number }) {
  const cleanSym = sym.replace(/\d+$/, '').toUpperCase()
  const logoUrl = TRADINGVIEW_LOGO_MAP[cleanSym]
  const emoji = EMOJI_MAP[cleanSym] || '🏢'
  
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

  // في حال فشل تحميل الصورة أو عدم توافر دومين، يعرض الإيموجي المناسب
  return (
    <span className="avatar" style={avatarStyle} aria-label={sym} title={sym}>
      <span style={{ fontSize: size * 0.48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {emoji}
      </span>
    </span>
  )
}
