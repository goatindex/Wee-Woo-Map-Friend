/**
 * @module bootstrap
 * Application initialization and bootstrap with native features integration
 */

// Import dependencies - Note: DeviceContext is available globally via window.DeviceContext
// StateManager and globalEventBus are not yet globally available, so we'll use window globals for now

// Enhanced logging system for deep diagnostics
const DiagnosticLogger = {
    enabled: true,
    level: 'verbose', // 'verbose', 'info', 'warn', 'error'
    
    log(level, component, message, data = null) {
        if (!this.enabled) return;
        if (this.shouldLog(level)) {
            const timestamp = new Date().toISOString();
            const prefix = `🔍 [${timestamp}] [${level.toUpperCase()}] [${component}]`;
            if (data) {
                console.log(`${prefix}: ${message}`, data);
            } else {
                console.log(`${prefix}: ${message}`);
            }
        }
    },
    
    shouldLog(level) {
        const levels = { verbose: 0, info: 1, warn: 2, error: 3 };
        return levels[level] >= levels[this.level];
    },
    
    verbose(component, message, data) { this.log('verbose', component, message, data); },
    info(component, message, data) { this.log('info', component, message, data); },
    warn(component, message, data) { this.log('warn', component, message, data); },
    error(component, message, data) { this.log('error', component, message, data); }
};

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

/**
 * Application Bootstrap
 * Handles initialization, device context setup, native features, and application startup
 */
