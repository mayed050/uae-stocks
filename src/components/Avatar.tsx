import { useState } from 'react'
import { symColor } from '../format'

// الخريطة الرسمية الكاملة لشعارات الشركات عالية الدقة ومباشرة من خادم TradingView CDN للأربعين سهماً بالكامل
const TRADINGVIEW_LOGO_MAP: Record<string, string> = {
  // دبي (DFM)
  DEWA: 'https://s3-symbol-logo.tradingview.com/dubai-electricity-and-water-authority--600.png',
  EMIRATESNBD: 'https://s3-symbol-logo.tradingview.com/emirates-nbd--600.png',
  DIB: 'https://s3-symbol-logo.tradingview.com/dubai-islamic-bank--600.png',
  EMAAR: 'https://s3-symbol-logo.tradingview.com/emaar-properties--600.png',
  DU: 'https://s3-symbol-logo.tradingview.com/emirate-integrated--600.png',
  SALIK: 'https://s3-symbol-logo.tradingview.com/salik-company-pj--600.png',
  TALABAT: 'https://s3-symbol-logo.tradingview.com/talabat-pl--600.png',
  EMPOWER: 'https://s3-symbol-logo.tradingview.com/emirates-central-c--600.png',
  TECOM: 'https://s3-symbol-logo.tradingview.com/tecom-pjsc--600.png',
  AIRARABIA: 'https://s3-symbol-logo.tradingview.com/air-arabia--600.png',
  DTC: 'https://s3-symbol-logo.tradingview.com/dubai-taxi-company--600.png',
  EMAARDEV: 'https://s3-symbol-logo.tradingview.com/emaar-development--600.png',
  DFM: 'https://s3-symbol-logo.tradingview.com/dubai-financial--600.png',
  MASHREQ: 'https://s3-symbol-logo.tradingview.com/mashreqbank--600.png',
  DIC: 'https://s3-symbol-logo.tradingview.com/dubai-investments--600.png',
  GFH: 'https://s3-symbol-logo.tradingview.com/gfh-financial-group--600.png',
  ALANSARI: 'https://s3-symbol-logo.tradingview.com/al-ansari-financia--600.png',
  SPINNEYS: 'https://s3-symbol-logo.tradingview.com/spinneys-1961-hold--600.png',
  PARKIN: 'https://s3-symbol-logo.tradingview.com/parkin-company-pjs--600.png',
  AMANAT: 'https://s3-symbol-logo.tradingview.com/amanat-holdings--600.png',

  // أبوظبي (ADX)
  FAB: 'https://s3-symbol-logo.tradingview.com/first-abu-dhabi-bank--600.png',
  ADCB: 'https://s3-symbol-logo.tradingview.com/abu-dhabi-commercial-bank--600.png',
  ADIB: 'https://s3-symbol-logo.tradingview.com/abu-dhabi-islamic-bank--600.png',
  ADNIC: 'https://s3-symbol-logo.tradingview.com/abu-dhabi-national-insurance-company--600.png',
  EAND: 'https://s3-symbol-logo.tradingview.com/emirates-telecom-company-etisalat-pjsc--600.png',
  // شعارات أدنوك — كل شركة فرعية بشعارها الصحيح الخاص
  ADNOCGAS:   'https://s3-symbol-logo.tradingview.com/adnoc-gas--600.png',
  ADNOCDIST:  'https://s3-symbol-logo.tradingview.com/adnoc-distribution--600.png',
  ADNOCDRILL: 'https://s3-symbol-logo.tradingview.com/adnoc-drilling-company-pjsc--600.png',
  NMDCENR: 'https://s3-symbol-logo.tradingview.com/nmdc-energy-pjsc--600.png',
  IHC: 'https://s3-symbol-logo.tradingview.com/international-holding-company-pjsc--600.png',
  TAQA: 'https://s3-symbol-logo.tradingview.com/abu-dhabi-national-energy-company--600.png',
  ALDAR: 'https://s3-symbol-logo.tradingview.com/al-dar-properties--600.png',
  ALPHADHABI: 'https://s3-symbol-logo.tradingview.com/alpha-dhabi-pjsc--600.png',
  ADNOCLS:    'https://s3-symbol-logo.tradingview.com/adnoc-logistics-services--600.png',
  MULTIPLY: 'https://s3-symbol-logo.tradingview.com/two-point-zero-group--600.png',
  BOROUGE: 'https://s3-symbol-logo.tradingview.com/borouge-plc--600.png',
  WAHAT: 'https://s3-symbol-logo.tradingview.com/waha-capital-company--600.png',
  DANA: 'https://s3-symbol-logo.tradingview.com/dana-gas-pjsc--600.png',
  BURJEEL: 'https://s3-symbol-logo.tradingview.com/burjeel-plc--600.png',
  PHOENIX: 'https://s3-symbol-logo.tradingview.com/phoenix-group-plc--600.png'
}

// خريطة أيقونات تعبيرية تعكس هوية أو قطاع كل شركة كبديل ممتاز في حال فشل تحميل الصورة
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
  PARKIN: '🅿️',
  AMANAT: '🎓',
  FAB: '🏦',
  ADCB: '🏦',
  ADIB: '🕌',
  ALDAR: '🏢',
  TAQA: '🔌',
  ADNOCGAS: '🔥',
  ADNOCDIST: '⛽',
  ADNOCDRILL: '⚙️',
  ADNOCLS: '🚢',
  BURJEEL: '🏥',
  IHC: '👑',
  EAND: '📱',
  ADNIC: '🛡️',
  NMDCENR: '⚓',
  WAHAT: '🌴',
  DANA: '🔥',
  TABREED: '❄️',
  FERTIGLOBE: '🌱',
  MULTIPLY: '✖️',
  YAHSAT: '🛰️',
  PRESIGHT: '🤖',
  PHOENIX: '🤖',
  BOROUGE: '🧪',
  BAYANAT: '🗺️',
  AGTHIA: '🍎',
  ALDAHRA: '🌾'
}

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
