import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: [resolve(__dirname, '../vitest.setup.js')],
    include: ['tests/unit/**/*.{test,spec}.{js,ts}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: 'test-results-unit/coverage',
      include: ['src/**/*.{vue,js,ts}'],
      exclude: ['src/main.js', 'src/App.vue', 'src/router/index.js'],
      thresholds: {
        statements: 50,
        branches: 50,
        functions: 50,
        lines: 50
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '../src')
    }
  }
})
