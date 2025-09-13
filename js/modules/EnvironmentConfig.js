/**
 * @module modules/EnvironmentConfig
 * Environment-specific configuration management
 * Centralizes all deployment-specific settings and configurations
 */

import { injectable, inject } from 'inversify';
import { TYPES } from './Types.js';
import { BaseService } from './BaseService.js';

/**
 * @class EnvironmentConfig
 * Manages environment-specific configurations and settings
 */
@injectable()
export class EnvironmentConfig extends BaseService {
  constructor(
    @inject(TYPES.StructuredLogger) structuredLogger,
    @inject(TYPES.PathResolver) private pathResolver
  ) {
    super(structuredLogger);
    this.environment = this.pathResolver.getEnvironment();
    this.config = this.pathResolver.getEnvironmentConfig();
    
    this.logger.info('Environment configuration initialized', {
      environment: this.environment,
      config: this.config
    });
  }

  /**
   * Get the current environment name
   */
  getEnvironment() {
    return this.environment;
  }

  /**
   * Get the base path for the current environment
   */
  getBasePath() {
    return this.pathResolver.getBasePath();
  }

  /**
   * Get the log level for the current environment
   */
  getLogLevel() {
    return this.config.logLevel;
  }

  /**
   * Check if debug tools should be enabled
   */
  isDebugToolsEnabled() {
    return this.config.enableDebugTools;
  }

  /**
   * Check if service worker should be enabled
   */
  isServiceWorkerEnabled() {
    return this.config.enableServiceWorker;
  }

  /**
   * Get the manifest path for the current environment
   */
  getManifestPath() {
    return this.pathResolver.getManifestPath();
  }

  /**
   * Get the service worker path for the current environment
   */
  getServiceWorkerPath() {
    return this.pathResolver.getServiceWorkerPath();
  }

  /**
   * Get the favicon path for the current environment
   */
  getFaviconPath() {
    return this.pathResolver.getFaviconPath();
  }

  /**
   * Get asset path for the current environment
   */
  getAssetPath(assetPath) {
    return this.pathResolver.getAssetPath(assetPath);
  }

  /**
   * Get API endpoints for the current environment
   */
  getApiEndpoints() {
    const endpoints = {
      'github-pages-new': {
        weather: 'https://goatindex.github.io/mapexp.github.io/api/weather',
        health: 'https://goatindex.github.io/mapexp.github.io/api/health'
      },
      'github-pages-old': {
        weather: 'https://goatindex.github.io/mapexp.github.io/api/weather',
        health: 'https://goatindex.github.io/mapexp.github.io/api/health'
      },
      'github-pages-root': {
        weather: 'https://goatindex.github.io/api/weather',
        health: 'https://goatindex.github.io/api/health'
      },
      'local': {
        weather: 'http://localhost:5000/api/weather',
        health: 'http://localhost:5000/api/health'
      },
      'custom-domain': {
        weather: '/api/weather',
        health: '/api/health'
      },
      'netlify-vercel': {
        weather: '/api/weather',
        health: '/api/health'
      },
      'unknown': {
        weather: '/api/weather',
        health: '/api/health'
      }
    };

    return endpoints[this.environment] || endpoints['unknown'];
  }

  /**
   * Get CDN URLs for external dependencies
   */
  getCdnUrls() {
    return {
      leaflet: {
        css: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
        js: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      },
      turf: {
        js: 'https://cdn.jsdelivr.net/npm/@turf/turf@6.5.0/turf.min.js'
      },
      proj4: {
        js: 'https://cdn.jsdelivr.net/npm/proj4@2.9.2/dist/proj4.min.js'
      }
    };
  }

  /**
   * Get data file paths for the current environment
   */
  getDataPaths() {
    const basePath = this.getBasePath();
    
    return {
      ses: `${basePath}data/ses.geojson`,
      lga: `${basePath}data/lga.geojson`,
      cfa: `${basePath}data/cfa.geojson`,
      ambulance: `${basePath}data/ambulance.geojson`,
      police: `${basePath}data/police.geojson`,
      frv: `${basePath}data/frv.geojson`
    };
  }

  /**
   * Get performance settings for the current environment
   */
  getPerformanceSettings() {
    const settings = {
      'github-pages-new': {
        cacheTimeout: 300000, // 5 minutes
        maxConcurrentRequests: 6,
        enableCompression: true,
        enableCaching: true
      },
      'github-pages-old': {
        cacheTimeout: 300000, // 5 minutes
        maxConcurrentRequests: 6,
        enableCompression: true,
        enableCaching: true
      },
      'github-pages-root': {
        cacheTimeout: 300000, // 5 minutes
        maxConcurrentRequests: 6,
        enableCompression: true,
        enableCaching: true
      },
      'local': {
        cacheTimeout: 60000, // 1 minute
        maxConcurrentRequests: 10,
        enableCompression: false,
        enableCaching: false
      },
      'custom-domain': {
        cacheTimeout: 300000, // 5 minutes
        maxConcurrentRequests: 8,
        enableCompression: true,
        enableCaching: true
      },
      'netlify-vercel': {
        cacheTimeout: 300000, // 5 minutes
        maxConcurrentRequests: 8,
        enableCompression: true,
        enableCaching: true
      },
      'unknown': {
        cacheTimeout: 300000, // 5 minutes
        maxConcurrentRequests: 6,
        enableCompression: true,
        enableCaching: true
      }
    };

    return settings[this.environment] || settings['unknown'];
  }

