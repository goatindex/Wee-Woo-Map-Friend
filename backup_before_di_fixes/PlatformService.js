/**
 * @module modules/PlatformService
 * Platform detection and capability management service
 * Provides platform-specific features, optimizations, and debugging tools
 * 
 * @fileoverview Platform service for the WeeWoo Map Friend application
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
import { pathResolver } from './PathResolver.js';

/**
 * Platform types enumeration
 */
export const PLATFORM_TYPES = {
  WEB: 'web',
  MOBILE: 'mobile',
  DESKTOP: 'desktop',
  TABLET: 'tablet',
  UNKNOWN: 'unknown'
};

/**
 * Device types enumeration
 */
export const DEVICE_TYPES = {
  PHONE: 'phone',
  TABLET: 'tablet',
  DESKTOP: 'desktop',
  LAPTOP: 'laptop',
  TV: 'tv',
  UNKNOWN: 'unknown'
};

/**
 * Browser types enumeration
 */
export const BROWSER_TYPES = {
  CHROME: 'chrome',
  FIREFOX: 'firefox',
  SAFARI: 'safari',
  EDGE: 'edge',
  OPERA: 'opera',
  IE: 'ie',
  UNKNOWN: 'unknown'
};

/**
 * Operating system types enumeration
 */
export const OS_TYPES = {
  WINDOWS: 'windows',
  MACOS: 'macos',
  LINUX: 'linux',
  ANDROID: 'android',
  IOS: 'ios',
  UNKNOWN: 'unknown'
};

/**
 * Platform capabilities interface
 */
export interface IPlatformCapabilities {
  // Core capabilities
  geolocation: boolean;
  serviceWorker: boolean;
  webGL: boolean;
  webGL2: boolean;
  touch: boolean;
  mouse: boolean;
  keyboard: boolean;
  
  // Storage capabilities
  localStorage: boolean;
  sessionStorage: boolean;
  indexedDB: boolean;
  webSQL: boolean;
  
  // Network capabilities
  fetch: boolean;
  websocket: boolean;
  webrtc: boolean;
  
  // Media capabilities
  camera: boolean;
  microphone: boolean;
  audio: boolean;
  video: boolean;
  
  // Performance capabilities
  webWorkers: boolean;
  sharedArrayBuffer: boolean;
  wasm: boolean;
  
  // Modern JavaScript capabilities
  es6Modules: boolean;
  promises: boolean;
  asyncAwait: boolean;
  arrowFunctions: boolean;
  destructuring: boolean;
  templateLiterals: boolean;
  
  // CSS capabilities
  cssGrid: boolean;
  cssFlexbox: boolean;
  cssVariables: boolean;
  cssAnimations: boolean;
  
  // Device capabilities
  orientation: boolean;
  vibration: boolean;
  accelerometer: boolean;
  gyroscope: boolean;
  magnetometer: boolean;
  
  // Screen capabilities
  multiScreen: boolean;
  highDPI: boolean;
  colorGamut: string;
  
  // Input capabilities
  touchEvents: boolean;
  pointerEvents: boolean;
  gamepad: boolean;
  
  // Security capabilities
  https: boolean;
  secureContext: boolean;
  cors: boolean;
  
  // PWA capabilities
  manifest: boolean;
  installPrompt: boolean;
  backgroundSync: boolean;
  pushNotifications: boolean;
}

/**
 * Platform information interface
 */
export interface IPlatformInfo {
  platform: string;
  device: string;
  browser: string;
  os: string;
  version: string;
  userAgent: string;
  language: string;
  timezone: string;
  screen: {
    width: number;
    height: number;
    pixelRatio: number;
    colorDepth: number;
    orientation: string;
  };
  viewport: {
    width: number;
    height: number;
    devicePixelRatio: number;
  };
  connection: {
    effectiveType: string;
    downlink: number;
    rtt: number;
    saveData: boolean;
  } | null;
  memory: {
    deviceMemory: number;
    jsHeapSizeLimit: number;
    totalJSHeapSize: number;
    usedJSHeapSize: number;
  } | null;
  hardware: {
    cores: number;
    maxTouchPoints: number;
  };
}

/**
 * Platform optimization settings interface
 */
