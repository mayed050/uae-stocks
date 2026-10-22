import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// خط عربي مستضاف ذاتيًا (بلا طلبات خارجية) أرقامه متساوية العرض فتصطف في الجداول المالية.
// الأوزان 800/900 المستخدمة في الأنماط تُعرض تلقائيًا بأقرب وزن متاح (700).
import '@fontsource/ibm-plex-sans-arabic/400.css'
import '@fontsource/ibm-plex-sans-arabic/500.css'
import '@fontsource/ibm-plex-sans-arabic/600.css'
import '@fontsource/ibm-plex-sans-arabic/700.css'
import './index.css'
import App from './App.tsx'
import { StocksProvider } from './store'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StocksProvider>
      <App />
    </StocksProvider>
  </StrictMode>,
)
