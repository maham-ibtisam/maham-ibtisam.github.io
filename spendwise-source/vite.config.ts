import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages project site: https://maham-ibtisam.github.io/spendwise/
export default defineConfig({
  base: '/spendwise/',
  plugins: [react(), tailwindcss()],
})
