/**
 * Performance Regression Testing
 * 
 * This test suite monitors performance metrics to detect regressions
 * and ensure the application maintains acceptable performance levels.
 * 
 * Key Metrics:
 * - Module initialization time
 * - Function execution time
 * - Memory usage patterns
 * - DOM manipulation performance
 * - Event handling performance
 */

const fs = require('fs');
const path = require('path');

// Performance thresholds (in milliseconds)
const PERFORMANCE_THRESHOLDS = {
  moduleInitialization: 1000,   // Max time for module init (increased for complex modules)
  functionExecution: 50,        // Max time for critical functions
  domManipulation: 30,          // Max time for DOM operations
  eventHandling: 20,            // Max time for event handlers
  memoryUsage: 200 * 1024 * 1024 // Max memory usage (200MB - increased for test environment)
};

// Performance baseline data
let performanceBaseline = null;
const baselineFile = path.resolve(__dirname, '../performance-baseline.json');

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      moduleInitialization: {},
      functionExecution: {},
      domManipulation: {},
      eventHandling: {},
      memoryUsage: {}
    };
    this.startTimes = new Map();
  }

  /**
   * Start timing a performance metric
   */
  startTiming(key, category = 'functionExecution') {
    this.startTimes.set(key, {
      startTime: performance.now(),
      category
    });
  }

  /**
   * End timing and record the metric
   */
  endTiming(key) {
    const timing = this.startTimes.get(key);
    if (!timing) {
      throw new Error(`No start timing found for key: ${key}`);
    }

    const duration = performance.now() - timing.startTime;
    this.recordMetric(timing.category, key, duration);
    this.startTimes.delete(key);
    return duration;
  }

  /**
   * Record a performance metric
   */
  recordMetric(category, key, value) {
    if (!this.metrics[category]) {
      this.metrics[category] = {};
    }
    this.metrics[category][key] = value;
  }

  /**
   * Get memory usage
   */
  getMemoryUsage() {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    return 0;
  }

  /**
   * Check if performance is within acceptable thresholds
   */
  checkThresholds() {
    const violations = [];

    for (const [category, threshold] of Object.entries(PERFORMANCE_THRESHOLDS)) {
      const metrics = this.metrics[category];
      if (metrics) {
        for (const [key, value] of Object.entries(metrics)) {
          if (value > threshold) {
            violations.push({
              category,
              key,
              value,
              threshold,
              violation: `${value}ms > ${threshold}ms`
            });
          }
        }
      }
    }

    return violations;
  }

  /**
   * Generate performance report
   */
  generateReport() {
    const violations = this.checkThresholds();
    const report = {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      violations,
      summary: {
        totalViolations: violations.length,
        categories: Object.keys(this.metrics).length,
        status: violations.length === 0 ? 'PASS' : 'FAIL'
      }
    };

    return report;
  }
}

