/**
 * @module modules/ES6Bootstrap
 * New ES6-based bootstrap system that replaces legacy bootstrap.js
 * Coordinates migration from legacy to ES6 modules
 */

// Core modules only - no circular dependencies
import { globalEventBus } from './EventBus.js';
import { stateManager } from './StateManager.js';

/**
 * @class ES6Bootstrap
 * Modern ES6-based application bootstrap system
 */
export class ES6Bootstrap {
  constructor() {
    this.initialized = false;
    this.legacyBootstrap = null;
    this.migrationPhase = 'starting';
    this.initStartTime = performance.now();
    
    // Bind methods
    this.init = this.init.bind(this);
    this.migrateLegacyBootstrap = this.migrateLegacyBootstrap.bind(this);
    this.setupLegacyIntegration = this.setupLegacyIntegration.bind(this);
    this.handleError = this.handleError.bind(this);
    
    // Module cache for dynamic imports
    this.modules = new Map();
    
    console.log('🚀 ES6Bootstrap: Modern bootstrap system initialized');
  }
  
  /**
   * Dynamically load a module to avoid circular dependencies
   * @param {string} moduleName - Name of the module to load
   * @returns {Promise<Object>} The loaded module
   */
  async loadModule(moduleName) {
    if (this.modules.has(moduleName)) {
      return this.modules.get(moduleName);
    }
    
    try {
      console.log(`📦 ES6Bootstrap: Loading module ${moduleName}...`);
      
      let module;
      switch (moduleName) {
        case 'es6IntegrationManager':
          module = await import('./ES6IntegrationManager.js');
          this.modules.set(moduleName, module.es6IntegrationManager);
          break;
        case 'configurationManager':
          module = await import('./ConfigurationManager.js');
          this.modules.set(moduleName, module.configurationManager);
          break;
        case 'legacyCompatibility':
          module = await import('./LegacyCompatibility.js');
          this.modules.set(moduleName, module.legacyCompatibility);
          break;
        case 'activeListManager':
          module = await import('./ActiveListManager.js');
          this.modules.set(moduleName, module.activeListManager);
          break;
        case 'mapManager':
          module = await import('./MapManager.js');
          this.modules.set(moduleName, module.mapManager);
          break;
        case 'layerManager':
          module = await import('./LayerManager.js');
          this.modules.set(moduleName, module.layerManager);
          break;
        case 'polygonLoader':
          module = await import('./PolygonLoader.js');
          this.modules.set(moduleName, module.polygonLoader);
          break;
        case 'dataLoadingOrchestrator':
          module = await import('./DataLoadingOrchestrator.js');
          this.modules.set(moduleName, module.dataLoadingOrchestrator);
          break;
        case 'stateSynchronizer':
          module = await import('./StateSynchronizer.js');
          this.modules.set(moduleName, module.stateSynchronizer);
          break;
        case 'legacyIntegrationBridge':
          module = await import('./LegacyIntegrationBridge.js');
          this.modules.set(moduleName, module.legacyIntegrationBridge);
          break;
        case 'labelManager':
          module = await import('./LabelManager.js');
          this.modules.set(moduleName, module.labelManager);
          break;
        case 'coordinateConverter':
          module = await import('./CoordinateConverter.js');
          this.modules.set(moduleName, module.coordinateConverter);
          break;
        case 'errorUI':
          module = await import('./ErrorUI.js');
          this.modules.set(moduleName, module.errorUI);
          break;
        case 'textFormatter':
          module = await import('./TextFormatter.js');
          this.modules.set(moduleName, module.textFormatter);
          break;
        case 'featureEnhancer':
          module = await import('./FeatureEnhancer.js');
          this.modules.set(moduleName, module.featureEnhancer);
          break;
        case 'appBootstrap':
          module = await import('./AppBootstrap.js');
          this.modules.set(moduleName, module.appBootstrap);
          break;
        case 'deviceManager':
          module = await import('./DeviceManager.js');
          this.modules.set(moduleName, module.deviceManager);
          break;
        case 'uiManager':
          module = await import('./UIManager.js');
          this.modules.set(moduleName, module.uiManager);
          break;
        default:
          throw new Error(`Unknown module: ${moduleName}`);
      }
      
      console.log(`✅ ES6Bootstrap: Module ${moduleName} loaded successfully`);
      return this.modules.get(moduleName);
      
    } catch (error) {
      console.error(`🚨 ES6Bootstrap: Failed to load module ${moduleName}:`, error);
      throw error;
    }
  }
  
