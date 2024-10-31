import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  alias: {
    "@": "./src",
  },
  server: {
    host: true, // Add this to allow network access
    port: 5173,  // Default port
    strictPort: true, // Don't try other ports if 5173 is taken
  }
})