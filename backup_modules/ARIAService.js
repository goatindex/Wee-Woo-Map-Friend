/**
 * @module modules/ARIAService
 * Comprehensive ARIA accessibility service
 * Provides centralized ARIA attribute management, focus management, and accessibility utilities
 */

import { injectable, inject } from 'inversify';
import { TYPES } from './Types.js';
import { logger } from './StructuredLogger.js';
import { BaseService } from './BaseService.js';

/**
 * @class ARIAService
 * Centralized ARIA accessibility service
 */
@injectable()
export class ARIAService extends BaseService {
  constructor(
    @inject(TYPES.EventBus) eventBus,
    @inject(TYPES.ErrorBoundary) errorBoundary
  ) {
    super();
    this.eventBus = eventBus;
    this.errorBoundary = errorBoundary;
    this.logger = logger.createChild({ module: 'ARIAService' });
    
    // Focus management
    this.focusHistory = [];
    this.focusableElements = new Set();
    this.currentFocusIndex = -1;
    this.focusTrapStack = [];
    
    // ARIA live regions
    this.liveRegions = new Map();
    this.announcementQueue = [];
    this.isAnnouncing = false;
    
    // Keyboard navigation
    this.keyboardNavigation = {
      enabled: true,
      currentIndex: -1,
      navigationElements: [],
      orientation: 'horizontal' // horizontal, vertical, grid
    };
    
    // Accessibility preferences
    this.preferences = {
      reducedMotion: false,
      highContrast: false,
      largeText: false,
      screenReader: false
    };
    
    this.logger.info('ARIAService initialized');
  }