const AppBootstrap = {
  
  /**
   * Initialize the application
   */
  async init() {
    DiagnosticLogger.info('AppBootstrap', 'Starting application initialization');
    const startTime = performance.now();
    
    try {
      // Wait for native features to be ready
      DiagnosticLogger.verbose('AppBootstrap', 'Step 1: Waiting for native features');
      await this.waitForNativeFeatures();
      
      // Get device context with native info
      DiagnosticLogger.verbose('AppBootstrap', 'Step 2: Getting device context');
      const deviceContext = window.DeviceContext.getContext();
      DiagnosticLogger.info('AppBootstrap', 'Device context initialized', deviceContext);
      
      // Apply device-specific styling
      DiagnosticLogger.verbose('AppBootstrap', 'Step 3: Applying device styles');
      this.applyDeviceStyles(deviceContext);
      
      // Initialize responsive breakpoint handling
      DiagnosticLogger.verbose('AppBootstrap', 'Step 4: Initializing responsive handling');
      this.initResponsiveHandling();
      
      // Set up orientation change handling
      DiagnosticLogger.verbose('AppBootstrap', 'Step 5: Setting up orientation handling');
      this.setupOrientationHandling();
      
      // Initialize native app integration
      DiagnosticLogger.verbose('AppBootstrap', 'Step 6: Initializing native integration');
      await this.initNativeIntegration();
      
      // Wait for Leaflet to be ready
      DiagnosticLogger.verbose('AppBootstrap', 'Step 7: Waiting for Leaflet to be ready');
      const leafletReady = await this.waitForLeaflet();
      
      // Initialize map
      DiagnosticLogger.verbose('AppBootstrap', 'Step 8: Initializing map');
      const mapSuccess = this.initMap();
      
      if (!mapSuccess) {
        DiagnosticLogger.warn('AppBootstrap', 'Map initialization failed, continuing with limited functionality');
        // Continue without map - FAB buttons will still work for other features
      }
      
      // Set up collapsibles and UI components
      DiagnosticLogger.verbose('AppBootstrap', 'Step 9: Setting up UI components');
      this.setupUI();
      
      // Initialize mobile documentation navigation
      if (window.MobileDocsNav) {
        DiagnosticLogger.verbose('AppBootstrap', 'Step 10: Initializing mobile docs navigation');
        window.MobileDocsNav.init();
      }
      
      // Load data and UI components
      DiagnosticLogger.verbose('AppBootstrap', 'Step 11: Loading application components');
      await this.loadComponents();
      
      // Set up event handlers
      DiagnosticLogger.verbose('AppBootstrap', 'Step 12: Setting up event handlers');
      this.setupEventHandlers();
      
      // Handle initial geolocation
      DiagnosticLogger.verbose('AppBootstrap', 'Step 13: Handling initial location');
      this.handleInitialLocation();
      
      const endTime = performance.now();
      DiagnosticLogger.info('AppBootstrap', `Application initialization complete in ${(endTime - startTime).toFixed(2)}ms`);
      
    } catch (error) {
      DiagnosticLogger.error('AppBootstrap', 'Initialization failed', error);
      console.error('AppBootstrap: Initialization failed:', error);
      if (window.ErrorUI) {
        window.ErrorUI.showError('Failed to initialize application', error.message);
      }
    }
  },
  
  /**
   * Wait for Leaflet to be ready
   */
  async waitForLeaflet() {
    return new Promise((resolve) => {
      // Check if Leaflet is already available
      if (typeof L !== 'undefined' && L.map) {
        console.log('AppBootstrap: Leaflet already available');
        resolve(true);
        return;
      }
      
      // Wait for Leaflet to load
      const checkLeaflet = () => {
        if (typeof L !== 'undefined' && L.map) {
          console.log('AppBootstrap: Leaflet became available');
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
        console.warn('AppBootstrap: Leaflet timeout, proceeding anyway');
        resolve(false);
      }, 5000);
    });
  },

  /**
   * Wait for native features to be ready
   */
  async waitForNativeFeatures() {
    return new Promise((resolve) => {
      if (window.NativeFeatures) {
        // Listen for native features ready event
        window.addEventListener('nativeFeaturesReady', (event) => {
          console.log('AppBootstrap: Native features ready:', event.detail);
          resolve(event.detail);
        }, { once: true });
        
        // Fallback timeout
        setTimeout(() => {
          console.log('AppBootstrap: Native features timeout, continuing with web-only');
          resolve({ isNative: false });
        }, 1000);
      } else {
        resolve({ isNative: false });
      }
    });
  },
  
  /**
   * Apply device-specific styles and classes
   */
  applyDeviceStyles(deviceContext) {
    const body = document.body;
    
    // Remove any existing device classes
    body.classList.remove('device-mobile', 'device-tablet', 'device-desktop', 'device-large');
    body.classList.remove('platform-ios', 'platform-android', 'platform-web');
    body.classList.remove('context-portrait', 'context-landscape');
    
    // Add current device classes
    body.classList.add(`device-${deviceContext.breakpoint}`);
    body.classList.add(`platform-${deviceContext.platform}`);
    body.classList.add(`context-${deviceContext.orientation}`);
    
    // Add touch/hover context
    if (deviceContext.hasTouch) {
      body.classList.add('has-touch');
    } else {
      body.classList.add('no-touch');
    }
    
    // Add standalone/native app context
    if (deviceContext.isStandalone || (window.NativeFeatures && window.NativeFeatures.isNativeApp())) {
      body.classList.add('app-standalone');
    }
    
    console.log('AppBootstrap: Applied device styles:', {
      device: deviceContext.device,
      platform: deviceContext.platform,
      orientation: deviceContext.orientation,
      hasTouch: deviceContext.hasTouch,
      isStandalone: deviceContext.isStandalone
    });
  },
  
  /**
   * Initialize responsive breakpoint handling
   */
  initResponsiveHandling() {
    // Update breakpoint classes on resize
    const updateBreakpoints = () => {
      const deviceContext = window.DeviceContext.getContext();
      this.applyDeviceStyles(deviceContext);
    };
    
    window.addEventListener('resize', debounce(updateBreakpoints, 150));
    
    // CSS custom properties for JavaScript integration
    const root = document.documentElement;
    const updateCSSProperties = () => {
      const context = window.DeviceContext.getContext();
      root.style.setProperty('--current-breakpoint', context.device);
      root.style.setProperty('--is-touch', context.hasTouch ? '1' : '0');
      root.style.setProperty('--is-landscape', context.orientation === 'landscape' ? '1' : '0');
    };
    
    updateCSSProperties();
    window.addEventListener('resize', debounce(updateCSSProperties, 150));
  },
  
  /**
   * Set up orientation change handling
   */
  setupOrientationHandling() {
    const handleOrientationChange = () => {
      setTimeout(() => {
        const deviceContext = window.DeviceContext.getContext();
        this.applyDeviceStyles(deviceContext);
        
        // Trigger map resize if available
        if (window.map) {
          window.map.invalidateSize();
        }
        
        // Dispatch custom event for other components
        window.dispatchEvent(new CustomEvent('appOrientationChange', {
          detail: { context: deviceContext }
        }));
      }, 100);
    };
    
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', debounce(handleOrientationChange, 150));
  },
  
  /**
   * Initialize native app integration
   */
  async initNativeIntegration() {
    if (window.NativeFeatures && window.NativeFeatures.isNativeApp()) {
      console.log('AppBootstrap: Setting up native app integration');
      
      // Handle native app state changes
      window.addEventListener('nativeAppStateChange', (event) => {
        console.log('AppBootstrap: App state changed:', event.detail);
        
        if (event.detail.isActive) {
          // App became active - refresh data if needed
          this.handleAppActivation();
        } else {
          // App went to background - save state if needed
          this.handleAppBackground();
        }
      });
      
      // Handle native back button
      window.addEventListener('nativeBackButton', (event) => {
        console.log('AppBootstrap: Native back button pressed');
        this.handleNativeBackButton();
      });
      
      // Set up native geolocation enhancement
      this.setupNativeGeolocation();
      
    } else {
      console.log('AppBootstrap: Running in web browser mode');
    }
  },
  
  /**
   * Handle app activation (foreground)
   */
  handleAppActivation() {
    // Refresh map if needed
    if (window.map) {
      setTimeout(() => window.map.invalidateSize(), 100);
    }
    
    // Check for data updates
    // Could implement periodic refresh here
  },
  
  /**
   * Handle app going to background
   */
  handleAppBackground() {
    // Save current state
    if (window.StateManager) {
      StateManager.saveState();
    }
  },
  
  /**
   * Handle native back button
   */
  handleNativeBackButton() {
    // Check if any modals are open
    const openModal = document.querySelector('.app-modal:not([hidden])');
    const openDrawer = document.querySelector('.docs-drawer:not([hidden])');
    
    if (openModal) {
      openModal.hidden = true;
      document.querySelector('.app-overlay').hidden = true;
      return;
    }
    
    if (openDrawer) {
      openDrawer.hidden = true;
      document.querySelector('.app-overlay').hidden = true;
      return;
    }
    
    // If nothing to close, minimize app (native only)
    if (window.NativeFeatures && window.NativeFeatures.hasFeature('app')) {
      // Could implement app minimization here
    }
  },
  
  /**
   * Set up enhanced geolocation with native features
   */
  setupNativeGeolocation() {
    if (!window.NativeFeatures) return;
    
    // Replace global geolocation functions with native-enhanced versions
    window.getEnhancedPosition = async (options) => {
      try {
        const position = await window.NativeFeatures.getCurrentPosition(options);
        console.log('AppBootstrap: Enhanced position obtained:', position);
        return position;
      } catch (error) {
        console.warn('AppBootstrap: Enhanced geolocation failed:', error);
        throw error;
      }
    };
    
    window.watchEnhancedPosition = (callback, options) => {
      try {
        return window.NativeFeatures.watchPosition(callback, options);
      } catch (error) {
        console.warn('AppBootstrap: Enhanced position watching failed:', error);
        throw error;
      }
    };
  },
  
  /**
   * Initialize map
   */
  initMap() {
    console.log('AppBootstrap: Initializing map');
    
    // Check if Leaflet is available
    if (typeof L === 'undefined') {
      console.error('AppBootstrap: Leaflet (L) is not available');
      DiagnosticLogger.error('AppBootstrap', 'Leaflet library not loaded');
      
      // Show user-friendly error message
      if (window.ErrorUI) {
        window.ErrorUI.showError('Map Library Error', 'The map library failed to load. Please refresh the page or check your internet connection.');
      } else {
        // Fallback error display
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#f8d7da;color:#721c24;padding:20px;border-radius:8px;border:1px solid #f5c6cb;z-index:10000;text-align:center;max-width:400px;';
        errorDiv.innerHTML = `
          <h3>🚨 Map Loading Error</h3>
          <p>The map library failed to load. This usually means:</p>
          <ul style="text-align:left;margin:10px 0;">
            <li>Internet connection issues</li>
            <li>CDN service temporarily unavailable</li>
            <li>Browser security blocking external scripts</li>
          </ul>
          <p><strong>Please refresh the page to try again.</strong></p>
          <button onclick="location.reload()" style="background:#721c24;color:white;border:none;padding:8px 16px;border-radius:4px;cursor:pointer;">🔄 Refresh Page</button>
        `;
        document.body.appendChild(errorDiv);
      }
      
      // Return false to indicate failure
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
      position: window.DeviceContext.getContext().device === 'mobile' ? 'bottomright' : 'topleft'
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
    
    // Handle map interactions with native feedback
    window.map.on('click', () => {
      if (window.NativeFeatures) {
        window.NativeFeatures.hapticFeedback('light');
      }
    });
    
    window.map.on('zoomend', () => {
      if (window.NativeFeatures) {
        window.NativeFeatures.hapticFeedback('light');
      }
    });
    
    // Set map reference for legacy compatibility
    if (window.setMap) {
      window.setMap(window.map);
    }
    
    console.log('AppBootstrap: Map initialized successfully');
    return true;
    
    } catch (error) {
      console.error('AppBootstrap: Map initialization failed:', error);
      DiagnosticLogger.error('AppBootstrap', 'Map initialization failed', error);
      
      // Show user-friendly error message
      if (window.ErrorUI) {
        window.ErrorUI.showError('Map Initialization Error', `Failed to initialize map: ${error.message}`);
      } else {
        // Fallback error display
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#f8d7da;color:#721c24;padding:20px;border-radius:8px;border:1px solid #f5c6cb;z-index:10000;text-align:center;max-width:400px;';
        errorDiv.innerHTML = `
          <h3>🚨 Map Initialization Error</h3>
          <p>Failed to initialize the map: <strong>${error.message}</strong></p>
          <p>This could be due to:</p>
          <ul style="text-align:left;margin:10px 0;">
            <li>Browser compatibility issues</li>
            <li>Memory or performance constraints</li>
            <li>Conflicting JavaScript libraries</li>
          </ul>
          <p><strong>Please refresh the page to try again.</strong></p>
          <button onclick="location.reload()" style="background:#721c24;color:white;border:none;padding:8px 16px;border-radius:4px;cursor:pointer;">🔄 Refresh Page</button>
        `;
        document.body.appendChild(errorDiv);
      }
      
      // Return false to indicate failure
      return false;
    }
  },
  
  /**
   * Set up UI components
   */
  setupUI() {
    console.log('AppBootstrap: Setting up UI components');
    
    // Debug: Check if setupCollapsible is available
    console.log('AppBootstrap: setupCollapsible check:', {
      exists: typeof window.setupCollapsible,
      isFunction: typeof window.setupCollapsible === 'function',
      value: window.setupCollapsible
    });
    
    // Set up collapsible sections
    if (window.setupCollapsible) {
      console.log('AppBootstrap: setupCollapsible is available, calling it...');
      
      // Start All Active collapsed; it will auto-expand when the first item is added
      window.setupCollapsible('activeHeader', 'activeList', false);
      window.setupCollapsible('showAllHeader', 'showAllList');
      window.setupCollapsible('sesHeader', 'sesList');
      window.setupCollapsible('lgaHeader', 'lgaList');
      window.setupCollapsible('cfaHeader', 'cfaList');
      window.setupCollapsible('policeHeader', 'policeList');
      window.setupCollapsible('ambulanceHeader', 'ambulanceList');
      window.setupCollapsible('frvHeader', 'frvList');
      
      console.log('AppBootstrap: All setupCollapsible calls completed');
    } else {
      console.error('AppBootstrap: setupCollapsible is NOT available!');
      console.error('AppBootstrap: Available window functions:', Object.keys(window).filter(key => typeof window[key] === 'function'));
    }
    
    // Initialize other UI managers
    if (window.CollapsibleManager) {
      CollapsibleManager.init();
    }
    
    if (window.SearchManager) {
      SearchManager.init();
    }
    
    if (window.ActiveListManager) {
      ActiveListManager.init();
    }
    
    // Initialize Documentation and Sidebar FABs via FABManager
    DiagnosticLogger.verbose('AppBootstrap', 'Step 13.1: Attempting to create FABs');
    
    // Create FABs immediately instead of using setTimeout
    DiagnosticLogger.info('AppBootstrap', 'FAB Creation: Starting FAB initialization');
    DiagnosticLogger.verbose('AppBootstrap', 'FAB Creation: Checking FABManager availability', {
      FABManagerAvailable: !!window.FABManager,
      FABManagerType: typeof window.FABManager,
      FABManagerKeys: window.FABManager ? Object.keys(window.FABManager) : 'N/A'
    });
    
    if (window.FABManager) {
      DiagnosticLogger.verbose('AppBootstrap', 'FAB Creation: FABManager found, attempting to create FABs');
      
      // Create DocsFAB
      try {
        DiagnosticLogger.verbose('AppBootstrap', 'FAB Creation: Creating DocsFAB');
        const docsFab = window.FABManager.create('docsFab');
        DiagnosticLogger.info('AppBootstrap', 'FAB Creation: DocsFAB created successfully', {
          docsFab: docsFab,
          docsFabType: typeof docsFab,
          docsFabKeys: docsFab ? Object.keys(docsFab) : 'N/A'
        });
      } catch (error) {
        DiagnosticLogger.error('AppBootstrap', 'FAB Creation: Failed to create DocsFAB', {
          error: error.message,
          stack: error.stack,
          FABManagerState: {
            available: !!window.FABManager,
            methods: window.FABManager ? Object.getOwnPropertyNames(window.FABManager) : []
          }
        });
      }
      
      // Create SidebarToggleFAB
      try {
        DiagnosticLogger.verbose('AppBootstrap', 'FAB Creation: Creating SidebarToggleFAB');
        const sidebarFab = window.FABManager.create('sidebarToggle');
        DiagnosticLogger.info('AppBootstrap', 'FAB Creation: SidebarToggleFAB created successfully', {
          sidebarFab: sidebarFab,
          sidebarFabType: typeof sidebarFab,
          sidebarFabKeys: sidebarFab ? Object.keys(sidebarFab) : 'N/A'
        });
      } catch (error) {
        DiagnosticLogger.error('AppBootstrap', 'FAB Creation: Failed to create SidebarToggleFAB', {
          error: error.message,
          stack: error.stack,
          FABManagerState: {
            available: !!window.FABManager,
            methods: window.FABManager ? Object.getOwnPropertyNames(window.FABManager) : []
          }
        });
      }
    } else {
      DiagnosticLogger.error('AppBootstrap', 'FAB Creation: FABManager not available', {
        windowKeys: Object.keys(window).filter(key => key.includes('FAB') || key.includes('fab')),
        globalObjects: {
          BaseFAB: typeof window.BaseFAB,
          FABManager: typeof window.FABManager,
          SidebarToggleFAB: typeof window.SidebarToggleFAB,
          DocsFAB: typeof window.DocsFAB
        }
      });
    }
  },
  
  /**
   * Load application components
   */
  async loadComponents() {
    console.log('AppBootstrap: Loading application components');
    
    try {
      // Start preloading if available
      if (window.startPreloading) {
        window.startPreloading();
      }
      
      // Load map data
      if (window.PolygonLoader) {
        await PolygonLoader.loadAllPolygons();
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
            console.warn(`AppBootstrap: Failed to load ${loaderName}:`, error);
          }
        }
      }
      
    } catch (error) {
      console.error('AppBootstrap: Component loading failed:', error);
      throw error;
    }
  },
  
  /**
   * Set up event handlers
   */
  setupEventHandlers() {
    console.log('AppBootstrap: Setting up event handlers');
    
    // Sidebar tool click handling
    window.addEventListener('sidebar-tool-click', (ev) => {
      const idx = ev?.detail?.index;
      
      // Haptic feedback for interactions
      if (window.NativeFeatures) {
        window.NativeFeatures.hapticFeedback('light');
      }
      
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
    
    // TOC clicks
    document.querySelectorAll('.docs-toc a[data-doc]').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const slug = a.getAttribute('data-doc');
        if (!slug) return;
        
        // Haptic feedback
        if (window.NativeFeatures) {
          window.NativeFeatures.hapticFeedback('light');
        }
        
        history.replaceState(null, '', `#in_app_docs/${slug}`);
        this.openDocs(slug);
      });
    });
    
    // Set up mobile navigation on window resize
    window.addEventListener('resize', debounce(() => {
      if (window.MobileDocsNav) {
        window.MobileDocsNav.setupDocsNavigation();
      }
    }, 250));
    
    // Set up initial mobile navigation if docs are open
    if (window.MobileDocsNav) {
      window.MobileDocsNav.setupDocsNavigation();
    }
    
    // ESC key handling
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeInfo();
        this.closeDocs();
      }
    });
  },
  
  /**
   * Handle initial geolocation
   */
  handleInitialLocation() {
    const deviceContext = window.DeviceContext.getContext();
    
    // Only auto-locate on mobile devices or if explicitly requested
    if (deviceContext.device === 'mobile' || localStorage.getItem('autoLocate') === 'true') {
      this.requestUserLocation();
    }
  },
  
  /**
   * Request user location with enhanced native features
   */
  async requestUserLocation() {
    try {
      console.log('AppBootstrap: Requesting user location');
      
      let position;
      if (window.getEnhancedPosition) {
        position = await window.getEnhancedPosition({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        });
      } else {
        // Fallback to standard geolocation
        position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000
          });
        });
      }
      
      if (position && window.map) {
        const lat = position.latitude || position.coords.latitude;
        const lng = position.longitude || position.coords.longitude;
        
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
        
        // Haptic feedback for successful location
        if (window.NativeFeatures) {
          window.NativeFeatures.hapticFeedback('success');
        }
        
        console.log('AppBootstrap: User location set:', { lat, lng });
      }
      
    } catch (error) {
      console.warn('AppBootstrap: Geolocation failed:', error);
      
      // Haptic feedback for failed location
      if (window.NativeFeatures) {
        window.NativeFeatures.hapticFeedback('error');
      }
    }
  },
  
  /**
   * Modal and drawer management
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
        
        // Set up mobile navigation
        if (window.MobileDocsNav) {
          window.MobileDocsNav.setupDocsNavigation();
        }
        
        // Update URL hash to reflect current page
        if (window.location.hash !== `#in_app_docs/${slug}`) {
          history.replaceState(null, '', `#in_app_docs/${slug}`);
        }
        
        const closeBtn = document.getElementById('docsClose');
        if (closeBtn) closeBtn.focus();
      })
      .catch(error => {
        console.error('Failed to load documentation:', error);
        const contentEl = document.getElementById('docsContent');
        if (contentEl) {
          contentEl.innerHTML = '<p>Failed to load documentation.</p>';
        }
        
        // Still set up navigation even if content fails
        if (window.MobileDocsNav) {
          window.MobileDocsNav.setupDocsNavigation();
        }
      });
  },
  
  /**
   * Highlight the currently active documentation page
   */
  highlightCurrentDocsPage() {
    const toc = document.querySelector('.docs-toc');
    if (!toc) return;
    
    // Get current page from URL hash
    const hash = window.location.hash;
    const match = hash.match(/^#docs\/(\w+)/);
    const currentSlug = match ? match[1] : 'intro';
    
    // Remove active class from all links
    toc.querySelectorAll('a[data-doc]').forEach(link => {
      link.classList.remove('active');
    });
    
    // Add active class to current page
    const currentLink = toc.querySelector(`a[data-doc="${currentSlug}"]`);
    if (currentLink) {
      currentLink.classList.add('active');
    }
  },
  
  closeDocs() {
    const overlay = document.getElementById('docsOverlay');
    const drawer = document.getElementById('docsDrawer');
    if (overlay) overlay.hidden = true;
    if (drawer) drawer.hidden = true;
  },
  
  openInfo() {
    const overlay = document.getElementById('infoOverlay');
    const modal = document.getElementById('infoModal');
    if (overlay) overlay.hidden = false;
    if (modal) modal.hidden = false;
    const closeBtn = document.getElementById('infoClose');
    if (closeBtn) closeBtn.focus();
  },
  
  closeInfo() {
    const overlay = document.getElementById('infoOverlay');
    const modal = document.getElementById('infoModal');
    if (overlay) overlay.hidden = true;
    if (modal) modal.hidden = true;
  },
  
  /**
   * Basic markdown parser for documentation
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
};

// Auto-initialize when DOM is ready (moved to end of file)

// Harden: align outlineColors with each category's styleFn color (prevents drift)
(() => {
	['ses','lga','cfa','frv'].forEach(cat => {
		try {
			const fn = window.categoryMeta?.[cat]?.styleFn;
			if (typeof fn === 'function') {
				const style = fn();
				if (style && style.color) {
					window.outlineColors[cat] = style.color;
				}
			}
		} catch {}
	});
})();

// Color category headers to match their outline colors
(() => {
	const headerToCategory = {
		sesHeader: 'ses',
		lgaHeader: 'lga',
		cfaHeader: 'cfa',
		ambulanceHeader: 'ambulance',
		policeHeader: 'police',
		frvHeader: 'frv'
	};
		Object.entries(headerToCategory).forEach(([id, cat]) => {
			const el = document.getElementById(id);
			if (el) {
				el.classList.add('category-header');
				const base = window.outlineColors[cat];
				const factor = window.headerColorAdjust[cat] ?? 1.0;
				el.style.color = window.adjustHexColor(base, factor);
				const arrow = el.querySelector('.collapse-arrow');
				if (arrow) arrow.style.color = window.adjustHexColor(base, Math.max(0, factor - 0.1));
			}
		});
})();

// Data loading is now handled by the preloader in sidebar order
// See preloader.js for the batched loading sequence

// Lazy-load triggers for Police
let _policeLoaded = false;
async function ensurePoliceLoaded(){
	if (_policeLoaded) return;
	try {
		await window.loadPolice();
		_policeLoaded = true;
	} catch (e) { console.error('Police load failed:', e); }
}

// 1) When user expands the Police section
(() => {
	const header = document.getElementById('policeHeader');
	const list = document.getElementById('policeList');
	if (!header || !list) return;
	header.addEventListener('click', () => {
		// Run after collapsible toggles display state
		setTimeout(() => {
			if (list.style.display !== 'none') ensurePoliceLoaded();
		}, 0);
	});
})();

// 2) When user toggles Show All Police Stations
(() => {
	const toggle = document.getElementById('toggleAllPolice');
	if (!toggle) return;
	// Prime loader on first interaction, then replay the event so loader's own handler runs
	const onFirstChange = async (ev) => {
		toggle.removeEventListener('change', onFirstChange);
		const desired = toggle.checked;
		await ensurePoliceLoaded();
		// Re-dispatch to apply group toggle with loader-bound handler
		toggle.checked = desired;
		toggle.dispatchEvent(new Event('change', { bubbles: true }));
	};
	toggle.addEventListener('change', onFirstChange);
})();

// Load waterway centrelines (but don't show by default)
window.loadWaterwayCentres();

// UI
window.initSearch();
window.updateActiveList();

// Sidebar minimize/expand toggle (mobile-friendly) - REPLACED BY SidebarToggleFab
/*
window.addEventListener('DOMContentLoaded', () => {
	const menu = document.getElementById('layerMenu');
	if (!menu) return;
	let btn = document.getElementById('sidebarToggle');
		if (!btn) {
			btn = document.createElement('button');
			btn.id = 'sidebarToggle';
			btn.className = 'sidebar-toggle';
			btn.type = 'button';
			btn.setAttribute('aria-controls', 'layerMenu');
			btn.setAttribute('aria-expanded', 'true');
			btn.title = 'Hide panel';
			btn.textContent = '⏩';
			// Append to body so transforms on the sidebar don't affect it
			document.body.appendChild(btn);
		}
	// Restore persisted state or default-minimize on small screens
	try {
		const saved = localStorage.getItem('sidebarMinimized');
		// Get mobile breakpoint from CSS custom property, fallback to 768px
		const computedStyle = getComputedStyle(document.documentElement);
		const mobileBreakpoint = parseInt(computedStyle.getPropertyValue('--mobile-large')?.replace('px', '')) || 768;
		const shouldMinimize = saved === '1' || (saved === null && window.innerWidth < mobileBreakpoint);
		if (shouldMinimize) {
			menu.classList.add('sidebar-minimized');
				// Disable focus/keyboard inside menu when minimized
				try { menu.inert = true; } catch {}
			btn.setAttribute('aria-expanded', 'false');
			btn.title = 'Show panel';
			btn.textContent = '⏪';
		}
	} catch {}
	btn.addEventListener('click', () => {
		const minimized = menu.classList.toggle('sidebar-minimized');
		const expanded = !minimized;
			// Toggle inert (focus/keyboard) safety when minimized
			try { menu.inert = minimized; } catch {}
		btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
		btn.title = expanded ? 'Hide panel' : 'Show panel';
		btn.textContent = expanded ? '⏩' : '⏪';
		try { localStorage.setItem('sidebarMinimized', minimized ? '1' : '0'); } catch {}
	});
*/

// Sidebar tool button handlers  
window.addEventListener('DOMContentLoaded', () => {
	// Attach inert click handlers to sidebar tool buttons (1, 2, 3)
	['sidebarBtn1','sidebarBtn2','sidebarBtn3'].forEach((id, idx) => {
		const el = document.getElementById(id);
		if (!el || el._bound) return;
		el._bound = true;
		el.addEventListener('click', () => {
			console.log(`Sidebar tool ${idx + 1} clicked`);
			window.dispatchEvent(new CustomEvent('sidebar-tool-click', { detail: { index: idx + 1, id } }));
		});
	});
});

window.setupOfflineListener();

// Enhanced device context integration
window.addEventListener('deviceContextReady', (event) => {
	const context = event.detail.context;
	console.log('Bootstrap: Device context ready:', context);
	
	// Apply platform-specific optimizations
	if (context.isPWA) {
		document.body.classList.add('pwa-mode');
		console.log('Bootstrap: PWA mode enabled');
	}
	
	if (context.platform.startsWith('ios')) {
		document.body.classList.add('ios-device');
	} else if (context.platform.startsWith('android')) {
		document.body.classList.add('android-device');
	}
	
	// Add breakpoint class to body
	document.body.classList.add(`breakpoint-${context.breakpoint}`);
});

// Handle orientation and context changes
window.addEventListener('deviceContextChange', (event) => {
	const { context, type } = event.detail;
	console.log('Bootstrap: Device context changed:', type, context);
	
	if (type === 'orientation') {
		// Update sidebar behavior on orientation change
		const menu = document.getElementById('layerMenu');
		if (menu && context.isMobile) {
			// On mobile landscape with limited height, adjust sidebar max-height
			if (context.orientation === 'landscape' && context.height < 500) {
				menu.style.maxHeight = '90vh';
			} else {
				menu.style.maxHeight = '80vh';
			}
		}
		
		// Update breakpoint class
		document.body.className = document.body.className.replace(/breakpoint-\w+/, '');
		document.body.classList.add(`breakpoint-${context.breakpoint}`);
	}
});

// Handle app visibility changes for performance
window.addEventListener('appVisibilityChange', (event) => {
	const { visible } = event.detail;
	console.log('Bootstrap: App visibility changed:', visible);
	
	if (!visible) {
		// App went to background, pause any heavy operations
		try {
			window.pauseOperations?.();
		} catch (e) {
			console.warn('Failed to pause operations:', e);
		}
	} else {
		// App came to foreground, resume operations
		try {
			window.resumeOperations?.();
		} catch (e) {
			console.warn('Failed to resume operations:', e);
		}
	}
});

// Reset handler: return the UI to a clean default starting state
window.addEventListener('sidebar-tool-click', async (ev) => {
	try {
		const detail = ev?.detail || {};
		if (detail.index !== 1 && detail.id !== 'sidebarBtn1') return;

		// Enter bulk mode to avoid churn in Active List during mass changes
	try { window.beginActiveListBulk(); } catch {}

		// 1) Clear global search and dropdown
		const input = document.getElementById('globalSidebarSearch');
		if (input) input.value = '';
		const dd = document.getElementById('sidebarSearchDropdown');
		if (dd) { dd.classList.remove('active'); dd.style.display = 'none'; dd.innerHTML = ''; }

		// 2) Hide weather box
		const wb = document.getElementById('weatherBox');
		if (wb) { wb.style.display = 'none'; wb.innerHTML = ''; }

		// 3a) Proactively clear all existing labels and emphasis, independent of list state
		;(['ses','lga','cfa','ambulance','police','frv']).forEach(cat => {
			const bucket = window.nameLabelMarkers?.[cat] || {};
			Object.keys(bucket).forEach(key => {
				try { window.removeLabel(cat, key); } catch {}
				try { window.emphasised[cat][key] = false; } catch {}
			});
		});

		// 3b) Clear all row checkboxes without forcing lazy loads
			const listIds = ['sesList','lgaList','cfaList','ambulanceList','policeList','frvList'];
			listIds.forEach(listId => {
				const list = document.getElementById(listId);
				if (!list) return;
				list.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
					if (cb.checked) {
						cb.checked = false;
						cb.dispatchEvent(new Event('change', { bubbles: true }));
					}
				});
			});
		// 3c) Reflect group toggles visually as unchecked, but avoid dispatching change
			['toggleAllSES','toggleAllLGAs','toggleAllCFA','toggleAllAmbulance','toggleAllPolice','toggleAllFRV'].forEach(id => {
				const el = document.getElementById(id);
				if (el) el.checked = false;
			});

		// 4) Clear the All Active UI then collapse sections
	try { window.updateActiveList(); } catch {}
		const sections = ['active','showAll','ses','lga','cfa','ambulance','police','frv'];
		sections.forEach(key => {
			const header = document.getElementById(`${key}Header`);
			const list = document.getElementById(`${key}List`);
			if (header) header.classList.add('collapsed');
			if (list) list.style.display = 'none';
		});

		// 5) Ensure any optional overlays are hidden
	try { window.hideWaterwayCentres(); } catch {}

		// 6) Reset map view to default
		try { mapInstance.setView(DEFAULT_VIEW.center, DEFAULT_VIEW.zoom); } catch {}

		// 7) Ensure sidebar is expanded (default on desktops)
		try {
			const menu = document.getElementById('layerMenu');
			if (menu) {
				menu.classList.remove('sidebar-minimized');
				try { menu.inert = false; } catch {}
			}
			localStorage.setItem('sidebarMinimized', '0');
			
      // Update SidebarToggleFAB state if it exists
      const sidebarFAB = window.FABManager && window.FABManager.getInstance('sidebarToggle');
      if (sidebarFAB && typeof sidebarFAB.restoreState === 'function') {
        sidebarFAB.restoreState();
      }
		} catch {}

		// Exit bulk mode after the bulk of changes are complete
	try { window.endActiveListBulk(); } catch {}

		// Final safety sweep after UI settles (handles any late events)
		setTimeout(() => {
			try {
				;(['ses','lga','cfa','ambulance','police']).forEach(cat => {
					const bucket = window.nameLabelMarkers?.[cat] || {};
					Object.keys(bucket).forEach(key => {
						try { window.removeLabel(cat, key); } catch {}
						try { window.emphasised[cat][key] = false; } catch {}
					});
				});
			} catch {}
		}, 0);

		console.log('Reset to default starting state complete.');
	} catch (e) {
		console.error('Reset to defaults failed:', e);
	}
});

