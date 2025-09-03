#!/usr/bin/env node
/**
 * Legacy Code Usage Analysis Tool
 * Analyzes usage patterns of legacy functions and globals throughout the codebase
 * Part of Phase 1: Foundation setup for legacy code cleanup
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class LegacyUsageAnalyzer {
  constructor() {
    this.legacyFunctions = [
      'window.updateActiveList',
      'window.beginActiveListBulk', 
      'window.endActiveListBulk',
      'window.createCheckbox',
      'window.setupCollapsible',
      'window.setEmphasis',
      'window.ensureLabel',
      'window.removeLabel',
      'window.toggleAll',
      'window.BulkOperationManager'
    ];
    
    this.legacyGlobals = [
      'window.featureLayers',
      'window.namesByCategory',
      'window.nameToKey',
      'window.emphasised',
      'window.nameLabelMarkers',
      'window.activeListFilter',
      'window.isBulkOperation',
      'window.pendingLabels',
      'window.outlineColors',
      'window.baseOpacities',
      'window.labelColorAdjust',
      'window.headerColorAdjust',
      'window.categoryMeta'
    ];
    
    this.results = {
      functions: {},
      globals: {},
      files: {},
      summary: {}
    };
  }
  
  /**
   * Analyze usage of legacy functions and globals
   */
  async analyze() {
    console.log('🔍 Starting legacy code usage analysis...');
    
    // Analyze legacy functions
    for (const func of this.legacyFunctions) {
      this.results.functions[func] = await this.findUsage(func);
    }
    
    // Analyze legacy globals
    for (const global of this.legacyGlobals) {
      this.results.globals[global] = await this.findUsage(global);
    }
    
    // Generate file-level analysis
    this.analyzeFileUsage();
    
    // Generate summary
    this.generateSummary();
    
    // Save results
    this.saveResults();
    
    console.log('✅ Legacy usage analysis complete');
    this.printSummary();
  }
  
  /**
   * Find usage of a specific legacy function/global
   */
  async findUsage(pattern) {
    try {
      // Use PowerShell Select-String for Windows compatibility
      const command = `powershell -Command "Get-ChildItem -Recurse -Include '*.js','*.html','*.md' | Select-String -Pattern '${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}' -AllMatches | ForEach-Object { '{0}:{1}:{2}' -f $_.Filename, $_.LineNumber, $_.Line.Trim() }"`;
      const output = execSync(command, { encoding: 'utf8', cwd: process.cwd() });
      
      const lines = output.trim().split('\n').filter(line => line.length > 0);
      const usage = lines.map(line => {
        const [file, lineNum, ...content] = line.split(':');
        return {
          file: file.replace('./', ''),
          line: parseInt(lineNum),
          content: content.join(':').trim()
        };
      });
      
      return {
        count: usage.length,
        locations: usage
      };
    } catch (error) {
      // PowerShell returns exit code 1 when no matches found
      return {
        count: 0,
        locations: []
      };
    }
  }
  
  /**
   * Analyze file-level usage patterns
   */
  analyzeFileUsage() {
    const fileUsage = {};
    
    // Count usage per file
    [...Object.values(this.results.functions), ...Object.values(this.results.globals)]
      .forEach(item => {
        item.locations.forEach(location => {
          if (!fileUsage[location.file]) {
            fileUsage[location.file] = {
              legacyFunctions: 0,
              legacyGlobals: 0,
              totalUsage: 0,
              functions: [],
              globals: []
            };
          }
          
          fileUsage[location.file].totalUsage++;
          
          // Determine if it's a function or global
          const isFunction = this.legacyFunctions.some(func => 
            location.content.includes(func)
          );
          
          if (isFunction) {
            fileUsage[location.file].legacyFunctions++;
            const func = this.legacyFunctions.find(f => location.content.includes(f));
            if (func && !fileUsage[location.file].functions.includes(func)) {
              fileUsage[location.file].functions.push(func);
            }
          } else {
            fileUsage[location.file].legacyGlobals++;
            const global = this.legacyGlobals.find(g => location.content.includes(g));
            if (global && !fileUsage[location.file].globals.includes(global)) {
              fileUsage[location.file].globals.push(global);
            }
          }
        });
      });
    
    this.results.files = fileUsage;
  }
  
  /**
   * Generate summary statistics
   */
  generateSummary() {
    const totalFunctionUsage = Object.values(this.results.functions)
      .reduce((sum, item) => sum + item.count, 0);
    
    const totalGlobalUsage = Object.values(this.results.globals)
      .reduce((sum, item) => sum + item.count, 0);
    
    const filesWithLegacyUsage = Object.keys(this.results.files).length;
    
    const mostUsedFunctions = Object.entries(this.results.functions)
      .sort(([,a], [,b]) => b.count - a.count)
      .slice(0, 5);
    
    const mostUsedGlobals = Object.entries(this.results.globals)
      .sort(([,a], [,b]) => b.count - a.count)
      .slice(0, 5);
    
    const filesWithMostUsage = Object.entries(this.results.files)
      .sort(([,a], [,b]) => b.totalUsage - a.totalUsage)
      .slice(0, 10);
    
    this.results.summary = {
      totalFunctionUsage,
      totalGlobalUsage,
      totalLegacyUsage: totalFunctionUsage + totalGlobalUsage,
      filesWithLegacyUsage,
      mostUsedFunctions,
      mostUsedGlobals,
      filesWithMostUsage,
      analysisDate: new Date().toISOString()
    };
  }
  
  /**
   * Save results to file
   */
  saveResults() {
    const outputFile = 'legacy-usage-analysis.json';
    fs.writeFileSync(outputFile, JSON.stringify(this.results, null, 2));
    console.log(`📊 Results saved to ${outputFile}`);
  }
  
  /**
   * Print summary to console
   */
  printSummary() {
    const { summary } = this.results;
    
    console.log('\n📈 LEGACY USAGE ANALYSIS SUMMARY');
    console.log('=====================================');
    console.log(`Total Legacy Function Usage: ${summary.totalFunctionUsage}`);
    console.log(`Total Legacy Global Usage: ${summary.totalGlobalUsage}`);
    console.log(`Total Legacy Usage: ${summary.totalLegacyUsage}`);
    console.log(`Files with Legacy Usage: ${summary.filesWithLegacyUsage}`);
    
    console.log('\n🔝 Most Used Legacy Functions:');
    summary.mostUsedFunctions.forEach(([func, data], index) => {
      console.log(`  ${index + 1}. ${func}: ${data.count} usages`);
    });
    
    console.log('\n🔝 Most Used Legacy Globals:');
    summary.mostUsedGlobals.forEach(([global, data], index) => {
      console.log(`  ${index + 1}. ${global}: ${data.count} usages`);
    });
    
    console.log('\n📁 Files with Most Legacy Usage:');
    summary.filesWithMostUsage.forEach(([file, data], index) => {
      console.log(`  ${index + 1}. ${file}: ${data.totalUsage} usages (${data.legacyFunctions} functions, ${data.legacyGlobals} globals)`);
    });
    
    console.log('\n⚠️  MIGRATION PRIORITY RECOMMENDATIONS:');
    console.log('=====================================');
    
    // High priority: Functions with many usages
    const highPriorityFunctions = summary.mostUsedFunctions
      .filter(([, data]) => data.count > 5)
      .map(([func]) => func);
    
    if (highPriorityFunctions.length > 0) {
      console.log('🚨 HIGH PRIORITY (Many usages):');
      highPriorityFunctions.forEach(func => console.log(`  - ${func}`));
    }
    
    // Medium priority: Functions with moderate usages
    const mediumPriorityFunctions = summary.mostUsedFunctions
      .filter(([, data]) => data.count > 1 && data.count <= 5)
      .map(([func]) => func);
    
    if (mediumPriorityFunctions.length > 0) {
      console.log('⚠️  MEDIUM PRIORITY (Moderate usages):');
      mediumPriorityFunctions.forEach(func => console.log(`  - ${func}`));
    }
    
    // Low priority: Functions with few usages
    const lowPriorityFunctions = summary.mostUsedFunctions
      .filter(([, data]) => data.count === 1)
      .map(([func]) => func);
    
    if (lowPriorityFunctions.length > 0) {
      console.log('✅ LOW PRIORITY (Few usages):');
      lowPriorityFunctions.forEach(func => console.log(`  - ${func}`));
    }
  }
}

// Run the analysis
if (require.main === module) {
  const analyzer = new LegacyUsageAnalyzer();
  analyzer.analyze().catch(console.error);
}

module.exports = LegacyUsageAnalyzer;
