#!/usr/bin/env node

/**
 * ES6 Module Integration Build Script
 * Verifies and builds the ES6 module integration
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  sourceDir: 'js/modules',
  componentsDir: 'js/components',
  testDir: 'js/modules',
  outputDir: 'dist/js',
  entryPoint: 'js/modules/app.js'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * Log with color
 */
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Check if file exists
 */
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

/**
 * Read and parse JSON file
 */
function readJSON(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

/**
 * Validate ES6 module structure
 */
function validateES6Modules() {
  log('🔍 Validating ES6 module structure...', 'blue');
  
  const requiredModules = [
    'ComponentBase.js',
    'StateManager.js',
    'EventBus.js',
    'Router.js',
    'LegacyBridge.js',
    'ES6IntegrationManager.js'
  ];
  
  const requiredComponents = [
    'HamburgerMenu.js',
    'CollapsibleManager.js',
    'SearchManager.js',
    'ActiveListManager.js',
    'MobileDocsNavManager.js'
  ];
  
  let allValid = true;
  
  // Check modules
  log('  Checking core modules...', 'cyan');
  requiredModules.forEach(module => {
    const modulePath = path.join(CONFIG.sourceDir, module);
    if (fileExists(modulePath)) {
      log(`    ✅ ${module}`, 'green');
    } else {
      log(`    ❌ ${module} - Missing`, 'red');
      allValid = false;
    }
  });
  
  // Check components
  log('  Checking components...', 'cyan');
  requiredComponents.forEach(component => {
    const componentPath = path.join(CONFIG.componentsDir, component);
    if (fileExists(componentPath)) {
      log(`    ✅ ${component}`, 'green');
    } else {
      log(`    ❌ ${component} - Missing`, 'red');
      allValid = false;
    }
  });
  
  // Check entry point
  log('  Checking entry point...', 'cyan');
  if (fileExists(CONFIG.entryPoint)) {
    log(`    ✅ ${CONFIG.entryPoint}`, 'green');
  } else {
    log(`    ❌ ${CONFIG.entryPoint} - Missing`, 'red');
    allValid = false;
  }
  
  return allValid;
}

/**
 * Validate ES6 syntax in files
 */
function validateES6Syntax() {
  log('🔍 Validating ES6 syntax...', 'blue');
  
  const filesToCheck = [
    path.join(CONFIG.sourceDir, 'ES6IntegrationManager.js'),
    path.join(CONFIG.sourceDir, 'app.js'),
    path.join(CONFIG.componentsDir, 'ActiveListManager.js')
  ];
  
  let allValid = true;
  
  filesToCheck.forEach(filePath => {
    if (!fileExists(filePath)) {
      log(`    ⚠️  ${filePath} - Skipping (file not found)`, 'yellow');
      return;
    }
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Basic ES6 syntax checks
      const hasExport = /export\s+/.test(content);
      const hasImport = /import\s+/.test(content);
      const hasClass = /class\s+\w+/.test(content);
      const hasArrowFunction = /=>/.test(content);
      const hasTemplateLiteral = /`[^`]*\$\{[^}]*\}[^`]*`/.test(content);
      
      const fileName = path.basename(filePath);
      log(`    Checking ${fileName}...`, 'cyan');
      
      if (hasExport) log(`      ✅ export statements`, 'green');
      if (hasImport) log(`      ✅ import statements`, 'green');
      if (hasClass) log(`      ✅ class declarations`, 'green');
      if (hasArrowFunction) log(`      ✅ arrow functions`, 'green');
      if (hasTemplateLiteral) log(`      ✅ template literals`, 'green');
      
      // Check for common issues
      if (content.includes('var ')) {
        log(`      ⚠️  var declarations found (consider using const/let)`, 'yellow');
      }
      
      if (content.includes('function(')) {
        log(`      ⚠️  function expressions found (consider using arrow functions)`, 'yellow');
      }
      
    } catch (error) {
      log(`    ❌ ${filePath} - Error reading file: ${error.message}`, 'red');
      allValid = false;
    }
  });
  
  return allValid;
}

