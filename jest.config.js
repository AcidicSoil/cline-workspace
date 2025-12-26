/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/packages'],
  testMatch: ['**/tests/**/*.test.ts'],
  transform: {
    '^.+\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json'
    }]
  },
  moduleNameMapper: {
    '^@workflow-pack/foundation/dist/(.*)$': '<rootDir>/packages/foundation/src/$1',
    '^@workflow-pack/workflow/dist/(.*)$': '<rootDir>/packages/workflow/src/$1',
    '^@workflow-pack/registry/dist/(.*)$': '<rootDir>/packages/registry/src/$1',
    '^@workflow-pack/runner/dist/(.*)$': '<rootDir>/packages/runner/src/$1',
    '^@workflow-pack/integrations/dist/(.*)$': '<rootDir>/packages/integrations/src/$1',
    '^@workflow-pack/workflows/dist/(.*)$': '<rootDir>/packages/workflows/src/$1',
    '^@workflow-pack/foundation$': '<rootDir>/packages/foundation/src',
    '^@workflow-pack/workflow$': '<rootDir>/packages/workflow/src',
    '^@workflow-pack/registry$': '<rootDir>/packages/registry/src',
    '^@workflow-pack/runner$': '<rootDir>/packages/runner/src',
    '^@workflow-pack/integrations$': '<rootDir>/packages/integrations/src',
    '^@workflow-pack/workflows$': '<rootDir>/packages/workflows/src',
  },
};