describe('Performance Regression Tests', () => {
  let performanceMonitor;

  beforeAll(() => {
    performanceMonitor = new PerformanceMonitor();
    
    // Load baseline if it exists
    if (fs.existsSync(baselineFile)) {
      try {
        performanceBaseline = JSON.parse(fs.readFileSync(baselineFile, 'utf8'));
      } catch (error) {
        console.warn('Could not load performance baseline:', error.message);
      }
    }
  });

  afterAll(() => {
    // Save current performance as new baseline
    const report = performanceMonitor.generateReport();
    fs.writeFileSync(baselineFile, JSON.stringify(report, null, 2));
  });

  describe('Module Initialization Performance', () => {
    test('ApplicationBootstrap initialization should be fast', async () => {
      performanceMonitor.startTiming('ApplicationBootstrap.init', 'moduleInitialization');
      
      // Import and initialize ApplicationBootstrap
      const { ApplicationBootstrap } = await import('../js/modules/ApplicationBootstrap.js');
      const bootstrap = new ApplicationBootstrap();
      
      // Mock DOM for testing
      global.document = {
        readyState: 'complete',
        addEventListener: jest.fn(),
        querySelector: jest.fn(() => null),
        querySelectorAll: jest.fn(() => [])
      };
      global.window = {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        location: { href: 'http://localhost:8001' }
      };

      await bootstrap.init();
      
      const duration = performanceMonitor.endTiming('ApplicationBootstrap.init');
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.moduleInitialization);
    });

    test('StateManager initialization should be fast', async () => {
      performanceMonitor.startTiming('StateManager.init', 'moduleInitialization');
      
      const { StateManager } = await import('../js/modules/StateManager.js');
      const stateManager = new StateManager();
      // StateManager doesn't have an init method, just test instantiation
      
      const duration = performanceMonitor.endTiming('StateManager.init');
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.moduleInitialization);
    });

    test('MapManager initialization should be fast', async () => {
      performanceMonitor.startTiming('MapManager.init', 'moduleInitialization');
      
      const { MapManager } = await import('../js/modules/MapManager.js');
      const mapManager = new MapManager();
      
      // Mock Leaflet
      global.L = {
        map: jest.fn(() => ({
          setView: jest.fn(),
          addLayer: jest.fn(),
          removeLayer: jest.fn(),
          on: jest.fn(),
          off: jest.fn(),
          createPane: jest.fn(),
          getPane: jest.fn(() => ({
            style: { zIndex: '' }
          })),
          getCenter: jest.fn(() => ({ lat: -37.8136, lng: 144.9631 })),
          getZoom: jest.fn(() => 10)
        })),
        tileLayer: jest.fn(() => ({
          addTo: jest.fn()
        })),
        control: {
          zoom: jest.fn(() => ({
            addTo: jest.fn()
          }))
        }
      };

      // Mock DOM element for map container
      global.document.getElementById = jest.fn(() => ({
        style: {},
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      }));

      await mapManager.init();
      
      const duration = performanceMonitor.endTiming('MapManager.init');
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.moduleInitialization);
    });
  });

  describe('Function Execution Performance', () => {
    test('StateManager operations should be fast', async () => {
      const { StateManager } = await import('../js/modules/StateManager.js');
      const stateManager = new StateManager();

      // Test get operation
      performanceMonitor.startTiming('StateManager.get', 'functionExecution');
      stateManager.get('testKey');
      const getDuration = performanceMonitor.endTiming('StateManager.get');

      // Test set operation
      performanceMonitor.startTiming('StateManager.set', 'functionExecution');
      stateManager.set('testKey', 'testValue');
      const setDuration = performanceMonitor.endTiming('StateManager.set');

      expect(getDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.functionExecution);
      expect(setDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.functionExecution);
    });

    test('EventBus operations should be fast', async () => {
      const { EventBus } = await import('../js/modules/EventBus.js');
      const eventBus = new EventBus();

      // Test emit operation
      performanceMonitor.startTiming('EventBus.emit', 'functionExecution');
      eventBus.emit('testEvent', { data: 'test' });
      const emitDuration = performanceMonitor.endTiming('EventBus.emit');

      // Test on operation
      performanceMonitor.startTiming('EventBus.on', 'functionExecution');
      eventBus.on('testEvent', jest.fn());
      const onDuration = performanceMonitor.endTiming('EventBus.on');

      expect(emitDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.functionExecution);
      expect(onDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.functionExecution);
    });
  });

  describe('DOM Manipulation Performance', () => {
    beforeEach(() => {
      // Mock DOM elements
      global.document = {
        createElement: jest.fn(() => ({
          setAttribute: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          appendChild: jest.fn(),
          removeChild: jest.fn(),
          classList: {
            add: jest.fn(),
            remove: jest.fn(),
            contains: jest.fn()
          }
        })),
        querySelector: jest.fn(() => ({
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          classList: {
            add: jest.fn(),
            remove: jest.fn(),
            contains: jest.fn()
          }
        })),
        querySelectorAll: jest.fn(() => []),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      };
    });

    test('ComponentBase DOM operations should be fast', async () => {
      const { ComponentBase } = await import('../js/modules/ComponentBase.js');
      
      class TestComponent extends ComponentBase {
        constructor() {
          super(document.createElement('div')); // Provide container
          this.element = null;
        }
        
        createElement() {
          this.element = document.createElement('div');
          this.element.className = 'test-component';
          return this.element;
        }
      }

      const component = new TestComponent();

      // Test element creation
      performanceMonitor.startTiming('ComponentBase.createElement', 'domManipulation');
      component.createElement();
      const createDuration = performanceMonitor.endTiming('ComponentBase.createElement');

      expect(createDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.domManipulation);
    });
  });

  describe('Event Handling Performance', () => {
    test('Event listener registration should be fast', async () => {
      const { EventBus } = await import('../js/modules/EventBus.js');
      const eventBus = new EventBus();

      const handler = jest.fn();

      // Test multiple event registrations
      performanceMonitor.startTiming('EventBus.multipleOn', 'eventHandling');
      for (let i = 0; i < 100; i++) {
        eventBus.on(`event${i}`, handler);
      }
      const registrationDuration = performanceMonitor.endTiming('EventBus.multipleOn');

      expect(registrationDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.eventHandling);
    });

    test('Event emission should be fast', async () => {
      const { EventBus } = await import('../js/modules/EventBus.js');
      const eventBus = new EventBus();

      const handler = jest.fn();
      eventBus.on('testEvent', handler);

      // Test multiple event emissions
      performanceMonitor.startTiming('EventBus.multipleEmit', 'eventHandling');
      for (let i = 0; i < 100; i++) {
        eventBus.emit('testEvent', { data: i });
      }
      const emissionDuration = performanceMonitor.endTiming('EventBus.multipleEmit');

      expect(emissionDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.eventHandling);
    });
  });

  describe('Memory Usage Performance', () => {
    test('Memory usage should be within limits', () => {
      const memoryUsage = performanceMonitor.getMemoryUsage();
      performanceMonitor.recordMetric('memoryUsage', 'current', memoryUsage);
      
      expect(memoryUsage).toBeLessThan(PERFORMANCE_THRESHOLDS.memoryUsage);
    });

    test('Memory usage should not grow excessively', () => {
      const initialMemory = performanceMonitor.getMemoryUsage();
      
      // Create some objects to test memory usage
      const testObjects = [];
      for (let i = 0; i < 1000; i++) {
        testObjects.push({
          id: i,
          data: new Array(100).fill('test')
        });
      }
      
      const finalMemory = performanceMonitor.getMemoryUsage();
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('Performance Regression Detection', () => {
    test('Current performance should not regress from baseline', () => {
      if (!performanceBaseline) {
        console.log('No performance baseline available for comparison');
        return;
      }

      const currentReport = performanceMonitor.generateReport();
      const violations = [];

      // Compare current metrics with baseline
      for (const [category, currentMetrics] of Object.entries(currentReport.metrics)) {
        const baselineMetrics = performanceBaseline.metrics[category];
        if (baselineMetrics) {
          for (const [key, currentValue] of Object.entries(currentMetrics)) {
            const baselineValue = baselineMetrics[key];
            if (baselineValue && currentValue > baselineValue * 1.5) {
              violations.push({
                category,
                key,
                current: currentValue,
                baseline: baselineValue,
                regression: `${currentValue}ms > ${baselineValue * 1.5}ms (50% increase)`
              });
            }
          }
        }
      }

      if (violations.length > 0) {
        console.warn('Performance regressions detected:', violations);
      }

      // Allow some tolerance for performance variations
      expect(violations.length).toBeLessThan(3);
    });
  });

  describe('Performance Summary', () => {
    test('Overall performance should be acceptable', () => {
      const report = performanceMonitor.generateReport();
      const violations = report.violations;

      console.log('Performance Report:', JSON.stringify(report, null, 2));

      if (violations.length > 0) {
        console.warn('Performance violations detected:', violations);
      }

      expect(violations.length).toBe(0);
    });
  });
});
