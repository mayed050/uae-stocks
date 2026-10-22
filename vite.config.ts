import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // React Compiler: تحسين تلقائي لإعادة الرسم (memoization) وقت البناء بدل useMemo/useCallback اليدوية
  plugins: [react(), babel({ presets: [reactCompilerPreset()] }), tailwindcss()],
  base: process.env.GITHUB_ACTIONS ? '/uae-stocks/' : '/',
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
  },
  build: {
    // فصل مكتبات الطرف الثالث إلى حِزم منفصلة (vendor chunks) لتحسين التخزين المؤقت في المتصفح
    // — مع الإبقاء على الاستيراد الساكن. التحديث اليومي يغيّر seed-data وحزمة التطبيق فقط.
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'charts',
              test: /[\\/]node_modules[\\/](recharts|recharts-scale|victory-vendor|d3-[^\\/]+|internmap|decimal\.js-light)[\\/]/,
            },
            {
              name: 'react-vendor',
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler|react-is)[\\/]/,
            },
            {
              name: 'price-chart',
              test: /[\\/]node_modules[\\/](lightweight-charts|fancy-canvas)[\\/]/,
            },
            {
              name: 'app-vendor',
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

