import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },

  /**
   * Layering, enforced rather than described.
   *
   * component → hook → service → api. Each layer knows the one below it and
   * nothing above. Written down in docs alone this lasts until the first
   * afternoon someone needs a value in a hurry, which is how a page came to
   * import mockDelay and fake a password reset without a service existing.
   *
   * `src/context/**` was added to this list after an auth context reached for
   * `api/tokens` directly. The rule was right and did not fire, because the
   * context directory was simply not in the guard — so a layer that is neither
   * a component nor a service had no enforced boundary at all.
   */
  {
    files: ['src/pages/**/*.{js,jsx}', 'src/components/**/*.{js,jsx}',
            'src/context/**/*.{js,jsx}',
            'src/Dashboard/**/*.{js,jsx}', 'src/customerDashboard/**/*.{js,jsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['@/api/*', '**/api/client', '**/api/mock', '**/api/tokens', '**/api/refresh'],
          message:
            'UI talks to a service, never to the transport. Add or reuse a function in src/services/ and call that.',
        }],
      }],
    },
  },

  // The transport must stay ignorant of the domain and of React, so it can be
  // reasoned about — and swapped — without reading a single component.
  {
    files: ['src/api/**/*.js'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['react', 'react-*', '@/services/**', '@/pages/*', '@/components/*',
                  '../services/**', '../pages/*', '../components/*'],
          message:
            'src/api is the bottom layer. Importing a service, a component or React inverts the dependency.',
        }],
      }],
    },
  },
])
