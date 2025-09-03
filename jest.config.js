/**
 * Jest Configuration for WeeWoo Map Friend
 * Supports ES6 modules and modern JavaScript features
 */

module.exports = {
  // Test environment
  testEnvironment: 'jsdom',
  
  // File extensions to process
  moduleFileExtensions: ['js', 'json', 'jsx'],
  
  // Transform configuration
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // Module name mapping for cleaner imports
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/js/$1',
    '^@modules/(.*)$': '<rootDir>/js/modules/$1',
    '^@components/(.*)$': '<rootDir>/js/components/$1',
    '^@utils/(.*)$': '<rootDir>/js/utils/$1'
  },
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Test file patterns (exclude Playwright tests)
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/js/modules/**/*.test.js',
    '<rootDir>/js/components/**/*.test.js'
  ],
  
  // Exclude Playwright tests from Jest
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/integration/',
    '/tests/es6-modules/',
    '/tests/console/',
    '/tests/performance/'
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'js/modules/**/*.js',
    'js/components/**/*.js',
    '!js/modules/**/*.test.js',
    '!js/components/**/*.test.js',
    '!js/modules/**/index.js'
  ],
  
  // Coverage thresholds (lowered during migration)
  coverageThreshold: {
    global: {
      branches: 25,
      functions: 25,
      lines: 25,
      statements: 25
    }
  },
  
  // Test timeout
  testTimeout: 10000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks between tests
  restoreMocks: true,
  

  
  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$|@turf|proj4))'
  ],
  
  // Module directories
  moduleDirectories: ['node_modules', 'js'],
  
  // Test environment options
  testEnvironmentOptions: {
    url: 'http://localhost:8000'
  }
};
