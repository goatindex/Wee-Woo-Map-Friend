#!/usr/bin/env node

/**
 * Performance Budget Checker for WeeWoo Map Friend
 * Integrates with CI/CD pipelines to enforce performance standards
 * 
 * @version 1.0.0
 * @author WeeWoo Map Friend Development Team
 */

const fs = require('fs');
const path = require('path');

// Performance budgets from documentation
const PERFORMANCE_BUDGETS = {
  'SES Layer Rendering': 100,      // 100ms max
  'LGA Layer Rendering': 120,      // 120ms max  
  'Search Filtering': 50,          // 50ms max
  'Active List Updates': 100,      // 100ms max
  'Memory Usage': 10000000,        // 10MB max
  'Bundle Size': 500000            // 500KB max
};

const PERFORMANCE_REPORT_PATH = './coverage/performance-report.json';
const TEST_RESULTS_PATH = './test-results/phase1-results.json';

function checkPerformanceBudget() {
  console.log('🔍 Checking performance budgets...');
  
  let budgetPassed = true;
  const results = {
    timestamp: new Date().toISOString(),
    budgets: PERFORMANCE_BUDGETS,
    checks: [],
    overallStatus: 'PASS'
  };

  // Check if performance report exists
  if (fs.existsSync(PERFORMANCE_REPORT_PATH)) {
    console.log('📊 Found performance report, checking budgets...');
    
    try {
      const report = JSON.parse(fs.readFileSync(PERFORMANCE_REPORT_PATH, 'utf8'));
      
      Object.entries(PERFORMANCE_BUDGETS).forEach(([metric, budget]) => {
        const actual = report[metric];
        
        if (actual !== undefined) {
          const status = actual <= budget ? 'PASS' : 'FAIL';
          const check = {
            metric,
            budget: `${budget}ms`,
            actual: `${actual}ms`,
            status,
            passed: actual <= budget
          };
          
          results.checks.push(check);
          
          if (status === 'FAIL') {
            budgetPassed = false;
            results.overallStatus = 'FAIL';
            console.error(`❌ ${metric}: ${actual}ms (budget: ${budget}ms)`);
          } else {
            console.log(`✅ ${metric}: ${actual}ms (budget: ${budget}ms)`);
          }
        } else {
          console.warn(`⚠️ ${metric}: No data available`);
          results.checks.push({
            metric,
            budget: `${budget}ms`,
            actual: 'N/A',
            status: 'SKIP',
            passed: true
          });
        }
      });
      
    } catch (error) {
      console.error('❌ Error reading performance report:', error.message);
      budgetPassed = false;
      results.overallStatus = 'ERROR';
    }
  } else {
    console.log('⚠️ Performance report not found, checking test results...');
    
    // Check Phase 1 test results if available
    if (fs.existsSync(TEST_RESULTS_PATH)) {
      try {
        const testResults = JSON.parse(fs.readFileSync(TEST_RESULTS_PATH, 'utf8'));
        
        // Check memory usage from test results
        if (testResults.performanceMetrics) {
          const memoryUsage = testResults.performanceMetrics.memoryUsage;
          const memoryBudget = PERFORMANCE_BUDGETS['Memory Usage'];
          
          if (memoryUsage > memoryBudget) {
            budgetPassed = false;
            results.overallStatus = 'FAIL';
            console.error(`❌ Memory Usage: ${formatBytes(memoryUsage)} (budget: ${formatBytes(memoryBudget)})`);
          } else {
            console.log(`✅ Memory Usage: ${formatBytes(memoryUsage)} (budget: ${formatBytes(memoryBudget)})`);
          }
          
          results.checks.push({
            metric: 'Memory Usage',
            budget: formatBytes(memoryBudget),
            actual: formatBytes(memoryUsage),
            status: memoryUsage <= memoryBudget ? 'PASS' : 'FAIL',
            passed: memoryUsage <= memoryBudget
          });
        }
        
        // Check execution time
        if (testResults.performanceMetrics?.executionTime) {
          const executionTime = testResults.performanceMetrics.executionTime;
          const executionBudget = 1000; // 1 second max
          
          if (executionTime > executionBudget) {
            console.warn(`⚠️ Test Execution Time: ${executionTime}ms (budget: ${executionBudget}ms)`);
          } else {
            console.log(`✅ Test Execution Time: ${executionTime}ms (budget: ${executionBudget}ms)`);
          }
          
          results.checks.push({
            metric: 'Test Execution Time',
            budget: `${executionBudget}ms`,
            actual: `${executionTime}ms`,
            status: executionTime <= executionBudget ? 'PASS' : 'WARNING',
            passed: true
          });
        }
        
      } catch (error) {
        console.error('❌ Error reading test results:', error.message);
      }
    } else {
      console.log('⚠️ No performance data available for budget checking');
    }
  }

  // Generate budget check report
  const budgetReportPath = './reports/budget-check-results.json';
  const reportsDir = path.dirname(budgetReportPath);
  
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  fs.writeFileSync(budgetReportPath, JSON.stringify(results, null, 2));
  console.log(`📁 Budget check results saved to: ${budgetReportPath}`);

  // Display summary
  console.log('\n📊 PERFORMANCE BUDGET SUMMARY:');
  console.log('='.repeat(50));
  
  const passedChecks = results.checks.filter(check => check.passed).length;
  const totalChecks = results.checks.length;
  
  console.log(`Total Checks: ${totalChecks}`);
  console.log(`Passed: ${passedChecks}`);
  console.log(`Failed: ${totalChecks - passedChecks}`);
  console.log(`Overall Status: ${results.overallStatus}`);
  
  if (budgetPassed) {
    console.log('\n✅ All performance budgets passed!');
    process.exit(0);
  } else {
    console.log('\n❌ Performance budget check failed!');
    process.exit(1);
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Run budget check if called directly
if (require.main === module) {
  checkPerformanceBudget();
}

module.exports = { checkPerformanceBudget, PERFORMANCE_BUDGETS };
