/**
 * @module modules/TextFormatter
 * Modern ES6-based text formatting utilities
 * Replaces legacy text formatting functions with a reactive, event-driven system
 */

import { globalEventBus } from './EventBus.js';
import { stateManager } from './StateManager.js';

/**
 * @class TextFormatter
 * Handles text formatting, normalization, and display name generation
 */
export class TextFormatter {
  constructor() {
    this.initialized = false;
    this.formattingRules = new Map();
    this.cache = new Map(); // Simple caching for performance
    
    // Bind methods
    this.init = this.init.bind(this);
    this.toTitleCase = this.toTitleCase.bind(this);
    this.formatLgaName = this.formatLgaName.bind(this);
    this.formatFrvName = this.formatFrvName.bind(this);
    this.formatSesName = this.formatSesName.bind(this);
    this.formatAmbulanceName = this.formatAmbulanceName.bind(this);
    this.formatPoliceName = this.formatPoliceName.bind(this);
    this.normalizeName = this.normalizeName.bind(this);
    this.getStatus = this.getStatus.bind(this);
    
    console.log('📝 TextFormatter: Text formatting system initialized');
  }
  
  /**
   * Initialize the text formatter
   */
  async init() {
    if (this.initialized) {
      console.warn('TextFormatter: Already initialized');
      return;
    }
    
    try {
      console.log('🔧 TextFormatter: Starting text formatter initialization...');
      
      // Set up formatting rules
      this.setupFormattingRules();
      
      // Set up event listeners
      this.setupEventListeners();
      
      this.initialized = true;
      console.log('✅ TextFormatter: Text formatting system ready');
      
    } catch (error) {
      console.error('🚨 TextFormatter: Failed to initialize:', error);
      throw error;
    }
  }
  
  /**
   * Set up formatting rules for different categories
   */
  setupFormattingRules() {
    // LGA formatting rules
    this.formattingRules.set('lga', {
      removePatterns: [
        /\(\s*unincorporated\s*\)/gi,
        /\(\s*uninc\.?\s*\)/gi,
        /\bunincorporated\b/gi,
        /\buninc\.?\b/gi
      ],
      replacePatterns: [
        { from: /\s{2,}/g, to: ' ' },
        { from: /^\s+|\s+$/g, to: '' }
      ]
    });
    
    // SES formatting rules
    this.formattingRules.set('ses', {
      removePatterns: [
        /^VIC\s*SES\s+/i,
        /^VICSES\s+/i,
        /^SES\s+/i
      ],
      replacePatterns: [
        { from: /\s{2,}/g, to: ' ' },
        { from: /^\s+|\s+$/g, to: '' }
      ]
    });
    
    // FRV formatting rules
    this.formattingRules.set('frv', {
      replacePatterns: [
        { from: /^FRV$/i, to: 'Fire Rescue Victoria' },
        { from: /\s{2,}/g, to: ' ' },
        { from: /^\s+|\s+$/g, to: '' }
      ]
    });
    
    // Ambulance formatting rules
    this.formattingRules.set('ambulance', {
      removePatterns: [
        /^Ambulance\s+Victoria\s+/i,
        /^AV\s+/i
      ],
      replacePatterns: [
        { from: /\s{2,}/g, to: ' ' },
        { from: /^\s+|\s+$/g, to: '' }
      ]
    });
    
    // Police formatting rules
    this.formattingRules.set('police', {
      removePatterns: [
        /^Victoria\s+Police\s+/i,
        /^VicPol\s+/i
      ],
      replacePatterns: [
        { from: /\s{2,}/g, to: ' ' },
        { from: /^\s+|\s+$/g, to: '' }
      ]
    });
    
    console.log('✅ TextFormatter: Formatting rules configured');
  }
  
  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Listen for text formatting requests
    globalEventBus.on('text:format', ({ category, name, type = 'display' }) => {
      try {
        let result;
        switch (category) {
          case 'lga':
            result = this.formatLgaName(name);
            break;
          case 'frv':
            result = this.formatFrvName(name);
            break;
          case 'ses':
            result = this.formatSesName(name);
            break;
          case 'ambulance':
            result = this.formatAmbulanceName(name);
            break;
          case 'police':
            result = this.formatPoliceName(name);
            break;
          default:
            result = this.normalizeName(name);
        }
        
        globalEventBus.emit('text:formatted', { category, input: name, output: result, type });
        
      } catch (error) {
        globalEventBus.emit('text:error', { error: error.message, category, name });
      }
    });
    
