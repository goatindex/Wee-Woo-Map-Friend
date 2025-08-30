/**
 * @fileoverview Custom Playwright Reporter with Progress Tracking
 * Integrates with E2EProgressTracker for enhanced test reporting
 */

const { progressTracker } = require('./progress-tracker');

class ProgressReporter {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
    this.currentSuite = null;
    this.currentTest = null;
  }

  onBegin(config, suite) {
    console.log('\n🚀 Starting E2E Test Suite');
    console.log(`📋 Total test files: ${suite.suites.length}`);
    console.log(`🎯 Target browsers: ${config.projects.map(p => p.name).join(', ')}`);
    console.log('='.repeat(66));
  }

  onTestBegin(test, result) {
    this.currentTest = test;
    
    if (this.verbose) {
      console.log(`\n📋 Starting test: ${test.title}`);
      console.log(`   File: ${test.location.file}`);
      console.log(`   Line: ${test.location.line}`);
    }
  }

  onTestEnd(test, result) {
    const testName = test.title;
    const suiteName = test.parent.title || 'unknown';
    const duration = result.duration;
    
    if (result.status === 'passed') {
      progressTracker.testPassed(testName, suiteName, duration);
    } else if (result.status === 'failed') {
      const error = result.error || new Error('Test failed');
      progressTracker.testFailed(testName, suiteName, error, duration);
    } else if (result.status === 'skipped') {
      progressTracker.testSkipped(testName, suiteName);
    }
    
    this.currentTest = null;
  }

  onSuiteBegin(suite) {
    if (suite.title && suite.title !== '') {
      this.currentSuite = suite.title;
      progressTracker.startPhase(suite.title);
      
      if (this.verbose) {
        console.log(`\n📁 Suite: ${suite.title}`);
        console.log(`   Tests: ${suite.suites.length + suite.tests.length}`);
      }
    }
  }

  onSuiteEnd(suite) {
    if (suite.title && suite.title !== '') {
      if (this.verbose) {
        console.log(`\n✅ Suite completed: ${suite.title}`);
      }
    }
  }

  onEnd(result) {
    console.log('\n🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉');
    console.log('🏁 E2E TESTING COMPLETE - FINAL REPORT');
    console.log('🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉');
    
    try {
      // Display final summary from progress tracker
      progressTracker.displayFinalSummary();
    } catch (error) {
      console.error('Error generating final report:', error.message);
      
      // Fallback summary
      console.log('\n📊 Basic Test Results:');
      console.log(`   Total: ${result.status === 'passed' ? 'All tests passed' : 'Some tests failed'}`);
      console.log(`   Duration: ${Math.round(result.duration / 1000)}s`);
    }
  }

  onError(error) {
    console.error('\n❌ Reporter Error:', error.message);
    if (this.verbose) {
      console.error('Stack trace:', error.stack);
    }
  }
}

module.exports = ProgressReporter;