  /**
   * Initialize the ES6 bootstrap system
   */
  async init() {
    if (this.initialized) {
      console.warn('ES6Bootstrap: Already initialized');
      return;
    }
    
    try {
      console.log('🔧 ES6Bootstrap: Starting modern bootstrap initialization...');
      
      // Phase 1: Wait for DOM and basic dependencies
      await this.waitForDOM();
      await this.waitForBasicDependencies();
      
      // Phase 2: Initialize ES6 integration manager
      await this.initES6Integration();
      
      // Phase 3: Migrate legacy bootstrap functionality
      await this.migrateLegacyBootstrap();
      
      // Phase 4: Initialize modern AppBootstrap
      await this.initAppBootstrap();
      
      // Phase 5: Set up legacy integration
      this.setupLegacyIntegration();
      
      // Phase 6: Initialize UI components
      await this.initUIComponents();
      
      // Phase 7: Initialize core ES6 systems
      await this.initCoreSystems();
      
      // Phase 8: Initialize legacy compatibility
      await this.initLegacyCompatibility();
      
      // Phase 9: Initialize active list manager
      await this.initActiveListManager();
      
      // Phase 10: Initialize map integration modules
      await this.initMapIntegration();
      
      // Phase 11: Initialize legacy function migration modules
      await this.initLegacyFunctionMigration();
      
      // Phase 12: Mark as initialized
      this.initialized = true;
      this.migrationPhase = 'complete';
      
      const initTime = performance.now() - this.initStartTime;
      console.log(`✅ ES6Bootstrap: Modern bootstrap complete (${initTime.toFixed(2)}ms)`);
      
      // Emit completion event
      globalEventBus.emit('es6bootstrap:complete', { bootstrap: this });
      
    } catch (error) {
      console.error('🚨 ES6Bootstrap: Modern bootstrap failed:', error);
      this.handleError(error);
      throw error;
    }
  }
  
