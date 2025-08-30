/**
 * @fileoverview Global Teardown for E2E Tests
 * Generates final reports and cleans up test environment
 */

const { progressTracker } = require('./progress-tracker');

async function globalTeardown() {
  console.log('\n🧹 E2E Test Suite Global Teardown');
  console.log('==================================================');
  
  // Generate final progress report
  progressTracker.displayFinalSummary();
  
  // Additional teardown information
  console.log('\n📊 FINAL STATISTICS:');
  console.log(`   Total Tests: ${progressTracker.globalStats.totalTests}`);
  console.log(`   Passed: ${progressTracker.globalStats.passedTests}`);
  console.log(`   Failed: ${progressTracker.globalStats.failedTests}`);
  console.log(`   Skipped: ${progressTracker.globalStats.skippedTests}`);
  console.log(`   Success Rate: ${progressTracker.globalStats.totalTests > 0 ? Math.round((progressTracker.globalStats.passedTests / progressTracker.globalStats.totalTests) * 100) : 0}%`);
  
  console.log('\n🎯 E2E Test Suite completed');
  console.log('==================================================\n');
}

module.exports = globalTeardown;
