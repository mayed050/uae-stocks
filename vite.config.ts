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
    // فصل مكتبات الطرف الثالث الثقيلة إلى حِزم منفصلة (vendor chunks) لتقليل حجم الحزمة
    // الرئيسية وتحسين التخزين المؤقت في المتصفح — مع الإبقاء على الاستيراد الساكن.
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
          ],
        },
      },
    },
  },
})

