/**
 * AAEConnect Jest Testing Configuration
 * 
 * Optimized for high-performance testing of enterprise communication platform
 * with comprehensive coverage of all BMAD Method targets
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/src/**/__tests__/**/*.test.js',
    '**/frontend/src/**/*.test.js',
    '**/mobile/**/*.test.dart',
    '**/desktop/**/*.test.rs'
  ],
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  collectCoverageFrom: [
    'src/**/*.js',
    'frontend/src/**/*.{js,ts,svelte}',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/*.config.js',
    '!**/*.test.js'
  ],
  
  // Performance testing configuration
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Test timeout for performance tests
  testTimeout: 10000,
  
  // AAE-specific test configuration
  globals: {
    AAE_CONFIG: {
      company: 'Advanced ID Asia Engineering Co.,Ltd',
      location: 'Chiang Mai, Thailand',
      industry: 'Automotive Manufacturing & Engineering',
      compliance: ['ISO 9001:2015', 'IATF 16949'],
      performance_targets: {
        message_latency_ms: 25,
        database_query_ms: 10,
        memory_per_client_mb: 25,
        ui_fps_minimum: 60,
        ui_fps_target: 120,
        file_upload_init_ms: 500,
        startup_time_ms: 1000,
        search_performance_ms: 50,
        concurrent_users: 1000
      },
      bmad_method: {
        agents: 25,
        sprint_days: 3,
        autonomous: true
      }
    }
  },
  
  // Module name mapping for frontend testing
  moduleNameMapping: {
    '^\\$lib/(.*)$': '<rootDir>/frontend/src/lib/$1',
    '^\\$app/(.*)$': '<rootDir>/node_modules/@sveltejs/kit/src/runtime/app/$1'
  },
  
  // Transform configuration for different file types
  transform: {
    '^.+\\.svelte$': 'svelte-jester',
    '^.+\\.ts$': 'ts-jest',
    '^.+\\.js$': 'babel-jest'
  },
  
  // Test suites organization
  projects: [
    {
      displayName: '⚡ Performance Tests',
      testMatch: ['<rootDir>/tests/performance.test.js'],
      setupFilesAfterEnv: ['<rootDir>/tests/performance.setup.js']
    },
    {
      displayName: '🔗 Integration Tests', 
      testMatch: ['<rootDir>/tests/integration.test.js'],
      setupFilesAfterEnv: ['<rootDir>/tests/integration.setup.js']
    },
    {
      displayName: '🔒 Security Tests',
      testMatch: ['<rootDir>/tests/security.test.js'],
      setupFilesAfterEnv: ['<rootDir>/tests/security.setup.js']
    },
    {
      displayName: '🌐 Frontend Tests',
      testMatch: ['<rootDir>/frontend/src/**/*.test.{js,ts}'],
      testEnvironment: 'jsdom'
    },
    {
      displayName: '📱 Mobile Tests',
      testMatch: ['<rootDir>/mobile/**/*.test.dart'],
      runner: 'flutter-test'
    }
  ],
  
  // Reporters for different output formats
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: './coverage/html-report',
      filename: 'aae-test-report.html',
      pageTitle: 'AAEConnect Test Report - Advanced ID Asia Engineering',
      logoImgPath: './assets/aae-logo.png'
    }],
    ['jest-junit', {
      outputDirectory: './coverage',
      outputName: 'junit.xml',
      suiteName: 'AAEConnect Test Suite'
    }]
  ],
  
  // Performance monitoring during tests
  verbose: true,
  detectOpenHandles: true,
  forceExit: true,
  
  // Cache configuration for faster test runs
  cacheDirectory: '<rootDir>/.jest-cache',
  
  // Custom AAE test environment setup
  setupFiles: ['<rootDir>/tests/aae.setup.js'],
  
  // Coverage thresholds to maintain quality
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  
  // Mock configuration
  clearMocks: true,
  restoreMocks: true,
  
  // Watch mode configuration for development
  watchman: true,
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/coverage/',
    '<rootDir>/dist/',
    '<rootDir>/build/'
  ]
};