export interface IPlatformOptimizations {
  // Performance optimizations
  enableWebGL: boolean;
  enableWebWorkers: boolean;
  enableServiceWorker: boolean;
  enableCaching: boolean;
  enableCompression: boolean;
  
  // UI optimizations
  enableTouchOptimizations: boolean;
  enableKeyboardOptimizations: boolean;
  enableMouseOptimizations: boolean;
  enableHighDPI: boolean;
  
  // Network optimizations
  enableOfflineMode: boolean;
  enableBackgroundSync: boolean;
  enablePushNotifications: boolean;
  
  // Memory optimizations
  enableMemoryOptimizations: boolean;
  enableGarbageCollection: boolean;
  enableResourceCleanup: boolean;
  
  // Feature optimizations
  enableAdvancedFeatures: boolean;
  enableExperimentalFeatures: boolean;
  enableDebugFeatures: boolean;
}

/**
 * Platform service implementation
 */
@injectable()
export class PlatformService extends BaseService {
  private platformInfo: IPlatformInfo | null = null;
  private capabilities: IPlatformCapabilities | null = null;
  private optimizations: IPlatformOptimizations | null = null;
  private initialized: boolean = false;

  constructor(
    @inject(TYPES.StructuredLogger) structuredLogger,
    @inject(TYPES.EventBus) private eventBus,
    @inject(TYPES.ConfigService) private configService,
    @inject(TYPES.EnvironmentService) private environmentService
  ) {
    super(structuredLogger);
  }

  /**
   * Initialize the platform service
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.logger.info('Initializing platform service');

    try {
      // Detect platform information
      this.platformInfo = await this.detectPlatformInfo();
      
      // Detect platform capabilities
      this.capabilities = await this.detectCapabilities();
      
      // Generate platform optimizations
      this.optimizations = this.generateOptimizations();
      
      // Store platform info in config service
      this.configService.set('platform.info', this.platformInfo);
      this.configService.set('platform.capabilities', this.capabilities);
      this.configService.set('platform.optimizations', this.optimizations);
      
      // Emit platform ready event
      this.eventBus.emit('platform:ready', {
        platform: this.platformInfo,
        capabilities: this.capabilities,
        optimizations: this.optimizations
      });
      
      this.initialized = true;
      
      this.logger.info('Platform service initialized successfully', {
        platform: this.platformInfo.platform,
        device: this.platformInfo.device,
        browser: this.platformInfo.browser,
        os: this.platformInfo.os,
        capabilities: Object.keys(this.capabilities).filter(key => this.capabilities[key]),
        optimizations: Object.keys(this.optimizations).filter(key => this.optimizations[key])
      });
      
    } catch (error) {
      this.logger.error('Failed to initialize platform service', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Get platform information
   */
  getPlatformInfo(): IPlatformInfo | null {
    return this.platformInfo;
  }

  /**
   * Get platform capabilities
   */
  getCapabilities(): IPlatformCapabilities | null {
    return this.capabilities;
  }

  /**
   * Get platform optimizations
   */
  getOptimizations(): IPlatformOptimizations | null {
    return this.optimizations;
  }

  /**
   * Check if a capability is supported
   */
  hasCapability(capability: keyof IPlatformCapabilities): boolean {
    return this.capabilities ? this.capabilities[capability] : false;
  }

  /**
   * Check if an optimization is enabled
   */
  isOptimizationEnabled(optimization: keyof IPlatformOptimizations): boolean {
    return this.optimizations ? this.optimizations[optimization] : false;
  }

  /**
   * Get platform type
   */
  getPlatform(): string {
    return this.platformInfo?.platform || PLATFORM_TYPES.UNKNOWN;
  }

  /**
   * Get device type
   */
  getDevice(): string {
    return this.platformInfo?.device || DEVICE_TYPES.UNKNOWN;
  }

  /**
   * Get browser type
   */
  getBrowser(): string {
    return this.platformInfo?.browser || BROWSER_TYPES.UNKNOWN;
  }

  /**
   * Get operating system
   */
  getOS(): string {
    return this.platformInfo?.os || OS_TYPES.UNKNOWN;
  }

