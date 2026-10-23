import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// خط عربي مستضاف ذاتيًا (بلا طلبات خارجية) أرقامه متساوية العرض فتصطف في الجداول المالية.
// الأوزان 800/900 المستخدمة في الأنماط تُعرض تلقائيًا بأقرب وزن متاح (700).
import '@fontsource/ibm-plex-sans-arabic/400.css'
import '@fontsource/ibm-plex-sans-arabic/500.css'
import '@fontsource/ibm-plex-sans-arabic/600.css'
import '@fontsource/ibm-plex-sans-arabic/700.css'
import './index.css'
import { RouterProvider } from '@tanstack/react-router'
import { createAppRouter } from './router'
import { AppProviders } from './store'

const router = createAppRouter()

// نشرٌ جديد يحذف حِزم النسخة السابقة؛ فإن طلب تبويبٌ قديم حزمةً (أو ملف أنماطها) لم تعد موجودة،
// يُعاد تحميل الصفحة مرة واحدة لكل ملف مفقود فيحصل على النسخة الجديدة (نمط Vite الموثّق: vite:preloadError).
window.addEventListener('vite:preloadError', (e) => {
  const key = `chunk_reload:${(e as Event & { payload?: Error }).payload?.message ?? ''}`
  try {
    if (sessionStorage.getItem(key)) return // أُعيد التحميل من قبل ولم يُجدِ: يُترك الخطأ يظهر
    sessionStorage.setItem(key, '1')
  } catch {
    return
  }
  e.preventDefault()
  window.location.reload()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
)
