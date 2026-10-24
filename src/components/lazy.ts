/**
 * مكوّنات ثقيلة تُجلب عند أول عرض، فلا تؤخّر ظهور الصفحة الأولى (مكتبتا الرسم ≈ 170KB مضغوطة).
 * lazyRouteComponent يصلح لأي مكوّن لا للمسارات وحدها: يعلّق العرض حتى تصل الحزمة (Suspense)،
 * ويعيد تحميل الصفحة مرة واحدة إن كانت الحزمة قد حُذفت بنشر أحدث. تُعرض داخل LazySlot.
 */
import { lazyRouteComponent } from '@tanstack/react-router'

export const LazyPriceChart = lazyRouteComponent(() => import('./PriceChart'))
export const LazyStockDetail = lazyRouteComponent(() => import('./StockDetail'))
