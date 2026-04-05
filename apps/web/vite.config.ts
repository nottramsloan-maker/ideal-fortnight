import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import path from 'node:path'

const repoRoot = fileURLToPath(new URL('../..', import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  // 微信开发者工具里的 web-view 有时访问不到仅绑定 localhost 的 dev server，需监听所有网卡
  server: {
    host: true,
    port: 5173,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@card-assets': path.join(repoRoot, '暂存截图', '卡片'),
    },
  },
})
