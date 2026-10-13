import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// https://vitejs.dev/config/
const frontendDirectory = dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const backendEnv = loadEnv(mode, resolve(frontendDirectory, '../backend'), 'PORT')
  const backendPort = backendEnv.PORT || '5000'

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: `http://localhost:${backendPort}`,
          changeOrigin: true,
          secure: false,
        }
      }
    }
  }
})
