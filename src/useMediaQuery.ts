import { useSyncExternalStore } from 'react'

/** يطابق استعلام وسائط CSS ويتحدّث عند تغيّر حجم النافذة؛ false حيث لا يتوفّر matchMedia (الاختبارات). */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window.matchMedia !== 'function') return () => {}
      const m = window.matchMedia(query)
      m.addEventListener('change', onChange)
      return () => m.removeEventListener('change', onChange)
    },
    () => typeof window.matchMedia === 'function' && window.matchMedia(query).matches,
    () => false,
  )
}
