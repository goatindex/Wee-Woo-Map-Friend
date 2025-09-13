/**
 * @module modules/MobileUIOptimizer
 * Mobile UI optimization service for WeeWoo Map Friend
 * Provides mobile-specific UI enhancements and optimizations
 * 
 * @fileoverview Mobile UI optimizer for enhanced mobile user experience
 * @version 1.0.0
 * @author WeeWoo Map Friend Team
 */

import { injectable, inject } from 'inversify';
import { BaseService } from './BaseService.js';
import { TYPES } from './Types.js';

/**
 * Mobile UI optimization constants
 */
export const MOBILE_UI_CONSTANTS = {
  // Touch targets
  MIN_TOUCH_TARGET: 44, // Minimum touch target size in pixels
  TOUCH_MARGIN: 8, // Additional margin for touch targets
  
  // Viewport breakpoints
  MOBILE_BREAKPOINT: 768,
  TABLET_BREAKPOINT: 1024,
  
  // Animation durations
  FAST_ANIMATION: 150,
  NORMAL_ANIMATION: 300,
  SLOW_ANIMATION: 500,
  
  // Scroll behavior
  SCROLL_THRESHOLD: 5, // Minimum scroll distance to trigger
  SCROLL_DEBOUNCE: 16, // Scroll event debounce in ms
  
  // Performance thresholds
  MAX_ANIMATION_DURATION: 300, // Maximum animation duration for mobile
  REDUCED_MOTION_THRESHOLD: 1000, // Threshold for reduced motion detection
};

/**
 * Mobile UI optimization types
 */
export const OPTIMIZATION_TYPES = {
  TOUCH_TARGETS: 'touch_targets',
  ANIMATIONS: 'animations',
  SCROLLING: 'scrolling',
  VIEWPORT: 'viewport',
  PERFORMANCE: 'performance',
  ACCESSIBILITY: 'accessibility'
};

/**
 * Mobile UI Optimizer
 * Provides mobile-specific UI enhancements and optimizations
 */
@injectable()
export class MobileUIOptimizer extends BaseService {
  constructor(
    @inject(TYPES.StructuredLogger) structuredLogger,
    @inject(TYPES.PlatformService) platformService,
    @inject(TYPES.EventBus) eventBus,
    @inject(TYPES.ConfigService) configService
  ) {
    super(structuredLogger);
    this.platformService = platformService;
    this.eventBus = eventBus;
    this.configService = configService;
    
    // Optimization state
    this.isMobile = false;
    this.isTablet = false;
    this.isNativeApp = false;
    this.optimizations = new Set();
    this.performanceObserver = null;
    this.scrollHandler = null;
    this.resizeHandler = null;
    
    this.logger.info('MobileUIOptimizer initialized');
  }

  /**
   * Initialize mobile UI optimizer
   */
  async initialize(): Promise<void> {
    this.logger.info('Initializing mobile UI optimizer');
    
    try {
      // Detect mobile platform
      await this.detectMobilePlatform();
      
      if (this.isMobile || this.isTablet) {
        // Apply mobile optimizations
        await this.applyMobileOptimizations();
        
        // Set up performance monitoring
        this.setupPerformanceMonitoring();
        
        // Set up responsive behavior
        this.setupResponsiveBehavior();
        
        // Set up accessibility enhancements
        this.setupAccessibilityEnhancements();
        
        this.logger.info('Mobile UI optimizer initialized successfully', {
          isMobile: this.isMobile,
          isTablet: this.isTablet,
          isNativeApp: this.isNativeApp,
          optimizations: Array.from(this.optimizations)
        });
      } else {
        this.logger.info('Not a mobile platform, skipping mobile optimizations');
      }
      
    } catch (error) {
      this.logger.error('Failed to initialize mobile UI optimizer', { error });
      throw error;
    }
  }

  /**
   * Detect mobile platform
   */
  private async detectMobilePlatform(): Promise<void> {
    const platformInfo = this.platformService.getPlatformInfo();
    this.isMobile = platformInfo.isMobile;
    this.isTablet = platformInfo.isTablet;
    this.isNativeApp = platformInfo.isNativeApp;
    
    this.logger.debug('Mobile platform detection', {
      platform: platformInfo.platform,
      isMobile: this.isMobile,
      isTablet: this.isTablet,
      isNativeApp: this.isNativeApp
    });
  }