  /**
   * Check if platform is mobile
   */
  isMobile(): boolean {
    return this.getPlatform() === PLATFORM_TYPES.MOBILE || 
           this.getDevice() === DEVICE_TYPES.PHONE;
  }

  /**
   * Check if platform is tablet
   */
  isTablet(): boolean {
    return this.getPlatform() === PLATFORM_TYPES.TABLET || 
           this.getDevice() === DEVICE_TYPES.TABLET;
  }

  /**
   * Check if platform is desktop
   */
  isDesktop(): boolean {
    return this.getPlatform() === PLATFORM_TYPES.DESKTOP || 
           this.getDevice() === DEVICE_TYPES.DESKTOP ||
           this.getDevice() === DEVICE_TYPES.LAPTOP;
  }

  /**
   * Check if platform is web
   */
  isWeb(): boolean {
    return this.getPlatform() === PLATFORM_TYPES.WEB;
  }

  /**
   * Check if platform supports touch
   */
  isTouch(): boolean {
    return this.hasCapability('touch') || this.hasCapability('touchEvents');
  }

  /**
   * Check if platform supports mouse
   */
  isMouse(): boolean {
    return this.hasCapability('mouse');
  }

  /**
   * Check if platform supports keyboard
   */
  isKeyboard(): boolean {
    return this.hasCapability('keyboard');
  }

  /**
   * Get screen information
   */
  getScreenInfo(): any {
    return this.platformInfo?.screen || null;
  }

  /**
   * Get viewport information
   */
  getViewportInfo(): any {
    return this.platformInfo?.viewport || null;
  }

  /**
   * Get connection information
   */
  getConnectionInfo(): any {
    return this.platformInfo?.connection || null;
  }

  /**
   * Get memory information
   */
  getMemoryInfo(): any {
    return this.platformInfo?.memory || null;
  }

  /**
   * Get hardware information
   */
  getHardwareInfo(): any {
    return this.platformInfo?.hardware || null;
  }

  /**
   * Detect platform information
   */
  private async detectPlatformInfo(): Promise<IPlatformInfo> {
    const userAgent = navigator.userAgent;
    const language = navigator.language || 'en';
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Detect platform
    const platform = this.detectPlatform(userAgent);
    
    // Detect device
    const device = this.detectDevice(userAgent);
    
    // Detect browser
    const browser = this.detectBrowser(userAgent);
    
    // Detect OS
    const os = this.detectOS(userAgent);
    
    // Detect version
    const version = this.detectVersion(userAgent, browser);
    
    // Get screen information
    const screen = this.getScreenInfo();
    
    // Get viewport information
    const viewport = this.getViewportInfo();
    
    // Get connection information
    const connection = this.getConnectionInfo();
    
    // Get memory information
    const memory = this.getMemoryInfo();
    
    // Get hardware information
    const hardware = this.getHardwareInfo();
    
    return {
      platform,
      device,
      browser,
      os,
      version,
      userAgent,
      language,
      timezone,
      screen,
      viewport,
      connection,
      memory,
      hardware
    };
  }

  /**
   * Detect platform type
   */
  private detectPlatform(userAgent: string): string {
    const ua = userAgent.toLowerCase();
    
    if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/.test(ua)) {
      return PLATFORM_TYPES.MOBILE;
    }
    
    if (/tablet|ipad|playbook|silk/.test(ua)) {
      return PLATFORM_TYPES.TABLET;
    }
    
    if (/electron|nwjs|node-webkit/.test(ua)) {
      return PLATFORM_TYPES.DESKTOP;
    }
    
