#!/usr/bin/env node

/**
 * Development server with auto-rebuild
 * Watches for changes and rebuilds JavaScript modules
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting development server with auto-rebuild...');

// Ensure dist directory exists
const distDir = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copy static files first
console.log('📋 Copying static files...');
const staticFiles = ['index.html', 'css', 'geojson', 'in_app_docs', 'manifest.json', 'sw.js'];
staticFiles.forEach(file => {
  const src = path.join(__dirname, '..', file);
  const dest = path.join(distDir, file);
  
  if (fs.existsSync(src)) {
    if (fs.statSync(src).isDirectory()) {
      require('child_process').execSync(`xcopy "${src}" "${dest}" /E /I /Y`, { stdio: 'ignore' });
    } else {
      fs.copyFileSync(src, dest);
    }
  }
});

// Start Babel watch process
console.log('👀 Watching JavaScript modules...');
const babelProcess = spawn('npx', ['babel', 'js/modules', '--out-dir', 'dist/js/modules', '--watch', '--source-maps'], {
  stdio: 'inherit',
  shell: true
});

// Start Python server
console.log('🌐 Starting Python server...');
const serverProcess = spawn('python', ['-m', 'http.server', '8000'], {
  stdio: 'inherit',
  shell: true,
  cwd: distDir
});

// Handle process cleanup
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down development server...');
  babelProcess.kill();
  serverProcess.kill();
  process.exit(0);
});

// Handle errors
babelProcess.on('error', (error) => {
  console.error('❌ Babel process error:', error);
});

serverProcess.on('error', (error) => {
  console.error('❌ Server process error:', error);
});

console.log('✅ Development server running at http://localhost:8000');
console.log('📝 Edit files in js/modules/ and they will be automatically rebuilt');
console.log('🛑 Press Ctrl+C to stop');
