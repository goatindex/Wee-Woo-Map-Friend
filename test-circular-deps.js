// Check for circular dependencies in ES6 modules
const fs = require('fs');
const path = require('path');

console.log('=== Checking for Circular Dependencies ===');

const modulesDir = 'js/modules';
const files = fs.readdirSync(modulesDir).filter(f => f.endsWith('.js'));

console.log('Found modules:', files.length);

// Check each module for imports
files.forEach(file => {
  try {
    const content = fs.readFileSync(path.join(modulesDir, file), 'utf8');
    const imports = content.match(/import.*from.*['"](.*?)['"]/g) || [];
    if (imports.length > 0) {
      console.log(`${file} imports:`, imports.map(imp => {
        const match = imp.match(/['"](.*?)['"]/);
        return match ? match[1] : 'unknown';
      }));
    }
  } catch (error) {
    console.log(`Error reading ${file}:`, error.message);
  }
});

// Check for specific problematic patterns
console.log('\n=== Checking for Problematic Patterns ===');

// Check if ES6Bootstrap imports anything that might cause issues
const bootstrapContent = fs.readFileSync('js/modules/ES6Bootstrap.js', 'utf8');
console.log('ES6Bootstrap imports:', bootstrapContent.match(/import.*from.*['"](.*?)['"]/g) || []);

// Check if there are any dynamic imports that might fail
const dynamicImports = bootstrapContent.match(/import\(['"](.*?)['"]\)/g) || [];
console.log('ES6Bootstrap dynamic imports:', dynamicImports);

// Check if there are any missing modules that ES6Bootstrap tries to load
const loadModuleCalls = bootstrapContent.match(/loadModule\(['"](.*?)['"]\)/g) || [];
console.log('ES6Bootstrap loadModule calls:', loadModuleCalls);

