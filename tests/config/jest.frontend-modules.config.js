module.exports = {
  rootDir: '../../',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests/unit/frontend-modules'],
  testMatch: ['**/*.test.tsx'],
  transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: { target: 'ES2022', module: 'CommonJS', jsx: 'react-jsx', esModuleInterop: true, resolveJsonModule: true, strict: true, skipLibCheck: true, exactOptionalPropertyTypes: false, noUncheckedIndexedAccess: false, baseUrl: '.', paths: { 'react': ['frontend/node_modules/@types/react'], 'react/jsx-runtime': ['frontend/node_modules/@types/react/jsx-runtime'], 'react-dom': ['frontend/node_modules/@types/react-dom'], 'react-dom/client': ['frontend/node_modules/@types/react-dom/client'], '@tanstack/react-query': ['frontend/node_modules/@tanstack/react-query'] } } }] },
  moduleNameMapper: {
    '^react$': '<rootDir>/frontend/node_modules/react',
    '^react/jsx-runtime$': '<rootDir>/frontend/node_modules/react/jsx-runtime',
    '^react-dom$': '<rootDir>/frontend/node_modules/react-dom',
    '^react-dom/client$': '<rootDir>/frontend/node_modules/react-dom/client',
    '^@tanstack/react-query$': '<rootDir>/frontend/node_modules/@tanstack/react-query/build/modern/index.cjs',
    '\\.(css)$': '<rootDir>/tests/helpers/emptyStyles.cjs',
  },
  testTimeout: 15000,
};
