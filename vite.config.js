import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/groq': {
        target: 'https://api.groq.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api\/groq/, ''),
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        }
      }
    }
  }
})
