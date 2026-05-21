import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: [
        'node_modules/**',
        'src/tests/**',
        '**/*.config.*',
        'src/main.jsx',
        'src/firebase.js',
      ]
    },
    // Resolve path aliases same as Vite
    resolve: {
      alias: {
        '@': '/src'
      }
    }
  }
})
