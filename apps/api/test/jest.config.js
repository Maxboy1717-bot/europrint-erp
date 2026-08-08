module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '..',
  testRegex: 'test/.*\\.spec\\.ts$',
  // Stryker .stryker-tmp sandbox-* dir-larini test'dan ajratish (B bo'lim, Task 6).
  // Stryker alohida `pnpm test:mutation` script orqali ishlaydi.
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/.stryker-tmp/',
  ],
  // ESM-only paket'lar (uuid@14, nanoid, jose) Jest tomonidan transform qilinsin.
  // Default'cha node_modules transform qilinmaydi (Task 1).
  transformIgnorePatterns: [
    'node_modules/(?!(uuid|nanoid|jose|@anthropic-ai|@noble|@scure)/)',
  ],
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.json',
      // Enable type-checking but suppress the most common false-positive codes.
      // diagnostics: false was hiding real TS errors in test files — see Task 9.
      // If adding new codes causes unexpected failures, add their code to ignoreCodes.
      diagnostics: {
        ignoreCodes: [2322, 2345, 7006],
      },
      isolatedModules: true,
    }],
  },
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    '!src/**/*.spec.ts',
    '!src/**/*.dto.ts',
    '!src/**/dto/**',
    '!src/**/types/**',
    '!src/**/*.d.ts',
    '!src/main.ts',
    '!src/**/index.ts',
  ],
  coverageDirectory: '../coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  // Threshold step-up plan: 25% (current) → 50% (S3) → 70% (S5) → 80% (S6 final).
  // Lower bound enforced so coverage cannot regress. See TESTING_PROMPT.md §2.
  coverageThreshold: {
    global: {
      lines: 25,
      functions: 25,
      branches: 20,
      statements: 25,
    },
  },
  testEnvironment: 'node',
  setupFiles: ['reflect-metadata'],
  moduleNameMapper: {
    '^shared/guards/(.*)$': '<rootDir>/src/modules/shared/guards/$1',
    '^shared/decorators/(.*)$': '<rootDir>/src/modules/shared/decorators/$1',
    '^shared/interceptors/(.*)$': '<rootDir>/src/modules/shared/interceptors/$1',
    '^shared/infrastructure/(.*)$': '<rootDir>/src/modules/shared/infrastructure/$1',
    '^shared/domain/(.*)$': '<rootDir>/src/modules/shared/domain/$1',
    '^@shared/domain/(.*)$': '<rootDir>/src/modules/shared/domain/$1',
    '^@shared/guards/(.*)$': '<rootDir>/src/modules/shared/guards/$1',
    '^@shared/decorators/(.*)$': '<rootDir>/src/modules/shared/decorators/$1',
    '^@common/(.*)$': '<rootDir>/src/common/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@shared/db(.*)$': '<rootDir>/src/shared/db/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@europrint/schemas$': '<rootDir>/src/shared/db/europrint-compat.ts',
    '^@workspace/db$': '<rootDir>/../../lib/db/dist/cjs/index.js',
    '^@workspace/db/(.*)$': '<rootDir>/../../lib/db/dist/cjs/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@core/(.*)$': '<rootDir>/src/common/$1',
    '^@auth/types$': '<rootDir>/src/modules/auth/types',
    '^@auth/types/(.*)$': '<rootDir>/src/modules/auth/types/$1',
    '^@auth/decorators/(.*)$': '<rootDir>/src/modules/auth/infrastructure/decorators/$1',
    '^@auth/guards/(.*)$': '<rootDir>/src/modules/auth/infrastructure/guards/$1',
    '^@auth/(.*)$': '<rootDir>/src/modules/auth/$1',
    // ESM uuid v14 fix — uuid@14 is pure ESM; map to CJS shim (Task 3).
    '^uuid$': '<rootDir>/test/_setup/uuid-mock.js',
  },
};
