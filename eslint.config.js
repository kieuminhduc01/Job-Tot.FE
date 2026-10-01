import path from 'node:path'
import { fileURLToPath } from 'node:url'
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

const sourceRoot = fileURLToPath(new URL('./src', import.meta.url))
const layers = ['app', 'pages', 'widgets', 'features', 'entities', 'shared']
const sliced = ['pages', 'widgets', 'features', 'entities']
const fsdRule = {
  meta: { type: 'problem', schema: [], messages: { boundary: 'FSD: chỉ import xuống layer thấp hơn hoặc trong cùng slice.', publicApi: 'FSD: import slice khác qua public API (index.js).' } },
  create(context) {
    function check(node) {
      const value = node.source?.value
      if (typeof value !== 'string' || (!value.startsWith('@/') && !value.startsWith('.'))) return
      const from = path.relative(sourceRoot, context.filename).split(path.sep)
      const target = value.startsWith('@/') ? path.join(sourceRoot, value.slice(2)) : path.resolve(path.dirname(context.filename), value)
      const to = path.relative(sourceRoot, target).split(path.sep)
      const fromLayer = layers.indexOf(from[0])
      const toLayer = layers.indexOf(to[0])
      if (fromLayer < 0 || toLayer < 0) return
      const sameSlice = from[0] === to[0] && (!sliced.includes(from[0]) || from[1] === to[1])
      if (toLayer < fromLayer || (toLayer === fromLayer && !sameSlice)) {
        context.report({ node, messageId: 'boundary' })
      } else if (!sameSlice && sliced.includes(to[0]) && to.length > 2 && !(to.length === 3 && /^index\.(js|jsx)$/.test(to[2]))) {
        context.report({ node, messageId: 'publicApi' })
      }
    }
    return { ImportDeclaration: check, ExportNamedDeclaration: check, ExportAllDeclaration: check }
  },
}

export default [
  { ignores: ['dist', 'node_modules'] },
  {
    files: ['**/*.{js,jsx}'],
    ...js.configs.recommended,
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: { ...globals.browser, ...globals.node }, parserOptions: { ecmaFeatures: { jsx: true } } },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh, fsd: { rules: { boundaries: fsdRule } } },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }],
      'react-refresh/only-export-components': ['error', { allowConstantExport: true }],
      'fsd/boundaries': 'error',
    },
  },
  { files: ['src/shared/ui/**/*.jsx'], rules: { 'react-refresh/only-export-components': 'off' } },
]