// Docs & Info: wiring for buttons #sidebarBtn2 (Docs) and #sidebarBtn3 (Info)
async function ensureMdDeps() {
	if (window.marked && window.DOMPurify) return;
	await Promise.all([
		new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/marked@12.0.2/marked.min.js'; s.onload = res; s.onerror = rej; document.head.appendChild(s); }),
		new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/dompurify@3.0.6/dist/purify.min.js'; s.onload = res; s.onerror = rej; document.head.appendChild(s); })
	]);
}

async function renderDoc(slug) {
	try {
		await ensureMdDeps();
		        const resp = await fetch(`in_app_docs/${slug}.md`, { cache: 'no-cache' });
		const md = await resp.text();
		const html = window.DOMPurify.sanitize(window.marked.parse(md));
		const cont = document.getElementById('docsContent');
		if (cont) cont.innerHTML = html;
	} catch (e) {
		const cont = document.getElementById('docsContent');
		if (cont) cont.innerHTML = '<p style="color:#b00020">Failed to load documentation.</p>';
	}
}

function openDocs(slug) {
	const overlay = document.getElementById('docsOverlay');
	const drawer = document.getElementById('docsDrawer');
	if (overlay) overlay.hidden = false;
	if (drawer) drawer.hidden = false;
	if (slug) renderDoc(slug);
	const link = document.querySelector(`.docs-toc a[data-doc="${slug}"]`);
	if (link) {
		document.querySelectorAll('.docs-toc a').forEach(a => a.classList.remove('active'));
		link.classList.add('active');
	}
	const content = document.getElementById('docsContent');
	if (content) content.focus();
	
	// Trigger mobile navigation setup
	if (window.MobileDocsNav) {
		window.MobileDocsNav.onDocsOpen();
	}
	
	// Dispatch event for other listeners
	window.dispatchEvent(new CustomEvent('docs-opened', { detail: { slug } }));
}

