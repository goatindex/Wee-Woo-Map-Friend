/**
 * @module modules/EnvironmentService
 * Environment service for platform detection and capability management
 * Provides platform-specific features, optimizations, and debugging tools
 * 
 * @fileoverview Environment service for the WeeWoo Map Friend application
 * @version 1.0.0
 * @author WeeWoo Map Friend Team
 */

import { injectable, inject } from 'inversify';
import { BaseService } from './BaseService.js';
import { TYPES } from './Types.js';
// Temporarily use a mock logger to avoid DI issues during migration
const logger = {
  createChild: () => ({
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
    createChild: () => ({
      info: () => {},
      warn: () => {},
      error: () => {},
      debug: () => {}
    })
  })
};

/**
 * Environment service implementation
 */
@injectable()
export class EnvironmentService extends BaseService {
  private platform: string = 'unknown';
  private capabilities: any = {};

  constructor(
    @inject(TYPES.StructuredLogger) structuredLogger
  ) {
    super(structuredLogger);
  }

  async initialize() {
    await super.initialize();
    this.detectPlatform();
    this.detectCapabilities();
  }

  getPlatform(): string {
    return this.platform;
  }

  getCapabilities(): any {
    return this.capabilities;
  }

  isMobile(): boolean {
    return this.platform === 'mobile';
  }

  isDesktop(): boolean {
    return this.platform === 'desktop';
  }

  isWeb(): boolean {
    return this.platform === 'web';
  }

  private detectPlatform(): void {
    if (typeof window === 'undefined') {
      this.platform = 'node';
      return;
    }

    const userAgent = window.navigator.userAgent.toLowerCase();
    
    if (/mobile|android|iphone|ipad|phone|tablet/.test(userAgent)) {
      this.platform = 'mobile';
    } else if (/electron/.test(userAgent)) {
      this.platform = 'desktop';
    } else {
      this.platform = 'web';
    }

    this.logger.info('Platform detected', { platform: this.platform });
  }

  private detectCapabilities(): void {
    if (typeof window === 'undefined') {
      this.capabilities = {};
      return;
    }

    this.capabilities = {
      geolocation: 'geolocation' in navigator,
      serviceWorker: 'serviceWorker' in navigator,
      webGL: this.detectWebGL(),
      touch: 'ontouchstart' in window,
      localStorage: this.detectLocalStorage(),
      indexedDB: 'indexedDB' in window,
      webWorkers: typeof Worker !== 'undefined',
      es6Modules: this.detectES6Modules(),
      fetch: 'fetch' in window,
      promises: typeof Promise !== 'undefined'
    };

    this.logger.info('Capabilities detected', { capabilities: this.capabilities });
  }

  private detectWebGL(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch (e) {
      return false;
    }
  }

  private detectLocalStorage(): boolean {
    try {
      const test = 'test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  private detectES6Modules(): boolean {
    try {
      // Check if dynamic import is supported
      return typeof window !== 'undefined' && 'import' in window;
    } catch (e) {
      return false;
    }
  }
}
