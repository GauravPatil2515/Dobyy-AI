import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const groqKey = env.VITE_GROQ_API_KEY || ''
  const orKey = env.VITE_OPENROUTER_API_KEY || '***REMOVED***'

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
              proxyReq.setHeader('Authorization', `Bearer ${groqKey}`)
            })
          }
        },
        '/api/openrouter': {
          target: 'https://api.openrouter.ai',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api\/openrouter/, '/api/v1/chat/completions'),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq, req) => {
              proxyReq.setHeader('Authorization', `Bearer ${orKey}`)
              proxyReq.setHeader('HTTP-Referer', `http://localhost:5175`)
              proxyReq.setHeader('X-Title', 'Dobby Studio')
            })
          }
        }
      }
    }
  }
})
