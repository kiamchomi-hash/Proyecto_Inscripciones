import { defineConfig, globalIgnores } from 'eslint/config';
import { fixupPluginRules } from '@eslint/compat';
import next from '@next/eslint-plugin-next';
import react from 'eslint-plugin-react';
import hooks from 'eslint-plugin-react-hooks';
import imports from 'eslint-plugin-import';
import a11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  {
    files: ['**/*.{js,jsx,mjs,ts,tsx,mts,cts}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node }, parserOptions: { ecmaFeatures: { jsx: true } } },
    plugins: { react: fixupPluginRules(react), 'react-hooks': hooks, import: fixupPluginRules(imports), 'jsx-a11y': a11y, '@next/next': next },
    settings: { react: { version: 'detect' } },
    rules: {
      ...react.configs.recommended.rules,
      ...hooks.configs.recommended.rules,
      ...next.configs['core-web-vitals'].rules,
      'import/no-anonymous-default-export': 'warn',
      'react/no-unknown-property': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'jsx-a11y/alt-text': ['warn', { elements: ['img'], img: ['Image'] }],
      'jsx-a11y/aria-props': 'warn',
      'jsx-a11y/aria-proptypes': 'warn',
      'jsx-a11y/aria-unsupported-elements': 'warn',
      'jsx-a11y/role-has-required-aria-props': 'warn',
      'jsx-a11y/role-supports-aria-props': 'warn',
      'react/jsx-no-target-blank': 'off',
    },
  },
  ...tseslint.configs.recommended,
  globalIgnores([
    '.next/**',
    'dist/**',
    // Paquete aislado: su check usa Astro y workerd, no reglas de Next.
    'cloudflare/**',
    'node_modules/**',
    '.claude/**',
    'scripts/**',
    // El material comercial y los artefactos locales no viajan con el sitio.
    // Sus verificaciones se ejecutan con las herramientas de ventas.
    'carreras/**',
    'ventas/**',
    'herramientas/ventas/**',
    '.agents/**',
    'entregables/**',
    'contenidos/**',
    'output/**',
    '.playwright-cli/**',
    '.playwright-mcp/**',
    'notas-locales/**',
    'screenshots/**',
    'tmp/**',
    'ventas/fuentes/teclab/**',
    'next-env.d.ts',
  ]),
  {
    rules: {
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/use-memo': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-unused-expressions': 'warn',
    },
  },
]);