  /**
   * Apply mobile optimizations
   */
  private async applyMobileOptimizations(): Promise<void> {
    // Apply touch target optimizations
    this.optimizeTouchTargets();
    this.optimizations.add(OPTIMIZATION_TYPES.TOUCH_TARGETS);
    
    // Apply animation optimizations
    this.optimizeAnimations();
    this.optimizations.add(OPTIMIZATION_TYPES.ANIMATIONS);
    
    // Apply scrolling optimizations
    this.optimizeScrolling();
    this.optimizations.add(OPTIMIZATION_TYPES.SCROLLING);
    
    // Apply viewport optimizations
    this.optimizeViewport();
    this.optimizations.add(OPTIMIZATION_TYPES.VIEWPORT);
    
    // Apply performance optimizations
    this.optimizePerformance();
    this.optimizations.add(OPTIMIZATION_TYPES.PERFORMANCE);
    
    // Apply accessibility optimizations
    this.optimizeAccessibility();
    this.optimizations.add(OPTIMIZATION_TYPES.ACCESSIBILITY);
    
    this.logger.info('Mobile optimizations applied', {
      optimizations: Array.from(this.optimizations)
    });
  }

  /**
   * Optimize touch targets for mobile
   */
  private optimizeTouchTargets(): void {
    const interactiveElements = document.querySelectorAll(
      'button, input, select, textarea, [role="button"], [tabindex]:not([tabindex="-1"])'
    );
    
    interactiveElements.forEach(element => {
      const rect = element.getBoundingClientRect();
      const minSize = MOBILE_UI_CONSTANTS.MIN_TOUCH_TARGET;
      
      if (rect.width < minSize || rect.height < minSize) {
        element.classList.add('mobile-touch-friendly');
        
        // Apply minimum touch target size
        const computedStyle = window.getComputedStyle(element);
        const paddingX = parseFloat(computedStyle.paddingLeft) + parseFloat(computedStyle.paddingRight);
        const paddingY = parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom);
        
        if (rect.width < minSize) {
          element.style.minWidth = `${minSize - paddingX}px`;
        }
        if (rect.height < minSize) {
          element.style.minHeight = `${minSize - paddingY}px`;
        }
        
        // Add touch margin
        element.style.margin = `${MOBILE_UI_CONSTANTS.TOUCH_MARGIN}px`;
      }
    });
    
