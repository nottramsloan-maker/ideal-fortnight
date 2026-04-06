import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import path from 'node:path'

const repoRoot = fileURLToPath(new URL('../..', import.meta.url))
const devtoolsNoop = fileURLToPath(new URL('./src/shims/vue-devtools-api-noop.ts', import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const miniWebview = mode === 'miniwebview'

  return {
    plugins: [vue()],
    // 微信开发者工具 web-view：需监听 0.0.0.0；用局域网 IP 打开时 Origin 非 localhost，
    // Vite 默认 CORS 仅放行回环地址会导致白屏/模块加载失败，开发环境放宽 CORS。
    server: {
      host: true,
      port: 5173,
      strictPort: true,
      cors: true,
      allowedHosts: true,
      // web-view 内 WebSocket HMR 常不稳定；miniwebview 模式一并关闭减少异常
      hmr: miniWebview ? false : undefined,
    },
    preview: {
      host: true,
      strictPort: true,
      cors: true,
      allowedHosts: true,
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@card-assets': path.join(repoRoot, '暂存截图', '卡片'),
        ...(miniWebview ? { '@vue/devtools-api': devtoolsNoop } : {}),
      },
    },
  }
})
