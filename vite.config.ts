import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import type { Plugin } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { buildFeeds, FEED_DIR } from './src/feeds'
import type { Dataset } from './src/data'

// data.json مُتحقَّق منه بعقد البيانات في سير عمل التحديث وفي الاختبارات قبل أن يصل إلى البناء
const feeds = () => buildFeeds((JSON.parse(readFileSync(new URL('./public/data.json', import.meta.url), 'utf8')) as Dataset).stocks)

/** يولّد تقاويم الاشتراك (calendar/*.ics) من أحدث data.json: ملفات في حزمة النشر، وتُخدم مباشرة في وضع التطوير. */
function calendarFeeds(): Plugin {
  return {
    name: 'calendar-feeds',
    apply: 'build',
    generateBundle() {
      for (const [fileName, source] of feeds()) this.emitFile({ type: 'asset', fileName, source })
    },
  }
}

function calendarFeedsDev(): Plugin {
  return {
    name: 'calendar-feeds-dev',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = req.url?.split('?')[0]?.replace(/^\//, '')
        if (!path?.startsWith(`${FEED_DIR}/`)) return next()
        const body = feeds().get(path)
        if (!body) return next()
        res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
        res.end(body)
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  // React Compiler: تحسين تلقائي لإعادة الرسم (memoization) وقت البناء بدل useMemo/useCallback اليدوية
  plugins: [react(), babel({ presets: [reactCompilerPreset()] }), tailwindcss(), calendarFeeds(), calendarFeedsDev()],
  base: process.env.GITHUB_ACTIONS ? '/uae-stocks/' : '/',
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
  },
  build: {
    // فصل مكتبات الطرف الثالث إلى حِزم منفصلة (vendor chunks) لتحسين التخزين المؤقت في المتصفح.
    // التحديث اليومي يغيّر seed-data وحزمة التطبيق فقط. الأولوية (priority) لازمة: كل مجموعة تضمّ
    // تبعيات وحداتها أيضًا، فلو سبقت مجموعةُ الرسوم مجموعةَ React لابتلعت React (تبعية recharts)
    // وصارت كل صفحة تستورد React منها، فتُجلب مكتبة الرسوم كاملة مع الصفحة الأولى.
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'charts',
              priority: 1,
              test: /[\\/]node_modules[\\/](recharts|recharts-scale|victory-vendor|d3-[^\\/]+|internmap|decimal\.js-light)[\\/]/,
            },
            {
              name: 'react-vendor',
              priority: 3,
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler|react-is)[\\/]/,
            },
            {
              name: 'price-chart',
              priority: 1,
              test: /[\\/]node_modules[\\/](lightweight-charts|fancy-canvas)[\\/]/,
            },
            {
              name: 'app-vendor',
              priority: 2,
              test: /[\\/]node_modules[\\/](@tanstack|zod|zustand|cmdk|@radix-ui|lucide-react|use-sync-external-store)[\\/]/,
            },
            // البيانات المضمّنة تتغيّر يوميًا: فصلها يُبقي بقية الحزم محفوظة في متصفح الزائر العائد
            { name: 'seed-data', test: /[\\/]src[\\/]data[\\/]seed\.json/ },
          ],
        },
      },
    },
  },
})