    this.logger.debug('Touch targets optimized', {
      elementsOptimized: interactiveElements.length
    });
  }

  /**
   * Optimize animations for mobile
   */
  private optimizeAnimations(): void {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion || this.isMobile) {
      // Reduce animation durations
      document.documentElement.style.setProperty('--animation-duration-fast', `${MOBILE_UI_CONSTANTS.FAST_ANIMATION}ms`);
      document.documentElement.style.setProperty('--animation-duration-normal', `${MOBILE_UI_CONSTANTS.NORMAL_ANIMATION}ms`);
      document.documentElement.style.setProperty('--animation-duration-slow', `${MOBILE_UI_CONSTANTS.SLOW_ANIMATION}ms`);
      
      // Disable complex animations on mobile
      document.body.classList.add('mobile-animations-optimized');
      
      this.logger.debug('Animations optimized for mobile');
    }
    
    // Optimize CSS transitions
    const style = document.createElement('style');
    style.textContent = `
      .mobile-animations-optimized * {
        transition-duration: ${MOBILE_UI_CONSTANTS.FAST_ANIMATION}ms !important;
        animation-duration: ${MOBILE_UI_CONSTANTS.NORMAL_ANIMATION}ms !important;
      }
      
      .mobile-animations-optimized .complex-animation {
        animation: none !important;
        transition: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Optimize scrolling for mobile
   */
  private optimizeScrolling(): void {
    // Add smooth scrolling behavior
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Optimize scroll performance
    let scrollTimeout: number;
    this.scrollHandler = () => {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      
      scrollTimeout = setTimeout(() => {
        // Emit scroll event for components
        this.eventBus.emit('mobile.scroll', {
          scrollY: window.scrollY,
          scrollX: window.scrollX
        });
      }, MOBILE_UI_CONSTANTS.SCROLL_DEBOUNCE);
    };
    
    window.addEventListener('scroll', this.scrollHandler, { passive: true });
    
    // Add momentum scrolling for iOS
    if (this.isMobile && /iPad|iPhone|iPod/.test(navigator.userAgent)) {
      document.body.style.webkitOverflowScrolling = 'touch';
    }
    
    this.logger.debug('Scrolling optimized for mobile');
  }

  /**
   * Optimize viewport for mobile
   */
  private optimizeViewport(): void {
    // Set up viewport meta tag
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.setAttribute('name', 'viewport');
      document.head.appendChild(viewport);
    }
    
    // Configure viewport for mobile
    viewport.setAttribute('content', 
      'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes, viewport-fit=cover'
    );
    
    // Handle orientation changes
    this.resizeHandler = () => {
      this.handleViewportChange();
    };
    
    window.addEventListener('resize', this.resizeHandler);
    window.addEventListener('orientationchange', this.resizeHandler);
    
    // Initial viewport optimization
    this.handleViewportChange();
    
    this.logger.debug('Viewport optimized for mobile');
  }

  /**
   * Handle viewport changes
   */
  private handleViewportChange(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Update CSS custom properties
    document.documentElement.style.setProperty('--viewport-width', `${width}px`);
    document.documentElement.style.setProperty('--viewport-height', `${height}px`);
    
    // Determine device orientation
    const isLandscape = width > height;
    document.body.classList.toggle('landscape', isLandscape);
    document.body.classList.toggle('portrait', !isLandscape);
    
    // Emit viewport change event
    this.eventBus.emit('mobile.viewport_change', {
      width,
      height,
      isLandscape,
      orientation: isLandscape ? 'landscape' : 'portrait'
    });
    
    this.logger.debug('Viewport change handled', {
      width,
      height,
      isLandscape
    });
  }

  /**
   * Optimize performance for mobile
   */
  private optimizePerformance(): void {
    // Add performance optimization classes
    document.body.classList.add('mobile-performance-optimized');
    
    // Optimize images for mobile
    this.optimizeImages();
    
    // Optimize fonts for mobile
    this.optimizeFonts();
    
    // Add performance monitoring
    this.setupPerformanceMonitoring();
    
    this.logger.debug('Performance optimized for mobile');
  }

  /**
   * Optimize images for mobile
   */
  private optimizeImages(): void {
    const images = document.querySelectorAll('img');
    
    images.forEach(img => {
      // Add loading optimization
      if (!img.hasAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
      }
      
      // Add mobile-specific attributes
      img.classList.add('mobile-optimized');
      
      // Optimize for different screen densities
      if (this.isMobile) {
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
      }
    });
    
    this.logger.debug('Images optimized for mobile', {
      imagesOptimized: images.length
    });
  }

  /**
   * Optimize fonts for mobile
   */
  private optimizeFonts(): void {
    // Add font optimization styles
    const style = document.createElement('style');
    style.textContent = `
      .mobile-performance-optimized {
        font-display: swap;
        text-rendering: optimizeSpeed;
      }
      
      .mobile-performance-optimized * {
        font-display: swap;
      }
    `;
    document.head.appendChild(style);
    
    this.logger.debug('Fonts optimized for mobile');
  }

  /**
   * Set up performance monitoring
   */
  private setupPerformanceMonitoring(): void {
    if ('PerformanceObserver' in window) {
      try {
        this.performanceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            if (entry.entryType === 'measure' && entry.duration > MOBILE_UI_CONSTANTS.REDUCED_MOTION_THRESHOLD) {
              this.logger.warn('Slow performance detected', {
                name: entry.name,
                duration: entry.duration,
                threshold: MOBILE_UI_CONSTANTS.REDUCED_MOTION_THRESHOLD
              });
            }
          });
        });
        
        this.performanceObserver.observe({ entryTypes: ['measure'] });
        
        this.logger.debug('Performance monitoring set up');
      } catch (error) {
        this.logger.warn('Failed to set up performance monitoring', { error });
      }
    }
  }

  /**
   * Set up responsive behavior
   */
  private setupResponsiveBehavior(): void {
    // Add responsive breakpoint classes
    const updateBreakpointClasses = () => {
      const width = window.innerWidth;
      
      document.body.classList.toggle('mobile', width < MOBILE_UI_CONSTANTS.MOBILE_BREAKPOINT);
      document.body.classList.toggle('tablet', 
        width >= MOBILE_UI_CONSTANTS.MOBILE_BREAKPOINT && 
        width < MOBILE_UI_CONSTANTS.TABLET_BREAKPOINT
      );
      document.body.classList.toggle('desktop', width >= MOBILE_UI_CONSTANTS.TABLET_BREAKPOINT);
    };
    
    // Initial setup
    updateBreakpointClasses();
    
    // Update on resize
    window.addEventListener('resize', updateBreakpointClasses);
    
    this.logger.debug('Responsive behavior set up');
  }

  /**
   * Set up accessibility enhancements
   */
  private setupAccessibilityEnhancements(): void {
    // Add mobile-specific accessibility features
    document.body.classList.add('mobile-accessibility-enhanced');
    
    // Enhance focus management for touch devices
    this.enhanceFocusManagement();
    
    // Add mobile-specific ARIA attributes
    this.enhanceARIA();
    
    this.logger.debug('Accessibility enhancements set up');
  }

  /**
   * Enhance focus management for touch devices
   */
  private enhanceFocusManagement(): void {
    // Add focus indicators for touch devices
    const style = document.createElement('style');
    style.textContent = `
      .mobile-accessibility-enhanced *:focus {
        outline: 2px solid #007AFF;
        outline-offset: 2px;
      }
      
      .mobile-accessibility-enhanced .mobile-touch-friendly:focus {
        outline: 3px solid #007AFF;
        outline-offset: 3px;
      }
    `;
    document.head.appendChild(style);
    
    // Add focus management for touch interactions
    document.addEventListener('touchstart', (event) => {
      const target = event.target as HTMLElement;
      if (target && target.focus && typeof target.focus === 'function') {
        // Focus element on touch for better accessibility
        target.focus();
      }
    });
  }

  /**
   * Enhance ARIA attributes for mobile
   */
  private enhanceARIA(): void {
    // Add mobile-specific ARIA attributes to interactive elements
    const interactiveElements = document.querySelectorAll(
      'button, input, select, textarea, [role="button"]'
    );
    
    interactiveElements.forEach(element => {
      if (!element.hasAttribute('aria-label') && !element.hasAttribute('aria-labelledby')) {
        // Add default aria-label for touch-friendly elements
        if (element.classList.contains('mobile-touch-friendly')) {
          element.setAttribute('aria-label', element.textContent || 'Interactive element');
        }
      }
    });
  }

  /**
   * Check if mobile optimizations are active
   */
  isMobileOptimized(): boolean {
    return this.isMobile || this.isTablet;
  }

  /**
   * Get active optimizations
   */
  getActiveOptimizations(): string[] {
    return Array.from(this.optimizations);
  }

  /**
   * Apply specific optimization
   */
  applyOptimization(type: string): void {
    switch (type) {
      case OPTIMIZATION_TYPES.TOUCH_TARGETS:
        this.optimizeTouchTargets();
        break;
      case OPTIMIZATION_TYPES.ANIMATIONS:
        this.optimizeAnimations();
        break;
      case OPTIMIZATION_TYPES.SCROLLING:
        this.optimizeScrolling();
        break;
      case OPTIMIZATION_TYPES.VIEWPORT:
        this.optimizeViewport();
        break;
      case OPTIMIZATION_TYPES.PERFORMANCE:
        this.optimizePerformance();
        break;
      case OPTIMIZATION_TYPES.ACCESSIBILITY:
        this.optimizeAccessibility();
        break;
      default:
        this.logger.warn('Unknown optimization type', { type });
    }
    
    this.optimizations.add(type);
  }

  /**
   * Remove specific optimization
   */
  removeOptimization(type: string): void {
    this.optimizations.delete(type);
    
    // Remove optimization-specific classes and styles
    switch (type) {
      case OPTIMIZATION_TYPES.TOUCH_TARGETS:
        document.querySelectorAll('.mobile-touch-friendly').forEach(el => {
          el.classList.remove('mobile-touch-friendly');
        });
        break;
      case OPTIMIZATION_TYPES.ANIMATIONS:
        document.body.classList.remove('mobile-animations-optimized');
        break;
      case OPTIMIZATION_TYPES.PERFORMANCE:
        document.body.classList.remove('mobile-performance-optimized');
        break;
      case OPTIMIZATION_TYPES.ACCESSIBILITY:
        document.body.classList.remove('mobile-accessibility-enhanced');
        break;
    }
  }

  /**
   * Cleanup mobile UI optimizer
   */
  async cleanup(): Promise<void> {
    this.logger.info('Cleaning up mobile UI optimizer');
    
    // Remove event listeners
    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler);
    }
    
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      window.removeEventListener('orientationchange', this.resizeHandler);
    }
    
    // Disconnect performance observer
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    
    // Remove optimization classes
    document.body.classList.remove(
      'mobile-animations-optimized',
      'mobile-performance-optimized',
      'mobile-accessibility-enhanced',
      'landscape',
      'portrait',
      'mobile',
      'tablet',
      'desktop'
    );
    
    // Clear state
    this.optimizations.clear();
    
    this.logger.info('Mobile UI optimizer cleaned up');
  }
}
