/**
 * Coverage Quality Metrics for WeeWoo Map Friend
 * 
 * This module provides comprehensive coverage quality analysis that goes beyond
 * simple line coverage to assess the actual quality and effectiveness of our tests.
 * 
 * Key Metrics:
 * - Critical Path Coverage: Tests for core functionality paths
 * - Error Boundary Coverage: Tests for error handling scenarios
 * - Edge Case Coverage: Tests for boundary conditions
 * - Integration Coverage: Tests for module interactions
 * - Performance Coverage: Tests for performance-critical code
 */

const fs = require('fs');
const path = require('path');

class CoverageQualityAnalyzer {
  constructor() {
    this.coverageData = null;
    this.qualityMetrics = {
      criticalPathCoverage: 0,
      errorBoundaryCoverage: 0,
      edgeCaseCoverage: 0,
      integrationCoverage: 0,
      performanceCoverage: 0,
      overallQuality: 0
    };
    
    // Define critical modules and their importance weights
    this.criticalModules = {
      'ApplicationBootstrap.js': { weight: 1.0, criticalPaths: ['0', '1'] }, // init and safeExecute functions
      'StateManager.js': { weight: 0.9, criticalPaths: ['0', '1', '2'] }, // get, set, reset functions
      'MapManager.js': { weight: 0.9, criticalPaths: ['0', '1', '2'] }, // init, createMap, getStatus functions
      'LayerManager.js': { weight: 0.8, criticalPaths: ['0', '1', '2'] }, // init, addLayer, removeLayer functions
      'PolygonLoader.js': { weight: 0.8, criticalPaths: ['0', '1'] }, // loadCategory, processFeatures functions
      'DataLoadingOrchestrator.js': { weight: 0.8, criticalPaths: ['0', '1'] }, // init, loadCategory functions
      'EventBus.js': { weight: 0.7, criticalPaths: ['0', '1', '2'] }, // emit, on, off functions
      'ConfigurationManager.js': { weight: 0.7, criticalPaths: ['0', '1'] }, // get, set functions
      'DeviceManager.js': { weight: 0.6, criticalPaths: ['0', '1'] }, // init, getDeviceContext functions
      'SearchManager.js': { weight: 0.6, criticalPaths: ['0', '1'] }, // init, search functions
      'ActiveListManager.js': { weight: 0.6, criticalPaths: ['0', '1'] }, // init, updateActiveList functions
      'CollapsibleManager.js': { weight: 0.5, criticalPaths: ['0', '1'] } // init, setupCollapsible functions
    };
    
    // Define error boundary patterns
    this.errorBoundaryPatterns = [
      'try\\s*\\{',
      'catch\\s*\\(',
      'throw\\s+new\\s+Error',
      'Promise\\.reject',
      'error\\s*\\?\\s*',
      'if\\s*\\(.*error.*\\)',
      'onError',
      'handleError'
    ];
    
    // Define edge case patterns
    this.edgeCasePatterns = [
      'if\\s*\\(.*null.*\\)',
      'if\\s*\\(.*undefined.*\\)',
      'if\\s*\\(.*empty.*\\)',
      'if\\s*\\(.*length\\s*===\\s*0.*\\)',
      'if\\s*\\(.*size\\s*===\\s*0.*\\)',
      'if\\s*\\(.*count\\s*===\\s*0.*\\)',
      'if\\s*\\(.*!.*\\)',
      'if\\s*\\(.*===.*\\)',
      'if\\s*\\(.*!==.*\\)',
      'if\\s*\\(.*>.*\\)',
      'if\\s*\\(.*<.*\\)',
      'if\\s*\\(.*>=.*\\)',
      'if\\s*\\(.*<=.*\\)'
    ];
    
    // Define integration patterns
    this.integrationPatterns = [
      'import.*from',
      'require\\(',
      'await\\s+import',
      '\\..*\\(.*\\)',
      'this\\..*\\(.*\\)',
      'globalEventBus',
      'stateManager',
      'configurationManager'
    ];
    
    // Define performance patterns
    this.performancePatterns = [
      'performance\\.now',
      'Date\\.now',
      'setTimeout',
      'setInterval',
      'requestAnimationFrame',
      'debounce',
      'throttle',
      'cache',
      'memoize',
      'lazy',
      'async',
      'await'
    ];
  }

