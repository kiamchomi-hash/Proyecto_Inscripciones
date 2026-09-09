import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypeScript from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  globalIgnores([
    '.next/**',
    'dist/**',
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
    'output/**',
    '.playwright-cli/**',
    '.playwright-mcp/**',
    '.vercel/**',
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
    },
  },
]);
