#!/usr/bin/env node

/**
 * Coverage Quality Report Script
 * 
 * This script runs Jest with coverage and then analyzes the coverage data
 * to provide comprehensive quality metrics beyond simple line coverage.
 */

const CoverageQualityAnalyzer = require('../tests/coverage-quality');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class CoverageQualityReporter {
  constructor() {
    this.analyzer = new CoverageQualityAnalyzer();
    this.outputDir = 'coverage-quality';
  }

  /**
   * Run Jest with coverage
   */
  runJestWithCoverage() {
    console.log('🔍 Running Jest with coverage...');
    
    try {
      const command = 'npm test -- --coverage --coverageReporters=json --coverageReporters=text';
      execSync(command, { stdio: 'inherit' });
      console.log('✅ Jest coverage completed successfully');
      return true;
    } catch (error) {
      console.error('❌ Jest coverage failed:', error.message);
      return false;
    }
  }

  /**
   * Load and analyze coverage data
   */
  analyzeCoverage() {
    console.log('📊 Analyzing coverage quality...');
    
    if (!this.analyzer.loadCoverageData()) {
      console.error('❌ Failed to load coverage data');
      return null;
    }
    
    const report = this.analyzer.generateQualityReport();
    return report;
  }

  /**
   * Generate HTML report
   */
  generateHtmlReport(report) {
    console.log('📄 Generating HTML report...');
    
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
    
    const html = this.createHtmlReport(report);
    const htmlPath = path.join(this.outputDir, 'coverage-quality-report.html');
    fs.writeFileSync(htmlPath, html);
    
    console.log(`📄 HTML report generated: ${htmlPath}`);
    return htmlPath;
  }

  /**
   * Create HTML report content
   */
  createHtmlReport(report) {
    const { qualityMetrics, recommendations, summary } = report;
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Coverage Quality Report - WeeWoo Map Friend</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
            font-weight: 300;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
        }
        .content {
            padding: 30px;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .summary-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border-left: 4px solid #667eea;
        }
        .summary-card h3 {
            margin: 0 0 10px 0;
            color: #333;
        }
        .summary-card .value {
            font-size: 2em;
            font-weight: bold;
            color: #667eea;
        }
        .summary-card .grade {
            font-size: 3em;
            font-weight: bold;
            margin: 10px 0;
        }
        .grade-A { color: #28a745; }
        .grade-B { color: #ffc107; }
        .grade-C { color: #fd7e14; }
        .grade-D { color: #dc3545; }
        .grade-F { color: #6c757d; }
        .metrics {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .metric-card {
            background: white;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 20px;
        }
        .metric-card h3 {
            margin: 0 0 15px 0;
            color: #333;
        }
        .metric-bar {
            background: #e9ecef;
            height: 20px;
            border-radius: 10px;
            overflow: hidden;
            margin-bottom: 10px;
        }
        .metric-fill {
            height: 100%;
            background: linear-gradient(90deg, #667eea, #764ba2);
            transition: width 0.3s ease;
        }
        .metric-value {
            text-align: right;
            font-weight: bold;
            color: #333;
        }
        .recommendations {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
        }
        .recommendations h3 {
            margin: 0 0 20px 0;
            color: #333;
        }
        .recommendation {
            background: white;
            border-left: 4px solid #dc3545;
            padding: 15px;
            margin-bottom: 10px;
            border-radius: 0 4px 4px 0;
        }
        .recommendation.critical {
            border-left-color: #dc3545;
        }
        .recommendation.error-handling {
            border-left-color: #fd7e14;
        }
        .recommendation.edge-cases {
            border-left-color: #ffc107;
        }
        .recommendation.integration {
            border-left-color: #17a2b8;
        }
        .recommendation.performance {
            border-left-color: #6f42c1;
        }
        .recommendation h4 {
            margin: 0 0 5px 0;
            color: #333;
        }
        .recommendation p {
            margin: 0;
            color: #666;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: #666;
            border-top: 1px solid #e9ecef;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Coverage Quality Report</h1>
            <p>WeeWoo Map Friend - Comprehensive Test Quality Analysis</p>
        </div>
        
        <div class="content">
            <div class="summary">
                <div class="summary-card">
                    <h3>Overall Quality</h3>
                    <div class="value">${summary.overallQuality}%</div>
                    <div class="grade grade-${summary.grade.charAt(0)}">${summary.grade}</div>
                    <p>${summary.status}</p>
                </div>
                <div class="summary-card">
                    <h3>Critical Paths</h3>
                    <div class="value">${qualityMetrics.criticalPathCoverage.toFixed(1)}%</div>
                </div>
                <div class="summary-card">
                    <h3>Error Boundaries</h3>
                    <div class="value">${qualityMetrics.errorBoundaryCoverage.toFixed(1)}%</div>
                </div>
                <div class="summary-card">
                    <h3>Edge Cases</h3>
                    <div class="value">${qualityMetrics.edgeCaseCoverage.toFixed(1)}%</div>
                </div>
            </div>
            
            <div class="metrics">
                <div class="metric-card">
                    <h3>Critical Path Coverage</h3>
                    <div class="metric-bar">
                        <div class="metric-fill" style="width: ${qualityMetrics.criticalPathCoverage}%"></div>
                    </div>
                    <div class="metric-value">${qualityMetrics.criticalPathCoverage.toFixed(1)}%</div>
                    <p>Tests for core functionality paths</p>
                </div>
                
                <div class="metric-card">
                    <h3>Error Boundary Coverage</h3>
                    <div class="metric-bar">
                        <div class="metric-fill" style="width: ${qualityMetrics.errorBoundaryCoverage}%"></div>
                    </div>
                    <div class="metric-value">${qualityMetrics.errorBoundaryCoverage.toFixed(1)}%</div>
                    <p>Tests for error handling scenarios</p>
                </div>
                
                <div class="metric-card">
                    <h3>Edge Case Coverage</h3>
                    <div class="metric-bar">
                        <div class="metric-fill" style="width: ${qualityMetrics.edgeCaseCoverage}%"></div>
                    </div>
                    <div class="metric-value">${qualityMetrics.edgeCaseCoverage.toFixed(1)}%</div>
                    <p>Tests for boundary conditions</p>
                </div>
                
                <div class="metric-card">
                    <h3>Integration Coverage</h3>
                    <div class="metric-bar">
                        <div class="metric-fill" style="width: ${qualityMetrics.integrationCoverage}%"></div>
                    </div>
                    <div class="metric-value">${qualityMetrics.integrationCoverage.toFixed(1)}%</div>
                    <p>Tests for module interactions</p>
                </div>
                
                <div class="metric-card">
                    <h3>Performance Coverage</h3>
                    <div class="metric-bar">
                        <div class="metric-fill" style="width: ${qualityMetrics.performanceCoverage}%"></div>
                    </div>
                    <div class="metric-value">${qualityMetrics.performanceCoverage.toFixed(1)}%</div>
                    <p>Tests for performance-critical code</p>
                </div>
            </div>
            
            ${recommendations.length > 0 ? `
            <div class="recommendations">
                <h3>Recommendations</h3>
                ${recommendations.map(rec => `
                    <div class="recommendation ${rec.type}">
                        <h4>${rec.message}</h4>
                        <p>Current: ${rec.current}% | Target: ${rec.target}%</p>
                    </div>
                `).join('')}
            </div>
            ` : ''}
        </div>
        
        <div class="footer">
            <p>Generated on ${new Date().toLocaleString()}</p>
            <p>WeeWoo Map Friend - Modern ES6 Architecture</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate JSON report
   */
  generateJsonReport(report) {
    console.log('📄 Generating JSON report...');
    
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
    
    const jsonPath = path.join(this.outputDir, 'coverage-quality-report.json');
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
    
    console.log(`📄 JSON report generated: ${jsonPath}`);
    return jsonPath;
  }

  /**
   * Run the complete analysis
   */
  async run() {
    console.log('🚀 Starting Coverage Quality Analysis...\n');
    
    // Run Jest with coverage
    if (!this.runJestWithCoverage()) {
      process.exit(1);
    }
    
    // Analyze coverage
    const report = this.analyzeCoverage();
    if (!report) {
      process.exit(1);
    }
    
    // Generate reports
    this.generateHtmlReport(report);
    this.generateJsonReport(report);
    
    // Print summary
    console.log('\n📊 Coverage Quality Summary:');
    console.log(`Overall Quality: ${report.summary.overallQuality}% (${report.summary.grade})`);
    console.log(`Status: ${report.summary.status}`);
    console.log(`\nCritical Path Coverage: ${report.qualityMetrics.criticalPathCoverage.toFixed(1)}%`);
    console.log(`Error Boundary Coverage: ${report.qualityMetrics.errorBoundaryCoverage.toFixed(1)}%`);
    console.log(`Edge Case Coverage: ${report.qualityMetrics.edgeCaseCoverage.toFixed(1)}%`);
    console.log(`Integration Coverage: ${report.qualityMetrics.integrationCoverage.toFixed(1)}%`);
    console.log(`Performance Coverage: ${report.qualityMetrics.performanceCoverage.toFixed(1)}%`);
    
    if (report.recommendations.length > 0) {
      console.log('\n🔧 Recommendations:');
      report.recommendations.forEach(rec => {
        console.log(`- ${rec.message} (${rec.current}% → ${rec.target}%)`);
      });
    }
    
    console.log('\n✅ Coverage Quality Analysis Complete!');
  }
}

// Run if called directly
if (require.main === module) {
  const reporter = new CoverageQualityReporter();
  reporter.run().catch(console.error);
}

module.exports = CoverageQualityReporter;
