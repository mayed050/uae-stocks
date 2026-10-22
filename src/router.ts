/**
 * التوجيه (TanStack Router): لكل صفحة مسار، ولكل سهم وفلتر رابط قابل للمشاركة.
 * سجل التنقّل بالهاش (#/screener?stock=EMAAR) لأن GitHub Pages لا يدعم إعادة كتابة المسارات.
 */
import { createHashHistory, createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import type { RouterHistory } from '@tanstack/react-router'
import { validateRootSearch, validateScreenerSearch, validateFinancialsSearch } from '@/search'
import App from './App'
import { NotFound, OverviewPage, ScreenerPage, DividendsPage, FinancialsPage, ComparePage, PortfolioPage } from './pages'

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
  component: ScreenerPage,
})

const dividendsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dividends',
  component: DividendsPage,
})

const financialsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/financials',
  validateSearch: validateFinancialsSearch,
  component: FinancialsPage,
})

const compareRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/compare',
  component: ComparePage,
})

const portfolioRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/portfolio',
  component: PortfolioPage,
})

const routeTree = rootRoute.addChildren([
  overviewRoute,
  screenerRoute,
  dividendsRoute,
  financialsRoute,
  compareRoute,
  portfolioRoute,
])

/** يُنشئ الموجّه؛ تمرّر الاختبارات سجلًا في الذاكرة بدل سجل الهاش. */
export function createAppRouter(history: RouterHistory = createHashHistory()) {
  return createRouter({ routeTree, history })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>
  }
}
