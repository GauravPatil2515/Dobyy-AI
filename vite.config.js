import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals:     true,
    environment: 'node',
    coverage: {
      provider:  'v8',
      reporter:  ['text', 'json', 'html'],
      include:   ['src/utils/**', 'src/store/**', 'src/domain/**', 'src/services/**'],
      exclude:   ['src/utils/groqClient.js', 'src/utils/imageAnalyzer.js'],
    },
  },
})
