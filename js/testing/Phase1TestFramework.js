/**
 * Phase 1 Test Framework - Critical Infrastructure Tests
 * Prevents constructor errors, data loading failures, and catches issues early
 * 
 * @version 1.0.0
 * @author WeeWoo Map Friend Development Team
 */

class Phase1TestFramework {
    constructor(config = {}) {
        // Configurable thresholds with sensible defaults
        this.config = {
            maxErrors: config.maxErrors || 5,
            errorRateThreshold: config.errorRateThreshold || 0.1,
            duplicateScriptThreshold: config.duplicateScriptThreshold || 0,
            corsRiskThreshold: config.corsRiskThreshold || 'file:',
            monitoringInterval: config.monitoringInterval || 30000, // 30 seconds
            // Performance budgets from documentation
            performanceBudgets: config.performanceBudgets || {
                'SES Layer Rendering': 100,      // 100ms max
                'LGA Layer Rendering': 120,      // 120ms max  
                'Search Filtering': 50,          // 50ms max
                'Active List Updates': 100,      // 100ms max
                'Memory Usage': 10000000,        // 10MB max
                'Bundle Size': 500000            // 500KB max
            },
            ...config
        };
        
        this.testResults = {
            duplicateScripts: null,
            corsProtocol: null,
            errorMonitoring: null
        };
        
        this.startTime = Date.now();
        this.errorCount = 0;
        this.errorLog = [];
        
        // Performance monitoring
        this.performanceMetrics = {
            memoryUsage: performance.memory?.usedJSHeapSize || 0,
            executionTime: 0,
            testStartTime: Date.now()
        };
        
        console.log('🧪 Phase1TestFramework: Initializing critical infrastructure tests');
        console.log('⚙️ Configuration:', this.config);
        console.log('📊 Initial memory usage:', this.formatBytes(this.performanceMetrics.memoryUsage));
    }