function closeDocs() {
	const overlay = document.getElementById('docsOverlay');
	const drawer = document.getElementById('docsDrawer');
	if (overlay) overlay.hidden = true;
	if (drawer) drawer.hidden = true;
}

function openInfo() {
	const overlay = document.getElementById('infoOverlay');
	const modal = document.getElementById('infoModal');
	if (overlay) overlay.hidden = false;
	if (modal) modal.hidden = false;
	const closeBtn = document.getElementById('infoClose');
	if (closeBtn) closeBtn.focus();
}

function closeInfo() {
	const overlay = document.getElementById('infoOverlay');
	const modal = document.getElementById('infoModal');
	if (overlay) overlay.hidden = true;
	if (modal) modal.hidden = true;
}

// Button event routing
window.addEventListener('sidebar-tool-click', (ev) => {
	const idx = ev?.detail?.index;
	if (idx === 3) { // Info
		openInfo();
	} else if (idx === 2) { // Docs
		const hash = (location.hash || '').toString();
		const m = hash.match(/^#docs\/(\w+)/);
		const slug = m ? m[1] : 'intro';
		openDocs(slug);
	}
});

// Overlay/close buttons and ESC handling
window.addEventListener('DOMContentLoaded', () => {
	const iClose = document.getElementById('infoClose');
	const dClose = document.getElementById('docsClose');
	const iOv = document.getElementById('infoOverlay');
	const dOv = document.getElementById('docsOverlay');
	if (iClose) iClose.addEventListener('click', closeInfo);
	if (iOv) iOv.addEventListener('click', closeInfo);
	if (dClose) dClose.addEventListener('click', closeDocs);
	if (dOv) dOv.addEventListener('click', closeDocs);
	// TOC clicks
	document.querySelectorAll('.docs-toc a[data-doc]').forEach(a => {
		a.addEventListener('click', (e) => {
			e.preventDefault();
			const slug = a.getAttribute('data-doc');
			if (!slug) return;
			        history.replaceState(null, '', `#in_app_docs/${slug}`);
			openDocs(slug);
			
			// Haptic feedback for mobile
			if (window.NativeFeatures) {
				window.NativeFeatures.hapticFeedback('light');
			}
		});
	});
});

window.addEventListener('keydown', (e) => {
	if (e.key === 'Escape') {
		closeInfo();
		closeDocs();
	}
});

// Make AppBootstrap available globally for backward compatibility
window.AppBootstrap = AppBootstrap;

// Initialize the application when the DOM is ready
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', () => AppBootstrap.init());
} else {
	AppBootstrap.init();
}

// FABs are created in setupUI() method during initialization