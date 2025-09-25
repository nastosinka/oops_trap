module.exports = {
  env: {
    browser: true,
    es2020: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-essential'
  ],
  ignorePatterns: [
    'dist/', 
    'coverage/',
    'tests/e2e/',
    'playwright-report/',
    'node_modules/'
  ],
  rules: {
    'vue/multi-word-component-names': 'off',
    'no-console': 'warn',
    'no-unused-vars': 'warn'
  }
}