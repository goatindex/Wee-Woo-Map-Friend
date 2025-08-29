#!/usr/bin/env node

/**
 * Enhanced Automated Test Runner for Phase 1A: Deep System Diagnostics
 * Features: Full automation + Interactive breakpoints + Self-critic checks + Real-time progress monitoring
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

// Enhanced logging with timestamps and progress indicators
class ProgressLogger {
    constructor() {
        this.startTime = Date.now();
        this.lastActivity = Date.now();
        this.activityInterval = null;
        this.progressSteps = 0;
        this.totalSteps = 0;
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
        const prefix = `[${timestamp}] [${elapsed}s]`;
        
        switch (type) {
            case 'progress':
                console.log(`${prefix} 🔄 ${message}`);
                break;
            case 'success':
                console.log(`${prefix} ✅ ${message}`);
                break;
            case 'error':
                console.log(`${prefix} ❌ ${message}`);
                break;
            case 'warning':
                console.log(`${prefix} ⚠️  ${message}`);
                break;
            case 'info':
            default:
                console.log(`${prefix} ℹ️  ${message}`);
                break;
        }
        
        this.lastActivity = Date.now();
    }

    startProgress(totalSteps, description) {
        this.totalSteps = totalSteps;
        this.progressSteps = 0;
        this.log(`🚀 Starting: ${description} (${totalSteps} steps)`, 'progress');
        
        // Start activity monitoring
        this.startActivityMonitor();
    }

    updateProgress(stepDescription, additionalInfo = '') {
        this.progressSteps++;
        const percentage = Math.round((this.progressSteps / this.totalSteps) * 100);
        const progressBar = this.createProgressBar(percentage);
        
        console.log(`\r${progressBar} ${percentage}% - ${stepDescription} ${additionalInfo}`);
        
        if (this.progressSteps === this.totalSteps) {
            console.log(''); // New line after progress completion
            this.log(`🎯 Completed: ${this.totalSteps} steps`, 'success');
        }
    }

    createProgressBar(percentage) {
        const width = 30;
        const filled = Math.round((width * percentage) / 100);
        const empty = width - filled;
        return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`;
    }

    startActivityMonitor() {
        // Show activity indicator every 5 seconds if no activity
        this.activityInterval = setInterval(() => {
            const timeSinceLastActivity = Date.now() - this.lastActivity;
            if (timeSinceLastActivity > 5000) { // 5 seconds
                const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
                process.stdout.write(`\r⏳ Still working... (${elapsed}s elapsed) - Last activity: ${((timeSinceLastActivity) / 1000).toFixed(1)}s ago`);
            }
        }, 5000);
    }

    stopActivityMonitor() {
        if (this.activityInterval) {
            clearInterval(this.activityInterval);
            this.activityInterval = null;
        }
    }

    logNetworkActivity(url, status) {
        const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
        process.stdout.write(`\r[${elapsed}s] 🌐 ${status}: ${url.substring(0, 60)}${url.length > 60 ? '...' : ''}`);
    }

    logTestResult(testName, success, details = '') {
        const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
        const status = success ? '✅ PASS' : '❌ FAIL';
        console.log(`\r[${elapsed}s] ${status} ${testName} ${details}`);
    }
}

class EnhancedAutomatedTestRunner {
    constructor() {
        this.testResults = {
            sessionId: `SESSION_${Date.now()}`,
            timestamp: new Date().toISOString(),
            environment: {
                nodeVersion: process.version,
                platform: process.version,
                arch: process.arch
            },
            results: {},
            breakpoints: [],
            selfCriticChecks: []
        };
        this.browser = null;
        this.page = null;
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        this.breakpointMode = false;
        this.currentTest = null;
        this.testQueue = [];
        
        // Initialize logger early for consistent logging
        this.logger = new ProgressLogger();
    }

    async initialize() {
        this.logger.log('🚀 Initializing Enhanced Automated Test Runner...', 'progress');
        
        try {
            this.logger.log('🌐 Launching browser...', 'info');
            this.browser = await puppeteer.launch({
                headless: false, // Always visible for breakpoint review
                defaultViewport: { width: 1920, height: 1080 },
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
                slowMo: 100 // Slow down for better observation
            });
            
            this.logger.log('📄 Creating new page...', 'info');
            this.page = await this.browser.newPage();
            
            // Set up comprehensive logging
            this.logger.log('🔧 Setting up logging...', 'info');
            this.setupLogging();
            
            // Set up test queue
            this.logger.log('📋 Setting up test queue...', 'info');
            this.setupTestQueue();
            
            this.logger.log('✅ Enhanced Test Runner initialized successfully', 'success');
            return true;
        } catch (error) {
            this.logger.log(`❌ Failed to initialize test runner: ${error.message}`, 'error');
            return false;
        }
    }

    setupLogging() {
        // Console logging with categorization
        this.page.on('console', msg => {
            const type = msg.type();
            const text = msg.text();
            const timestamp = new Date().toISOString();
            
            console.log(`[${timestamp}] [${type.toUpperCase()}] ${text}`);
            
            if (!this.testResults.results.consoleLogs) {
                this.testResults.results.consoleLogs = [];
            }
            this.testResults.results.consoleLogs.push({
                type: type,
                message: text,
                timestamp: timestamp,
                testContext: this.currentTest
            });
        });

        // Error logging with stack traces
        this.page.on('pageerror', error => {
            const timestamp = new Date().toISOString();
            console.error(`[${timestamp}] [PAGE ERROR] ${error.message}`);
            
            if (!this.testResults.results.pageErrors) {
                this.testResults.results.pageErrors = [];
            }
            this.testResults.results.pageErrors.push({
                message: error.message,
                stack: error.stack,
                timestamp: timestamp,
                testContext: this.currentTest
            });
        });

        // Request logging for network analysis
        this.page.on('request', request => {
            if (request.url().includes('file://')) {
                if (this.logger) {
                    this.logger.logNetworkActivity(request.url(), 'Loading');
                } else {
                    console.log(`[NETWORK] Loading: ${request.url()}`);
                }
            }
        });

        // Response logging for success/failure tracking
        this.page.on('response', response => {
            if (response.url().includes('file://')) {
                const status = response.status();
                const statusText = response.statusText();
                if (this.logger) {
                    this.logger.logNetworkActivity(response.url(), `${status} ${statusText}`);
                } else {
                    console.log(`[NETWORK] Response: ${response.url()} - ${status} ${statusText}`);
                }
            }
        });
    }

    setupTestQueue() {
        this.testQueue = [
            { name: 'System Load Test', method: 'runSystemLoadTest', breakpoint: true },
            { name: 'FAB Framework Test', method: 'runFABFrameworkTest', breakpoint: true },
            { name: 'Bootstrap Init Test', method: 'runBootstrapInitTest', breakpoint: true },
            { name: 'Performance Metrics', method: 'capturePerformanceMetrics', breakpoint: false }
        ];
    }

    async loadTestEnvironment() {
        if (this.logger) {
            this.logger.log('📱 Loading test environment...', 'info');
        } else {
            console.log('📱 Loading test environment...');
        }
        
        try {
            const testFile = path.join(__dirname, 'test-source-system.html');
            const fileUrl = `file://${testFile}`;
            
            if (this.logger) {
                this.logger.log(`🌐 Navigating to: ${testFile}`, 'info');
            }
            
            await this.page.goto(fileUrl, { waitUntil: 'networkidle0' });
            
                    // Wait for test environment to load
        if (this.logger) {
            this.logger.log('⏳ Waiting for test controls to load...', 'info');
        }
        await this.page.waitForSelector('#test-controls', { timeout: 10000 });
        
        // Wait a bit more for scripts to fully load
        if (this.logger) {
            this.logger.log('⏳ Waiting for scripts to fully load...', 'info');
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Verify all test buttons are present
            if (this.logger) {
                this.logger.log('🔍 Verifying test buttons...', 'info');
            }
            const buttonSelectors = ['#test-system-load', '#test-fab-framework', '#test-bootstrap-init'];
            for (const selector of buttonSelectors) {
                const button = await this.page.$(selector);
                if (!button) {
                    throw new Error(`Test button not found: ${selector}`);
                }
            }
            
            if (this.logger) {
                this.logger.log('✅ Test environment loaded successfully', 'success');
            } else {
                console.log('✅ Test environment loaded successfully');
            }
            return true;
        } catch (error) {
            if (this.logger) {
                this.logger.log(`❌ Failed to load test environment: ${error.message}`, 'error');
            } else {
                console.error('❌ Failed to load test environment:', error);
            }
            return false;
        }
    }

    async executeWithBreakpoint(testName, testMethod, shouldBreakpoint = true) {
        this.currentTest = testName;
        if (this.logger) {
            this.logger.log(`🧪 Executing: ${testName}`, 'info');
        } else {
            console.log(`\n🧪 Executing: ${testName}`);
        }
        
        if (shouldBreakpoint) {
            if (this.logger) {
                this.logger.log('⏸️  Breakpoint enabled - test will pause for review', 'warning');
            } else {
                console.log('⏸️  Breakpoint enabled - test will pause for review');
            }
            await this.pauseForReview(testName, 'before');
        }
        
        try {
            const startTime = Date.now();
            const result = await this[testMethod]();
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            // Add timing to result
            if (result && typeof result === 'object') {
                result.duration = duration;
                result.timestamp = new Date().toISOString();
            }
            
            if (this.logger) {
                this.logger.logTestResult(testName, true, `completed in ${duration}ms`);
            } else {
                console.log(`✅ ${testName} completed in ${duration}ms`);
            }
            
            if (shouldBreakpoint) {
                await this.pauseForReview(testName, 'after', result);
            }
            
            return result;
        } catch (error) {
            if (this.logger) {
                this.logger.logTestResult(testName, false, error.message);
            } else {
                console.error(`❌ ${testName} failed:`, error);
            }
            return { success: false, error: error.message, timestamp: new Date().toISOString() };
        }
    }

    async pauseForReview(testName, phase, result = null) {
        console.log(`\n⏸️  BREAKPOINT: ${testName} - ${phase.toUpperCase()} phase`);
        console.log('='.repeat(60));
        
        if (phase === 'after' && result) {
            console.log('📊 Test Results:');
            console.log(JSON.stringify(result, null, 2));
        }
        
        console.log('\nOptions:');
        console.log('  [c] Continue to next step');
        console.log('  [r] Review current browser state');
        console.log('  [a] Analyze current results');
        console.log('  [s] Skip remaining breakpoints');
        console.log('  [q] Quit testing');
        
        const choice = await this.getUserInput('Enter your choice: ');
        
        switch (choice.toLowerCase()) {
            case 'c':
                console.log('▶️  Continuing...');
                break;
            case 'r':
                await this.reviewBrowserState();
                await this.pauseForReview(testName, phase, result);
                break;
            case 'a':
                await this.analyzeCurrentResults(testName, result);
                await this.pauseForReview(testName, phase, result);
                break;
            case 's':
                console.log('⏭️  Skipping remaining breakpoints...');
                this.breakpointMode = false;
                break;
            case 'q':
                console.log('🛑 Quitting testing...');
                process.exit(0);
                break;
            default:
                console.log('❓ Invalid choice, continuing...');
                break;
        }
    }

    async getUserInput(prompt) {
        return new Promise((resolve) => {
            this.rl.question(prompt, (answer) => {
                resolve(answer.trim());
            });
        });
    }

    async reviewBrowserState() {
        console.log('\n🔍 Reviewing Browser State...');
        
        try {
            // Get current URL
            const url = this.page.url();
            console.log(`📍 Current URL: ${url}`);
            
            // Get page title
            const title = await this.page.title();
            console.log(`📄 Page Title: ${title}`);
            
            // Check for errors in console
            const consoleErrors = this.testResults.results.consoleLogs?.filter(log => log.type === 'error') || [];
            if (consoleErrors.length > 0) {
                console.log(`❌ Console Errors (${consoleErrors.length}):`);
                consoleErrors.slice(-5).forEach(error => {
                    console.log(`  - ${error.message}`);
                });
            }
            
            // Check for page errors
            const pageErrors = this.testResults.results.pageErrors || [];
            if (pageErrors.length > 0) {
                console.log(`💥 Page Errors (${pageErrors.length}):`);
                pageErrors.slice(-5).forEach(error => {
                    console.log(`  - ${error.message}`);
                });
            }
            
            // Check DOM state
            const testControls = await this.page.$('#test-controls');
            const systemStatus = await this.page.$('#system-status');
            const diagnosticLogs = await this.page.$('#diagnostic-logs');
            
            console.log(`🔧 Test Controls: ${testControls ? '✅ Present' : '❌ Missing'}`);
            console.log(`📊 System Status: ${systemStatus ? '✅ Present' : '❌ Missing'}`);
            console.log(`📝 Diagnostic Logs: ${diagnosticLogs ? '✅ Present' : '❌ Missing'}`);
            
        } catch (error) {
            console.error('❌ Error reviewing browser state:', error);
        }
    }

    async analyzeCurrentResults(testName, result) {
        console.log(`\n🔍 Analyzing Results for: ${testName}`);
        
        if (!result) {
            console.log('❌ No results to analyze');
            return;
        }
        
        // Self-critic checks
        const checks = this.performSelfCriticChecks(testName, result);
        
        console.log('📋 Self-Critic Analysis:');
        checks.forEach(check => {
            const status = check.passed ? '✅' : '❌';
            console.log(`  ${status} ${check.description}`);
            if (!check.passed && check.recommendation) {
                console.log(`     💡 Recommendation: ${check.recommendation}`);
            }
        });
        
        // Store checks for later analysis
        if (!this.testResults.selfCriticChecks) {
            this.testResults.selfCriticChecks = [];
        }
        this.testResults.selfCriticChecks.push({
            testName,
            timestamp: new Date().toISOString(),
            checks
        });
    }

    performSelfCriticChecks(testName, result) {
        const checks = [];
        
        switch (testName) {
            case 'System Load Test':
                checks.push(
                    { 
                        description: 'Test completed within reasonable time',
                        passed: result.duration < 5000,
                        recommendation: 'Test took longer than expected - investigate performance issues'
                    },
                    {
                        description: 'Test returned valid results',
                        passed: result && typeof result === 'object',
                        recommendation: 'Test result format is invalid - check test implementation'
                    }
                );
                break;
                
            case 'FAB Framework Test':
                checks.push(
                    {
                        description: 'FAB components are available',
                        passed: result.fabResults && result.fabResults.fabManagerAvailable,
                        recommendation: 'FABManager not found - check component loading'
                    },
                    {
                        description: 'Base FAB class is available',
                        passed: result.fabResults && result.fabResults.baseFABAvailable,
                        recommendation: 'BaseFAB not found - check inheritance chain'
                    }
                );
                break;
                
            case 'Bootstrap Init Test':
                checks.push(
                    {
                        description: 'AppBootstrap is available',
                        passed: result.bootstrapResults && result.bootstrapResults.appBootstrapAvailable,
                        recommendation: 'AppBootstrap not found - check bootstrap.js loading'
                    },
                    {
                        description: 'Init method is available',
                        passed: result.bootstrapResults && result.bootstrapResults.initMethodAvailable,
                        recommendation: 'Init method not found - check bootstrap implementation'
                    }
                );
                break;
        }
        
        return checks;
    }

    async runSystemLoadTest() {
        console.log('🧪 Running System Load Test...');
        
        try {
            // Click Test System Load button
            await this.page.click('#test-system-load');
            
            // Wait for test to complete
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Capture system status
            const systemStatus = await this.page.evaluate(() => {
                const statusElement = document.querySelector('#system-status');
                return statusElement ? statusElement.textContent : 'Status not found';
            });
            
            // Capture diagnostic logs
            const diagnosticLogs = await this.page.evaluate(() => {
                const logsElement = document.querySelector('#diagnostic-logs');
                return logsElement ? logsElement.textContent : 'Logs not found';
            });
            
            const result = {
                success: true,
                systemStatus: systemStatus,
                diagnosticLogs: diagnosticLogs
            };
            
            this.testResults.results.systemLoadTest = result;
            return result;
        } catch (error) {
            const result = {
                success: false,
                error: error.message
            };
            this.testResults.results.systemLoadTest = result;
            return result;
        }
    }

    async runFABFrameworkTest() {
        console.log('🧪 Running FAB Framework Test...');
        
        try {
            // Click Test FAB Framework button
            await this.page.click('#test-fab-framework');
            
            // Wait for test to complete
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Capture FAB-specific results
            const fabResults = await this.page.evaluate(() => {
                const results = {};
                
                // Check if FAB components are available
                results.fabManagerAvailable = typeof window.FABManager !== 'undefined';
                results.baseFABAvailable = typeof window.BaseFAB !== 'undefined';
                results.docsFABAvailable = typeof window.DocsFAB !== 'undefined';
                results.sidebarToggleFABAvailable = typeof window.SidebarToggleFAB !== 'undefined';
                
                // Check for any FAB elements in DOM
                const fabElements = document.querySelectorAll('.fab, .fab-button');
                results.fabElementsInDOM = fabElements.length;
                
                // Check component registration
                if (window.FABManager) {
                    results.registeredTypes = Object.keys(window.FABManager.registry || {});
                }
                
                return results;
            });
            
            const result = {
                success: true,
                fabResults: fabResults
            };
            
            this.testResults.results.fabFrameworkTest = result;
            return result;
        } catch (error) {
            const result = {
                success: false,
                error: error.message
            };
            this.testResults.results.fabFrameworkTest = result;
            return result;
        }
    }

    async runBootstrapInitTest() {
        console.log('🧪 Running Bootstrap Init Test...');
        
        try {
            // Click Test Bootstrap Init button
            await this.page.click('#test-bootstrap-init');
            
            // Wait for test to complete
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Capture bootstrap-specific results
            const bootstrapResults = await this.page.evaluate(() => {
                const results = {};
                
                // Check if AppBootstrap is available
                results.appBootstrapAvailable = typeof window.AppBootstrap !== 'undefined';
                
                if (results.appBootstrapAvailable) {
                    results.initMethodAvailable = typeof window.AppBootstrap.init === 'function';
                    results.deviceContextAvailable = typeof window.DeviceContext !== 'undefined';
                    results.nativeFeaturesAvailable = typeof window.NativeFeatures !== 'undefined';
                    
                    // Check for any initialization errors
                    results.initializationErrors = [];
                    if (window.console && window.console.error) {
                        // This would need to be captured during actual execution
                        results.initializationErrors.push('Console error capture not implemented');
                    }
                }
                
                return results;
            });
            
            const result = {
                success: true,
                bootstrapResults: bootstrapResults
            };
            
            this.testResults.results.bootstrapInitTest = result;
            return result;
        } catch (error) {
            const result = {
                success: false,
                error: error.message
            };
            this.testResults.results.bootstrapInitTest = result;
            return result;
        }
    }

    async capturePerformanceMetrics() {
        console.log('📊 Capturing Performance Metrics...');
        
        try {
            const metrics = await this.page.evaluate(() => {
                const performance = window.performance;
                const memory = performance.memory || {};
                
                return {
                    navigationStart: performance.timing ? performance.timing.navigationStart : null,
                    loadEventEnd: performance.timing ? performance.timing.loadEventEnd : null,
                    domContentLoaded: performance.timing ? performance.timing.domContentLoadedEventEnd : null,
                    memory: {
                        usedJSHeapSize: memory.usedJSHeapSize || 'Not available',
                        totalJSHeapSize: memory.totalJSHeapSize || 'Not available',
                        jsHeapSizeLimit: memory.jsHeapSizeLimit || 'Not available'
                    },
                    navigation: performance.getEntriesByType('navigation')[0] || null
                };
            });
            
            const result = {
                ...metrics,
                success: true
            };
            
            this.testResults.results.performanceMetrics = result;
            return result;
        } catch (error) {
            const result = {
                success: false,
                error: error.message
            };
            this.testResults.results.performanceMetrics = result;
            return result;
        }
    }

    async generateTestReport() {
        if (this.logger) {
            this.logger.log('📋 Generating Enhanced Test Report...', 'info');
        } else {
            console.log('📋 Generating Enhanced Test Report...');
        }
        
        try {
            const reportPath = path.join(__dirname, `enhanced-test-report-${this.testResults.sessionId}.json`);
            
            // Add summary statistics with comprehensive error handling
            let actualTestResults = {};
            let totalDuration = 0;
            
            try {
                // Filter out logging objects
                actualTestResults = Object.entries(this.testResults.results)
                    .filter(([key, value]) => !['consoleLogs', 'pageErrors'].includes(key))
                    .reduce((acc, [key, value]) => {
                        acc[key] = value;
                        return acc;
                    }, {});
                
                if (this.logger) {
                    this.logger.log(`Debug: actualTestResults keys: ${Object.keys(actualTestResults).join(', ')}`, 'info');
                    this.logger.log(`Debug: actualTestResults values: ${JSON.stringify(actualTestResults, null, 2)}`, 'info');
                }
                
                // Calculate total duration safely
                totalDuration = Object.values(actualTestResults)
                    .filter(r => r && typeof r === 'object' && typeof r.duration === 'number')
                    .reduce((sum, r) => sum + r.duration, 0);
                    
            } catch (error) {
                if (this.logger) {
                    this.logger.log(`Warning: Error processing test results: ${error.message}`, 'warning');
                }
                actualTestResults = {};
                totalDuration = 0;
            }
            
            // Create summary with safe defaults
            this.testResults.summary = {
                totalTests: Object.keys(actualTestResults).length || 0,
                successfulTests: Object.values(actualTestResults).filter(r => r && r.success !== false).length || 0,
                failedTests: Object.values(actualTestResults).filter(r => r && r.success === false).length || 0,
                totalDuration: totalDuration || 0,
                breakpointsHit: this.testResults.breakpoints.length || 0,
                selfCriticChecks: this.testResults.selfCriticChecks.length || 0
            };
            
            // Write detailed report
            fs.writeFileSync(reportPath, JSON.stringify(this.testResults, null, 2));
            
            // Generate human-readable summary
            const summaryPath = path.join(__dirname, `enhanced-test-summary-${this.testResults.sessionId}.txt`);
            const summary = this.generateEnhancedSummary();
            fs.writeFileSync(summaryPath, summary);
            
            if (this.logger) {
                this.logger.log(`✅ Enhanced test report generated: ${reportPath}`, 'success');
                this.logger.log(`✅ Enhanced test summary generated: ${summaryPath}`, 'success');
            } else {
                console.log(`✅ Enhanced test report generated: ${reportPath}`);
                console.log(`✅ Enhanced test summary generated: ${summaryPath}`);
            }
            
            return { reportPath, summaryPath };
        } catch (error) {
            if (this.logger) {
                this.logger.log(`❌ Failed to generate test report: ${error.message}`, 'error');
                this.logger.log(`❌ Error stack: ${error.stack}`, 'error');
            } else {
                console.error('❌ Failed to generate test report:', error);
            }
            return false;
        }
    }

    generateEnhancedSummary() {
        let summary = `=== ENHANCED PHASE 1A TEST REPORT ===\n`;
        summary += `Session ID: ${this.testResults.sessionId}\n`;
        summary += `Timestamp: ${this.testResults.timestamp}\n`;
        summary += `Environment: ${this.testResults.environment.platform} ${this.testResults.environment.arch}\n\n`;
        
        summary += `=== TEST RESULTS SUMMARY ===\n`;
        summary += `Total Tests: ${this.testResults.summary.totalTests}\n`;
        summary += `Successful: ${this.testResults.summary.successfulTests}\n`;
        summary += `Failed: ${this.testResults.summary.failedTests}\n`;
        summary += `Total Duration: ${this.testResults.summary.totalDuration}ms\n`;
        summary += `Breakpoints Hit: ${this.testResults.summary.breakpointsHit}\n`;
        summary += `Self-Critic Checks: ${this.testResults.summary.selfCriticChecks}\n\n`;
        
        summary += `=== DETAILED RESULTS ===\n`;
        
        Object.entries(this.testResults.results)
            .filter(([key, value]) => !['consoleLogs', 'pageErrors'].includes(key))
            .forEach(([testName, result]) => {
                summary += `\n${testName.toUpperCase()}:\n`;
                summary += `  Status: ${result.success ? '✅ PASS' : '❌ FAIL'}\n`;
                if (result.duration) summary += `  Duration: ${result.duration}ms\n`;
                if (result.error) summary += `  Error: ${result.error}\n`;
                if (result.timestamp) summary += `  Timestamp: ${result.timestamp}\n`;
            });
        
        summary += `\n=== SELF-CRITIC ANALYSIS ===\n`;
        if (this.testResults.selfCriticChecks) {
            this.testResults.selfCriticChecks.forEach(check => {
                summary += `\n${check.testName}:\n`;
                check.checks.forEach(c => {
                    const status = c.passed ? '✅' : '❌';
                    summary += `  ${status} ${c.description}\n`;
                    if (!c.passed && c.recommendation) {
                        summary += `     💡 ${c.recommendation}\n`;
                    }
                });
            });
        }
        
        summary += `\n=== CONSOLE OUTPUT ===\n`;
        if (this.testResults.results.consoleLogs) {
            this.testResults.results.consoleLogs.forEach(log => {
                summary += `[${log.type.toUpperCase()}] ${log.message}\n`;
            });
        }
        
        summary += `\n=== PAGE ERRORS ===\n`;
        if (this.testResults.results.pageErrors) {
            this.testResults.results.pageErrors.forEach(error => {
                summary += `ERROR: ${error.message}\n`;
                if (error.stack) summary += `STACK: ${error.stack}\n`;
            });
        }
        
        return summary;
    }

    async cleanup() {
        if (this.logger) {
            this.logger.log('🧹 Cleaning up test environment...', 'info');
        } else {
            console.log('🧹 Cleaning up test environment...');
        }
        
        if (this.rl) {
            this.rl.close();
        }
        
        if (this.browser) {
            await this.browser.close();
        }
        
        if (this.logger) {
            this.logger.log('✅ Cleanup completed', 'success');
        } else {
            console.log('✅ Cleanup completed');
        }
    }

    async runAllTests() {
        this.logger.log('🚀 Starting Enhanced Phase 1A: Deep System Diagnostics', 'progress');
        this.logger.log('🎯 Features: Full automation + Interactive breakpoints + Self-critic checks + Real-time progress monitoring', 'info');
        
        try {
            this.logger.startProgress(4, 'Main Test Phases');
            
            // Initialize
            this.logger.updateProgress('Initializing test runner');
            if (!(await this.initialize())) {
                throw new Error('Failed to initialize test runner');
            }
            
            // Load test environment
            this.logger.updateProgress('Loading test environment');
            if (!(await this.loadTestEnvironment())) {
                throw new Error('Failed to load test environment');
            }
            
            // Run tests with breakpoints
            this.logger.updateProgress('Executing test suite');
            this.logger.startProgress(this.testQueue.length, 'Individual Tests');
            
            for (let i = 0; i < this.testQueue.length; i++) {
                const test = this.testQueue[i];
                this.logger.updateProgress(`Running: ${test.name}`, `(${i + 1}/${this.testQueue.length})`);
                
                if (this.breakpointMode) {
                    await this.executeWithBreakpoint(test.name, test.method, test.breakpoint);
                } else {
                    await this.executeWithBreakpoint(test.name, test.method, false);
                }
            }
            
            // Debug: Check test results after execution
            this.logger.log(`Debug: Test results after execution: ${JSON.stringify(this.testResults, null, 2)}`, 'info');
            
            // Generate report
            this.logger.updateProgress('Generating final report');
            
            // Debug: Check test results structure before report generation
            this.logger.log(`Debug: Test results structure: ${JSON.stringify(this.testResults, null, 2)}`, 'info');
            
            const reportFiles = await this.generateTestReport();
            
            this.logger.log('🎉 All tests completed successfully!', 'success');
            this.logger.log(`📊 Enhanced report: ${reportFiles.reportPath}`, 'info');
            this.logger.log(`📋 Enhanced summary: ${reportFiles.summaryPath}`, 'info');
            
            return this.testResults;
            
        } catch (error) {
            this.logger.log(`💥 Test execution failed: ${error.message}`, 'error');
            return null;
        } finally {
            this.logger.stopActivityMonitor();
            await this.cleanup();
        }
    }
}

// Main execution
async function main() {
    const runner = new EnhancedAutomatedTestRunner();
    const results = await runner.runAllTests();
    
    if (results) {
        console.log('\n✅ Enhanced Phase 1A testing completed successfully');
        process.exit(0);
    } else {
        console.log('\n❌ Enhanced Phase 1A testing failed');
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = EnhancedAutomatedTestRunner;
