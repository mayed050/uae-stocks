import { useState } from 'react'
import { symColor } from '../format'

const DOMAIN_MAP: Record<string, string> = {
  // DFM
  DEWA: 'dewa.gov.ae',
  EMIRATESNBD: 'emiratesnbd.com',
  DIB: 'dib.ae',
  EMAAR: 'emaar.com',
  DU: 'du.ae',
  SALIK: 'salik.ae',
  TALABAT: 'talabat.com',
  EMPOWER: 'empower.ae',
  TECOM: 'tecomgroup.ae',
  AIRARABIA: 'airarabia.com',
  DTC: 'dubaitaxi.ae',
  EMAARDEV: 'emaar.com',
  DFM: 'dfm.ae',
  MASHREQ: 'mashreqbank.com',
  DIC: 'dubaiinvestments.com',
  GFH: 'gfh.com',
  ALANSARI: 'alansariholder.com',
  SPINNEYS: 'spinneys.com',
  PARKINS: 'parkin.ae',
  AMANAT: 'amanat.com',

  // ADX
  FAB: 'bankfab.com',
  ADCB: 'adcb.com',
  ADIB: 'adib.ae',
  ALDAR: 'aldar.com',
  TAQA: 'taqagroup.com',
  ADNOCGAS: 'adnoc.ae',
  ADNOCDIST: 'adnocdistribution.ae',
  ADNOCDRILL: 'adnoc.ae',
  BURJEEL: 'burjeelholdings.com',
  IHC: 'ihcuae.com',
  EAND: 'eand.com',
  TABREED: 'tabreed.ae',
  FERTIGLOBE: 'fertiglobe.com',
  MULTIPLY: 'multiply.ae',
  YAHSAT: 'yahsat.com',
  PRESIGHT: 'presight.ai',
  BOROUGE: 'borouge.com',
  BAYANAT: 'bayanat.ai',
  AGTHIA: 'agthia.com',
  ALDAHRA: 'aldahra.com'
}

// خريطة أيقونات تعبيرية تعكس هوية أو قطاع كل شركة كبديل ممتاز
const EMOJI_MAP: Record<string, string> = {
  DEWA: '⚡',
  EMIRATESNBD: '🏦',
  DIB: '🕌',
  EMAAR: '🏢',
  DU: '📱',
  SALIK: '🛣️',
  TALABAT: '🍔',
  EMPOWER: '❄️',
  TECOM: '💼',
  AIRARABIA: '✈️',
  DTC: '🚕',
  EMAARDEV: '🏗️',
  DFM: '📈',
  MASHREQ: '🏦',
  DIC: '💼',
  GFH: '💵',
  ALANSARI: '💸',
  SPINNEYS: '🛒',
  PARKINS: '🅿️',
  AMANAT: '🎓',
  FAB: '🏦',
  ADCB: '🏦',
  ADIB: '🕌',
  ALDAR: '🏢',
  TAQA: '🔌',
  ADNOCGAS: '🔥',
  ADNOCDIST: '⛽',
  ADNOCDRILL: '⚙️',
  BURJEEL: '🏥',
  IHC: '👑',
  EAND: '📱',
  TABREED: '❄️',
  FERTIGLOBE: '🌱',
  MULTIPLY: '✖️',
  YAHSAT: '🛰️',
  PRESIGHT: '🤖',
  BOROUGE: '🧪',
  BAYANAT: '🗺️',
  AGTHIA: '🍎',
  ALDAHRA: '🌾'
}

export default function Avatar({ sym, size = 40 }: { sym: string; size?: number }) {
  const cleanSym = sym.replace(/\d+$/, '').toUpperCase()
  const domain = DOMAIN_MAP[cleanSym]
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
    border: '1.5px solid var(--line)',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    transition: 'all 0.15s ease'
  }

  if (domain && !imgFailed) {
    return (
      <span className="avatar" style={avatarStyle} aria-label={sym}>
        <img
          src={`https://logo.clearbit.com/${domain}?size=${size * 2}`}
          alt={sym}
          onError={() => setImgFailed(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            background: '#fff',
            padding: '3px'
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
