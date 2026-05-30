import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: process.env.GITHUB_ACTIONS ? '/uae-stocks/' : '/',
  build: {
    // فصل مكتبات الطرف الثالث الثقيلة إلى حِزم منفصلة (vendor chunks) لتقليل حجم الحزمة
    // الرئيسية وتحسين التخزين المؤقت في المتصفح — مع الإبقاء على الاستيراد الساكن.
    rolldownOptions: {
      output: {
        advancedChunks: {
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