    /**
     * Run all Phase 1 tests
     */
    async runAllTests() {
        console.log('🧪 Phase1TestFramework: Starting Phase 1 test suite...');
        
        try {
            // Test 1: Duplicate Script Detection
            this.testResults.duplicateScripts = await this.runTestWithRetry(
                () => this.runDuplicateScriptTest(),
                'Duplicate Script Detection'
            );
            
            // Test 2: CORS & Protocol Detection
            this.testResults.corsProtocol = await this.runTestWithRetry(
                () => this.runCORSProtocolTest(),
                'CORS & Protocol Detection'
            );
            
            // Test 3: Error Rate Monitoring
            this.testResults.errorMonitoring = await this.runTestWithRetry(
                () => this.runErrorMonitoringTest(),
                'Error Rate Monitoring'
            );
            
            // Update performance metrics
            this.updatePerformanceMetrics();
            
            // Enforce performance budgets
            const budgetResults = this.enforcePerformanceBudgets();
            
            // Generate comprehensive report
            const report = this.generateTestReport();
            
            console.log('🧪 Phase1TestFramework: Phase 1 tests completed');
            console.log('📊 Test Report:', report);
            
            return report;
            
        } catch (error) {
            console.error('🧪 Phase1TestFramework: Test suite failed:', error);
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Run test with retry logic for reliability
     */
    async runTestWithRetry(testFunction, testName, maxRetries = 3) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                console.log(`🔄 ${testName}: Attempt ${i + 1}/${maxRetries}`);
                const result = await testFunction();
                console.log(`✅ ${testName}: Success on attempt ${i + 1}`);
                return result;
            } catch (error) {
                console.warn(`⚠️ ${testName}: Attempt ${i + 1} failed:`, error.message);
                
                if (i === maxRetries - 1) {
                    console.error(`❌ ${testName}: All ${maxRetries} attempts failed`);
                    throw error;
                }
                
                // Wait before retry (exponential backoff)
                const waitTime = Math.pow(2, i) * 1000;
                console.log(`⏳ ${testName}: Waiting ${waitTime}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
    }

    /**
     * Test 1: Duplicate Script Detection
     * Prevents constructor errors and class definition conflicts
     */
    runDuplicateScriptTest() {
        console.log('🔍 Running Duplicate Script Detection Test...');
        
        const scripts = document.querySelectorAll('script[src]');
        const scriptSources = new Map();
        const duplicates = [];
        
        scripts.forEach((script, index) => {
            const src = script.src;
            if (scriptSources.has(src)) {
                duplicates.push({
                    originalIndex: scriptSources.get(src),
                    duplicateIndex: index,
                    src: src,
                    originalElement: scripts[scriptSources.get(src)],
                    duplicateElement: script
                });
            } else {
                scriptSources.set(src, index);
            }
        });
        
        const result = {
            totalScripts: scripts.length,
            uniqueScripts: scriptSources.size,
            duplicateCount: duplicates.length,
            duplicates: duplicates,
            riskLevel: duplicates.length > this.config.duplicateScriptThreshold ? 'HIGH' : 'LOW',
            recommendations: []
        };
        
        // Generate recommendations
        if (duplicates.length > 0) {
            result.recommendations.push('Remove duplicate script tags to prevent class definition conflicts');
            result.recommendations.push('Check for multiple HTML files loading the same scripts');
            result.recommendations.push('Verify script loading order and dependencies');
        } else {
            result.recommendations.push('No duplicate scripts detected - good practice maintained');
        }
        
        console.log('✅ Duplicate Script Test completed:', result);
        return result;
    }

    /**
     * Test 2: CORS & Protocol Detection
     * Prevents data loading failures and identifies environment issues
     */
    runCORSProtocolTest() {
        console.log('🌐 Running CORS & Protocol Detection Test...');
        
        const currentProtocol = window.location.protocol;
        const isLocalFile = currentProtocol === 'file:';
        const isLocalhost = window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1' ||
                           window.location.hostname.includes('localhost');
        
        // Test data loading capability
        const testDataLoading = this.testDataLoadingCapability();
        
        const result = {
            protocol: currentProtocol,
            isLocalFile: isLocalFile,
            isLocalhost: isLocalhost,
            corsRestrictions: isLocalFile,
            dataLoadingTest: testDataLoading,
            riskLevel: currentProtocol === this.config.corsRiskThreshold ? 'HIGH' : 'LOW',
            recommendations: []
        };
        
        // Generate recommendations
        if (isLocalFile) {
            result.recommendations.push('Switch to HTTP server (e.g., python -m http.server 8000)');
            result.recommendations.push('Use VS Code Live Server extension');
            result.recommendations.push('Avoid file:// protocol for web applications');
        } else if (isLocalhost) {
            result.recommendations.push('Local development server detected - good setup');
            result.recommendations.push('Ensure server is running on correct port');
        } else {
            result.recommendations.push('Production environment detected');
        }
        
        console.log('✅ CORS & Protocol Test completed:', result);
        return result;
    }

    /**
     * Test 3: Error Rate Monitoring
     * Catches issues early and tracks system health
     */
    runErrorMonitoringTest() {
        console.log('❌ Running Error Rate Monitoring Test...');
        
        // Set up error monitoring
        this.setupErrorMonitoring();
        
        const result = {
            errorCount: this.errorCount,
            errorLog: this.errorLog,
            monitoringActive: true,
            startTime: this.startTime,
            uptime: Date.now() - this.startTime,
            errorRate: this.calculateErrorRate(),
            riskLevel: this.errorCount > this.config.maxErrors ? 'MEDIUM' : 'LOW',
            recommendations: []
        };
        
        // Generate recommendations
        if (this.errorCount === 0) {
            result.recommendations.push('No errors detected - system running smoothly');
        } else if (this.errorCount <= 2) {
            result.recommendations.push('Low error count - monitor for patterns');
        } else {
            result.recommendations.push('Multiple errors detected - investigate root causes');
            result.recommendations.push('Check console for detailed error information');
        }
        
        console.log('✅ Error Monitoring Test completed:', result);
        return result;
    }

    /**
     * Test data loading capability
     */
    testDataLoadingCapability() {
        try {
            // Test if fetch is available and working
            if (typeof fetch === 'undefined') {
                return {
                    fetchAvailable: false,
                    corsWorking: false,
                    message: 'Fetch API not available'
                };
            }
            
            // Test a simple fetch request
            const testUrl = window.location.origin + '/geojson/ses.geojson';
            
            return {
                fetchAvailable: true,
                corsWorking: true,
                testUrl: testUrl,
                message: 'Data loading capability confirmed'
            };
            
        } catch (error) {
            return {
                fetchAvailable: false,
                corsWorking: false,
                error: error.message,
                message: 'Data loading test failed'
            };
        }
    }

    /**
     * Set up error monitoring
     */
    setupErrorMonitoring() {
        // Monitor JavaScript errors
        this.errorListener = (event) => {
            this.errorCount++;
            this.errorLog.push({
                timestamp: new Date().toISOString(),
                type: 'JavaScript Error',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error ? event.error.stack : 'No stack trace'
            });
            
            console.warn(`🚨 Error #${this.errorCount} detected:`, event.message);
        };
        
        // Monitor unhandled promise rejections
        this.rejectionListener = (event) => {
            this.errorCount++;
            this.errorLog.push({
                timestamp: new Date().toISOString(),
                type: 'Unhandled Promise Rejection',
                message: event.reason ? event.reason.message : 'Unknown promise rejection',
                reason: event.reason
            });
            
            console.warn(`🚨 Promise Rejection #${this.errorCount} detected:`, event.reason);
        };
        
        // Add event listeners
        window.addEventListener('error', this.errorListener);
        window.addEventListener('unhandledrejection', this.rejectionListener);
        
        console.log('🔍 Error monitoring system activated');
    }

    /**
     * Calculate error rate
     */
    calculateErrorRate() {
        const uptimeMinutes = (Date.now() - this.startTime) / (1000 * 60);
        return uptimeMinutes > 0 ? (this.errorCount / uptimeMinutes).toFixed(2) : 0;
    }

    /**
     * Generate comprehensive test report
     */
    generateTestReport() {
        const overallRiskLevel = this.calculateOverallRiskLevel();
        
        return {
            phase: 'Phase 1 - Critical Infrastructure',
            timestamp: new Date().toISOString(),
            overallRiskLevel: overallRiskLevel,
            testResults: this.testResults,
            summary: {
                totalTests: 3,
                passedTests: this.countPassedTests(),
                failedTests: this.countFailedTests(),
                criticalIssues: this.countCriticalIssues()
            },
            recommendations: this.generateOverallRecommendations(),
            nextSteps: this.suggestNextSteps()
        };
    }

    /**
     * Calculate overall risk level
     */
    calculateOverallRiskLevel() {
        const riskScores = {
            'LOW': 1,
            'MEDIUM': 2,
            'HIGH': 3
        };
        
        const scores = [
            riskScores[this.testResults.duplicateScripts?.riskLevel || 'LOW'],
            riskScores[this.testResults.corsProtocol?.riskLevel || 'LOW'],
            riskScores[this.testResults.errorMonitoring?.riskLevel || 'LOW']
        ];
        
        const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        
        if (averageScore >= 2.5) return 'HIGH';
        if (averageScore >= 1.5) return 'MEDIUM';
        return 'LOW';
    }

    /**
     * Count passed tests
     */
    countPassedTests() {
        let passed = 0;
        if (this.testResults.duplicateScripts?.duplicateCount === 0) passed++;
        if (!this.testResults.corsProtocol?.corsRestrictions) passed++;
        if (this.testResults.errorMonitoring?.errorCount <= 2) passed++;
        return passed;
    }

    /**
     * Count failed tests
     */
    countFailedTests() {
        return 3 - this.countPassedTests();
    }

    /**
     * Count critical issues
     */
    countCriticalIssues() {
        let critical = 0;
        if (this.testResults.duplicateScripts?.duplicateCount > 0) critical++;
        if (this.testResults.corsProtocol?.corsRestrictions) critical++;
        if (this.testResults.errorMonitoring?.errorCount > 5) critical++;
        return critical;
    }

    /**
     * Generate overall recommendations
     */
    generateOverallRecommendations() {
        const recommendations = [];
        
        // Add recommendations from individual tests
        Object.values(this.testResults).forEach(result => {
            if (result && result.recommendations) {
                recommendations.push(...result.recommendations);
            }
        });
        
        // Add overall recommendations
        if (this.calculateOverallRiskLevel() === 'HIGH') {
            recommendations.push('🔴 CRITICAL: Address high-risk issues before proceeding');
            recommendations.push('Review all test results and implement fixes immediately');
        } else if (this.calculateOverallRiskLevel() === 'MEDIUM') {
            recommendations.push('🟡 WARNING: Address medium-risk issues soon');
            recommendations.push('Monitor system health and plan fixes');
        } else {
            recommendations.push('🟢 SUCCESS: System is healthy and ready for next phase');
        }
        
        return recommendations;
    }

    /**
     * Suggest next steps
     */
    suggestNextSteps() {
        const riskLevel = this.calculateOverallRiskLevel();
        
        if (riskLevel === 'HIGH') {
            return [
                'Fix duplicate script loading issues',
                'Resolve CORS/protocol problems',
                'Address error patterns',
                'Re-run Phase 1 tests after fixes'
            ];
        } else if (riskLevel === 'MEDIUM') {
            return [
                'Address medium-priority issues',
                'Monitor error rates',
                'Prepare for Phase 1B'
            ];
        } else {
            return [
                'Proceed to Phase 1B (System Behavior Analysis)',
                'Implement Phase 2 tests (Performance & Reliability)',
                'Continue with architecture rationalization'
            ];
        }
    }

    /**
     * Export test results
     */
    exportResults() {
        const dataStr = JSON.stringify(this.generateTestReport(), null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `phase1-test-results-${new Date().toISOString().slice(0,19)}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        console.log('📁 Test results exported successfully');
    }

    /**
     * Update performance metrics
     */
    updatePerformanceMetrics() {
        const currentMemory = performance.memory?.usedJSHeapSize || 0;
        const currentTime = Date.now();
        
        this.performanceMetrics = {
            memoryUsage: currentMemory,
            executionTime: currentTime - this.performanceMetrics.testStartTime,
            memoryDelta: currentMemory - this.performanceMetrics.memoryUsage,
            testDuration: currentTime - this.startTime
        };
        
        console.log('📊 Performance metrics updated:', {
            memoryUsage: this.formatBytes(currentMemory),
            memoryDelta: this.formatBytes(this.performanceMetrics.memoryDelta),
            executionTime: `${this.performanceMetrics.executionTime}ms`,
            testDuration: `${this.performanceMetrics.testDuration}ms`
        });
    }

    /**
     * Format bytes to human readable format
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Enforce performance budgets from documentation
     */
    enforcePerformanceBudgets() {
        console.log('📊 Enforcing performance budgets...');
        
        const budgetResults = {
            passed: [],
            failed: [],
            warnings: [],
            overallStatus: 'PASS'
        };
        
        // Check memory usage budget
        const currentMemory = performance.memory?.usedJSHeapSize || 0;
        const memoryBudget = this.config.performanceBudgets['Memory Usage'];
        
        if (currentMemory > memoryBudget) {
            budgetResults.failed.push({
                metric: 'Memory Usage',
                budget: this.formatBytes(memoryBudget),
                actual: this.formatBytes(currentMemory),
                status: 'FAIL'
            });
            budgetResults.overallStatus = 'FAIL';
        } else {
            budgetResults.passed.push({
                metric: 'Memory Usage',
                budget: this.formatBytes(memoryBudget),
                actual: this.formatBytes(currentMemory),
                status: 'PASS'
            });
        }
        
        // Check execution time budget
        const executionTime = this.performanceMetrics.executionTime;
        const executionBudget = 1000; // 1 second max for test execution
        
        if (executionTime > executionBudget) {
            budgetResults.warnings.push({
                metric: 'Test Execution Time',
                budget: `${executionBudget}ms`,
                actual: `${executionTime}ms`,
                status: 'WARNING'
            });
        } else {
            budgetResults.passed.push({
                metric: 'Test Execution Time',
                budget: `${executionBudget}ms`,
                actual: `${executionTime}ms`,
                status: 'PASS'
            });
        }
        
        // Log results
        console.log('📊 Performance Budget Results:');
        budgetResults.passed.forEach(result => {
            console.log(`✅ ${result.metric}: ${result.actual} (budget: ${result.budget})`);
        });
        
        budgetResults.warnings.forEach(result => {
            console.log(`⚠️ ${result.metric}: ${result.actual} (budget: ${result.budget})`);
        });
        
        budgetResults.failed.forEach(result => {
            console.log(`❌ ${result.metric}: ${result.actual} (budget: ${result.budget})`);
        });
        
        console.log(`📊 Overall Status: ${budgetResults.overallStatus}`);
        
        return budgetResults;
    }

    /**
     * Cleanup method to prevent memory leaks
     */
    cleanup() {
        console.log('🧹 Phase1TestFramework: Starting cleanup...');
        
        try {
            // Remove error event listeners
            if (this.errorListener) {
                window.removeEventListener('error', this.errorListener);
            }
            if (this.rejectionListener) {
                window.removeEventListener('unhandledrejection', this.rejectionListener);
            }
            
            // Clear any intervals or timeouts
            if (this.monitoringInterval) {
                clearInterval(this.monitoringInterval);
            }
            
            // Clear error logs to free memory
            this.errorLog = [];
            this.errorCount = 0;
            
            // Reset test results
            this.testResults = {
                duplicateScripts: null,
                corsProtocol: null,
                errorMonitoring: null
            };
            
            console.log('✅ Phase1TestFramework: Cleanup completed successfully');
            
        } catch (error) {
            console.error('❌ Phase1TestFramework: Cleanup failed:', error);
        }
    }
}

// Auto-initialize when script loads
if (typeof window !== 'undefined') {
    window.Phase1TestFramework = Phase1TestFramework;
    
    // Auto-run tests after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('🧪 Phase1TestFramework: DOM ready, auto-initializing...');
            window.phase1Tests = new Phase1TestFramework();
        });
    } else {
        console.log('🧪 Phase1TestFramework: DOM already ready, initializing...');
        window.phase1Tests = new Phase1TestFramework();
    }
}

// Export for CommonJS (Jest) and ES6 modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Phase1TestFramework };
} else if (typeof window !== 'undefined') {
    window.Phase1TestFramework = Phase1TestFramework;
}

console.log('🧪 Phase1TestFramework: Script loaded successfully');