  /**
   * Load coverage data from Jest coverage report
   */
  loadCoverageData(coveragePath = 'coverage/coverage-final.json') {
    try {
      const coverageFile = path.resolve(coveragePath);
      if (fs.existsSync(coverageFile)) {
        this.coverageData = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
        return true;
      }
    } catch (error) {
      console.error('Error loading coverage data:', error.message);
    }
    return false;
  }

  /**
   * Analyze critical path coverage
   */
  analyzeCriticalPathCoverage() {
    let totalWeight = 0;
    let coveredWeight = 0;

    for (const [moduleName, moduleInfo] of Object.entries(this.criticalModules)) {
      const modulePath = this.findModulePath(moduleName);
      if (modulePath && this.coverageData[modulePath]) {
        const coverage = this.coverageData[modulePath];
        const moduleWeight = moduleInfo.weight;
        
        // Check if critical paths are covered
        const criticalPathCoverage = this.calculateCriticalPathCoverage(coverage, moduleInfo.criticalPaths);
        coveredWeight += criticalPathCoverage * moduleWeight;
        totalWeight += moduleWeight;
      }
    }

    this.qualityMetrics.criticalPathCoverage = totalWeight > 0 ? (coveredWeight / totalWeight) * 100 : 0;
  }

  /**
   * Calculate critical path coverage for a module
   */
  calculateCriticalPathCoverage(coverage, criticalPaths) {
    if (!coverage.functions) return 0;
    
    let coveredPaths = 0;
    for (const path of criticalPaths) {
      // Check if function exists and has been executed
      if (coverage.functions[path] && coverage.functions[path] > 0) {
        coveredPaths++;
      }
    }
    
    return criticalPaths.length > 0 ? coveredPaths / criticalPaths.length : 0;
  }

  /**
   * Analyze error boundary coverage
   */
  analyzeErrorBoundaryCoverage() {
    let totalErrorBoundaries = 0;
    let coveredErrorBoundaries = 0;
    let moduleFilesProcessed = 0;

    for (const [filePath, coverage] of Object.entries(this.coverageData)) {
      if (this.isModuleFile(filePath)) {
        moduleFilesProcessed++;
        const coveredLines = this.getCoveredLines(coverage);
        const content = this.readFileContent(filePath);
        
        if (content) {
          const lines = content.split('\n');
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            for (const pattern of this.errorBoundaryPatterns) {
              const regex = new RegExp(pattern, 'g');
              const matches = line.match(regex);
              if (matches) {
                totalErrorBoundaries += matches.length;
                if (coveredLines.has(i + 1)) {
                  coveredErrorBoundaries += matches.length;
                }
              }
            }
          }
        }
      }
    }

