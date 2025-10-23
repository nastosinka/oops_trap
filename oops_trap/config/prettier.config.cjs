module.exports = {
  semi: false,
  singleQuote: true,
  tabWidth: 2,
  useTabs: false,
  printWidth: 80,
  trailingComma: 'none',
  arrowParens: 'avoid',
  bracketSpacing: true,
  endOfLine: 'lf',
  vueIndentScriptAndStyle: false,
  overrides: [
    {
      files: '*.vue',
      options: {
        parser: 'vue'
      }
    },
    {
      files: '*.js',
      options: {
        parser: 'babel'
      }
    }
  ]
}