  /**
   * Wait for DOM to be ready
   */
  async waitForDOM() {
    if (document.readyState === 'loading') {
      return new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve, { once: true });
      });
    }
  }
  
  /**
   * Wait for basic dependencies to be available
   */
  async waitForBasicDependencies() {
    console.log('⏳ ES6Bootstrap: Waiting for basic dependencies...');
    
    const dependencies = [
      { name: 'L', global: 'L', timeout: 5000 },
      { name: 'DeviceContext', global: 'DeviceContext', timeout: 2000 }
    ];
    
    const promises = dependencies.map(dep => this.waitForGlobal(dep.global, dep.timeout, dep.name));
    
    try {
      await Promise.all(promises);
      console.log('✅ ES6Bootstrap: All basic dependencies ready');
    } catch (error) {
      console.warn('⚠️ ES6Bootstrap: Some basic dependencies not ready:', error.message);
      // Continue anyway - some dependencies are optional
    }
  }
  
  /**
   * Wait for a global variable to be available
   */
  async waitForGlobal(globalName, timeout = 5000, friendlyName = globalName) {
    return new Promise((resolve, reject) => {
      if (window[globalName]) {
        resolve(window[globalName]);
        return;
      }
      
      let attempts = 0;
      const maxAttempts = timeout / 100;
      
      const check = () => {
        if (window[globalName]) {
          console.log(`✅ ES6Bootstrap: ${friendlyName} ready`);
          resolve(window[globalName]);
        } else if (attempts++ >= maxAttempts) {
          reject(new Error(`Timeout waiting for ${friendlyName}`));
        } else {
          setTimeout(check, 100);
        }
      };
      
      check();
    });
  }
  
  /**
   * Initialize ES6 integration manager
   */
  async initES6Integration() {
    try {
      console.log('🔧 ES6Bootstrap: Initializing ES6 integration manager...');
      
      const es6IntegrationManager = await this.loadModule('es6IntegrationManager');
      await es6IntegrationManager.init();
      
      if (!es6IntegrationManager.isReady()) {
        throw new Error('ES6 integration manager failed to initialize');
      }
      
      console.log('✅ ES6Bootstrap: ES6 integration manager ready');
      
    } catch (error) {
      console.error('🚨 ES6Bootstrap: ES6 integration manager failed:', error);
      throw error;
    }
  }
  
  /**
   * Migrate legacy bootstrap functionality to ES6
   */
  async migrateLegacyBootstrap() {
    try {
      console.log('🔄 ES6Bootstrap: Migrating legacy bootstrap functionality...');
      
      // Check if legacy bootstrap exists
      if (window.AppBootstrap) {
        this.legacyBootstrap = window.AppBootstrap;
        console.log('✅ ES6Bootstrap: Legacy bootstrap found and preserved');
      } else {
        console.warn('⚠️ ES6Bootstrap: No legacy bootstrap found');
      }
      
      // Migrate device context handling
      await this.migrateDeviceContext();
      
      // Migrate responsive handling
      this.migrateResponsiveHandling();
      
      // Migrate orientation handling
      this.migrateOrientationHandling();
      
      console.log('✅ ES6Bootstrap: Legacy bootstrap migration complete');
      
    } catch (error) {
      console.error('🚨 ES6Bootstrap: Legacy bootstrap migration failed:', error);
      throw error;
    }
  }
  
  /**
   * Initialize modern AppBootstrap
   */
  async initAppBootstrap() {
    try {
      console.log('🔧 ES6Bootstrap: Initializing modern AppBootstrap...');
      
      // Initialize device manager first
      const deviceManager = await this.loadModule('deviceManager');
      await deviceManager.init();
      
      if (!deviceManager.isReady()) {
        throw new Error('Device manager failed to initialize');
      }
      
      // Initialize app bootstrap
      const appBootstrap = await this.loadModule('appBootstrap');
      await appBootstrap.init();
      
      if (!appBootstrap.isReady()) {
        throw new Error('AppBootstrap failed to initialize');
      }
      
      console.log('✅ ES6Bootstrap: Modern AppBootstrap ready');
      
    } catch (error) {
      console.error('🚨 ES6Bootstrap: Modern AppBootstrap failed:', error);
      throw error;
    }
  }
  
  /**
   * Initialize UI components
   */
  async initUIComponents() {
    try {
      console.log('🎨 ES6Bootstrap: Initializing UI components...');
      
      // Initialize UI manager
      const uiManager = await this.loadModule('uiManager');
      if (uiManager && typeof uiManager.init === 'function') {
        await uiManager.init();
        
        if (!uiManager.isReady()) {
          throw new Error('UI manager failed to initialize');
        }
        
        console.log('✅ ES6Bootstrap: UI manager ready');
      } else {
        console.warn('⚠️ ES6Bootstrap: UI manager not available or missing init method');
      }
      
      console.log('✅ ES6Bootstrap: UI components ready');
      
    } catch (error) {
      console.error('🚨 ES6Bootstrap: UI components initialization failed:', error);
      throw error;
    }
  }
  
  /**
   * Migrate device context handling
   */
  async migrateDeviceContext() {
    try {
      if (window.DeviceContext) {
        const deviceContext = window.DeviceContext.getContext();
        stateManager.set('deviceContext', deviceContext);
        console.log('✅ ES6Bootstrap: Device context migrated to state manager');
      }
    } catch (error) {
      console.warn('⚠️ ES6Bootstrap: Device context migration failed:', error);
    }
  }
  
  /**
   * Migrate responsive handling
   */
  migrateResponsiveHandling() {
    try {
      // Set up responsive breakpoint handling
      const handleResize = debounce(() => {
        if (window.DeviceContext) {
          const context = window.DeviceContext.getContext();
          stateManager.set('deviceContext', context);
          globalEventBus.emit('device:resize', context);
        }
      }, 250);
      
      window.addEventListener('resize', handleResize);
      console.log('✅ ES6Bootstrap: Responsive handling migrated');
      
    } catch (error) {
      console.warn('⚠️ ES6Bootstrap: Responsive handling migration failed:', error);
    }
  }
  
  /**
   * Migrate orientation handling
   */
  migrateOrientationHandling() {
    try {
      // Set up orientation change handling
      window.addEventListener('orientationchange', () => {
        setTimeout(() => {
          if (window.DeviceContext) {
            const context = window.DeviceContext.getContext();
            stateManager.set('deviceContext', context);
            globalEventBus.emit('device:orientationChange', context);
          }
        }, 100);
      });
      
      console.log('✅ ES6Bootstrap: Orientation handling migrated');
      
    } catch (error) {
      console.warn('⚠️ ES6Bootstrap: Orientation handling migration failed:', error);
    }
  }
  
  /**
   * Set up integration with legacy system
   */
  setupLegacyIntegration() {
    try {
      console.log('🔗 ES6Bootstrap: Setting up legacy integration...');
      
      // Hook into legacy bootstrap if it exists
      if (this.legacyBootstrap && this.legacyBootstrap.init) {
        const originalInit = this.legacyBootstrap.init;
        
        this.legacyBootstrap.init = async function(...args) {
          console.log('🤝 ES6Bootstrap: Legacy bootstrap starting...');
          
          try {
            const result = await originalInit.apply(this, args);
            
            // After legacy init, set up modern enhancements
            globalEventBus.emit('legacy:bootstrapped');
            console.log('✅ ES6Bootstrap: Legacy bootstrap complete, modern enhancements available');
            
            return result;
          } catch (error) {
            console.error('🚨 ES6Bootstrap: Legacy bootstrap failed:', error);
            globalEventBus.emit('legacy:bootstrapError', { error });
            throw error;
          }
        };
        
        console.log('✅ ES6Bootstrap: Legacy bootstrap integration complete');
      }
      
    } catch (error) {
      console.warn('⚠️ ES6Bootstrap: Legacy integration setup failed:', error);
    }
  }
  
  /**
   * Initialize core ES6 systems
   */
  async initCoreSystems() {
    try {
      console.log('🔧 ES6Bootstrap: Initializing core ES6 systems...');
      
      // Initialize state manager (already imported)
      if (stateManager && typeof stateManager.init === 'function') {
        await stateManager.init();
      }
      
      // Initialize configuration manager
      const configurationManager = await this.loadModule('configurationManager');
      if (configurationManager && typeof configurationManager.init === 'function') {
        await configurationManager.init();
      }
      
      // Set up global event listeners
      this.setupGlobalEvents();
      
      console.log('✅ ES6Bootstrap: Core ES6 systems ready');
      
    } catch (error) {
      console.error('🚨 ES6Bootstrap: Core systems initialization failed:', error);
      throw error;
    }
  }
  
  /**
   * Initialize legacy compatibility layer
   */
  async initLegacyCompatibility() {
    try {
      console.log('🔗 ES6Bootstrap: Initializing legacy compatibility...');
      
      // Initialize legacy compatibility layer
      const legacyCompatibility = await this.loadModule('legacyCompatibility');
      if (legacyCompatibility && typeof legacyCompatibility.init === 'function') {
        await legacyCompatibility.init();
      }
      
      console.log('✅ ES6Bootstrap: Legacy compatibility ready');
      
    } catch (error) {
      console.error('🚨 ES6Bootstrap: Legacy compatibility initialization failed:', error);
      throw error;
    }
  }
  
  /**
   * Initialize active list manager
   */
  async initActiveListManager() {
    try {
      console.log('📋 ES6Bootstrap: Initializing active list manager...');
      
      // Initialize active list manager
      const activeListManager = await this.loadModule('activeListManager');
      if (activeListManager && typeof activeListManager.init === 'function') {
        await activeListManager.init();
      }
      
      console.log('✅ ES6Bootstrap: Active list manager ready');
      
    } catch (error) {
      console.error('🚨 ES6Bootstrap: Active list manager initialization failed:', error);
      throw error;
    }
  }
  
  /**
   * Initialize map integration modules
   */
  async initMapIntegration() {
    try {
      console.log('🗺️ ES6Bootstrap: Initializing map integration modules...');
      
      // Initialize map manager first
      const mapManager = await this.loadModule('mapManager');
      if (mapManager && typeof mapManager.init === 'function') {
        console.log('🗺️ ES6Bootstrap: Initializing map manager...');
        await mapManager.init();
        console.log('✅ ES6Bootstrap: Map manager initialized');
      } else {
        console.warn('⚠️ ES6Bootstrap: Map manager not available or missing init method');
      }
      
      // Initialize layer manager
      const layerManager = await this.loadModule('layerManager');
      if (layerManager && typeof layerManager.init === 'function') {
        console.log('🔲 ES6Bootstrap: Initializing layer manager...');
        await layerManager.init();
        console.log('✅ ES6Bootstrap: Layer manager initialized');
      } else {
        console.warn('⚠️ ES6Bootstrap: Layer manager not available or missing init method');
      }
      
      // Initialize polygon loader
      const polygonLoader = await this.loadModule('polygonLoader');
      if (polygonLoader && typeof polygonLoader.init === 'function') {
        console.log('📐 ES6Bootstrap: Initializing polygon loader...');
        await polygonLoader.init();
        console.log('✅ ES6Bootstrap: Polygon loader initialized');
        
        // Store polygon loader in state manager for orchestration system
        stateManager.set('polygonLoader', polygonLoader);
      } else {
        console.warn('⚠️ ES6Bootstrap: Polygon loader not available or missing init method');
      }
      
      // Initialize data loading orchestrator
      const dataOrchestrator = await this.loadModule('dataLoadingOrchestrator');
      if (dataOrchestrator && typeof dataOrchestrator.init === 'function') {
        console.log('🎼 ES6Bootstrap: Initializing data loading orchestrator...');
        await dataOrchestrator.init();
        console.log('✅ ES6Bootstrap: Data loading orchestrator initialized');
      } else {
        console.warn('⚠️ ES6Bootstrap: Data loading orchestrator not available or missing init method');
      }
      
      // Initialize state synchronizer
      const stateSynchronizer = await this.loadModule('stateSynchronizer');
      if (stateSynchronizer && typeof stateSynchronizer.init === 'function') {
        console.log('🔄 ES6Bootstrap: Initializing state synchronizer...');
        await stateSynchronizer.init();
        console.log('✅ ES6Bootstrap: State synchronizer initialized');
      } else {
        console.warn('⚠️ ES6Bootstrap: State synchronizer not available or missing init method');
      }
      
      // Initialize legacy integration bridge
      const legacyBridge = await this.loadModule('legacyIntegrationBridge');
      if (legacyBridge && typeof legacyBridge.init === 'function') {
        console.log('🌉 ES6Bootstrap: Initializing legacy integration bridge...');
        await legacyBridge.init();
        console.log('✅ ES6Bootstrap: Legacy integration bridge initialized');
      } else {
        console.warn('⚠️ ES6Bootstrap: Legacy integration bridge not available or missing init method');
      }
      
      // Initialize label manager
      const labelManager = await this.loadModule('labelManager');
      if (labelManager && typeof labelManager.init === 'function') {
        console.log('🏷️ ES6Bootstrap: Initializing label manager...');
        await labelManager.init();
        console.log('✅ ES6Bootstrap: Label manager initialized');
      } else {
        console.warn('⚠️ ES6Bootstrap: Label manager not available or missing init method');
      }
      
      console.log('✅ ES6Bootstrap: Map integration modules ready');
      
    } catch (error) {
      console.error('🚨 ES6Bootstrap: Map integration initialization failed:', error);
      throw error;
    }
  }
  
  /**
   * Initialize legacy function migration modules
   */
  async initLegacyFunctionMigration() {
    try {
      console.log('🔧 ES6Bootstrap: Initializing legacy function migration modules...');
      
      // Initialize coordinate converter
      const coordinateConverter = await this.loadModule('coordinateConverter');
      if (coordinateConverter && typeof coordinateConverter.init === 'function') {
        console.log('🗺️ ES6Bootstrap: Initializing coordinate converter...');
        await coordinateConverter.init();
        console.log('✅ ES6Bootstrap: Coordinate converter initialized');
      } else {
        console.warn('⚠️ ES6Bootstrap: Coordinate converter not available or missing init method');
      }
      
      // Initialize error UI
      const errorUI = await this.loadModule('errorUI');
      if (errorUI && typeof errorUI.init === 'function') {
        console.log('⚠️ ES6Bootstrap: Initializing error UI...');
        await errorUI.init();
        console.log('✅ ES6Bootstrap: Error UI initialized');
      } else {
        console.warn('⚠️ ES6Bootstrap: Error UI not available or missing init method');
      }
      
      // Initialize text formatter
      const textFormatter = await this.loadModule('textFormatter');
      if (textFormatter && typeof textFormatter.init === 'function') {
        console.log('📝 ES6Bootstrap: Initializing text formatter...');
        await textFormatter.init();
        console.log('✅ ES6Bootstrap: Text formatter initialized');
      } else {
        console.warn('⚠️ ES6Bootstrap: Text formatter not available or missing init method');
      }
      
      // Initialize feature enhancer
      const featureEnhancer = await this.loadModule('featureEnhancer');
      if (featureEnhancer && typeof featureEnhancer.init === 'function') {
        console.log('✨ ES6Bootstrap: Initializing feature enhancer...');
        await featureEnhancer.init();
        console.log('✅ ES6Bootstrap: Feature enhancer initialized');
      } else {
        console.warn('⚠️ ES6Bootstrap: Feature enhancer not available or missing init method');
      }
      
      console.log('✅ ES6Bootstrap: Legacy function migration modules ready');
      
    } catch (error) {
      console.error('🚨 ES6Bootstrap: Legacy function migration initialization failed:', error);
      throw error;
    }
  }
  
  /**
   * Set up global event listeners
   */
  setupGlobalEvents() {
    try {
      // Handle window resize with throttling
      let resizeTimeout;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          const context = window.DeviceContext ? window.DeviceContext.getContext() : null;
          if (context) {
            stateManager.set('deviceContext', context);
          }
          globalEventBus.emit('app:resize', { 
            width: window.innerWidth, 
            height: window.innerHeight 
          });
        }, 250);
      });
      
      // Handle visibility change for PWA lifecycle
      document.addEventListener('visibilitychange', () => {
        const isVisible = !document.hidden;
        stateManager.set('appVisible', isVisible);
        globalEventBus.emit('app:visibilityChange', { visible: isVisible });
      });
      
      console.log('✅ ES6Bootstrap: Global event listeners ready');
      
    } catch (error) {
      console.warn('⚠️ ES6Bootstrap: Global event setup failed:', error);
    }
  }
  
  /**
   * Handle bootstrap errors
   */
  handleError(error) {
    console.error('🚨 ES6Bootstrap: Handling error:', error);
    
    // Store error in state
    stateManager.set('bootstrapError', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    // Emit error event
    globalEventBus.emit('es6bootstrap:error', { error });
    
    // Attempt fallback to legacy system
    this.fallbackToLegacy(error);
  }
  
  /**
   * Fallback to legacy system when modern system fails
   */
  fallbackToLegacy(error) {
    console.warn('🔄 ES6Bootstrap: Falling back to legacy system due to:', error.message);
    
    try {
      // Mark modern system as disabled
      window.useModernSystem = false;
      
      // If legacy bootstrap exists, try to use it
      if (this.legacyBootstrap && this.legacyBootstrap.init) {
        console.log('🤝 ES6Bootstrap: Using legacy bootstrap as fallback');
        this.legacyBootstrap.init().catch(console.error);
      } else {
        console.error('🚨 ES6Bootstrap: No legacy bootstrap available for fallback');
      }
      
    } catch (fallbackError) {
      console.error('🚨 ES6Bootstrap: Fallback to legacy also failed:', fallbackError);
    }
  }
  
  /**
   * Get bootstrap status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      migrationPhase: this.migrationPhase,
      legacyBootstrap: !!this.legacyBootstrap,
      initTime: this.initStartTime ? Date.now() - this.initStartTime : 0
    };
  }
  
  /**
   * Legacy bootstrap functionality - maintains backward compatibility
   */
  async startLegacyBootstrap() {
    console.log('🔄 ES6Bootstrap: Starting legacy bootstrap sequence...');
    
    try {
      // Wait for Leaflet to be ready
      await this.waitForLeaflet();
      
      // Initialize map
      const mapSuccess = this.initMap();
      
      if (!mapSuccess) {
        console.warn('ES6Bootstrap: Map initialization failed, continuing with limited functionality');
      }
      
      // Set up UI components
      this.setupUI();
      
      // Load components
      await this.loadComponents();
      
      // Set up event handlers
      this.setupEventHandlers();
      
      // Handle initial location
      this.handleInitialLocation();
      
      console.log('✅ ES6Bootstrap: Legacy bootstrap sequence complete');
      
    } catch (error) {
      console.error('🚨 ES6Bootstrap: Legacy bootstrap failed:', error);
      throw error;
    }
  }
  
  /**
   * Wait for Leaflet to be ready (legacy compatibility)
   */
  async waitForLeaflet() {
    return new Promise((resolve) => {
      // Check if Leaflet is already available
      if (typeof L !== 'undefined' && L.map) {
        console.log('ES6Bootstrap: Leaflet already available');
        resolve(true);
        return;
      }
      
      // Wait for Leaflet to load
      const checkLeaflet = () => {
        if (typeof L !== 'undefined' && L.map) {
          console.log('ES6Bootstrap: Leaflet became available');
          resolve(true);
        } else {
          // Check again in 100ms
          setTimeout(checkLeaflet, 100);
        }
      };
      
      // Start checking
      checkLeaflet();
      
      // Fallback timeout after 5 seconds
      setTimeout(() => {
        console.warn('ES6Bootstrap: Leaflet timeout, proceeding anyway');
        resolve(false);
      }, 5000);
    });
  }
  
  /**
   * Initialize map (legacy compatibility)
   */
  initMap() {
    console.log('ES6Bootstrap: Initializing map');
    
    // Check if Leaflet is available
    if (typeof L === 'undefined') {
      console.error('ES6Bootstrap: Leaflet (L) is not available');
      return false;
    }
    
    try {
      // Create map instance with optimized settings
      window.map = L.map('map', {
        center: [-37.8136, 144.9631], // Melbourne
        zoom: 8,
        zoomSnap: 0.333,
        zoomDelta: 0.333,
        preferCanvas: true,
        zoomControl: false,
        attributionControl: false
      });
    
      // Store default view for reset functionality
      window.DEFAULT_VIEW = { 
        center: window.map.getCenter(), 
        zoom: window.map.getZoom() 
      };
      
      // Add zoom control in better position for mobile
      L.control.zoom({
        position: 'topleft'
      }).addTo(window.map);
      
      // Add base tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(window.map);
      
      // Create panes to control z-order (bottom -> top): LGA, CFA, SES, Ambulance, Police, FRV
      const panes = [
        ['lga', 400],
        ['cfa', 410],
        ['ses', 420],
        ['ambulance', 430],
        ['police', 440],
        ['frv', 450]
      ];
      
      panes.forEach(([name, z]) => {
        window.map.createPane(name);
        window.map.getPane(name).style.zIndex = String(z);
      });
      
      // Set map reference for legacy compatibility
      if (window.setMap) {
        window.setMap(window.map);
      }
      
      console.log('ES6Bootstrap: Map initialized successfully');
      return true;
      
    } catch (error) {
      console.error('ES6Bootstrap: Map initialization failed:', error);
      return false;
    }
  }
  
  /**
   * Set up UI components (legacy compatibility)
   */
  setupUI() {
    console.log('ES6Bootstrap: Setting up UI components');
    
    // Set up collapsible sections
    if (window.setupCollapsible) {
      console.log('ES6Bootstrap: setupCollapsible is available, calling it...');
      
      // Start All Active collapsed; it will auto-expand when the first item is added
      window.setupCollapsible('activeHeader', 'activeList', false);
      window.setupCollapsible('showAllHeader', 'showAllList');
      window.setupCollapsible('sesHeader', 'sesList');
      window.setupCollapsible('lgaHeader', 'lgaList');
      window.setupCollapsible('cfaHeader', 'cfaList');
      window.setupCollapsible('policeHeader', 'policeList');
      window.setupCollapsible('ambulanceHeader', 'ambulanceList');
      window.setupCollapsible('frvHeader', 'frvList');
      
      console.log('ES6Bootstrap: All setupCollapsible calls completed');
    } else {
      console.error('ES6Bootstrap: setupCollapsible is NOT available!');
    }
    
    // Initialize other UI managers
    if (window.CollapsibleManager) {
      window.CollapsibleManager.init();
    }
    
    if (window.SearchManager) {
      window.SearchManager.init();
    }
    
    if (window.ActiveListManager) {
      window.ActiveListManager.init();
    }
  }
  
  /**
   * Load application components (legacy compatibility)
   */
  async loadComponents() {
    console.log('ES6Bootstrap: Loading application components');
    
    try {
      // Start preloading if available
      if (window.startPreloading) {
        window.startPreloading();
      }
      
      // Load map data
      if (window.PolygonLoader) {
        await window.PolygonLoader.loadAllPolygons();
      }
      
      // Load facility data
      const facilityLoaders = [
        'AmbulanceLoader',
        'PoliceLoader', 
        'SESFacilitiesLoader',
        'CFAFacilitiesLoader'
      ];
      
      for (const loaderName of facilityLoaders) {
        if (window[loaderName]) {
          try {
            await window[loaderName].init();
          } catch (error) {
            console.warn(`ES6Bootstrap: Failed to load ${loaderName}:`, error);
          }
        }
      }
      
    } catch (error) {
      console.error('ES6Bootstrap: Component loading failed:', error);
      throw error;
    }
  }
  
  /**
   * Set up event handlers (legacy compatibility)
   */
  setupEventHandlers() {
    console.log('ES6Bootstrap: Setting up event handlers');
    
    // Sidebar tool click handling
    window.addEventListener('sidebar-tool-click', (ev) => {
      const idx = ev?.detail?.index;
      
      if (idx === 3) { // Info
        this.openInfo();
      } else if (idx === 2) { // Docs
        const hash = (location.hash || '').toString();
        const m = hash.match(/^#docs\/(\w+)/);
        const slug = m ? m[1] : 'intro';
        this.openDocs(slug);
      }
    });
    
    // Overlay/close buttons and ESC handling
    const iClose = document.getElementById('infoClose');
    const dClose = document.getElementById('docsClose');
    const iOv = document.getElementById('infoOverlay');
    const dOv = document.getElementById('docsOverlay');
    
    if (iClose) iClose.addEventListener('click', () => this.closeInfo());
    if (iOv) iOv.addEventListener('click', () => this.closeInfo());
    if (dClose) dClose.addEventListener('click', () => this.closeDocs());
    if (dOv) dOv.addEventListener('click', () => this.closeDocs());
    
    // ESC key handling
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeInfo();
        this.closeDocs();
      }
    });
  }
  
  /**
   * Handle initial geolocation (legacy compatibility)
   */
  handleInitialLocation() {
    // Only auto-locate if explicitly requested
    if (localStorage.getItem('autoLocate') === 'true') {
      this.requestUserLocation();
    }
  }
  
  /**
   * Request user location (legacy compatibility)
   */
  async requestUserLocation() {
    try {
      console.log('ES6Bootstrap: Requesting user location');
      
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        });
      });
      
      if (position && window.map) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        // Add user location marker
        L.marker([lat, lng], {
          icon: L.divIcon({
            className: 'user-location-marker',
            html: '📍',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          })
        }).addTo(window.map).bindPopup('Your location');
        
        // Center map on user location
        window.map.setView([lat, lng], 12);
        
        console.log('ES6Bootstrap: User location set:', { lat, lng });
      }
      
    } catch (error) {
      console.warn('ES6Bootstrap: Geolocation failed:', error);
    }
  }
  
  /**
   * Modal and drawer management (legacy compatibility)
   */
  openDocs(slug = 'intro') {
    fetch(`in_app_docs/${slug}.md`)
      .then(response => response.text())
      .then(content => {
        const contentEl = document.getElementById('docsContent');
        if (contentEl) {
          // Basic markdown parsing (for simple content)
          contentEl.innerHTML = this.parseMarkdown(content);
        }
        
        const overlay = document.getElementById('docsOverlay');
        const drawer = document.getElementById('docsDrawer');
        if (overlay) overlay.hidden = false;
        if (drawer) drawer.hidden = false;
        
        const closeBtn = document.getElementById('docsClose');
        if (closeBtn) closeBtn.focus();
      })
      .catch(error => {
        console.error('Failed to load documentation:', error);
        const contentEl = document.getElementById('docsContent');
        if (contentEl) {
          contentEl.innerHTML = '<p>Failed to load documentation.</p>';
        }
      });
  }
  
  closeDocs() {
    const overlay = document.getElementById('docsOverlay');
    const drawer = document.getElementById('docsDrawer');
    if (overlay) overlay.hidden = true;
    if (drawer) drawer.hidden = true;
  }
  
  openInfo() {
    const overlay = document.getElementById('infoOverlay');
    const modal = document.getElementById('infoModal');
    if (overlay) overlay.hidden = false;
    if (modal) modal.hidden = false;
    const closeBtn = document.getElementById('infoClose');
    if (closeBtn) closeBtn.focus();
  }
  
  closeInfo() {
    const overlay = document.getElementById('infoOverlay');
    const modal = document.getElementById('infoModal');
    if (overlay) overlay.hidden = true;
    if (modal) modal.hidden = true;
  }
  
  /**
   * Basic markdown parser for documentation (legacy compatibility)
   */
  parseMarkdown(content) {
    return content
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/!\[([^\]]*)\]\(([^\)]*)\)/gim, '<img alt="$1" src="$2" />')
      .replace(/\[([^\]]*)\]\(([^\)]*)\)/gim, '<a href="$2">$1</a>')
      .replace(/`([^`]*)`/gim, '<code>$1</code>')
      .replace(/^\* (.*$)/gim, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/gims, '<ul>$1</ul>')
      .replace(/\n\n/gim, '</p><p>')
      .replace(/^(?!<[h|u|l])/gim, '<p>')
      .replace(/$/gim, '</p>');
  }
  
  /**
   * Check if bootstrap is ready
   */
  isReady() {
    return this.initialized;
  }
}

// Utility function for debouncing
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Export singleton instance
export const es6Bootstrap = new ES6Bootstrap();

// Export for legacy compatibility
if (typeof window !== 'undefined') {
  window.ES6Bootstrap = es6Bootstrap;
  
  // Legacy compatibility layer - proxy old bootstrap functions to new ES6 system
  console.log('🔧 ES6Bootstrap: Setting up legacy compatibility layer');
  
  // Legacy bootstrap functions
  window.AppBootstrap = {
    init: () => {
      console.log('🔄 Legacy AppBootstrap.init() called - delegating to ES6Bootstrap');
      return es6Bootstrap.startLegacyBootstrap();
    }
  };
  
  // Legacy utility functions
  window.debounce = debounce;
  
  // Legacy initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => es6Bootstrap.init());
  } else {
    es6Bootstrap.init();
  }
  
  console.log('✅ ES6Bootstrap: Legacy compatibility layer active');
}
