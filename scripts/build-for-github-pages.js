#!/usr/bin/env node

/**
 * Build script for GitHub Pages deployment
 * Compiles JavaScript modules and prepares static files
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building for GitHub Pages...');

// Ensure dist directory exists
const distDir = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

try {
  // Step 1: Compile JavaScript modules
  console.log('📦 Compiling JavaScript modules...');
  execSync('npx babel js/modules --out-dir dist/js/modules --source-maps', { stdio: 'inherit' });
  
  // Step 2: Copy static files
  console.log('📋 Copying static files...');
  const staticFiles = [
    'index.html',
    'css',
    'geojson',
    'in_app_docs',
    'manifest.json',
    'sw.js',
    'browserconfig.xml'
  ];
  
  staticFiles.forEach(file => {
    const src = path.join(__dirname, '..', file);
    const dest = path.join(distDir, file);
    
    if (fs.existsSync(src)) {
      if (fs.statSync(src).isDirectory()) {
        execSync(`xcopy "${src}" "${dest}" /E /I /Y`, { stdio: 'inherit' });
      } else {
        fs.copyFileSync(src, dest);
      }
      console.log(`✅ Copied ${file}`);
    } else {
      console.log(`⚠️  Skipped ${file} (not found)`);
    }
  });
  
  // Step 3: Update index.html to use compiled modules
  console.log('🔧 Updating index.html for compiled modules...');
  const indexPath = path.join(distDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    let content = fs.readFileSync(indexPath, 'utf8');
    
    // Replace module paths
    content = content.replace(
      'src="js/modules/main.js"',
      'src="js/modules/main.js"'
    );
    
    fs.writeFileSync(indexPath, content);
    console.log('✅ Updated index.html');
  }
  
  // Step 4: Create .nojekyll file for GitHub Pages
  console.log('📄 Creating .nojekyll file...');
  fs.writeFileSync(path.join(distDir, '.nojekyll'), '');
  
  // Step 5: Create deployment info
  const deploymentInfo = {
    buildTime: new Date().toISOString(),
    version: require('../package.json').version,
    buildType: 'github-pages',
    compiledModules: true
  };
  
  fs.writeFileSync(
    path.join(distDir, 'deployment-info.json'),
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log('✅ Build completed successfully!');
  console.log('📁 Output directory: dist/');
  console.log('🌐 Ready for GitHub Pages deployment');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
