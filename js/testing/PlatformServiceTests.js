/**
 * @module testing/PlatformServiceTests
 * Comprehensive test suite for PlatformService
 * Tests platform detection, capabilities, and optimizations
 * 
 * @fileoverview Platform service tests for the WeeWoo Map Friend application
 * @version 1.0.0
 * @author WeeWoo Map Friend Team
 */

import { PlatformService, PLATFORM_TYPES, DEVICE_TYPES, BROWSER_TYPES, OS_TYPES } from '../modules/PlatformService.js';
import { TYPES } from '../modules/DependencyContainer.js';

/**
 * Mock event bus for testing
 */
class MockEventBus {
  constructor() {
    this.events = new Map();
  }

  on(eventType, handler) {
    if (!this.events.has(eventType)) {
      this.events.set(eventType, []);
    }
    this.events.get(eventType).push(handler);
    return () => this.off(eventType, handler);
  }

  off(eventType, handler) {
    if (this.events.has(eventType)) {
      const handlers = this.events.get(eventType);
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  emit(eventType, payload) {
    if (this.events.has(eventType)) {
      this.events.get(eventType).forEach(handler => {
        try {
          handler(payload);
        } catch (error) {
          console.error('Error in event handler:', error);
        }
      });
    }
  }
}

/**
 * Mock config service for testing
 */
class MockConfigService {
  constructor() {
    this.config = new Map();
  }

  set(key, value) {
    this.config.set(key, value);
  }

  get(key, defaultValue) {
    return this.config.get(key) || defaultValue;
  }

  has(key) {
    return this.config.has(key);
  }

  getAll() {
    const result = {};
    for (const [key, value] of this.config) {
      result[key] = value;
    }
    return result;
  }
}

/**
 * Platform service test suite
 */
export class PlatformServiceTests {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
    this.platformService = null;
    this.mockEventBus = new MockEventBus();
    this.mockConfigService = new MockConfigService();
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🧪 Running PlatformService Tests...\n');

    // Setup
    await this.setupTests();

    // Run tests
    await this.testPlatformDetection();
    await this.testCapabilityDetection();
    await this.testOptimizationGeneration();
    await this.testPlatformInfo();
    await this.testPlatformMethods();
    await this.testErrorHandling();
    await this.testIntegration();

    // Results
    this.printResults();
  }

  /**
   * Setup test environment
   */
  async setupTests() {
    try {
      // Create platform service with mocked dependencies
      this.platformService = new PlatformService(this.mockEventBus, this.mockConfigService);
      
      // Mock browser APIs for testing
      this.mockBrowserAPIs();
      
      console.log('✅ Test setup completed');
    } catch (error) {
      console.error('❌ Test setup failed:', error);
      throw error;
    }
  }

  /**
   * Mock browser APIs for testing
   */
  mockBrowserAPIs() {
    // Mock navigator
    global.navigator = {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      language: 'en-US',
      hardwareConcurrency: 8,
      maxTouchPoints: 0,
      geolocation: {},
      serviceWorker: {},
      deviceMemory: 8,
      connection: {
        effectiveType: '4g',
        downlink: 10,
        rtt: 50,
        saveData: false
      }
    };

    // Mock window
    global.window = {
      innerWidth: 1920,
      innerHeight: 1080,
      devicePixelRatio: 1,
      isSecureContext: true,
      location: {
        protocol: 'https:'
      },
      screen: {
        width: 1920,
        height: 1080,
        colorDepth: 24,
        orientation: {
          type: 'landscape-primary'
        }
      },
      document: {
        createElement: (tag) => ({
          getContext: (type) => type === 'webgl' ? {} : null
        })
      },
      CSS: {
        supports: (property, value) => true
      },
      performance: {
        memory: {
          jsHeapSizeLimit: 4294705152,
          totalJSHeapSize: 100000000,
          usedJSHeapSize: 50000000
        }
      }
    };

    // Mock screen
    global.screen = global.window.screen;

    // Mock localStorage
    global.localStorage = {
      setItem: () => {},
      removeItem: () => {},
      getItem: () => null
    };

    // Mock sessionStorage
    global.sessionStorage = {
      setItem: () => {},
      removeItem: () => {},
      getItem: () => null
    };

    // Mock Intl
    global.Intl = {
      DateTimeFormat: () => ({
        resolvedOptions: () => ({
          timeZone: 'America/New_York'
        })
      })
    };
  }

  /**
   * Test platform detection
   */
  async testPlatformDetection() {
    console.log('🔍 Testing Platform Detection...');

    try {
      await this.platformService.initialize();
      
      const platformInfo = this.platformService.getPlatformInfo();
      
      // Test platform detection
      this.assert(platformInfo !== null, 'Platform info should be detected');
      this.assert(platformInfo.platform !== PLATFORM_TYPES.UNKNOWN, 'Platform should be detected');
      this.assert(platformInfo.device !== DEVICE_TYPES.UNKNOWN, 'Device should be detected');
      this.assert(platformInfo.browser !== BROWSER_TYPES.UNKNOWN, 'Browser should be detected');
      this.assert(platformInfo.os !== OS_TYPES.UNKNOWN, 'OS should be detected');
      
      // Test specific platform detection
      this.assert(platformInfo.platform === PLATFORM_TYPES.WEB, 'Should detect web platform');
      this.assert(platformInfo.device === DEVICE_TYPES.DESKTOP, 'Should detect desktop device');
      this.assert(platformInfo.browser === BROWSER_TYPES.CHROME, 'Should detect Chrome browser');
      this.assert(platformInfo.os === OS_TYPES.WINDOWS, 'Should detect Windows OS');
      
      console.log('✅ Platform detection tests passed');
    } catch (error) {
      console.error('❌ Platform detection tests failed:', error);
      this.failed++;
    }
  }

  /**
   * Test capability detection
   */
  async testCapabilityDetection() {
    console.log('🔍 Testing Capability Detection...');

    try {
      const capabilities = this.platformService.getCapabilities();
      
      // Test capability detection
      this.assert(capabilities !== null, 'Capabilities should be detected');
      this.assert(typeof capabilities === 'object', 'Capabilities should be an object');
      
      // Test specific capabilities
      this.assert(capabilities.geolocation === true, 'Should detect geolocation capability');
      this.assert(capabilities.serviceWorker === true, 'Should detect service worker capability');
      this.assert(capabilities.webGL === true, 'Should detect WebGL capability');
      this.assert(capabilities.localStorage === true, 'Should detect localStorage capability');
      this.assert(capabilities.fetch === true, 'Should detect fetch capability');
      this.assert(capabilities.promises === true, 'Should detect promises capability');
      
      // Test platform-specific capabilities
      this.assert(capabilities.touch === false, 'Should detect no touch capability on desktop');
      this.assert(capabilities.mouse === true, 'Should detect mouse capability on desktop');
      this.assert(capabilities.keyboard === true, 'Should detect keyboard capability on desktop');
      
      console.log('✅ Capability detection tests passed');
    } catch (error) {
      console.error('❌ Capability detection tests failed:', error);
      this.failed++;
    }
  }

  /**
   * Test optimization generation
   */
  async testOptimizationGeneration() {
    console.log('🔍 Testing Optimization Generation...');

    try {
      const optimizations = this.platformService.getOptimizations();
      
      // Test optimization generation
      this.assert(optimizations !== null, 'Optimizations should be generated');
      this.assert(typeof optimizations === 'object', 'Optimizations should be an object');
      
      // Test specific optimizations
      this.assert(optimizations.enableWebGL === true, 'Should enable WebGL on desktop');
      this.assert(optimizations.enableWebWorkers === true, 'Should enable Web Workers on desktop');
      this.assert(optimizations.enableCaching === true, 'Should enable caching on desktop');
      this.assert(optimizations.enableTouchOptimizations === false, 'Should disable touch optimizations on desktop');
      this.assert(optimizations.enableKeyboardOptimizations === true, 'Should enable keyboard optimizations on desktop');
      this.assert(optimizations.enableMouseOptimizations === true, 'Should enable mouse optimizations on desktop');
      
      console.log('✅ Optimization generation tests passed');
    } catch (error) {
      console.error('❌ Optimization generation tests failed:', error);
      this.failed++;
    }
  }

  /**
   * Test platform info methods
   */
  async testPlatformInfo() {
    console.log('🔍 Testing Platform Info Methods...');

    try {
      // Test platform type methods
      this.assert(this.platformService.getPlatform() === PLATFORM_TYPES.WEB, 'getPlatform should return web');
      this.assert(this.platformService.getDevice() === DEVICE_TYPES.DESKTOP, 'getDevice should return desktop');
      this.assert(this.platformService.getBrowser() === BROWSER_TYPES.CHROME, 'getBrowser should return chrome');
      this.assert(this.platformService.getOS() === OS_TYPES.WINDOWS, 'getOS should return windows');
      
      // Test platform type checks
      this.assert(this.platformService.isWeb() === true, 'isWeb should return true');
      this.assert(this.platformService.isMobile() === false, 'isMobile should return false');
      this.assert(this.platformService.isTablet() === false, 'isTablet should return false');
      this.assert(this.platformService.isDesktop() === true, 'isDesktop should return true');
      
      // Test capability checks
      this.assert(this.platformService.isTouch() === false, 'isTouch should return false');
      this.assert(this.platformService.isMouse() === true, 'isMouse should return true');
      this.assert(this.platformService.isKeyboard() === true, 'isKeyboard should return true');
      
      // Test info getters
      const screenInfo = this.platformService.getScreenInfo();
      this.assert(screenInfo !== null, 'getScreenInfo should return info');
      this.assert(screenInfo.width === 1920, 'Screen width should be 1920');
      this.assert(screenInfo.height === 1080, 'Screen height should be 1080');
      
      const viewportInfo = this.platformService.getViewportInfo();
      this.assert(viewportInfo !== null, 'getViewportInfo should return info');
      this.assert(viewportInfo.width === 1920, 'Viewport width should be 1920');
      this.assert(viewportInfo.height === 1080, 'Viewport height should be 1080');
      
      const connectionInfo = this.platformService.getConnectionInfo();
      this.assert(connectionInfo !== null, 'getConnectionInfo should return info');
      this.assert(connectionInfo.effectiveType === '4g', 'Connection type should be 4g');
      
      const memoryInfo = this.platformService.getMemoryInfo();
      this.assert(memoryInfo !== null, 'getMemoryInfo should return info');
      this.assert(memoryInfo.deviceMemory === 8, 'Device memory should be 8');
      
      const hardwareInfo = this.platformService.getHardwareInfo();
      this.assert(hardwareInfo !== null, 'getHardwareInfo should return info');
      this.assert(hardwareInfo.cores === 8, 'CPU cores should be 8');
      
      console.log('✅ Platform info methods tests passed');
    } catch (error) {
      console.error('❌ Platform info methods tests failed:', error);
      this.failed++;
    }
  }

  /**
   * Test platform methods
   */
  async testPlatformMethods() {
    console.log('🔍 Testing Platform Methods...');

    try {
      // Test capability methods
      this.assert(this.platformService.hasCapability('geolocation') === true, 'hasCapability should return true for geolocation');
      this.assert(this.platformService.hasCapability('serviceWorker') === true, 'hasCapability should return true for serviceWorker');
      this.assert(this.platformService.hasCapability('webGL') === true, 'hasCapability should return true for webGL');
      this.assert(this.platformService.hasCapability('touch') === false, 'hasCapability should return false for touch');
      
      // Test optimization methods
      this.assert(this.platformService.isOptimizationEnabled('enableWebGL') === true, 'isOptimizationEnabled should return true for enableWebGL');
      this.assert(this.platformService.isOptimizationEnabled('enableTouchOptimizations') === false, 'isOptimizationEnabled should return false for enableTouchOptimizations');
      
      // Test initialization status
      this.assert(this.platformService.isInitialized() === true, 'isInitialized should return true');
      
      // Test debug info
      const debugInfo = this.platformService.getDebugInfo();
      this.assert(debugInfo !== null, 'getDebugInfo should return info');
      this.assert(debugInfo.platform !== null, 'Debug info should include platform');
      this.assert(debugInfo.capabilities !== null, 'Debug info should include capabilities');
      this.assert(debugInfo.optimizations !== null, 'Debug info should include optimizations');
      this.assert(debugInfo.timestamp !== null, 'Debug info should include timestamp');
      
      console.log('✅ Platform methods tests passed');
    } catch (error) {
      console.error('❌ Platform methods tests failed:', error);
      this.failed++;
    }
  }

  /**
   * Test error handling
   */
  async testErrorHandling() {
    console.log('🔍 Testing Error Handling...');

    try {
      // Test with invalid user agent
      const originalUserAgent = global.navigator.userAgent;
      global.navigator.userAgent = 'Invalid User Agent';
      
      // Create new platform service instance
      const testPlatformService = new PlatformService(this.mockEventBus, this.mockConfigService);
      await testPlatformService.initialize();
      
      // Should still work with fallback values
      this.assert(testPlatformService.getPlatform() !== PLATFORM_TYPES.UNKNOWN, 'Should handle invalid user agent');
      this.assert(testPlatformService.getBrowser() !== BROWSER_TYPES.UNKNOWN, 'Should handle invalid user agent');
      
      // Restore original user agent
      global.navigator.userAgent = originalUserAgent;
      
      console.log('✅ Error handling tests passed');
    } catch (error) {
      console.error('❌ Error handling tests failed:', error);
      this.failed++;
    }
  }

  /**
   * Test integration
   */
  async testIntegration() {
    console.log('🔍 Testing Integration...');

    try {
      // Test event emission
      let platformReadyEventEmitted = false;
      this.mockEventBus.on('platform:ready', (payload) => {
        platformReadyEventEmitted = true;
        this.assert(payload.platform !== null, 'Platform ready event should include platform');
        this.assert(payload.capabilities !== null, 'Platform ready event should include capabilities');
        this.assert(payload.optimizations !== null, 'Platform ready event should include optimizations');
      });
      
      // Test config service integration
      const platformInfo = this.mockConfigService.get('platform.info');
      this.assert(platformInfo !== null, 'Platform info should be stored in config service');
      
      const platformCapabilities = this.mockConfigService.get('platform.capabilities');
      this.assert(platformCapabilities !== null, 'Platform capabilities should be stored in config service');
      
      const platformOptimizations = this.mockConfigService.get('platform.optimizations');
      this.assert(platformOptimizations !== null, 'Platform optimizations should be stored in config service');
      
      console.log('✅ Integration tests passed');
    } catch (error) {
      console.error('❌ Integration tests failed:', error);
      this.failed++;
    }
  }

  /**
   * Assert helper
   */
  assert(condition, message) {
    if (condition) {
      this.passed++;
    } else {
      this.failed++;
      console.error(`❌ Assertion failed: ${message}`);
    }
  }

  /**
   * Print test results
   */
  printResults() {
    console.log('\n📊 PlatformService Test Results:');
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`📈 Total: ${this.passed + this.failed}`);
    console.log(`🎯 Success Rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}%`);
    
    if (this.failed === 0) {
      console.log('\n🎉 All tests passed! PlatformService is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the implementation.');
    }
  }
}

// Export for use in other test files
export default PlatformServiceTests;
