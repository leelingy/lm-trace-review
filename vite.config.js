import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/lm-trace-review/' : '/',
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  }
})