  /**
   * Get feature flags for the current environment
   */
  getFeatureFlags() {
    const flags = {
      'github-pages-new': {
        enableSearch: true,
        enableWeather: true,
        enableOfflineMode: true,
        enableAnalytics: false,
        enableDebugPanel: false
      },
      'github-pages-old': {
        enableSearch: true,
        enableWeather: true,
        enableOfflineMode: true,
        enableAnalytics: false,
        enableDebugPanel: false
      },
      'github-pages-root': {
        enableSearch: true,
        enableWeather: true,
        enableOfflineMode: true,
        enableAnalytics: false,
        enableDebugPanel: false
      },
      'local': {
        enableSearch: true,
        enableWeather: false,
        enableOfflineMode: false,
        enableAnalytics: false,
        enableDebugPanel: true
      },
      'custom-domain': {
        enableSearch: true,
        enableWeather: true,
        enableOfflineMode: true,
        enableAnalytics: true,
        enableDebugPanel: false
      },
      'netlify-vercel': {
        enableSearch: true,
        enableWeather: true,
        enableOfflineMode: true,
        enableAnalytics: true,
        enableDebugPanel: false
      },
      'unknown': {
        enableSearch: true,
        enableWeather: false,
        enableOfflineMode: false,
        enableAnalytics: false,
        enableDebugPanel: true
      }
    };

    return flags[this.environment] || flags['unknown'];
  }

  /**
   * Get all configuration for the current environment
   */
  getAllConfig() {
    return {
      environment: this.environment,
      basePath: this.getBasePath(),
      logLevel: this.getLogLevel(),
      debugTools: this.isDebugToolsEnabled(),
      serviceWorker: this.isServiceWorkerEnabled(),
      manifest: this.getManifestPath(),
      serviceWorkerPath: this.getServiceWorkerPath(),
      favicon: this.getFaviconPath(),
      api: this.getApiEndpoints(),
      cdn: this.getCdnUrls(),
      data: this.getDataPaths(),
      performance: this.getPerformanceSettings(),
      features: this.getFeatureFlags()
    };
  }

  /**
   * Check if a feature is enabled
   */
  isFeatureEnabled(featureName) {
    const features = this.getFeatureFlags();
    return features[featureName] === true;
  }

  /**
   * Get a performance setting
   */
  getPerformanceSetting(settingName) {
    const settings = this.getPerformanceSettings();
    return settings[settingName];
  }

  /**
   * Get an API endpoint
   */
  getApiEndpoint(endpointName) {
    const endpoints = this.getApiEndpoints();
    return endpoints[endpointName];
  }

  /**
   * Get a data file path
   */
  getDataPath(dataType) {
    const paths = this.getDataPaths();
    return paths[dataType];
  }
}

// Create singleton instance
// Legacy compatibility functions - use DI container instead
export const environmentConfig = {
  getEnvironment: () => {
    console.warn('environmentConfig.getEnvironment: Legacy function called. Use DI container to get EnvironmentConfig instance.');
    throw new Error('Legacy function not available. Use DI container to get EnvironmentConfig instance.');
  },
  getConfig: () => {
    console.warn('environmentConfig.getConfig: Legacy function called. Use DI container to get EnvironmentConfig instance.');
    throw new Error('Legacy function not available. Use DI container to get EnvironmentConfig instance.');
  },
  getBasePath: () => {
    console.warn('environmentConfig.getBasePath: Legacy function called. Use DI container to get EnvironmentConfig instance.');
    throw new Error('Legacy function not available. Use DI container to get EnvironmentConfig instance.');
  },
  getManifestPath: () => {
    console.warn('environmentConfig.getManifestPath: Legacy function called. Use DI container to get EnvironmentConfig instance.');
    throw new Error('Legacy function not available. Use DI container to get EnvironmentConfig instance.');
  },
  getServiceWorkerPath: () => {
    console.warn('environmentConfig.getServiceWorkerPath: Legacy function called. Use DI container to get EnvironmentConfig instance.');
    throw new Error('Legacy function not available. Use DI container to get EnvironmentConfig instance.');
  },
  getFaviconPath: () => {
    console.warn('environmentConfig.getFaviconPath: Legacy function called. Use DI container to get EnvironmentConfig instance.');
    throw new Error('Legacy function not available. Use DI container to get EnvironmentConfig instance.');
  },
  getAssetPath: () => {
    console.warn('environmentConfig.getAssetPath: Legacy function called. Use DI container to get EnvironmentConfig instance.');
    throw new Error('Legacy function not available. Use DI container to get EnvironmentConfig instance.');
  }
};
