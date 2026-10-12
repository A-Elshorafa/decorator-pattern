import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// /api calls are proxied to the .NET backend, so no CORS setup is needed.
export default defineConfig({
  plugins: [react()],
  server: { port: 8100, strictPort: true, proxy: { '/api': 'http://localhost:8099' } },
})
