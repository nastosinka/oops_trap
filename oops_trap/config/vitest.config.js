import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.{test,spec}.{js,ts}'], 
    outputFile: {
      html: 'test-results-unit/vitest-report.html',
      json: 'test-results-unit/vitest-report.json'
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: 'test-results-unit/coverage',
      include: ['src/**/*.{vue,js,ts}']
    }
  },
  resolve: {
    alias: {
      '@': resolve(process.cwd(), 'src') 
    }
  }
})