  /**
   * Initialize ARIA service
   */
  async init() {
    try {
      this.logger.info('Initializing ARIA service...');
      
      // Set up accessibility preferences detection
      await this.detectAccessibilityPreferences();
      
      // Create live regions for announcements
      this.createLiveRegions();
      
      // Set up global keyboard navigation
      this.setupGlobalKeyboardNavigation();
      
      // Set up focus management
      this.setupFocusManagement();
      
      // Set up ARIA attribute validation
      this.setupARIAValidation();
      
      this.logger.info('ARIAService initialization complete');
    } catch (error) {
      this.errorBoundary.catch(error, { context: 'ARIAService.init' });
      this.logger.error('ARIAService initialization failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Detect user accessibility preferences
   */
  async detectAccessibilityPreferences() {
    try {
      // Detect reduced motion preference
      this.preferences.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      // Detect high contrast preference
      this.preferences.highContrast = window.matchMedia('(prefers-contrast: high)').matches;
      
      // Detect large text preference
      this.preferences.largeText = window.matchMedia('(prefers-reduced-data: no-preference)').matches;
      
      // Detect screen reader (basic detection)
      this.preferences.screenReader = this.detectScreenReader();
      
      this.logger.debug('Accessibility preferences detected', this.preferences);
      
      // Apply preferences to document
      this.applyAccessibilityPreferences();
      
    } catch (error) {
      this.logger.warn('Failed to detect accessibility preferences', { error: error.message });
    }
  }

  /**
   * Basic screen reader detection
   */
  detectScreenReader() {
    try {
      // Check for common screen reader indicators
      const hasScreenReader = (
        window.speechSynthesis ||
        window.webkitSpeechSynthesis ||
        navigator.userAgent.includes('NVDA') ||
        navigator.userAgent.includes('JAWS') ||
        navigator.userAgent.includes('VoiceOver')
      );
      
      return hasScreenReader;
    } catch (error) {
      return false;
    }
  }

  /**
   * Apply accessibility preferences to document
   */
  applyAccessibilityPreferences() {
    const root = document.documentElement;
    
    if (this.preferences.reducedMotion) {
      root.classList.add('reduced-motion');
    }
    
    if (this.preferences.highContrast) {
      root.classList.add('high-contrast');
    }
    
    if (this.preferences.largeText) {
      root.classList.add('large-text');
    }
    
    if (this.preferences.screenReader) {
      root.classList.add('screen-reader');
    }
  }

  /**
   * Create live regions for announcements
   */
  createLiveRegions() {
    const regions = [
      { id: 'aria-live-polite', politeness: 'polite' },
      { id: 'aria-live-assertive', politeness: 'assertive' },
      { id: 'aria-live-status', politeness: 'polite', role: 'status' },
      { id: 'aria-live-alert', politeness: 'assertive', role: 'alert' }
    ];
    
    regions.forEach(region => {
      const element = document.createElement('div');
      element.id = region.id;
      element.setAttribute('aria-live', region.politeness);
      element.setAttribute('aria-atomic', 'true');
      element.className = 'sr-only';
      
      if (region.role) {
        element.setAttribute('role', region.role);
      }
      
      // Hide visually but keep accessible
      element.style.cssText = `
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
      `;
      
      document.body.appendChild(element);
      this.liveRegions.set(region.id, element);
    });
    
    this.logger.debug('Live regions created', { count: regions.length });
  }

  /**
   * Announce text to screen readers
   */
  announce(text, politeness = 'polite') {
    try {
      if (!text || typeof text !== 'string') {
        this.logger.warn('Invalid announcement text', { text });
        return;
      }
      
      const regionId = `aria-live-${politeness}`;
      const region = this.liveRegions.get(regionId);
      
      if (!region) {
        this.logger.warn('Live region not found', { regionId });
        return;
      }
      
      // Clear previous content
      region.textContent = '';
      
      // Set new content with a slight delay to ensure announcement
      setTimeout(() => {
        region.textContent = text;
        this.logger.debug('Announcement made', { text, politeness });
      }, 100);
      
    } catch (error) {
      this.logger.error('Failed to announce text', { error: error.message, text });
    }
  }

  /**
   * Set up global keyboard navigation
   */
  setupGlobalKeyboardNavigation() {
    document.addEventListener('keydown', (event) => {
      if (!this.keyboardNavigation.enabled) return;
      
      // Handle arrow key navigation
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        this.handleArrowKeyNavigation(event);
      }
      
      // Handle Tab navigation
      if (event.key === 'Tab') {
        this.handleTabNavigation(event);
      }
      
      // Handle Escape key
      if (event.key === 'Escape') {
        this.handleEscapeKey(event);
      }
      
      // Handle Enter and Space
      if (['Enter', ' '].includes(event.key)) {
        this.handleActivationKey(event);
      }
    });
    
    this.logger.debug('Global keyboard navigation setup complete');
  }

  /**
   * Handle arrow key navigation
   */
  handleArrowKeyNavigation(event) {
    const { key, target } = event;
    const element = target.closest('[role]');
    
    if (!element) return;
    
    const role = element.getAttribute('role');
    const orientation = this.getNavigationOrientation(element);
    
    // Prevent default arrow key behavior for interactive elements
    if (['button', 'menuitem', 'tab', 'option'].includes(role)) {
      event.preventDefault();
      
      const nextElement = this.getNextNavigationElement(element, key, orientation);
      if (nextElement) {
        nextElement.focus();
        this.announce(`Focused on ${this.getElementDescription(nextElement)}`);
      }
    }
  }

  /**
   * Handle Tab navigation
   */
  handleTabNavigation(event) {
    const { target } = event;
    
    // Track focus history
    this.focusHistory.push(target);
    if (this.focusHistory.length > 10) {
      this.focusHistory.shift();
    }
    
    // Update focusable elements set
    this.focusableElements.add(target);
    
    // Announce focus change
    this.announce(`Focused on ${this.getElementDescription(target)}`);
  }

  /**
   * Handle Escape key
   */
  handleEscapeKey(event) {
    const { target } = event;
    
    // Close modals, dropdowns, etc.
    const modal = target.closest('[role="dialog"]');
    if (modal) {
      const closeButton = modal.querySelector('[aria-label*="close"], [aria-label*="Close"]');
      if (closeButton) {
        closeButton.focus();
        closeButton.click();
        this.announce('Modal closed');
      }
    }
    
    // Close dropdowns
    const dropdown = target.closest('[role="combobox"], [role="listbox"]');
    if (dropdown) {
      const isExpanded = dropdown.getAttribute('aria-expanded') === 'true';
      if (isExpanded) {
        dropdown.setAttribute('aria-expanded', 'false');
        this.announce('Dropdown closed');
      }
    }
  }

  /**
   * Handle activation keys (Enter, Space)
   */
  handleActivationKey(event) {
    const { key, target } = event;
    
    // Don't interfere with form inputs
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
      return;
    }
    
    // Handle button activation
    if (target.getAttribute('role') === 'button' || target.tagName === 'BUTTON') {
      if (key === ' ') {
        event.preventDefault();
        target.click();
      }
    }
  }

  /**
   * Get navigation orientation for an element
   */
  getNavigationOrientation(element) {
    const role = element.getAttribute('role');
    const ariaOrientation = element.getAttribute('aria-orientation');
    
    if (ariaOrientation) {
      return ariaOrientation;
    }
    
    // Default orientations by role
    const roleOrientations = {
      'menubar': 'horizontal',
      'menu': 'vertical',
      'tablist': 'horizontal',
      'listbox': 'vertical',
      'grid': 'both'
    };
    
    return roleOrientations[role] || 'horizontal';
  }

  /**
   * Get next navigation element
   */
  getNextNavigationElement(currentElement, direction, orientation) {
    const container = currentElement.closest('[role]');
    if (!container) return null;
    
    const navigableElements = Array.from(container.querySelectorAll('[tabindex]:not([tabindex="-1"]), button, [role="button"], [role="menuitem"], [role="tab"], [role="option"]'));
    const currentIndex = navigableElements.indexOf(currentElement);
    
    if (currentIndex === -1) return null;
    
    let nextIndex = currentIndex;
    
    switch (direction) {
      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'both') {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : navigableElements.length - 1;
        }
        break;
      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'both') {
          nextIndex = currentIndex < navigableElements.length - 1 ? currentIndex + 1 : 0;
        }
        break;
      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'both') {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : navigableElements.length - 1;
        }
        break;
      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'both') {
          nextIndex = currentIndex < navigableElements.length - 1 ? currentIndex + 1 : 0;
        }
        break;
    }
    
    return navigableElements[nextIndex] || null;
  }

  /**
   * Set up focus management
   */
  setupFocusManagement() {
    // Track focus changes
    document.addEventListener('focusin', (event) => {
      this.handleFocusIn(event);
    });
    
    document.addEventListener('focusout', (event) => {
      this.handleFocusOut(event);
    });
    
    this.logger.debug('Focus management setup complete');
  }

  /**
   * Handle focus in
   */
  handleFocusIn(event) {
    const { target } = event;
    
    // Update current focus index
    this.currentFocusIndex = this.focusHistory.length;
    
    // Add focus indicator
    target.classList.add('focus-visible');
    
    // Update ARIA attributes
    this.updateFocusAttributes(target, true);
  }

  /**
   * Handle focus out
   */
  handleFocusOut(event) {
    const { target } = event;
    
    // Remove focus indicator
    target.classList.remove('focus-visible');
    
    // Update ARIA attributes
    this.updateFocusAttributes(target, false);
  }

  /**
   * Update focus-related ARIA attributes
   */
  updateFocusAttributes(element, hasFocus) {
    if (hasFocus) {
      element.setAttribute('aria-selected', 'true');
    } else {
      element.removeAttribute('aria-selected');
    }
  }

  /**
   * Set up ARIA attribute validation
   */
  setupARIAValidation() {
    // Validate ARIA attributes on DOM changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName?.startsWith('aria-')) {
          this.validateARIAAttributes(mutation.target);
        }
      });
    });
    
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['aria-expanded', 'aria-selected', 'aria-checked', 'aria-pressed', 'aria-hidden']
    });
    
    this.logger.debug('ARIA validation setup complete');
  }

  /**
   * Validate ARIA attributes
   */
  validateARIAAttributes(element) {
    const issues = [];
    
    // Check for required ARIA attributes
    const role = element.getAttribute('role');
    if (role) {
      const requiredAttributes = this.getRequiredARIAAttributes(role);
      requiredAttributes.forEach(attr => {
        if (!element.hasAttribute(attr)) {
          issues.push(`Missing required attribute: ${attr}`);
        }
      });
    }
    
    // Check for invalid ARIA values
    const ariaExpanded = element.getAttribute('aria-expanded');
    if (ariaExpanded && !['true', 'false'].includes(ariaExpanded)) {
      issues.push('Invalid aria-expanded value');
    }
    
    const ariaSelected = element.getAttribute('aria-selected');
    if (ariaSelected && !['true', 'false'].includes(ariaSelected)) {
      issues.push('Invalid aria-selected value');
    }
    
    if (issues.length > 0) {
      this.logger.warn('ARIA validation issues found', { 
        element: element.tagName, 
        issues 
      });
    }
  }

  /**
   * Get required ARIA attributes for a role
   */
  getRequiredARIAAttributes(role) {
    const requirements = {
      'button': [],
      'checkbox': ['aria-checked'],
      'combobox': ['aria-expanded', 'aria-controls'],
      'dialog': ['aria-labelledby', 'aria-modal'],
      'listbox': ['aria-multiselectable'],
      'menuitem': ['aria-haspopup'],
      'progressbar': ['aria-valuenow', 'aria-valuemin', 'aria-valuemax'],
      'slider': ['aria-valuenow', 'aria-valuemin', 'aria-valuemax'],
      'tab': ['aria-selected', 'aria-controls'],
      'tablist': ['aria-orientation'],
      'textbox': ['aria-multiline']
    };
    
    return requirements[role] || [];
  }

  /**
   * Get element description for screen readers
   */
  getElementDescription(element) {
    const label = element.getAttribute('aria-label') || 
                  element.getAttribute('title') || 
                  element.textContent?.trim() || 
                  element.getAttribute('alt') || 
                  element.tagName.toLowerCase();
    
    const role = element.getAttribute('role') || element.tagName.toLowerCase();
    const state = this.getElementState(element);
    
    return `${label} ${role} ${state}`.trim();
  }

  /**
   * Get element state for screen readers
   */
  getElementState(element) {
    const states = [];
    
    if (element.getAttribute('aria-expanded') === 'true') {
      states.push('expanded');
    } else if (element.getAttribute('aria-expanded') === 'false') {
      states.push('collapsed');
    }
    
    if (element.getAttribute('aria-selected') === 'true') {
      states.push('selected');
    }
    
    if (element.getAttribute('aria-checked') === 'true') {
      states.push('checked');
    } else if (element.getAttribute('aria-checked') === 'false') {
      states.push('unchecked');
    }
    
    if (element.getAttribute('aria-pressed') === 'true') {
      states.push('pressed');
    }
    
    if (element.getAttribute('aria-disabled') === 'true') {
      states.push('disabled');
    }
    
    return states.join(' ');
  }

  /**
   * Set up focus trap
   */
  setupFocusTrap(container, options = {}) {
    const {
      initialFocus = null,
      returnFocus = true,
      preventScroll = false
    } = options;
    
    const focusableElements = this.getFocusableElements(container);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    const trap = {
      container,
      firstElement,
      lastElement,
      returnFocus,
      preventScroll,
      handleKeyDown: (event) => {
        if (event.key === 'Tab') {
          if (event.shiftKey) {
            if (document.activeElement === firstElement) {
              event.preventDefault();
              lastElement.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              event.preventDefault();
              firstElement.focus();
            }
          }
        }
      }
    };
    
    container.addEventListener('keydown', trap.handleKeyDown);
    this.focusTrapStack.push(trap);
    
    // Focus initial element
    if (initialFocus) {
      initialFocus.focus();
    } else if (firstElement) {
      firstElement.focus();
    }
    
    this.logger.debug('Focus trap setup', { container: container.id || container.tagName });
    
    return trap;
  }

  /**
   * Remove focus trap
   */
  removeFocusTrap(trap) {
    const index = this.focusTrapStack.indexOf(trap);
    if (index > -1) {
      this.focusTrapStack.splice(index, 1);
      trap.container.removeEventListener('keydown', trap.handleKeyDown);
      
      // Return focus if specified
      if (trap.returnFocus && document.activeElement) {
        document.activeElement.blur();
      }
      
      this.logger.debug('Focus trap removed', { container: trap.container.id || trap.container.tagName });
    }
  }

  /**
   * Get focusable elements within a container
   */
  getFocusableElements(container) {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([aria-disabled="true"])',
      '[role="menuitem"]:not([aria-disabled="true"])',
      '[role="tab"]:not([aria-disabled="true"])',
      '[role="option"]:not([aria-disabled="true"])'
    ];
    
    return Array.from(container.querySelectorAll(focusableSelectors.join(', ')));
  }

  /**
   * Cleanup ARIA service
   */
  async cleanup() {
    try {
      this.logger.info('Cleaning up ARIA service...');
      
      // Remove live regions
      this.liveRegions.forEach((region, id) => {
        if (region.parentElement) {
          region.parentElement.removeChild(region);
        }
      });
      this.liveRegions.clear();
      
      // Remove focus traps
      this.focusTrapStack.forEach(trap => {
        this.removeFocusTrap(trap);
      });
      this.focusTrapStack = [];
      
      // Clear focus history
      this.focusHistory = [];
      this.focusableElements.clear();
      
      this.logger.info('ARIAService cleanup complete');
    } catch (error) {
      this.errorBoundary.catch(error, { context: 'ARIAService.cleanup' });
      this.logger.error('ARIAService cleanup failed', { error: error.message });
    } finally {
      await super.cleanup();
    }
  }
}

// Export singleton instance
export const ariaService = new ARIAService(null, null);
