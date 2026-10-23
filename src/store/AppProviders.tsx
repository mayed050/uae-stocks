import { useState } from 'react'
import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { createQueryClient } from './queries'

/** مزوّدات التطبيق: عميل الاستعلامات (يُمرَّر عميل مستقل في الاختبارات). */
export default function AppProviders({ children, client }: { children: ReactNode; client?: QueryClient }) {
  const [qc] = useState(() => client ?? createQueryClient())
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}
