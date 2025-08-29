/**
 * Phase 1 Test Runner
 * Simple script to execute Phase 1 tests and display results
 */

console.log('🚀 Starting Phase 1 Test Execution...');

// Wait for Phase1TestFramework to be available
function waitForFramework() {
    if (window.Phase1TestFramework) {
        console.log('✅ Phase1TestFramework found, starting tests...');
        runTests();
    } else {
        console.log('⏳ Waiting for Phase1TestFramework to load...');
        setTimeout(waitForFramework, 100);
    }
}

async function runTests() {
    try {
        // Create test instance
        const testFramework = new window.Phase1TestFramework();
        
        // Run all tests
        console.log('🧪 Executing Phase 1 test suite...');
        const results = await testFramework.runAllTests();
        
        // Display results in console
        displayResults(results);
        
        // Make results available globally
        window.phase1TestResults = results;
        
        console.log('🎉 Phase 1 tests completed successfully!');
        console.log('📊 Results available as: window.phase1TestResults');
        console.log('📁 Export results with: window.phase1Tests.exportResults()');
        
    } catch (error) {
        console.error('❌ Phase 1 test execution failed:', error);
    }
}

function displayResults(results) {
    console.log('\n' + '='.repeat(60));
    console.log('🧪 PHASE 1 TEST RESULTS');
    console.log('='.repeat(60));
    
    console.log(`📅 Timestamp: ${results.timestamp}`);
    console.log(`🎯 Overall Risk Level: ${results.overallRiskLevel}`);
    console.log(`📊 Summary: ${results.summary.passedTests}/${results.summary.totalTests} tests passed`);
    console.log(`🚨 Critical Issues: ${results.summary.criticalIssues}`);
    
    console.log('\n📋 RECOMMENDATIONS:');
    results.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
    });
    
    console.log('\n➡️ NEXT STEPS:');
    results.nextSteps.forEach((step, index) => {
        console.log(`   ${index + 1}. ${step}`);
    });
    
    console.log('\n' + '='.repeat(60));
}

// Start the test process
waitForFramework();
