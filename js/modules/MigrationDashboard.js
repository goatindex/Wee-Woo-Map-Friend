/**
 * @module modules/MigrationDashboard
 * Migration progress dashboard for monitoring ES6 transition
 */

import { globalEventBus } from './EventBus.js';

/**
 * @class MigrationDashboard
 * Displays migration progress and system status
 */
export class MigrationDashboard {
  constructor() {
    this.container = null;
    this.isVisible = false;
    this.updateInterval = null;
    
    // Bind methods
    this.show = this.show.bind(this);
    this.hide = this.hide.bind(this);
    this.update = this.update.bind(this);
    
    console.log('📊 MigrationDashboard: Dashboard system initialized');
  }
  
  /**
   * Show the migration dashboard
   */
  show() {
    if (this.isVisible) return;
    
    try {
      // Create dashboard container
      this.container = document.createElement('div');
      this.container.id = 'migrationDashboard';
      this.container.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        width: 350px;
        max-height: 80vh;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        border-radius: 8px;
        padding: 16px;
        font-family: monospace;
        font-size: 12px;
        z-index: 10000;
        overflow-y: auto;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      `;
      
      // Create header
      const header = document.createElement('div');
      header.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <h3 style="margin: 0; color: #4CAF50;">🔄 ES6 Migration Dashboard</h3>
          <button id="closeDashboard" style="background: #f44336; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer;">✖</button>
        </div>
      `;
      
      // Add close button handler
      header.querySelector('#closeDashboard').addEventListener('click', () => this.hide());
      
      this.container.appendChild(header);
      
      // Create content area
      const content = document.createElement('div');
      content.id = 'dashboardContent';
      this.container.appendChild(content);
      
      // Add to page
      document.body.appendChild(this.container);
      
      // Start updates
      this.update();
      this.updateInterval = setInterval(this.update, 2000);
      
      this.isVisible = true;
      console.log('📊 MigrationDashboard: Dashboard displayed');
      
    } catch (error) {
      console.error('🚨 MigrationDashboard: Failed to show dashboard:', error);
    }
  }
  
  /**
   * Hide the migration dashboard
   */
  hide() {
    if (!this.isVisible) return;
    
    try {
      if (this.updateInterval) {
        clearInterval(this.updateInterval);
        this.updateInterval = null;
      }
      
      if (this.container && this.container.parentNode) {
        this.container.parentNode.removeChild(this.container);
      }
      
      this.container = null;
      this.isVisible = false;
      console.log('📊 MigrationDashboard: Dashboard hidden');
      
    } catch (error) {
      console.error('🚨 MigrationDashboard: Failed to hide dashboard:', error);
    }
  }
  
  /**
   * Update dashboard content
   */
  update() {
    if (!this.container) return;
    
    try {
      const content = this.container.querySelector('#dashboardContent');
      if (!content) return;
      
      const status = this.getMigrationStatus();
      content.innerHTML = this.renderStatus(status);
      
    } catch (error) {
      console.error('🚨 MigrationDashboard: Failed to update dashboard:', error);
    }
  }
  
