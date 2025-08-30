/**
 * @fileoverview E2E Test Progress Tracker
 * Provides real-time progress monitoring and statistics for Playwright E2E tests
 * Tracks test execution, timing, and generates comprehensive reports
 */

class E2EProgressTracker {
  constructor() {
    this.startTime = null;
    this.phases = new Map();
    this.currentPhase = null;
    this.testResults = new Map();
    this.globalStats = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      totalDuration: 0
    };
  }

  /**
   * Start tracking a new test phase
   * @param {string} phaseName - Name of the test phase
   */
  startPhase(phaseName) {
    this.currentPhase = phaseName;
    this.phases.set(phaseName, {
      name: phaseName,
      startTime: Date.now(),
      tests: new Set(),
      stats: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: 0
      }
    });
    
    console.log(`\n🚀 Starting Phase: ${phaseName}`);
    console.log(`⏰ Started at: ${new Date().toISOString()}`);
  }

  /**
   * Record when a test starts
   * @param {string} testName - Name of the test
   * @param {string} suiteName - Name of the test suite
   */
  testStarted(testName, suiteName) {
    if (!this.currentPhase) {
      this.startPhase('Default Phase');
    }

    const phase = this.phases.get(this.currentPhase);
    phase.tests.add(testName);
    phase.stats.total++;
    this.globalStats.totalTests++;

    const testKey = `${suiteName}:${testName}`;
    this.testResults.set(testKey, {
      name: testName,
      suite: suiteName,
      phase: this.currentPhase,
      startTime: Date.now(),
      status: 'running'
    });

    console.log(`\n📋 Test Started: ${testName}`);
    console.log(`   Suite: ${suiteName}`);
    console.log(`   Phase: ${this.currentPhase}`);
    this.updateProgress();
  }

  /**
   * Record when a test passes
   * @param {string} testName - Name of the test
   * @param {string} suiteName - Name of the test suite
   * @param {number} duration - Test duration in milliseconds
   */
  testPassed(testName, suiteName, duration) {
    const testKey = `${suiteName}:${testName}`;
    const testResult = this.testResults.get(testKey);
    
    if (testResult) {
      testResult.status = 'passed';
      testResult.duration = duration;
      testResult.endTime = Date.now();
    }

    if (this.currentPhase) {
      const phase = this.phases.get(this.currentPhase);
      phase.stats.passed++;
      phase.stats.duration += duration;
    }

    this.globalStats.passedTests++;
    this.globalStats.totalDuration += duration;

    console.log(`✅ Test Passed: ${testName}`);
    console.log(`   Duration: ${duration}ms`);
    this.updateProgress();
  }

  /**
   * Record when a test fails
   * @param {string} testName - Name of the test
   * @param {string} suiteName - Name of the test suite
   * @param {Error} error - Error that caused the test to fail
   * @param {number} duration - Test duration in milliseconds
   */
  testFailed(testName, suiteName, error, duration) {
    const testKey = `${suiteName}:${testName}`;
    const testResult = this.testResults.get(testKey);
    
    if (testResult) {
      testResult.status = 'failed';
      testResult.duration = duration;
      testResult.endTime = Date.now();
      testResult.error = error.message;
    }

    if (this.currentPhase) {
      const phase = this.phases.get(this.currentPhase);
      phase.stats.failed++;
      phase.stats.duration += duration;
    }

    this.globalStats.failedTests++;
    this.globalStats.totalDuration += duration;

    console.log(`❌ Test Failed: ${testName}`);
    console.log(`   Error: ${error.message}`);
    console.log(`   Duration: ${duration}ms`);
    this.updateProgress();
  }

  /**
   * Record when a test is skipped
   * @param {string} testName - Name of the test
   * @param {string} suiteName - Name of the test suite
   */
  testSkipped(testName, suiteName) {
    const testKey = `${suiteName}:${testName}`;
    const testResult = this.testResults.get(testKey);
    
    if (testResult) {
      testResult.status = 'skipped';
      testResult.endTime = Date.now();
    }

    if (this.currentPhase) {
      const phase = this.phases.get(this.currentPhase);
      phase.stats.skipped++;
    }

    this.globalStats.skippedTests++;

    console.log(`⏭️ Test Skipped: ${testName}`);
    this.updateProgress();
  }

  /**
   * Update and display current progress
   */
  updateProgress() {
    if (!this.currentPhase) return;

    const phase = this.phases.get(this.currentPhase);
    const totalTests = phase.stats.total;
    const completedTests = phase.stats.passed + phase.stats.failed + phase.stats.skipped;
    const progressPercent = totalTests > 0 ? Math.round((completedTests / totalTests) * 100) : 0;

    console.log(`\n📊 Progress Update - ${this.currentPhase}:`);
    console.log(`   Progress: ${completedTests}/${totalTests} (${progressPercent}%)`);
    console.log(`   Passed: ${phase.stats.passed}`);
    console.log(`   Failed: ${phase.stats.failed}`);
    console.log(`   Skipped: ${phase.stats.skipped}`);
    
    // Global progress
    const globalCompleted = this.globalStats.passedTests + this.globalStats.failedTests + this.globalStats.skippedTests;
    const globalProgressPercent = this.globalStats.totalTests > 0 ? Math.round((globalCompleted / this.globalStats.totalTests) * 100) : 0;
    
    console.log(`\n🌍 Global Progress: ${globalCompleted}/${this.globalStats.totalTests} (${globalProgressPercent}%)`);
    console.log(`   Total Passed: ${this.globalStats.passedTests}`);
    console.log(`   Total Failed: ${this.globalStats.failedTests}`);
    console.log(`   Total Skipped: ${this.globalStats.skippedTests}`);
  }

  /**
   * Generate final test report
   * @returns {Object} Comprehensive test report
   */
  generateReport() {
    const endTime = Date.now();
    const totalDuration = endTime - (this.startTime || endTime);

    const report = {
      summary: {
        startTime: this.startTime ? new Date(this.startTime).toISOString() : null,
        endTime: new Date(endTime).toISOString(),
        totalDuration: totalDuration,
        globalStats: { ...this.globalStats },
        successRate: this.globalStats.totalTests > 0 
          ? Math.round((this.globalStats.passedTests / this.globalStats.totalTests) * 100)
          : 0
      },
      phases: Array.from(this.phases.values()).map(phase => ({
        name: phase.name,
        stats: { ...phase.stats },
        tests: Array.from(phase.tests)
      })),
      testResults: Array.from(this.testResults.values())
    };

    return report;
  }

  /**
   * Display final summary
   */
  displayFinalSummary() {
    const report = this.generateReport();
    
    console.log('\n' + '='.repeat(80));
    console.log('🎯 E2E TEST EXECUTION COMPLETE');
    console.log('='.repeat(80));
    
    console.log(`\n📅 Execution Time: ${new Date(report.summary.startTime).toLocaleString()} - ${new Date(report.summary.endTime).toLocaleString()}`);
    console.log(`⏱️ Total Duration: ${Math.round(report.summary.totalDuration / 1000)}s`);
    
    console.log(`\n📊 Global Results:`);
    console.log(`   Total Tests: ${report.summary.globalStats.totalTests}`);
    console.log(`   Passed: ${report.summary.globalStats.passedTests} ✅`);
    console.log(`   Failed: ${report.summary.globalStats.failedTests} ❌`);
    console.log(`   Skipped: ${report.summary.globalStats.skippedTests} ⏭️`);
    console.log(`   Success Rate: ${report.summary.successRate}%`);
    
    console.log(`\n📋 Phase Breakdown:`);
    report.phases.forEach(phase => {
      const phaseSuccessRate = phase.stats.total > 0 
        ? Math.round((phase.stats.passed / phase.stats.total) * 100)
        : 0;
      
      console.log(`   ${phase.name}:`);
      console.log(`     Tests: ${phase.stats.passed}/${phase.stats.total} (${phaseSuccessRate}%)`);
      console.log(`     Duration: ${Math.round(phase.stats.duration / 1000)}s`);
    });

    if (report.summary.globalStats.failedTests > 0) {
      console.log(`\n❌ Failed Tests:`);
      report.testResults
        .filter(test => test.status === 'failed')
        .forEach(test => {
          console.log(`   ${test.suite}: ${test.name}`);
          if (test.error) {
            console.log(`     Error: ${test.error}`);
          }
        });
    }

    console.log('\n' + '='.repeat(80));
  }

  /**
   * Initialize the tracker
   */
  init() {
    this.startTime = Date.now();
    console.log('🚀 E2E Progress Tracker Initialized');
    console.log(`⏰ Started at: ${new Date(this.startTime).toISOString()}`);
  }
}

// Export singleton instance
const progressTracker = new E2EProgressTracker();

module.exports = { progressTracker };