    this.qualityMetrics.errorBoundaryCoverage = totalErrorBoundaries > 0 ? (coveredErrorBoundaries / totalErrorBoundaries) * 100 : 0;
  }

  /**
   * Analyze edge case coverage
   */
  analyzeEdgeCaseCoverage() {
    let totalEdgeCases = 0;
    let coveredEdgeCases = 0;

    for (const [filePath, coverage] of Object.entries(this.coverageData)) {
      if (this.isModuleFile(filePath)) {
        const coveredLines = this.getCoveredLines(coverage);
        const content = this.readFileContent(filePath);
        
        if (content) {
          const lines = content.split('\n');
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            for (const pattern of this.edgeCasePatterns) {
              const regex = new RegExp(pattern, 'g');
              const matches = line.match(regex);
              if (matches) {
                totalEdgeCases += matches.length;
                if (coveredLines.has(i + 1)) {
                  coveredEdgeCases += matches.length;
                }
              }
            }
          }
        }
      }
    }

    this.qualityMetrics.edgeCaseCoverage = totalEdgeCases > 0 ? (coveredEdgeCases / totalEdgeCases) * 100 : 0;
  }

  /**
   * Analyze integration coverage
   */
  analyzeIntegrationCoverage() {
    let totalIntegrations = 0;
    let coveredIntegrations = 0;

    for (const [filePath, coverage] of Object.entries(this.coverageData)) {
      if (this.isModuleFile(filePath)) {
        const coveredLines = this.getCoveredLines(coverage);
        const content = this.readFileContent(filePath);
        
        if (content) {
          const lines = content.split('\n');
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            for (const pattern of this.integrationPatterns) {
              const regex = new RegExp(pattern, 'g');
              const matches = line.match(regex);
              if (matches) {
                totalIntegrations += matches.length;
                if (coveredLines.has(i + 1)) {
                  coveredIntegrations += matches.length;
                }
              }
            }
          }
        }
      }
    }

    this.qualityMetrics.integrationCoverage = totalIntegrations > 0 ? (coveredIntegrations / totalIntegrations) * 100 : 0;
  }

  /**
   * Analyze performance coverage
   */
  analyzePerformanceCoverage() {
    let totalPerformanceCode = 0;
    let coveredPerformanceCode = 0;

    for (const [filePath, coverage] of Object.entries(this.coverageData)) {
      if (this.isModuleFile(filePath)) {
        const coveredLines = this.getCoveredLines(coverage);
        const content = this.readFileContent(filePath);
        
        if (content) {
          const lines = content.split('\n');
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            for (const pattern of this.performancePatterns) {
              const regex = new RegExp(pattern, 'g');
              const matches = line.match(regex);
              if (matches) {
                totalPerformanceCode += matches.length;
                if (coveredLines.has(i + 1)) {
                  coveredPerformanceCode += matches.length;
                }
              }
            }
          }
        }
      }
    }

    this.qualityMetrics.performanceCoverage = totalPerformanceCode > 0 ? (coveredPerformanceCode / totalPerformanceCode) * 100 : 0;
  }

  /**
   * Read file content
   */
  readFileContent(filePath) {
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      return null;
    }
  }

  /**
   * Count patterns in a file
   */
  countPatternsInFile(filePath, patterns) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      let count = 0;
      
      for (const pattern of patterns) {
        const regex = new RegExp(pattern, 'g');
        const matches = content.match(regex);
        if (matches) {
          count += matches.length;
        }
      }
      
      return count;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Calculate pattern coverage
   */
  calculatePatternCoverage(filePath, patterns, coveredLines) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      let totalPatterns = 0;
      let coveredPatterns = 0;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (const pattern of patterns) {
          const regex = new RegExp(pattern, 'g');
          const matches = line.match(regex);
          if (matches) {
            totalPatterns += matches.length;
            if (coveredLines.has(i + 1)) {
              coveredPatterns += matches.length;
            }
          }
        }
      }
      
      return totalPatterns > 0 ? coveredPatterns / totalPatterns : 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get covered lines from coverage data
   */
  getCoveredLines(coverage) {
    const coveredLines = new Set();
    
    if (coverage.s) {
      for (const [line, count] of Object.entries(coverage.s)) {
        if (count > 0) {
          coveredLines.add(parseInt(line));
        }
      }
    }
    
    return coveredLines;
  }

  /**
   * Check if file is a module file
   */
  isModuleFile(filePath) {
    return (filePath.includes('js/modules/') || filePath.includes('js\\modules\\')) && 
           filePath.endsWith('.js') && 
           !filePath.includes('.test.js');
  }

  /**
   * Find module path in coverage data
   */
  findModulePath(moduleName) {
    for (const filePath of Object.keys(this.coverageData)) {
      if (filePath.endsWith(moduleName)) {
        return filePath;
      }
    }
    return null;
  }

  /**
   * Calculate overall quality score
   */
  calculateOverallQuality() {
    const weights = {
      criticalPathCoverage: 0.3,
      errorBoundaryCoverage: 0.25,
      edgeCaseCoverage: 0.2,
      integrationCoverage: 0.15,
      performanceCoverage: 0.1
    };
    
    let weightedSum = 0;
    let totalWeight = 0;
    
    for (const [metric, weight] of Object.entries(weights)) {
      weightedSum += this.qualityMetrics[metric] * weight;
      totalWeight += weight;
    }
    
    this.qualityMetrics.overallQuality = totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  /**
   * Main analysis method - runs all quality analyses
   */
  analyze() {
    if (!this.coverageData) {
      return {
        error: 'No coverage data available. Run tests with coverage first.',
        qualityMetrics: this.qualityMetrics
      };
    }

    // Run all analyses
    this.analyzeCriticalPathCoverage();
    this.analyzeErrorBoundaryCoverage();
    this.analyzeEdgeCaseCoverage();
    this.analyzeIntegrationCoverage();
    this.analyzePerformanceCoverage();
    this.calculateOverallQuality();

    return {
      qualityMetrics: this.qualityMetrics,
      recommendations: this.generateRecommendations(),
      summary: this.generateSummary()
    };
  }

  /**
   * Generate quality report
   */
  generateQualityReport() {
    return this.analyze();
  }

  /**
   * Generate recommendations based on quality metrics
   */
  generateRecommendations() {
    const recommendations = [];
    
    if (this.qualityMetrics.criticalPathCoverage < 80) {
      recommendations.push({
        type: 'critical',
        message: 'Critical path coverage is low. Focus on testing core functionality paths.',
        current: this.qualityMetrics.criticalPathCoverage.toFixed(1),
        target: 80
      });
    }
    
    if (this.qualityMetrics.errorBoundaryCoverage < 70) {
      recommendations.push({
        type: 'error-handling',
        message: 'Error boundary coverage is low. Add more error handling tests.',
        current: this.qualityMetrics.errorBoundaryCoverage.toFixed(1),
        target: 70
      });
    }
    
    if (this.qualityMetrics.edgeCaseCoverage < 60) {
      recommendations.push({
        type: 'edge-cases',
        message: 'Edge case coverage is low. Test boundary conditions and null/undefined scenarios.',
        current: this.qualityMetrics.edgeCaseCoverage.toFixed(1),
        target: 60
      });
    }
    
    if (this.qualityMetrics.integrationCoverage < 70) {
      recommendations.push({
        type: 'integration',
        message: 'Integration coverage is low. Test module interactions and dependencies.',
        current: this.qualityMetrics.integrationCoverage.toFixed(1),
        target: 70
      });
    }
    
    if (this.qualityMetrics.performanceCoverage < 50) {
      recommendations.push({
        type: 'performance',
        message: 'Performance coverage is low. Test performance-critical code paths.',
        current: this.qualityMetrics.performanceCoverage.toFixed(1),
        target: 50
      });
    }
    
    return recommendations;
  }

  /**
   * Generate summary
   */
  generateSummary() {
    const overall = this.qualityMetrics.overallQuality;
    let grade = 'F';
    
    if (overall >= 90) grade = 'A+';
    else if (overall >= 85) grade = 'A';
    else if (overall >= 80) grade = 'A-';
    else if (overall >= 75) grade = 'B+';
    else if (overall >= 70) grade = 'B';
    else if (overall >= 65) grade = 'B-';
    else if (overall >= 60) grade = 'C+';
    else if (overall >= 55) grade = 'C';
    else if (overall >= 50) grade = 'C-';
    else if (overall >= 45) grade = 'D+';
    else if (overall >= 40) grade = 'D';
    else if (overall >= 35) grade = 'D-';
    
    return {
      overallQuality: overall.toFixed(1),
      grade,
      status: overall >= 70 ? 'Good' : overall >= 50 ? 'Needs Improvement' : 'Poor'
    };
  }
}

module.exports = CoverageQualityAnalyzer;
