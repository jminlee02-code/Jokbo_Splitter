import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['pdfjs-dist'],
  },
  worker: {
    format: 'es',
  },
  build: {
    rollupOptions: {
      output: {
        // Worker 파일을 assets 폴더에 올바르게 배치
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.worker.js')) {
            return 'assets/[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
  // CORS 헤더는 CDN Worker 사용 시 필요 없을 수 있음
  // server: {
  //   headers: {
  //     'Cross-Origin-Embedder-Policy': 'require-corp',
  //     'Cross-Origin-Opener-Policy': 'same-origin',
  //   },
  // },
})

