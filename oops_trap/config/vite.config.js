import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  base: './',
  plugins: [vue()],
  build: {
    outDir: 'dist'
  },
  server: {
    port: 5173,
    host: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '../src')
    }
  }
})
