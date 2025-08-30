#!/usr/bin/env node

/**
 * @fileoverview Enhanced E2E Test Runner with Progress Tracking
 * Provides comprehensive progress reporting and test execution control
 * Usage: node tests/e2e/run-with-progress.js [options]
 */

const { execSync } = require('child_process');
const { progressTracker } = require('./progress-tracker');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  browser: 'chromium',
  headed: false,
  verbose: false,
  timeout: 60000,
  retries: 0,
  help: false
};

// Parse arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  
  switch (arg) {
    case '--browser':
    case '-b':
      options.browser = args[++i] || 'chromium';
      break;
    case '--headed':
    case '-h':
      options.headed = true;
      break;
    case '--verbose':
    case '-v':
      options.verbose = true;
      break;
    case '--timeout':
    case '-t':
      options.timeout = parseInt(args[++i]) || 60000;
      break;
    case '--retries':
    case '-r':
      options.retries = parseInt(args[++i]) || 0;
      break;
    case '--help':
      options.help = true;
      break;
    default:
      console.log(`Unknown option: ${arg}`);
      options.help = true;
      break;
  }
}

if (options.help) {
  console.log(`
Enhanced E2E Test Runner with Progress Tracking

Usage: node tests/e2e/run-with-progress.js [options]

Options:
  -b, --browser <browser>    Target browser (chromium, firefox, webkit) [default: chromium]
  -h, --headed               Run tests in headed mode (show browser)
  -v, --verbose             Enable verbose output
  -t, --timeout <ms>        Test timeout in milliseconds [default: 60000]
  -r, --retries <count>     Number of retries for failed tests [default: 0]
  --help                    Show this help message

Examples:
  node tests/e2e/run-with-progress.js
  node tests/e2e/run-with-progress.js --browser firefox --headed
  node tests/e2e/run-with-progress.js --verbose --timeout 120000
`);
  process.exit(0);
}

// Display startup information
console.log('\n🚀 Enhanced E2E Test Runner Starting');
console.log('='.repeat(60));
console.log(`🎯 Target Browser: ${options.browser}`);
console.log(`👁️  Headed Mode: ${options.headed ? 'Yes' : 'No'}`);
console.log(`🔍 Verbose Output: ${options.verbose ? 'Yes' : 'No'}`);
console.log(`⏱️  Test Timeout: ${options.timeout}ms`);
console.log(`🔄 Retries: ${options.retries}`);
console.log('='.repeat(60));

// Build Playwright command
let command = 'npx playwright test';
command += ` --project=${options.browser}`;

if (options.headed) {
  command += ' --headed';
}

if (options.verbose) {
  command += ' --verbose';
}

if (options.timeout !== 60000) {
  command += ` --timeout=${options.timeout}`;
}

if (options.retries > 0) {
  command += ` --retries=${options.retries}`;
}

// Add progress reporter
command += ' --reporter=./tests/e2e/progress-reporter.js';

console.log(`\n📋 Executing: ${command}`);
console.log('⏱️  Starting test execution...\n');

try {
  // Execute the command
  execSync(command, { 
    stdio: 'inherit',
    cwd: process.cwd(),
    env: { ...process.env, FORCE_COLOR: '1' }
  });
  
  console.log('\n🎉 All tests completed successfully!');
  
} catch (error) {
  console.log('\n❌ Test execution failed');
  console.log(`Exit code: ${error.status}`);
  
  if (error.status === 1) {
    console.log('Some tests failed - check the output above for details');
  } else {
    console.log('Test execution error - check the output above for details');
  }
  
  process.exit(error.status || 1);
}