    console.log('✅ TextFormatter: Event listeners configured');
  }
  
  /**
   * Convert text to title case
   * @param {string} str - Input string
   * @returns {string} - Title case string
   */
  toTitleCase(str) {
    if (!str || typeof str !== 'string') return '';
    
    try {
      // Replace underscores with spaces first, then apply title case
      return str
        .replace(/_/g, ' ')
        .replace(/\w\S*/g, t => t[0].toUpperCase() + t.slice(1).toLowerCase());
    } catch (error) {
      console.error('🚨 TextFormatter: Title case conversion failed:', error);
      return str;
    }
  }
  
  /**
   * Format LGA name for display
   * @param {string} name - Raw LGA name
   * @returns {string} - Formatted display name
   */
  formatLgaName(name) {
    if (!name || typeof name !== 'string') return 'Unknown LGA';
    
    try {
      // Check cache first
      const cacheKey = `lga_${name}`;
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }
      
      let formatted = name;
      const rules = this.formattingRules.get('lga');
      
      if (rules) {
        // Apply removal patterns
        rules.removePatterns.forEach(pattern => {
          formatted = formatted.replace(pattern, '');
        });
        
        // Apply replacement patterns
        rules.replacePatterns.forEach(({ from, to }) => {
          formatted = formatted.replace(from, to);
        });
      }
      
      // Cache result
      this.cache.set(cacheKey, formatted);
      
      // Emit formatting event
      globalEventBus.emit('text:formatted', {
        category: 'lga',
        input: name,
        output: formatted,
        type: 'display'
      });
      
      return formatted;
      
    } catch (error) {
      console.error('🚨 TextFormatter: LGA name formatting failed:', error);
      return name || 'Unknown LGA';
    }
  }
  
  /**
   * Format FRV name for display
   * @param {string} name - Raw FRV name
   * @returns {string} - Formatted display name
   */
  formatFrvName(name) {
    if (!name || typeof name !== 'string') return name;
    
    try {
      // Check cache first
      const cacheKey = `frv_${name}`;
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }
      
      let formatted = name;
      const rules = this.formattingRules.get('frv');
      
      if (rules) {
        // Apply replacement patterns
        rules.replacePatterns.forEach(({ from, to }) => {
          formatted = formatted.replace(from, to);
        });
      }
      
      // Cache result
      this.cache.set(cacheKey, formatted);
      
      // Emit formatting event
      globalEventBus.emit('text:formatted', {
        category: 'frv',
        input: name,
        output: formatted,
        type: 'display'
      });
      
      return formatted;
      
    } catch (error) {
      console.error('🚨 TextFormatter: FRV name formatting failed:', error);
      return name;
    }
  }
  
  /**
   * Format SES name for display
   * @param {string} name - Raw SES name
   * @returns {string} - Formatted display name
   */
  formatSesName(name) {
    if (!name || typeof name !== 'string') return name;
    
    try {
      // Check cache first
      const cacheKey = `ses_${name}`;
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }
      
      let formatted = name;
      const rules = this.formattingRules.get('ses');
      
      if (rules) {
        // Apply removal patterns
        rules.removePatterns.forEach(pattern => {
          formatted = formatted.replace(pattern, '');
        });
        
        // Apply replacement patterns
        rules.replacePatterns.forEach(({ from, to }) => {
          formatted = formatted.replace(from, to);
        });
      }
      
      // Cache result
      this.cache.set(cacheKey, formatted);
      
      // Emit formatting event
      globalEventBus.emit('text:formatted', {
        category: 'ses',
        input: name,
        output: formatted,
        type: 'display'
      });
      
      return formatted;
      
    } catch (error) {
      console.error('🚨 TextFormatter: SES name formatting failed:', error);
      return name;
    }
  }
  
  /**
   * Format ambulance name for display
   * @param {string} name - Raw ambulance name
   * @returns {string} - Formatted display name
   */
  formatAmbulanceName(name) {
    if (!name || typeof name !== 'string') return name;
    
    try {
      // Check cache first
      const cacheKey = `ambulance_${name}`;
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }
      
      let formatted = name;
      const rules = this.formattingRules.get('ambulance');
      
      if (rules) {
        // Apply removal patterns
        rules.removePatterns.forEach(pattern => {
          formatted = formatted.replace(pattern, '');
        });
        
        // Apply replacement patterns
        rules.replacePatterns.forEach(({ from, to }) => {
          formatted = formatted.replace(from, to);
        });
      }
      
      // Cache result
      this.cache.set(cacheKey, formatted);
      
      // Emit formatting event
      globalEventBus.emit('text:formatted', {
        category: 'ambulance',
        input: name,
        output: formatted,
        type: 'display'
      });
      
      return formatted;
      
    } catch (error) {
      console.error('🚨 TextFormatter: Ambulance name formatting failed:', error);
      return name;
    }
  }
  
  /**
   * Format police name for display
   * @param {string} name - Raw police name
   * @returns {string} - Formatted display name
   */
  formatPoliceName(name) {
    if (!name || typeof name !== 'string') return name;
    
    try {
      // Check cache first
      const cacheKey = `police_${name}`;
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }
      
      let formatted = name;
      const rules = this.formattingRules.get('police');
      
      if (rules) {
        // Apply removal patterns
        rules.removePatterns.forEach(pattern => {
          formatted = formatted.replace(pattern, '');
        });
        
        // Apply replacement patterns
        rules.replacePatterns.forEach(({ from, to }) => {
          formatted = formatted.replace(from, to);
        });
      }
      
      // Cache result
      this.cache.set(cacheKey, formatted);
      
      // Emit formatting event
      globalEventBus.emit('text:formatted', {
        category: 'police',
        input: name,
        output: formatted,
        type: 'display'
      });
      
      return formatted;
      
    } catch (error) {
      console.error('🚨 TextFormatter: Police name formatting failed:', error);
      return name;
    }
  }
  
  /**
   * Normalize a name for general use
   * @param {string} name - Raw name
   * @returns {string} - Normalized name
   */
  normalizeName(name) {
    if (!name || typeof name !== 'string') return '';
    
    try {
      return name
        .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
    } catch (error) {
      console.error('🚨 TextFormatter: Name normalization failed:', error);
      return name;
    }
  }
  
  /**
   * Clear the formatting cache
   */
  clearCache() {
    this.cache.clear();
    console.log('✅ TextFormatter: Cache cleared');
  }
  
  /**
   * Get text formatter status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      formattingRules: this.formattingRules.size,
      cacheSize: this.cache.size,
      supportedCategories: Array.from(this.formattingRules.keys())
    };
  }
}

// Export singleton instance
export const textFormatter = new TextFormatter();

// Export for global access and legacy compatibility
if (typeof window !== 'undefined') {
  window.textFormatter = textFormatter;
  window.toTitleCase = (str) => textFormatter.toTitleCase(str);
  window.formatLgaName = (name) => textFormatter.formatLgaName(name);
  window.formatFrvName = (name) => textFormatter.formatFrvName(name);
}