  /**
   * Get current migration status
   */
  getMigrationStatus() {
    // Debug: Log what managers are available
    const availableManagers = {
      ES6Bootstrap: !!window.ES6Bootstrap,
      es6IntegrationManager: !!window.es6IntegrationManager,
      stateManager: !!window.stateManager,
      configurationManager: !!window.configurationManager,
      legacyCompatibility: !!window.legacyCompatibility,
      activeListManager: !!window.activeListManager,
      mapManager: !!window.mapManager,
      layerManager: !!window.layerManager,
      polygonLoader: !!window.polygonLoader,
      labelManager: !!window.labelManager,
      coordinateConverter: !!window.coordinateConverter,
      errorUI: !!window.errorUI,
      textFormatter: !!window.textFormatter,
      featureEnhancer: !!window.featureEnhancer,
      AppBootstrap: !!window.AppBootstrap,
      DeviceManager: !!window.DeviceManager,
      UIManager: !!window.UIManager,
      CollapsibleManager: !!window.CollapsibleManager,
      SearchManager: !!window.SearchManager,
      FABManager: !!window.FABManager
    };
    
    console.log('📊 MigrationDashboard: Available managers:', availableManagers);
    
    const status = {
      timestamp: new Date().toISOString(),
      es6Bootstrap: window.ES6Bootstrap ? window.ES6Bootstrap.getStatus() : null,
      es6Integration: window.es6IntegrationManager ? window.es6IntegrationManager.getStatus() : null,
      stateManager: window.stateManager ? window.stateManager.getStatus() : null,
      configurationManager: window.configurationManager ? window.configurationManager.getStatus() : null,
      legacyCompatibility: window.legacyCompatibility ? window.legacyCompatibility.getStatus() : null,
      activeListManager: window.activeListManager ? window.activeListManager.getStatus() : null,
      mapManager: window.mapManager ? window.mapManager.getStatus() : null,
      layerManager: window.layerManager ? window.layerManager.getStatus() : null,
      polygonLoader: window.polygonLoader ? window.polygonLoader.getStatus() : null,
              labelManager: window.labelManager ? window.labelManager.getStatus() : null,
              coordinateConverter: window.coordinateConverter ? window.coordinateConverter.getStatus() : null,
      errorUI: window.errorUI ? window.errorUI.getStatus() : null,
      textFormatter: window.textFormatter ? window.textFormatter.getStatus() : null,
      featureEnhancer: window.featureEnhancer ? window.featureEnhancer.getStatus() : null,
      appBootstrap: window.AppBootstrap ? window.AppBootstrap.getStatus() : null,
      deviceManager: window.DeviceManager ? window.DeviceManager.getStatus() : null,
      uiManager: window.UIManager ? window.UIManager.getStatus() : null,
      collapsibleManager: window.CollapsibleManager ? window.CollapsibleManager.getStatus() : null,
      searchManager: window.SearchManager ? window.SearchManager.getStatus() : null,
      fabManager: window.FABManager ? window.FABManager.getStatus() : null,
      legacyBootstrap: window.AppBootstrap ? 'Available' : 'Not Available',
      modules: this.getModuleStatus(),
      system: this.getSystemStatus()
    };
    
    return status;
  }
  
  /**
   * Get module loading status
   */
  getModuleStatus() {
          const modules = [
        'ES6Bootstrap',
        'es6IntegrationManager',
        'stateManager',
        'configurationManager',
        'legacyCompatibility',
        'activeListManager',
        'mapManager',
        'layerManager',
        'polygonLoader',
        'labelManager',
        'coordinateConverter',
        'errorUI',
        'textFormatter',
        'featureEnhancer',
        'AppBootstrap',
        'DeviceManager',
        'UIManager',
        'CollapsibleManager',
        'SearchManager',
        'FABManager',
        'globalEventBus'
      ];
    
    return modules.map(name => ({
      name,
      loaded: !!window[name],
      type: window[name] ? 'ES6 Module' : 'Not Loaded'
    }));
  }
  
  /**
   * Get system status
   */
  getSystemStatus() {
    return {
      userAgent: navigator.userAgent,
      es6Support: typeof window !== 'undefined' && 'Promise' in window && 'Map' in window && 'Set' in window,
      moduleSupport: typeof window !== 'undefined' && 'import' in window,
      readyState: document.readyState,
      url: window.location.href
    };
  }
  
