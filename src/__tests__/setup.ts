// إعداد مشترك لاختبارات المكوّنات: مطابقات jest-dom لـ Vitest
import '@testing-library/jest-dom/vitest'

// رسائل Zod Mini المقروءة (الإنجليزية) في الاختبارات و CI فقط — لا تُشحن إلى المتصفح.
import * as z from 'zod/mini'
z.config(z.locales.en())
