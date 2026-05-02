module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '..',
  testRegex: 'src/.*\\.dto\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
  testEnvironment: 'node',
  moduleNameMapper: {
    '^shared/guards/(.*)$': '<rootDir>/src/modules/shared/guards/$1',
    '^shared/decorators/(.*)$': '<rootDir>/src/modules/shared/decorators/$1',
    '^@common/(.*)$': '<rootDir>/src/common/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@europrint/schemas$': '<rootDir>/../../lib/db/dist/cjs/index.js',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@core/(.*)$': '<rootDir>/src/common/$1',
  },
};
