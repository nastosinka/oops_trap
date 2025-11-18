import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { sentryVitePlugin } from '@sentry/vite-plugin'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    base: './',
    plugins: [
      vue(),

      sentryVitePlugin({
        org: 'itmo-university-o4',
        project: 'javascript-vue',

        authToken: env.SENTRY_AUTH_TOKEN,
        release: 'myapp@1.0.0',

        sourceMaps: {
          include: ['dist'],
          ignore: ['node_modules'],
          urlPrefix: '~/'
        }
      })
    ],
    build: {
      outDir: 'dist',
      sourcemap: true
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost',
          changeOrigin: true,
          rewrite: path => path
        }
      }
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, '../src')
      }
    }
  }
})