  /**
   * Render status as HTML
   */
  renderStatus(status) {
    return `
      <div style="margin-bottom: 16px;">
        <h4 style="margin: 0 0 8px 0; color: #2196F3;">📊 System Status</h4>
        <div style="background: rgba(255, 255, 255, 0.1); padding: 8px; border-radius: 4px; margin-bottom: 8px;">
          <div><strong>ES6 Support:</strong> <span style="color: ${status.system.es6Support ? '#4CAF50' : '#f44336'}">${status.system.es6Support ? '✅ Yes' : '❌ No'}</span></div>
          <div><strong>Module Support:</strong> <span style="color: ${status.system.moduleSupport ? '#4CAF50' : '#f44336'}">${status.system.moduleSupport ? '✅ Yes' : '❌ No'}</span></div>
          <div><strong>Ready State:</strong> <span style="color: #FF9800">${status.system.readyState}</span></div>
        </div>
      </div>
      
      <div style="margin-bottom: 16px;">
        <h4 style="margin: 0 0 8px 0; color: #2196F3;">🚀 ES6 Bootstrap</h4>
        ${status.es6Bootstrap ? `
          <div style="background: rgba(255, 255, 255, 0.1); padding: 8px; border-radius: 4px; margin-bottom: 8px;">
            <div><strong>Status:</strong> <span style="color: ${status.es6Bootstrap.initialized ? '#4CAF50' : '#FF9800'}">${status.es6Bootstrap.initialized ? '✅ Ready' : '⏳ Initializing'}</span></div>
            <div><strong>Phase:</strong> <span style="color: #FF9800">${status.es6Bootstrap.migrationPhase}</span></div>
            <div><strong>Legacy Bootstrap:</strong> <span style="color: ${status.es6Bootstrap.legacyBootstrap ? '#4CAF50' : '#f44336'}">${status.es6Bootstrap.legacyBootstrap ? '✅ Found' : '❌ Not Found'}</span></div>
            <div><strong>Init Time:</strong> <span style="color: #FF9800">${status.es6Bootstrap.initTime}ms</span></div>
          </div>
        ` : '<div style="color: #f44336;">❌ Not Available</div>'}
      </div>
      
      <div style="margin-bottom: 16px;">
        <h4 style="margin: 0 0 8px 0; color: #2196F3;">🔗 ES6 Integration</h4>
        ${status.es6Integration ? `
          <div style="background: rgba(255, 255, 255, 0.1); padding: 8px; border-radius: 4px; margin-bottom: 8px;">
            <div><strong>Status:</strong> <span style="color: ${status.es6Integration.phase === 'ready' ? '#4CAF50' : '#FF9800'}">${status.es6Integration.phase === 'ready' ? '✅ Ready' : '⏳ ' + status.es6Integration.phase}</span></div>
            <div><strong>Modules:</strong> <span style="color: #FF9800">${status.es6Integration.modulesLoaded.length}</span></div>
            <div><strong>Legacy Functions:</strong> <span style="color: #FF9800">${status.es6Integration.legacyFunctions.length}</span></div>
          </div>
        ` : '<div style="color: #f44336;">❌ Not Available</div>'}
      </div>
      
      <div style="margin-bottom: 16px;">
        <h4 style="margin: 0 0 8px 0; color: #2196F3;">📊 State Manager</h4>
        ${status.stateManager ? `
          <div style="background: rgba(255, 255, 255, 0.1); padding: 8px; border-radius: 4px; margin-bottom: 8px;">
            <div><strong>Status:</strong> <span style="color: #4CAF50">✅ Ready</span></div>
            <div><strong>State Properties:</strong> <span style="color: #FF9800">${Object.keys(status.stateManager).length}</span></div>
          </div>
        ` : '<div style="color: #f44336;">❌ Not Available</div>'}
      </div>
      
      <div style="margin-bottom: 16px;">
        <h4 style="margin: 0 0 8px 0; color: #2196F3;">⚙️ Configuration Manager</h4>
        ${status.configurationManager ? `
          <div style="background: rgba(255, 255, 255, 0.1); padding: 8px; border-radius: 4px; margin-bottom: 8px;">
            <div><strong>Status:</strong> <span style="color: #4CAF50">✅ Ready</span></div>
            <div><strong>Config Items:</strong> <span style="color: #FF9800">${status.configurationManager.configCount}</span></div>
            <div><strong>Categories:</strong> <span style="color: #FF9800">${status.configurationManager.categories.join(', ')}</span></div>
          </div>
        ` : '<div style="color: #f44336;">❌ Not Available</div>'}
      </div>
      
      <div style="margin-bottom: 16px;">
        <h4 style="margin: 0 0 8px 0; color: #2196F3;">🔗 Legacy Compatibility</h4>
        ${status.legacyCompatibility ? `
          <div style="background: rgba(255, 255, 255, 0.1); padding: 8px; border-radius: 4px; margin-bottom: 8px;">
            <div><strong>Status:</strong> <span style="color: ${status.legacyCompatibility.initialized ? '#4CAF50' : '#FF9800'}">${status.legacyCompatibility.initialized ? '✅ Ready' : '⏳ Initializing'}</span></div>
            <div><strong>Legacy Globals:</strong> <span style="color: #FF9800">${status.legacyCompatibility.legacyGlobals}</span></div>
            <div><strong>Legacy Functions:</strong> <span style="color: #FF9800">${status.legacyCompatibility.legacyFunctions}</span></div>
          </div>
        ` : '<div style="color: #f44336;">❌ Not Available</div>'}
      </div>
      
      <div style="margin-bottom: 16px;">
        <h4 style="margin: 0 0 8px 0; color: #2196F3;">📋 Active List Manager</h4>
        ${status.activeListManager ? `
          <div style="background: rgba(255, 255, 255, 0.1); padding: 8px; border-radius: 4px; margin-bottom: 8px;">
            <div><strong>Status:</strong> <span style="color: ${status.activeListManager.initialized ? '#4CAF50' : '#FF9800'}">${status.activeListManager.initialized ? '✅ Ready' : '⏳ Initializing'}</span></div>
            <div><strong>Bulk Operation:</strong> <span style="color: ${status.activeListManager.bulkOperationActive ? '#FF9800' : '#4CAF50'}">${status.activeListManager.bulkOperationActive ? '🔄 Active' : '✅ Inactive'}</span></div>
            <div><strong>Pending Updates:</strong> <span style="color: #FF9800">${status.activeListManager.pendingUpdates.length}</span></div>
            <div><strong>Container:</strong> <span style="color: ${status.activeListManager.activeListContainer ? '#4CAF50' : '#f44336'}">${status.activeListManager.activeListContainer ? '✅ Found' : '❌ Not Found'}</span></div>
                            </div>
                ` : '<div style="color: #f44336;">❌ Not Available</div>'}
              </div>
              
              <div style="margin-bottom: 16px;">
                <h4 style="margin: 0 0 8px 0; color: #2196F3;">🗺️ Map Manager</h4>
                ${status.mapManager ? `
                  <div style="background: rgba(255, 255, 255, 0.1); padding: 8px; border-radius: 4px; margin-bottom: 8px;">
                    <div><strong>Status:</strong> <span style="color: ${status.mapManager.mapReady ? '#4CAF50' : '#FF9800'}">${status.mapManager.mapReady ? '✅ Ready' : '⏳ Initializing'}</span></div>
                    <div><strong>Map Center:</strong> <span style="color: #FF9800">${status.mapManager.mapCenter ? `${status.mapManager.mapCenter.lat.toFixed(4)}, ${status.mapManager.mapCenter.lng.toFixed(4)}` : 'N/A'}</span></div>
                    <div><strong>Zoom Level:</strong> <span style="color: #FF9800">${status.mapManager.mapZoom || 'N/A'}</span></div>
                    <div><strong>Base Tile:</strong> <span style="color: ${status.mapManager.baseTileLayer ? '#4CAF50' : '#f44336'}">${status.mapManager.baseTileLayer ? '✅ Loaded' : '❌ Not Loaded'}</span></div>
                  </div>
                ` : '<div style="color: #f44336;">❌ Not Available</div>'}
              </div>
              
              <div style="margin-bottom: 16px;">
                <h4 style="margin: 0 0 8px 0; color: #2196F3;">🔲 Layer Manager</h4>
                ${status.layerManager ? `
                  <div style="background: rgba(255, 255, 255, 0.1); padding: 8px; border-radius: 4px; margin-bottom: 8px;">
                    <div><strong>Status:</strong> <span style="color: ${status.layerManager.initialized ? '#4CAF50' : '#FF9800'}">${status.layerManager.initialized ? '✅ Ready' : '⏳ Initializing'}</span></div>
                    <div><strong>Panes:</strong> <span style="color: #FF9800">${status.layerManager.panes}</span></div>
                    <div><strong>Categories:</strong> <span style="color: #FF9800">${status.layerManager.categories}</span></div>
                    <div><strong>Total Layers:</strong> <span style="color: #FF9800">${status.layerManager.totalLayers}</span></div>
                  </div>
                ` : '<div style="color: #f44336;">❌ Not Available</div>'}
              </div>
              
              <div style="margin-bottom: 16px;">
                <h4 style="margin: 0 0 8px 0; color: #2196F3;">📐 Polygon Loader</h4>
                ${status.polygonLoader ? `
                  <div style="background: rgba(255, 255, 255, 0.1); padding: 8px; border-radius: 4px; margin-bottom: 8px;">
                    <div><strong>Status:</strong> <span style="color: ${status.polygonLoader.initialized ? '#4CAF50' : '#FF9800'}">${status.polygonLoader.initialized ? '✅ Ready' : '⏳ Initializing'}</span></div>
                    <div><strong>Loading:</strong> <span style="color: #FF9800">${status.polygonLoader.loadingCategories.length}</span></div>
                    <div><strong>Loaded:</strong> <span style="color: #FF9800">${status.polygonLoader.loadedCategories.length}</span></div>
                    <div><strong>Total Categories:</strong> <span style="color: #FF9800">${status.polygonLoader.totalCategories}</span></div>
                  </div>
                ` : '<div style="color: #f44336;">❌ Not Available</div>'}
              </div>
              
              <div style="margin-bottom: 16px;">
                <h4 style="margin: 0 0 8px 0; color: #2196F3;">🏷️ Label Manager</h4>
                ${status.labelManager ? `
                  <div style="background: rgba(255, 255, 255, 0.1); padding: 8px; border-radius: 4px; margin-bottom: 8px;">
                    <div><strong>Status:</strong> <span style="color: ${status.labelManager.initialized ? '#4CAF50' : '#FF9800'}">${status.labelManager.initialized ? '✅ Ready' : '⏳ Initializing'}</span></div>
                    <div><strong>Total Labels:</strong> <span style="color: #FF9800">${status.labelManager.totalLabels}</span></div>
                    <div><strong>Visible Labels:</strong> <span style="color: #FF9800">${status.labelManager.visibleLabels}</span></div>
                    <div><strong>Categories:</strong> <span style="color: #FF9800">${status.labelManager.categories}</span></div>
                    <div><strong>Deferred:</strong> <span style="color: #FF9800">${status.labelManager.deferredLabels}</span></div>
                  </div>
                ` : '<div style="color: #f44336;">❌ Not Available</div>'}
              </div>
              
              <div style="margin-bottom: 16px;">
                <h4 style="margin: 0 0 8px 0; color: #2196F3;">🗺️ Coordinate Converter</h4>
                ${status.coordinateConverter ? `
                  <div style="background: rgba(255, 255, 255, 0.1); padding: 8px; border-radius: 4px; margin-bottom: 8px;">
                    <div><strong>Status:</strong> <span style="color: ${status.coordinateConverter.initialized ? '#4CAF50' : '#FF9800'}">${status.coordinateConverter.initialized ? '✅ Ready' : '⏳ Initializing'}</span></div>
                    <div><strong>Proj4 Available:</strong> <span style="color: ${status.coordinateConverter.proj4Available ? '#4CAF50' : '#f44336'}">${status.coordinateConverter.proj4Available ? '✅ Yes' : '❌ No'}</span></div>
                    <div><strong>Conversions:</strong> <span style="color: #FF9800">${status.coordinateConverter.supportedConversions.join(', ')}</span></div>
                  </div>
                ` : '<div style="color: #f44336;">❌ Not Available</div>'}
              </div>
              
              <div style="margin-bottom: 16px;">
                <h4 style="margin: 0 0 8px 0; color: #2196F3;">⚠️ Error UI</h4>
                ${status.errorUI ? `
                  <div style="background: rgba(255, 255, 255, 0.1); padding: 8px; border-radius: 4px; margin-bottom: 8px;">
                    <div><strong>Status:</strong> <span style="color: ${status.errorUI.initialized ? '#4CAF50' : '#FF9800'}">${status.errorUI.initialized ? '✅ Ready' : '⏳ Initializing'}</span></div>
                    <div><strong>Offline Status:</strong> <span style="color: ${status.errorUI.offlineStatus ? '#FF9800' : '#4CAF50'}">${status.errorUI.offlineStatus ? '🔄 Offline' : '✅ Online'}</span></div>
                    <div><strong>Active Errors:</strong> <span style="color: #FF9800">${status.errorUI.activeErrors}</span></div>
                    <div><strong>Error Container:</strong> <span style="color: ${status.errorUI.errorContainer ? '#4CAF50' : '#f44336'}">${status.errorUI.errorContainer ? '✅ Found' : '❌ Not Found'}</span></div>
                  </div>
                ` : '<div style="color: #f44336;">❌ Not Available</div>'}
              </div>
              
              <div style="margin-bottom: 16px;">
                <h4 style="margin: 0 0 8px 0; color: #2196F3;">📝 Text Formatter</h4>
                ${status.textFormatter ? `
                  <div style="background: rgba(255, 255, 255, 0.1); padding: 8px; border-radius: 4px; margin-bottom: 8px;">
                    <div><strong>Status:</strong> <span style="color: ${status.textFormatter.initialized ? '#4CAF50' : '#FF9800'}">${status.textFormatter.initialized ? '✅ Ready' : '⏳ Initializing'}</span></div>
                    <div><strong>Formatting Rules:</strong> <span style="color: #FF9800">${status.textFormatter.formattingRules}</span></div>
                    <div><strong>Cache Size:</strong> <span style="color: #FF9800">${status.textFormatter.cacheSize}</span></div>
                    <div><strong>Categories:</strong> <span style="color: #FF9800">${status.textFormatter.supportedCategories.join(', ')}</span></div>
                  </div>
                ` : '<div style="color: #f44336;">❌ Not Available</div>'}
              </div>
              
              <div style="margin-bottom: 16px;">
                <h4 style="margin: 0 0 8px 0; color: #2196F3;">✨ Feature Enhancer</h4>
                ${status.featureEnhancer ? `
                  <div style="background: rgba(255, 255, 255, 0.1); padding: 8px; border-radius: 4px; margin-bottom: 8px;">
                    <div><strong>Status:</strong> <span style="color: ${status.featureEnhancer.initialized ? '#4CAF50' : '#FF9800'}">${status.featureEnhancer.initialized ? '✅ Ready' : '⏳ Initializing'}</span></div>
                    <div><strong>Active Enhancements:</strong> <span style="color: #FF9800">${status.featureEnhancer.activeEnhancements}</span></div>
                    <div><strong>SES Facilities:</strong> <span style="color: #FF9800">${status.featureEnhancer.sesFacilities}</span></div>
                    <div><strong>CFA Facilities:</strong> <span style="color: #FF9800">${status.featureEnhancer.cfaFacilities}</span></div>
                    <div><strong>Types:</strong> <span style="color: #FF9800">${status.featureEnhancer.enhancementTypes.join(', ')}</span></div>
                  </div>
                ` : '<div style="color: #f44336;">❌ Not Available</div>'}
              </div>
              
              <div style="margin-bottom: 16px;">
                <h4 style="margin: 0 0 8px 0; color: #2196F3;">🚀 App Bootstrap</h4>
                ${status.appBootstrap ? `
                  <div style="background: rgba(255, 255, 255, 0.1); padding: 8px; border-radius: 4px; margin-bottom: 8px;">
                    <div><strong>Status:</strong> <span style="color: ${status.appBootstrap.initialized ? '#4CAF50' : '#FF9800'}">${status.appBootstrap.initialized ? '✅ Ready' : '⏳ Initializing'}</span></div>
                    <div><strong>Init Time:</strong> <span style="color: #FF9800">${status.appBootstrap.initTime}ms</span></div>
                    <div><strong>Device Context:</strong> <span style="color: #FF9800">${status.appBootstrap.deviceContext ? status.appBootstrap.deviceContext.device : 'N/A'}</span></div>
                    <div><strong>Native Features:</strong> <span style="color: #FF9800">${status.appBootstrap.nativeFeatures ? (status.appBootstrap.nativeFeatures.isNative ? 'Yes' : 'No') : 'N/A'}</span></div>
                  </div>
                ` : '<div style="color: #f44336;">❌ Not Available</div>'}
              </div>
              
                             <div style="margin-bottom: 16px;">
                 <h4 style="margin: 0 0 8px 0; color: #2196F3;">📱 Device Manager</h4>
                 ${status.deviceManager ? `
                   <div style="background: rgba(255, 255, 255, 0.1); padding: 8px; border-radius: 4px; margin-bottom: 8px;">
                     <div><strong>Status:</strong> <span style="color: ${status.deviceManager.initialized ? '#4CAF50' : '#FF9800'}">${status.deviceManager.initialized ? '✅ Ready' : '⏳ Initializing'}</span></div>
                     <div><strong>Device:</strong> <span style="color: #FF9800">${status.deviceManager.deviceContext ? status.deviceManager.deviceContext.device : 'N/A'}</span></div>
                     <div><strong>Platform:</strong> <span style="color: #FF9800">${status.deviceManager.deviceContext ? status.deviceManager.deviceContext.platform : 'N/A'}</span></div>
                     <div><strong>Orientation:</strong> <span style="color: #FF9800">${status.deviceManager.deviceContext ? status.deviceManager.deviceContext.orientation : 'N/A'}</span></div>
                     <div><strong>Touch:</strong> <span style="color: #FF9800">${status.deviceManager.deviceContext ? (status.deviceManager.deviceContext.hasTouch ? 'Yes' : 'No') : 'N/A'}</span></div>
                   </div>
                 ` : '<div style="color: #f44336;">❌ Not Available</div>'}
               </div>
               
               <div style="margin-bottom: 16px;">
                 <h4 style="margin: 0 0 8px 0; color: #2196F3;">🎨 UI Manager</h4>
                 ${status.uiManager ? `
                   <div style="background: rgba(255, 255, 255, 0.1); padding: 8px; border-radius: 4px; margin-bottom: 8px;">
                     <div><strong>Status:</strong> <span style="color: ${status.uiManager.initialized ? '#4CAF50' : '#FF9800'}">${status.uiManager.initialized ? '✅ Ready' : '⏳ Initializing'}</span></div>
                     <div><strong>Components:</strong> <span style="color: #FF9800">${status.uiManager.totalComponents}</span></div>
                     <div><strong>Breakpoint:</strong> <span style="color: #FF9800">${status.uiManager.currentBreakpoint}</span></div>
                     <div><strong>Component Names:</strong> <span style="color: #FF9800">${status.uiManager.componentNames.join(', ')}</span></div>
                   </div>
                 ` : '<div style="color: #f44336;">❌ Not Available</div>'}
               </div>
               
               <div style="margin-bottom: 16px;">
                 <h4 style="margin: 0 0 8px 0; color: #2196F3;">📁 Collapsible Manager</h4>
                 ${status.collapsibleManager ? `
                   <div style="background: rgba(255, 255, 255, 0.1); padding: 8px; border-radius: 4px; margin-bottom: 8px;">
                     <div><strong>Status:</strong> <span style="color: ${status.collapsibleManager.initialized ? '#4CAF50' : '#FF9800'}">${status.collapsibleManager.initialized ? '✅ Ready' : '⏳ Initializing'}</span></div>
                     <div><strong>Total Sections:</strong> <span style="color: #FF9800">${status.collapsibleManager.totalSections}</span></div>
                     <div><strong>Sticky Headers:</strong> <span style="color: #FF9800">${status.collapsibleManager.stickyHeaders}</span></div>
                     <div><strong>Active Section:</strong> <span style="color: #FF9800">${status.collapsibleManager.activeSection || 'None'}</span></div>
                   </div>
                 ` : '<div style="color: #f44336;">❌ Not Available</div>'}
               </div>
               
               <div style="margin-bottom: 16px;">
                 <h4 style="margin: 0 0 8px 0; color: #2196F3;">🔍 Search Manager</h4>
                 ${status.searchManager ? `
                   <div style="background: rgba(255, 255, 255, 0.1); padding: 8px; border-radius: 4px; margin-bottom: 8px;">
                     <div><strong>Status:</strong> <span style="color: ${status.searchManager.initialized ? '#4CAF50' : '#FF9800'}">${status.searchManager.initialized ? '✅ Ready' : '⏳ Initializing'}</span></div>
                     <div><strong>Search Box:</strong> <span style="color: ${status.searchManager.searchBox ? '#4CAF50' : '#f44336'}">${status.searchManager.searchBox ? '✅ Found' : '❌ Not Found'}</span></div>
                     <div><strong>Dropdown:</strong> <span style="color: ${status.searchManager.dropdown ? '#4CAF50' : '#f44336'}">${status.searchManager.dropdown ? '✅ Found' : '❌ Not Found'}</span></div>
                     <div><strong>Search Index:</strong> <span style="color: #FF9800">${status.searchManager.searchIndexSize}</span></div>
                     <div><strong>Last Query:</strong> <span style="color: #FF9800">${status.searchManager.lastQuery || 'None'}</span></div>
                   </div>
                 ` : '<div style="color: #f44336;">❌ Not Available</div>'}
               </div>
               
               <div style="margin-bottom: 16px;">
                 <h4 style="margin: 0 0 8px 0; color: #2196F3;">🔘 FAB Manager</h4>
                 ${status.fabManager ? `
                   <div style="background: rgba(255, 255, 255, 0.1); padding: 8px; border-radius: 4px; margin-bottom: 8px;">
                     <div><strong>Status:</strong> <span style="color: ${status.fabManager.initialized ? '#4CAF50' : '#FF9800'}">${status.fabManager.initialized ? '✅ Ready' : '⏳ Initializing'}</span></div>
                     <div><strong>Total Types:</strong> <span style="color: #FF9800">${status.fabManager.totalTypes}</span></div>
                     <div><strong>Total Instances:</strong> <span style="color: #FF9800">${status.fabManager.totalInstances}</span></div>
                     <div><strong>FAB Container:</strong> <span style="color: ${status.fabManager.fabContainer ? '#4CAF50' : '#f44336'}">${status.fabManager.fabContainer ? '✅ Found' : '❌ Not Found'}</span></div>
                     <div><strong>Registered Types:</strong> <span style="color: #FF9800">${status.fabManager.registeredTypes.join(', ')}</span></div>
                   </div>
                 ` : '<div style="color: #f44336;">❌ Not Available</div>'}
               </div>
              
              <div style="margin-bottom: 16px;">
                <h4 style="margin: 0 0 8px 0; color: #2196F3;">📦 Module Status</h4>
        <div style="background: rgba(255, 255, 255, 0.1); padding: 8px; border-radius: 4px; margin-bottom: 8px;">
          ${status.modules.map(module => `
            <div><strong>${module.name}:</strong> <span style="color: ${module.loaded ? '#4CAF50' : '#f44336'}">${module.loaded ? '✅ Loaded' : '❌ Not Loaded'}</span> <span style="color: #FF9800; font-size: 10px;">(${module.type})</span></div>
          `).join('')}
        </div>
      </div>
      
      <div style="margin-bottom: 16px;">
        <h4 style="margin: 0 0 8px 0; color: #2196F3;">🔄 Legacy System</h4>
        <div style="background: rgba(255, 255, 255, 0.1); padding: 8px; border-radius: 4px; margin-bottom: 8px;">
          <div><strong>Bootstrap:</strong> <span style="color: ${status.legacyBootstrap === 'Available' ? '#4CAF50' : '#f44336'}">${status.legacyBootstrap}</span></div>
        </div>
      </div>
      
      <div style="font-size: 10px; color: #999; text-align: center;">
        Last updated: ${new Date(status.timestamp).toLocaleTimeString()}
      </div>
    `;
  }
}

// Export singleton instance
export const migrationDashboard = new MigrationDashboard();

// Export for global access
if (typeof window !== 'undefined') {
  window.migrationDashboard = migrationDashboard;
  
  // Add keyboard shortcut to show/hide dashboard (Ctrl+Shift+M)
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'M') {
      e.preventDefault();
      if (migrationDashboard.isVisible) {
        migrationDashboard.hide();
      } else {
        migrationDashboard.show();
      }
    }
  });
}
