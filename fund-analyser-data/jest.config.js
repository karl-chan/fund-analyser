
module.exports = {
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json'
    }
  },
  testEnvironment: 'node',
  moduleFileExtensions: [
    'ts',
    'js'
  ],
  modulePathIgnorePatterns: [
    '<rootDir>/dist/'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  testMatch: [
    '**/*.test.(ts|js)'
  ],
  coverageReporters: [
    'json',
    'html'
  ],
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        filename: 'test-report.html',
        expand: true
      }
    ]
  ],
  setupFilesAfterEnv: [
    'jest-extended/all',
    'jest-chain'
  ]
}
