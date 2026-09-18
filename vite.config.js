import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Matches the shadcn/ui-layouts convention (`@/lib/utils`, etc.) so
    // components pulled from their registries work as-is.
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
