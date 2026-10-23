/**
 * حاضنة لمكوّن يُجلب عند الطلب: هيكل انتظار أثناء التحميل، وبديل هادئ إن تعذّر الجلب
 * (انقطاع الشبكة مثلًا) بدل أن يُسقط الخطأ الصفحة كلها.
 */
import { Component, Suspense } from 'react'
import type { ReactNode } from 'react'

class Boundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

export default function LazySlot({ loading, failed, children }: { loading: ReactNode; failed: ReactNode; children: ReactNode }) {
  return (
    <Boundary fallback={failed}>
      <Suspense fallback={loading}>{children}</Suspense>
    </Boundary>
  )
}

/** موضع مخطط: هيكل متحرك بارتفاع المخطط نفسه (لا قفزة في التخطيط)، ورسالة إن تعذّر تحميله. */
export function ChartSlot({ height, children }: { height: number; children: ReactNode }) {
  return (
    <LazySlot
      loading={<div className="chart-skeleton" role="status" aria-label="جارٍ تحميل المخطط" style={{ height }} />}
      failed={<div className="chart-empty" style={{ minHeight: height }}><b>تعذّر تحميل المخطط — أعد تحميل الصفحة</b></div>}
    >
      {children}
    </LazySlot>
  )
}
