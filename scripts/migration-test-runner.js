#!/usr/bin/env node
/**
 * Migration Test Runner
 * Automated testing pipeline for Controlled Aggressive Elimination migration
 * Runs tests continuously and provides real-time feedback
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class MigrationTestRunner {
  constructor() {
    this.testResults = [];
    this.isRunning = false;
    this.watchMode = false;
    this.lastRunTime = null;
    this.startTime = Date.now();
    
    // Test configuration
    this.config = {
      testCommand: 'npm test',
      watchCommand: 'npm test -- --watch',
      maxRetries: 3,
      retryDelay: 2000,
      logFile: 'migration-test-results.log'
    };
    
    console.log('🧪 Migration Test Runner initialized');
    console.log(`📁 Log file: ${this.config.logFile}`);
  }
  
  /**
   * Start the test runner
   */
  async start(options = {}) {
    this.watchMode = options.watch || false;
    this.isRunning = true;
    
    console.log(`🚀 Starting migration test runner (${this.watchMode ? 'watch' : 'single'} mode)`);
    
    if (this.watchMode) {
      await this.runWatchMode();
    } else {
      await this.runSingleTest();
    }
  }
  
  /**
   * Run tests in watch mode
   */
  async runWatchMode() {
    console.log('👀 Running tests in watch mode...');
    
    const testProcess = spawn('npm', ['test', '--', '--watch'], {
      stdio: 'pipe',
      shell: true
    });
    
    testProcess.stdout.on('data', (data) => {
      this.handleTestOutput(data.toString());
    });
    
    testProcess.stderr.on('data', (data) => {
      this.handleTestError(data.toString());
    });
    
    testProcess.on('close', (code) => {
      console.log(`🔄 Test process exited with code ${code}`);
      if (this.isRunning) {
        console.log('🔄 Restarting test runner...');
        setTimeout(() => this.runWatchMode(), 1000);
      }
    });
    
    // Handle process termination
    process.on('SIGINT', () => {
      console.log('\n🛑 Stopping test runner...');
      this.isRunning = false;
      testProcess.kill('SIGINT');
      process.exit(0);
    });
  }
  
  /**
   * Run a single test suite
   */
  async runSingleTest() {
    console.log('🧪 Running single test suite...');
    
    try {
      const result = await this.executeTest();
      this.logTestResult(result);
      
      if (result.success) {
        console.log('✅ All tests passed!');
        process.exit(0);
      } else {
        console.log('❌ Some tests failed!');
        process.exit(1);
      }
    } catch (error) {
      console.error('🚨 Test execution failed:', error.message);
      process.exit(1);
    }
  }
  
  /**
   * Execute the test command
   */
  executeTest() {
    return new Promise((resolve, reject) => {
      const testProcess = spawn('npm', ['test'], {
        stdio: 'pipe',
        shell: true
      });
      
      let stdout = '';
      let stderr = '';
      
      testProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      testProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      testProcess.on('close', (code) => {
        const result = {
          success: code === 0,
          exitCode: code,
          stdout,
          stderr,
          timestamp: new Date().toISOString()
        };
        
        resolve(result);
      });
      
      testProcess.on('error', (error) => {
        reject(error);
      });
    });
  }
  
  /**
   * Handle test output in watch mode
   */
  handleTestOutput(output) {
    const lines = output.split('\n');
    
    lines.forEach(line => {
      if (line.trim()) {
        console.log(`[TEST] ${line}`);
        
        // Parse test results
        if (line.includes('PASS') || line.includes('FAIL')) {
          this.parseTestResult(line);
        }
        
        // Log to file
        this.logToFile(`[${new Date().toISOString()}] ${line}`);
      }
    });
  }
  
  /**
   * Handle test errors
   */
  handleTestError(error) {
    console.error(`[ERROR] ${error}`);
    this.logToFile(`[${new Date().toISOString()}] ERROR: ${error}`);
  }
  
  /**
   * Parse test result from output line
   */
  parseTestResult(line) {
    const timestamp = new Date().toISOString();
    
    if (line.includes('PASS')) {
      console.log(`✅ ${line}`);
      this.testResults.push({
        type: 'PASS',
        line,
        timestamp
      });
    } else if (line.includes('FAIL')) {
      console.log(`❌ ${line}`);
      this.testResults.push({
        type: 'FAIL',
        line,
        timestamp
      });
    }
  }
  
  /**
   * Log test result to file
   */
  logTestResult(result) {
    const logEntry = {
      timestamp: result.timestamp,
      success: result.success,
      exitCode: result.exitCode,
      duration: Date.now() - this.startTime,
      stdout: result.stdout,
      stderr: result.stderr
    };
    
    this.logToFile(JSON.stringify(logEntry, null, 2));
  }
  
  /**
   * Log message to file
   */
  logToFile(message) {
    try {
      fs.appendFileSync(this.config.logFile, message + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error.message);
    }
  }
  
  /**
   * Generate test summary
   */
  generateSummary() {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.type === 'PASS').length;
    const failedTests = this.testResults.filter(r => r.type === 'FAIL').length;
    
    const summary = {
      totalTests,
      passedTests,
      failedTests,
      successRate: totalTests > 0 ? (passedTests / totalTests * 100).toFixed(2) : 0,
      duration: Date.now() - this.startTime,
      timestamp: new Date().toISOString()
    };
    
    console.log('\n📊 Test Summary:');
    console.log(`   Total Tests: ${summary.totalTests}`);
    console.log(`   Passed: ${summary.passedTests}`);
    console.log(`   Failed: ${summary.failedTests}`);
    console.log(`   Success Rate: ${summary.successRate}%`);
    console.log(`   Duration: ${(summary.duration / 1000).toFixed(2)}s`);
    
    return summary;
  }
  
  /**
   * Stop the test runner
   */
  stop() {
    this.isRunning = false;
    console.log('🛑 Test runner stopped');
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    watch: args.includes('--watch') || args.includes('-w'),
    help: args.includes('--help') || args.includes('-h')
  };
  
  if (options.help) {
    console.log(`
Migration Test Runner

Usage:
  node scripts/migration-test-runner.js [options]

Options:
  --watch, -w    Run tests in watch mode
  --help, -h     Show this help message

Examples:
  node scripts/migration-test-runner.js              # Run single test
  node scripts/migration-test-runner.js --watch      # Run tests in watch mode
    `);
    process.exit(0);
  }
  
  const runner = new MigrationTestRunner();
  
  // Handle process termination
  process.on('SIGINT', () => {
    runner.stop();
    process.exit(0);
  });
  
  // Start the runner
  runner.start(options).catch(error => {
    console.error('Failed to start test runner:', error);
    process.exit(1);
  });
}

module.exports = MigrationTestRunner;
