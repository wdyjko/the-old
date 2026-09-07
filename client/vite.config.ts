import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 本地开发时把 /api/* 代理到 Node 后端 (默认 5000 端口)
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      // Socket.io WebSocket 代理
      '/socket.io': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
