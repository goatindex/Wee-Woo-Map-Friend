// Test file to diagnose the application loading issues
const fs = require('fs');

console.log('=== WeeWoo Map Friend Diagnosis ===');

try {
  // Check HTML structure
  const htmlContent = fs.readFileSync('index.html', 'utf8');
  
  console.log('\n📄 HTML Structure Analysis:');
  console.log('- Contains map div:', htmlContent.includes('<div id="map"></div>'));
  console.log('- Contains layerMenu div:', htmlContent.includes('<div class="layer-menu" id="layerMenu">'));
  console.log('- Contains main.js script:', htmlContent.includes('src="js/modules/main.js"'));
  console.log('- Contains Leaflet CSS:', htmlContent.includes('leaflet@1.9.4/dist/leaflet.css'));
  console.log('- Contains Leaflet JS:', htmlContent.includes('leaflet@1.9.4/dist/leaflet.js'));
  
  // Check critical files
  console.log('\n📁 Critical Files Check:');
  const criticalFiles = [
    'js/modules/main.js',
    'js/modules/ES6Bootstrap.js',
    'js/modules/EventBus.js',
    'js/modules/StateManager.js',
    'js/modules/MapManager.js',
    'js/device.js',
    'css/styles.css'
  ];
  
  criticalFiles.forEach(file => {
    try {
      fs.accessSync(file, fs.constants.F_OK);
      console.log('✅', file, 'exists');
    } catch (error) {
      console.log('❌', file, 'missing');
    }
  });
  
  // Check for potential issues
  console.log('\n🔍 Potential Issues Analysis:');
  
  // Check if main.js has proper imports
  const mainContent = fs.readFileSync('js/modules/main.js', 'utf8');
  console.log('- main.js imports ES6Bootstrap:', mainContent.includes("import { es6Bootstrap }"));
  console.log('- main.js imports globalEventBus:', mainContent.includes("import { globalEventBus }"));
  
  // Check if ES6Bootstrap has proper exports
  const bootstrapContent = fs.readFileSync('js/modules/ES6Bootstrap.js', 'utf8');
  console.log('- ES6Bootstrap exports es6Bootstrap:', bootstrapContent.includes("export const es6Bootstrap"));
  
  // Check if EventBus has proper exports
  const eventBusContent = fs.readFileSync('js/modules/EventBus.js', 'utf8');
  console.log('- EventBus exports globalEventBus:', eventBusContent.includes("export const globalEventBus"));
  
  // Check if device.js exists and has DeviceContext
  const deviceContent = fs.readFileSync('js/device.js', 'utf8');
  console.log('- device.js has DeviceContext:', deviceContent.includes("window.DeviceContext"));
  
  console.log('\n✅ Diagnosis complete');
  
} catch (error) {
  console.error('❌ Error during diagnosis:', error.message);
}