    return PLATFORM_TYPES.WEB;
  }

  /**
   * Detect device type
   */
  private detectDevice(userAgent: string): string {
    const ua = userAgent.toLowerCase();
    
    if (/phone|mobile|android|iphone|ipod|blackberry|iemobile|opera mini/.test(ua)) {
      return DEVICE_TYPES.PHONE;
    }
    
    if (/tablet|ipad|playbook|silk/.test(ua)) {
      return DEVICE_TYPES.TABLET;
    }
    
    if (/tv|smart-tv|googletv|appletv|roku/.test(ua)) {
      return DEVICE_TYPES.TV;
    }
    
    if (/laptop|notebook|macbook/.test(ua)) {
      return DEVICE_TYPES.LAPTOP;
    }
    
    return DEVICE_TYPES.DESKTOP;
  }

  /**
   * Detect browser type
   */
  private detectBrowser(userAgent: string): string {
    const ua = userAgent.toLowerCase();
    
    if (/chrome/.test(ua) && !/edge|edg/.test(ua)) {
      return BROWSER_TYPES.CHROME;
    }
    
    if (/firefox/.test(ua)) {
      return BROWSER_TYPES.FIREFOX;
    }
    
    if (/safari/.test(ua) && !/chrome/.test(ua)) {
      return BROWSER_TYPES.SAFARI;
    }
    
    if (/edge|edg/.test(ua)) {
      return BROWSER_TYPES.EDGE;
    }
    
    if (/opera|opr/.test(ua)) {
      return BROWSER_TYPES.OPERA;
    }
    
    if (/msie|trident/.test(ua)) {
      return BROWSER_TYPES.IE;
    }
    
    return BROWSER_TYPES.UNKNOWN;
  }

  /**
   * Detect operating system
   */
  private detectOS(userAgent: string): string {
    const ua = userAgent.toLowerCase();
    
    if (/windows/.test(ua)) {
      return OS_TYPES.WINDOWS;
    }
    
    if (/macintosh|mac os x/.test(ua)) {
      return OS_TYPES.MACOS;
    }
    
    if (/linux/.test(ua)) {
      return OS_TYPES.LINUX;
    }
    
    if (/android/.test(ua)) {
      return OS_TYPES.ANDROID;
    }
    
    if (/iphone|ipad|ipod/.test(ua)) {
      return OS_TYPES.IOS;
    }
    
    return OS_TYPES.UNKNOWN;
  }

  /**
   * Detect version
   */
  private detectVersion(userAgent: string, browser: string): string {
    const ua = userAgent.toLowerCase();
    
    switch (browser) {
      case BROWSER_TYPES.CHROME:
        const chromeMatch = ua.match(/chrome\/(\d+\.\d+)/);
        return chromeMatch ? chromeMatch[1] : 'unknown';
        
      case BROWSER_TYPES.FIREFOX:
        const firefoxMatch = ua.match(/firefox\/(\d+\.\d+)/);
        return firefoxMatch ? firefoxMatch[1] : 'unknown';
        
      case BROWSER_TYPES.SAFARI:
        const safariMatch = ua.match(/version\/(\d+\.\d+)/);
        return safariMatch ? safariMatch[1] : 'unknown';
        
      case BROWSER_TYPES.EDGE:
        const edgeMatch = ua.match(/edge\/(\d+\.\d+)/);
        return edgeMatch ? edgeMatch[1] : 'unknown';
        
      case BROWSER_TYPES.OPERA:
        const operaMatch = ua.match(/opr\/(\d+\.\d+)/);
        return operaMatch ? operaMatch[1] : 'unknown';
        
      case BROWSER_TYPES.IE:
        const ieMatch = ua.match(/msie (\d+\.\d+)/);
        return ieMatch ? ieMatch[1] : 'unknown';
        
      default:
        return 'unknown';
    }
  }

  /**
   * Get screen information
   */
  private getScreenInfo(): any {
    return {
      width: screen.width,
      height: screen.height,
      pixelRatio: window.devicePixelRatio || 1,
      colorDepth: screen.colorDepth,
      orientation: screen.orientation ? screen.orientation.type : 'unknown'
    };
  }

  /**
   * Get viewport information
   */
  private getViewportInfo(): any {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio || 1
    };
  }

  /**
   * Get connection information
   */
  private getConnectionInfo(): any {
    if ('connection' in navigator) {
      const conn = (navigator as any).connection;
      return {
        effectiveType: conn.effectiveType || 'unknown',
        downlink: conn.downlink || 0,
        rtt: conn.rtt || 0,
        saveData: conn.saveData || false
      };
    }
    return null;
  }

  /**
   * Get memory information
   */
  private getMemoryInfo(): any {
    if ('memory' in performance) {
      const mem = (performance as any).memory;
      return {
        deviceMemory: (navigator as any).deviceMemory || 0,
        jsHeapSizeLimit: mem.jsHeapSizeLimit || 0,
        totalJSHeapSize: mem.totalJSHeapSize || 0,
        usedJSHeapSize: mem.usedJSHeapSize || 0
      };
    }
    return null;
  }

  /**
   * Get hardware information
   */
  private getHardwareInfo(): any {
    return {
      cores: navigator.hardwareConcurrency || 0,
      maxTouchPoints: navigator.maxTouchPoints || 0
    };
  }

  /**
   * Detect platform capabilities
   */
  private async detectCapabilities(): Promise<IPlatformCapabilities> {
    return {
      // Core capabilities
      geolocation: 'geolocation' in navigator,
      serviceWorker: 'serviceWorker' in navigator,
      webGL: this.detectWebGL(),
      webGL2: this.detectWebGL2(),
      touch: 'ontouchstart' in window,
      mouse: 'onmousedown' in window,
      keyboard: 'onkeydown' in window,
      
      // Storage capabilities
      localStorage: this.detectLocalStorage(),
      sessionStorage: this.detectSessionStorage(),
      indexedDB: 'indexedDB' in window,
      webSQL: 'openDatabase' in window,
      
      // Network capabilities
      fetch: 'fetch' in window,
      websocket: 'WebSocket' in window,
      webrtc: 'RTCPeerConnection' in window,
      
      // Media capabilities
      camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
      microphone: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
      audio: 'AudioContext' in window || 'webkitAudioContext' in window,
      video: 'HTMLVideoElement' in window,
      
      // Performance capabilities
      webWorkers: typeof Worker !== 'undefined',
      sharedArrayBuffer: 'SharedArrayBuffer' in window,
      wasm: 'WebAssembly' in window,
      
      // Modern JavaScript capabilities
      es6Modules: typeof window !== 'undefined' && 'import' in window,
      promises: typeof Promise !== 'undefined',
      asyncAwait: this.detectAsyncAwait(),
      arrowFunctions: this.detectArrowFunctions(),
      destructuring: this.detectDestructuring(),
      templateLiterals: this.detectTemplateLiterals(),
      
      // CSS capabilities
      cssGrid: this.detectCSSGrid(),
      cssFlexbox: this.detectCSSFlexbox(),
      cssVariables: this.detectCSSVariables(),
      cssAnimations: this.detectCSSAnimations(),
      
      // Device capabilities
      orientation: 'orientation' in screen,
      vibration: 'vibrate' in navigator,
      accelerometer: 'Accelerometer' in window,
      gyroscope: 'Gyroscope' in window,
      magnetometer: 'Magnetometer' in window,
      
      // Screen capabilities
      multiScreen: 'getScreenDetails' in window,
      highDPI: window.devicePixelRatio > 1,
      colorGamut: this.detectColorGamut(),
      
      // Input capabilities
      touchEvents: 'ontouchstart' in window,
      pointerEvents: 'onpointerdown' in window,
      gamepad: 'getGamepads' in navigator,
      
      // Security capabilities
      https: location.protocol === 'https:',
      secureContext: window.isSecureContext,
      cors: 'XMLHttpRequest' in window,
      
      // PWA capabilities
      manifest: 'manifest' in document.createElement('link'),
      installPrompt: 'onbeforeinstallprompt' in window,
      backgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
      pushNotifications: 'serviceWorker' in navigator && 'PushManager' in window
    };
  }

  /**
   * Detect WebGL support
   */
  private detectWebGL(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch (e) {
      return false;
    }
  }

  /**
   * Detect WebGL2 support
   */
  private detectWebGL2(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!canvas.getContext('webgl2');
    } catch (e) {
      return false;
    }
  }

  /**
   * Detect localStorage support
   */
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

  /**
   * Detect sessionStorage support
   */
  private detectSessionStorage(): boolean {
    try {
      const test = 'test';
      sessionStorage.setItem(test, test);
      sessionStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Detect async/await support
   */
  private detectAsyncAwait(): boolean {
    try {
      eval('async () => {}');
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Detect arrow functions support
   */
  private detectArrowFunctions(): boolean {
    try {
      eval('() => {}');
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Detect destructuring support
   */
  private detectDestructuring(): boolean {
    try {
      eval('const {a} = {}');
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Detect template literals support
   */
  private detectTemplateLiterals(): boolean {
    try {
      eval('`test`');
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Detect CSS Grid support
   */
  private detectCSSGrid(): boolean {
    return CSS.supports('display', 'grid');
  }

  /**
   * Detect CSS Flexbox support
   */
  private detectCSSFlexbox(): boolean {
    return CSS.supports('display', 'flex');
  }

  /**
   * Detect CSS Variables support
   */
  private detectCSSVariables(): boolean {
    return CSS.supports('color', 'var(--test)');
  }

  /**
   * Detect CSS Animations support
   */
  private detectCSSAnimations(): boolean {
    return CSS.supports('animation', 'test 1s');
  }

  /**
   * Detect color gamut support
   */
  private detectColorGamut(): string {
    if ('colorGamut' in screen) {
      return (screen as any).colorGamut || 'unknown';
    }
    return 'unknown';
  }

  /**
   * Generate platform optimizations
   */
  private generateOptimizations(): IPlatformOptimizations {
    const capabilities = this.capabilities!;
    const platform = this.getPlatform();
    const device = this.getDevice();
    const connection = this.getConnectionInfo();
    const memory = this.getMemoryInfo();
    
    // Performance optimizations
    const enableWebGL = capabilities.webGL && !this.isMobile();
    const enableWebWorkers = capabilities.webWorkers && !this.isMobile();
    const enableServiceWorker = capabilities.serviceWorker && this.configService.get('enableServiceWorker', true);
    const enableCaching = capabilities.localStorage && !this.isMobile();
    const enableCompression = connection && connection.effectiveType !== 'slow-2g';
    
    // UI optimizations
    const enableTouchOptimizations = this.isMobile() || this.isTablet();
    const enableKeyboardOptimizations = this.isDesktop();
    const enableMouseOptimizations = this.isDesktop();
    const enableHighDPI = capabilities.highDPI;
    
    // Network optimizations
    const enableOfflineMode = capabilities.serviceWorker && capabilities.localStorage;
    const enableBackgroundSync = capabilities.backgroundSync;
    const enablePushNotifications = capabilities.pushNotifications;
    
    // Memory optimizations
    const enableMemoryOptimizations = memory && memory.deviceMemory < 4;
    const enableGarbageCollection = memory && memory.deviceMemory < 2;
    const enableResourceCleanup = memory && memory.deviceMemory < 4;
    
    // Feature optimizations
    const enableAdvancedFeatures = !this.isMobile() && capabilities.webGL;
    const enableExperimentalFeatures = this.configService.get('enableDebugTools', false);
    const enableDebugFeatures = this.configService.get('enableDebugTools', false);
    
    return {
      enableWebGL,
      enableWebWorkers,
      enableServiceWorker,
      enableCaching,
      enableCompression,
      enableTouchOptimizations,
      enableKeyboardOptimizations,
      enableMouseOptimizations,
      enableHighDPI,
      enableOfflineMode,
      enableBackgroundSync,
      enablePushNotifications,
      enableMemoryOptimizations,
      enableGarbageCollection,
      enableResourceCleanup,
      enableAdvancedFeatures,
      enableExperimentalFeatures,
      enableDebugFeatures
    };
  }

  /**
   * Get platform debugging information
   */
  getDebugInfo(): any {
    return {
      platform: this.platformInfo,
      capabilities: this.capabilities,
      optimizations: this.optimizations,
      environment: pathResolver.getEnvironment(),
      config: this.configService.getAll(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Cleanup the platform service
   */
  async cleanup(): Promise<void> {
    this.logger.info('Cleaning up platform service');
    
    this.platformInfo = null;
    this.capabilities = null;
    this.optimizations = null;
    this.initialized = false;
    
    await super.cleanup();
  }
}

// Export singleton instance
// Legacy function for backward compatibility
export const platformService = () => {
  console.warn('platformService: Legacy function called. Use DI container to get PlatformService instance.');
  throw new Error('Legacy function not available. Use DI container to get PlatformService instance.');
};