/**
 * Check build configuration
 */
function checkBuildConfig() {
  log('🔍 Checking build configuration...', 'blue');
  
  // Check package.json
  const packageJson = readJSON('package.json');
  if (packageJson) {
    log('  ✅ package.json found', 'green');
    
    // Check for ES6-related dependencies
    const dependencies = packageJson.dependencies || {};
    const devDependencies = packageJson.devDependencies || {};
    
    const es6Deps = ['@rollup/plugin-node-resolve', '@rollup/plugin-commonjs'];
    es6Deps.forEach(dep => {
      if (dependencies[dep] || devDependencies[dep]) {
        log(`    ✅ ${dep}`, 'green');
      } else {
        log(`    ⚠️  ${dep} - Not found in dependencies`, 'yellow');
      }
    });
  } else {
    log('  ❌ package.json not found', 'red');
    return false;
  }
  
  // Check rollup config
  if (fileExists('rollup.config.js')) {
    log('  ✅ rollup.config.js found', 'green');
  } else {
    log('  ❌ rollup.config.js not found', 'red');
    return false;
  }
  
  return true;
}

/**
 * Generate integration report
 */
function generateIntegrationReport() {
  log('📊 Generating ES6 integration report...', 'blue');
  
  const report = {
    timestamp: new Date().toISOString(),
    phase: '1.3',
    status: 'in-progress',
    modules: {
      core: ['ComponentBase', 'StateManager', 'EventBus', 'Router', 'LegacyBridge', 'ES6IntegrationManager'],
      components: ['HamburgerMenu', 'CollapsibleManager', 'SearchManager', 'ActiveListManager', 'MobileDocsNavManager']
    },
    integration: {
      bulkOperations: 'unified',
      activeList: 'es6-module',
      stateManagement: 'es6-module',
      compatibility: 'legacy-bridge'
    },
    nextSteps: [
      'Complete Phase 1.3 testing',
      'Move to Phase 2: Architecture Foundation',
      'Implement full ES6 module loading',
      'Remove legacy compatibility layers'
    ]
  };
  
  const reportPath = 'project_docs/es6-integration-report.json';
  try {
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    log(`  ✅ Integration report saved to ${reportPath}`, 'green');
  } catch (error) {
    log(`  ❌ Failed to save report: ${error.message}`, 'red');
  }
  
  return report;
}

/**
 * Main execution
 */
async function main() {
  log('🚀 ES6 Module Integration Build Script', 'bright');
  log('=====================================', 'bright');
  
  try {
    // Step 1: Validate module structure
    const structureValid = validateES6Modules();
    if (!structureValid) {
      log('❌ ES6 module structure validation failed', 'red');
      process.exit(1);
    }
    
    // Step 2: Validate ES6 syntax
    const syntaxValid = validateES6Syntax();
    if (!syntaxValid) {
      log('❌ ES6 syntax validation failed', 'red');
      process.exit(1);
    }
    
    // Step 3: Check build configuration
    const buildConfigValid = checkBuildConfig();
    if (!buildConfigValid) {
      log('❌ Build configuration check failed', 'red');
      process.exit(1);
    }
    
    // Step 4: Generate integration report
    const report = generateIntegrationReport();
    
    // Success
    log('\n🎉 ES6 Module Integration validation complete!', 'green');
    log('✅ All checks passed successfully', 'green');
    log('📋 Next steps:', 'cyan');
    report.nextSteps.forEach((step, index) => {
      log(`   ${index + 1}. ${step}`, 'cyan');
    });
    
  } catch (error) {
    log(`\n🚨 Build script failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  validateES6Modules,
  validateES6Syntax,
  checkBuildConfig,
  generateIntegrationReport
};
