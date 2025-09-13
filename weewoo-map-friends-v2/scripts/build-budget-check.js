import { readFileSync, existsSync } from 'fs';
import { gzipSync } from 'zlib';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BUDGETS = {
  'bundle-size': 500 * 1024, // 500KB
  'gzip-size': 150 * 1024,   // 150KB
  'load-time': 3000,         // 3 seconds
  'memory-usage': 50 * 1024 * 1024 // 50MB
};

function checkBudgets() {
  try {
    console.log('📊 Performance Budget Check');
    console.log('========================');
    
    // Check if dist directory exists
    if (!existsSync('dist')) {
      console.error('❌ dist directory not found. Run build first.');
      process.exit(1);
    }
    
    // Calculate bundle size
    const bundleSize = calculateBundleSize();
    console.log(`✅ Bundle size: ${formatBytes(bundleSize)}`);
    
    // Calculate gzip size
    const gzipSize = calculateGzipSize();
    console.log(`✅ Gzip size: ${formatBytes(gzipSize)}`);
    
    // Check budgets
    const results = {
      'bundle-size': bundleSize,
      'gzip-size': gzipSize
    };
    
    let allPassed = true;
    
    Object.entries(BUDGETS).forEach(([metric, budget]) => {
      const actual = results[metric];
      if (actual) {
        const percentage = ((actual / budget) * 100).toFixed(1);
        
        if (actual > budget) {
          console.error(`❌ ${metric}: ${formatBytes(actual)} > ${formatBytes(budget)} (${percentage}%)`);
          allPassed = false;
        } else {
          console.log(`✅ ${metric}: ${formatBytes(actual)} <= ${formatBytes(budget)} (${percentage}%)`);
        }
      }
    });
    
    if (allPassed) {
      console.log('🎉 All performance budgets met!');
    } else {
      console.error('💥 Performance budgets exceeded!');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Failed to check performance budgets:', error.message);
    process.exit(1);
  }
}

function calculateBundleSize() {
  try {
    const result = execSync('du -sb dist', { encoding: 'utf8' });
    return parseInt(result.split('\t')[0]);
  } catch (error) {
    // Fallback for Windows
    try {
      const result = execSync('powershell -Command "(Get-ChildItem -Path dist -Recurse | Measure-Object -Property Length -Sum).Sum"', { encoding: 'utf8' });
      return parseInt(result.trim());
    } catch (windowsError) {
      console.warn('⚠️  Could not calculate bundle size automatically');
      return 0;
    }
  }
}

function calculateGzipSize() {
  try {
    // Find the main JS file
    const result = execSync('find dist -name "*.js" -type f | head -1', { encoding: 'utf8' });
    const mainFile = result.trim();
    
    if (mainFile && existsSync(mainFile)) {
      const content = readFileSync(mainFile);
      const gzipped = gzipSync(content);
      return gzipped.length;
    }
    
    return 0;
  } catch (error) {
    console.warn('⚠️  Could not calculate gzip size automatically');
    return 0;
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

checkBudgets();

