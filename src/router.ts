/**
 * التوجيه (TanStack Router): لكل صفحة مسار، ولكل سهم وفلتر رابط قابل للمشاركة.
 * سجل التنقّل بالهاش (#/screener?stock=EMAAR) لأن GitHub Pages لا يدعم إعادة كتابة المسارات.
 *
 * تقسيم الحزم: النظرة العامة (الصفحة الأولى) ضمن الحزمة الرئيسية، وبقية الصفحات حِزم تُجلب عند الطلب
 * وتُحمَّل مسبقًا عند تمرير المؤشر على رابطها. إن طلب تبويبٌ قديم حزمةً حذفها نشرٌ أحدث، يعيد
 * lazyRouteComponent تحميل الصفحة مرة واحدة فيحصل على النسخة الجديدة بدل صفحة خطأ.
 */
import { createHashHistory, createRootRoute, createRoute, createRouter, lazyRouteComponent } from '@tanstack/react-router'
import type { RouterHistory } from '@tanstack/react-router'
import { validateRootSearch, validateScreenerSearch, validateFinancialsSearch } from '@/search'
import App from './App'
import { NotFound, OverviewPage, PagePending } from './routes/overview'

const rootRoute = createRootRoute({
  validateSearch: validateRootSearch,
  component: App,
  notFoundComponent: NotFound,
})

const overviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: OverviewPage,
})

const screenerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/screener',
  validateSearch: validateScreenerSearch,
  component: lazyRouteComponent(() => import('./routes/screener')),
})

const dividendsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dividends',
  component: lazyRouteComponent(() => import('./routes/dividends')),
})

const financialsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/financials',
  validateSearch: validateFinancialsSearch,
  component: lazyRouteComponent(() => import('./routes/financials')),
})

const compareRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/compare',
  component: lazyRouteComponent(() => import('./routes/compare')),
})

const portfolioRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/portfolio',
  component: lazyRouteComponent(() => import('./routes/portfolio')),
})

const termsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/terms',
  component: lazyRouteComponent(() => import('./routes/terms')),
})

const routeTree = rootRoute.addChildren([
  overviewRoute,
  screenerRoute,
  dividendsRoute,
  financialsRoute,
  compareRoute,
  portfolioRoute,
  termsRoute,
])

/** يُنشئ الموجّه؛ تمرّر الاختبارات سجلًا في الذاكرة بدل سجل الهاش. */
export function createAppRouter(history: RouterHistory = createHashHistory()) {
  return createRouter({ routeTree, history, defaultPreload: 'intent', defaultPendingComponent: PagePending })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>
  }
}
