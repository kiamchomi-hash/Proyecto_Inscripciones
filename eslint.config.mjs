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
    'migracion_pendiente/**',
    'archivados/**',
    'shared_skills/**',
    'testsprite_tests/**',
    'scripts/**',
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
