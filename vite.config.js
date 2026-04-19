import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiKey = env.VITE_GROQ_API_KEY || ''

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/chat': {
          target: 'https://api.groq.com',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api\/chat/, '/openai/v1/chat/completions'),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader('Authorization', `Bearer ${apiKey}`)
            })
          }
        }
      }
    }
  }
})
