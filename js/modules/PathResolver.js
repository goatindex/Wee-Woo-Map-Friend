/**
 * @module modules/PathResolver
 * Dynamic path resolution system for different deployment environments
 * Handles GitHub Pages, local development, and future hosting platforms
 */

import { logger } from './StructuredLogger.js';

/**
 * @class PathResolver
 * Centralized path resolution for different deployment environments
 */
export class PathResolver {
  constructor() {
    this.logger = logger.createChild({ module: 'PathResolver' });
    this.environment = this.detectEnvironment();
    this.basePath = this.calculateBasePath();
    
    this.logger.info('Path resolver initialized', {
      environment: this.environment,
      basePath: this.basePath,
      hostname: window.location.hostname,
      pathname: window.location.pathname
    });
  }

  /**
   * Detect the current deployment environment
   */
  detectEnvironment() {
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;

    // GitHub Pages environments
    if (hostname === 'goatindex.github.io') {
      if (pathname.includes('Wee-Woo-Map-Friend')) {
        return 'github-pages-new';
      } else if (pathname.includes('mapexp.github.io')) {
        return 'github-pages-old';
      } else {
        return 'github-pages-root';
      }
    }

    // Local development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'local';
    }

    // Custom domain (future)
    if (hostname.includes('weewoomapfriend.com') || hostname.includes('weewoo-map-friend.com')) {
      return 'custom-domain';
    }

    // Netlify/Vercel (future)
    if (hostname.includes('netlify.app') || hostname.includes('vercel.app')) {
      return 'netlify-vercel';
    }

    // Default fallback
    return 'unknown';
  }

  /**
   * Calculate the base path for the current environment
   */
  calculateBasePath() {
    switch (this.environment) {
      case 'github-pages-new':
        return '/Wee-Woo-Map-Friend/';
      
      case 'github-pages-old':
        return '/mapexp.github.io/';
      
      case 'github-pages-root':
        return '/';
      
      case 'local':
        return '/';
      
      case 'custom-domain':
        return '/';
      
      case 'netlify-vercel':
        return '/';
      
      default:
        this.logger.warn('Unknown environment, using root path', {
          environment: this.environment,
          hostname: window.location.hostname,
          pathname: window.location.pathname
        });
        return '/';
    }
  }

  /**
   * Resolve a path relative to the current environment
   */
  resolvePath(relativePath) {
    // Ensure relative path starts with /
    const normalizedPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
    
    // For root environments, return the path as-is
    if (this.basePath === '/') {
      return normalizedPath;
    }
    
    // For subdirectory environments, prepend the base path
    const resolvedPath = `${this.basePath}${normalizedPath.substring(1)}`;
    
    this.logger.debug('Path resolved', {
      relativePath,
      resolvedPath,
      environment: this.environment,
      basePath: this.basePath
    });
    
    return resolvedPath;
  }

  /**
   * Get the base path for the current environment
   */
  getBasePath() {
    return this.basePath;
  }

  /**
   * Get the current environment
   */
  getEnvironment() {
    return this.environment;
  }

  /**
   * Check if we're in a GitHub Pages environment
   */
  isGitHubPages() {
    return this.environment.startsWith('github-pages');
  }

  /**
   * Check if we're in local development
   */
  isLocal() {
    return this.environment === 'local';
  }

  /**
   * Get environment-specific configuration
   */
  getEnvironmentConfig() {
    const configs = {
      'github-pages-new': {
        name: 'GitHub Pages (New)',
        basePath: '/Wee-Woo-Map-Friend/',
        logLevel: 'WARN',
        enableDebugTools: false,
        enableServiceWorker: true
      },
      'github-pages-old': {
        name: 'GitHub Pages (Old)',
        basePath: '/mapexp.github.io/',
        logLevel: 'WARN',
        enableDebugTools: false,
        enableServiceWorker: true
      },
      'github-pages-root': {
        name: 'GitHub Pages (Root)',
        basePath: '/',
        logLevel: 'WARN',
        enableDebugTools: false,
        enableServiceWorker: true
      },
      'local': {
        name: 'Local Development',
        basePath: '/',
        logLevel: 'DEBUG',
        enableDebugTools: true,
        enableServiceWorker: false
      },
      'custom-domain': {
        name: 'Custom Domain',
        basePath: '/',
        logLevel: 'WARN',
        enableDebugTools: false,
        enableServiceWorker: true
      },
      'netlify-vercel': {
        name: 'Netlify/Vercel',
        basePath: '/',
        logLevel: 'WARN',
        enableDebugTools: false,
        enableServiceWorker: true
      },
      'unknown': {
        name: 'Unknown Environment',
        basePath: '/',
        logLevel: 'DEBUG',
        enableDebugTools: true,
        enableServiceWorker: false
      }
    };

    return configs[this.environment] || configs['unknown'];
  }

  /**
   * Get the manifest path for the current environment
   */
  getManifestPath() {
    return this.resolvePath('manifest.json');
  }

  /**
   * Get the service worker path for the current environment
   */
  getServiceWorkerPath() {
    return this.resolvePath('sw.js');
  }

  /**
   * Get the favicon path for the current environment
   */
  getFaviconPath() {
    return this.resolvePath('favicon.ico');
  }

  /**
   * Get asset paths for the current environment
   */
  getAssetPath(assetPath) {
    return this.resolvePath(assetPath);
  }
}

// Create singleton instance
export const pathResolver = new PathResolver();
