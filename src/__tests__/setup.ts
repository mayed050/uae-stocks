// إعداد مشترك لاختبارات المكوّنات: مطابقات jest-dom لـ Vitest
import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as z from 'zod/mini'

// تنظيف DOM بعد كل اختبار (لا يُسجَّل تلقائيًا دون globals في Vitest) — يمنع تسرّب عناصر بين الاختبارات
afterEach(() => cleanup())

// رسائل Zod Mini المقروءة (الإنجليزية) في الاختبارات و CI فقط — لا تُشحن إلى المتصفح.
z.config(z.locales.en())

// jsdom لا ينفّذ التمرير — بديل صامت لتفادي ضوضاء «Not implemented» في اختبارات التوجيه.
window.scrollTo = () => {}
