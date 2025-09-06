/**
 * @jest-environment jsdom
 */

import { ConfigurationManager, configurationManager } from './ConfigurationManager.js';

describe('ConfigurationManager', () => {
  let manager;

  beforeEach(() => {
    // Create a fresh instance for testing
    manager = new ConfigurationManager();
  });

  afterEach(() => {
    // Clean up
    if (manager) {
      manager = null;
    }
  });

  describe('Initialization', () => {
    test('should initialize with default configuration', () => {
      expect(manager.isReady()).toBe(true);
      
      // Test that default configuration is loaded
      expect(manager.get('outlineColors')).toBeDefined();
      expect(manager.get('categoryMeta')).toBeDefined();
      expect(manager.get('styles')).toBeDefined();
    });

    test('should have correct outline colors', () => {
      const colors = manager.get('outlineColors');
      expect(colors.ses).toBe('#cc7a00');
      expect(colors.lga).toBe('black');
      expect(colors.cfa).toBe('#FF0000');
    });

    test('should have correct category metadata', () => {
      const meta = manager.get('categoryMeta');
      expect(meta.ses.type).toBe('polygon');
      expect(meta.ses.nameProp).toBe('RESPONSE_ZONE_NAME');
      expect(meta.ambulance.type).toBe('point');
    });
  });

  describe('Configuration Access', () => {
    test('should get configuration values by path', () => {
      expect(manager.get('outlineColors.ses')).toBe('#cc7a00');
      expect(manager.get('categoryMeta.ses.type')).toBe('polygon');
    });

    test('should return default value for missing paths', () => {
      expect(manager.get('nonexistent.path', 'default')).toBe('default');
      expect(manager.get('nonexistent.path')).toBeUndefined();
    });

    test('should set configuration values', () => {
      manager.set('test.value', 'test');
      expect(manager.get('test.value')).toBe('test');
    });
  });

  describe('Style Functions', () => {
    test('should get style function for categories', () => {
      const sesStyle = manager.getStyle('ses');
      expect(typeof sesStyle).toBe('function');
      
      const style = sesStyle();
      expect(style.color).toBe('#FF9900');
      expect(style.weight).toBe(3);
    });

    test('should return null for categories without style functions', () => {
      const ambulanceStyle = manager.getStyle('ambulance');
      expect(ambulanceStyle).toBeNull();
    });
  });

  describe('Utility Functions', () => {
    test('should provide color adjustment function', () => {
      const adjuster = manager.getColorAdjuster();
      expect(typeof adjuster).toBe('function');
      
      // Test color adjustment
      expect(adjuster('#FF0000', 0.5)).toBe('#800000'); // 50% darker red
      expect(adjuster('#FF0000', 1.5)).toBe('#ff0000'); // 150% lighter (clamped)
    });
  });

  describe('Legacy Compatibility', () => {
    test('should expose legacy window globals', () => {
      // These should be available after ConfigurationManager loads
      expect(window.outlineColors).toBeDefined();
      expect(window.categoryMeta).toBeDefined();
      expect(window.adjustHexColor).toBeDefined();
      expect(window.sesStyle).toBeDefined();
    });

    test('should proxy legacy style functions', () => {
      const sesStyle = window.sesStyle();
      expect(sesStyle.color).toBe('#FF9900');
      
      const lgaStyle = window.lgaStyle();
      expect(lgaStyle.color).toBe('#001A70');
    });
  });

  describe('Status and Health', () => {
    test('should provide status information', () => {
      const status = manager.getStatus();
      expect(status.initialized).toBe(true);
      expect(status.categories).toContain('ses');
      expect(status.categories).toContain('lga');
      expect(status.colors).toContain('ses');
      expect(status.styles).toContain('sesStyle');
    });
  });
});
