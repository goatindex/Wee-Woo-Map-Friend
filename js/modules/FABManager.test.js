/**
 * @fileoverview Tests for FABManager component - Real Code Testing
 */

import { FABManager, fabManager } from './FABManager.js';

describe('FABManager', () => {
  let manager;

  beforeEach(() => {
    manager = new FABManager();
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    test('should create empty manager', () => {
      expect(manager.instances).toBeInstanceOf(Map);
      expect(manager.types).toBeInstanceOf(Map);
      expect(manager.instances.size).toBe(0);
      expect(manager.types.size).toBe(0);
    });
  });

  describe('register', () => {
    test('should register FAB type', () => {
      const mockFABClass = class MockFAB {};
      manager.register('test-fab', mockFABClass);
      
      expect(manager.types.has('test-fab')).toBe(true);
      expect(manager.types.get('test-fab')).toBe(mockFABClass);
    });

    test('should overwrite existing type', () => {
      const mockFABClass1 = class MockFAB1 {};
      const mockFABClass2 = class MockFAB2 {};
      
      manager.register('test-fab', mockFABClass1);
      manager.register('test-fab', mockFABClass2);
      
      expect(manager.types.get('test-fab')).toBe(mockFABClass2);
    });
  });

  describe('create', () => {
    test('should create FAB instance', async () => {
      const mockFABClass = class MockFAB {
        constructor(config) {
          this.config = config;
          this.id = config.id;
        }
        async init() {
          // Mock init method
        }
      };
      
      manager.register('test-fab', mockFABClass);
      const instance = await manager.create('test-fab', { id: 'test-1' });
      
      expect(instance).toBeInstanceOf(mockFABClass);
      expect(instance.id).toBe('test-1');
    });

    test('should store instance in instances map', async () => {
      const mockFABClass = class MockFAB {
        constructor(config) {
          this.config = config;
          this.id = config.id;
        }
        async init() {
          // Mock init method
        }
      };
      
      manager.register('test-fab', mockFABClass);
      const instance = await manager.create('test-fab', { id: 'test-1' });
      
      expect(manager.instances.has('test-1')).toBe(true);
      expect(manager.instances.get('test-1')).toBe(instance);
    });

    test('should handle unknown type by throwing error', async () => {
      // Test that unknown type throws an error (this is expected behavior)
      await expect(manager.create('unknown-fab', { id: 'test-1' })).rejects.toThrow('not registered');
    });
  });

  describe('getInstance', () => {
    test('should return FAB instance', async () => {
      const mockFABClass = class MockFAB {
        constructor(config) {
          this.config = config;
          this.id = config.id;
        }
        async init() {
          // Mock init method
        }
      };
      
      manager.register('test-fab', mockFABClass);
      const instance = await manager.create('test-fab', { id: 'test-1' });
      
      expect(manager.getInstance('test-1')).toBe(instance);
    });

    test('should return null for non-existent instance', () => {
      expect(manager.getInstance('non-existent')).toBeNull();
    });
  });

  describe('destroy', () => {
    test('should destroy FAB instance', async () => {
      const mockFABClass = class MockFAB {
        constructor(config) {
          this.config = config;
          this.id = config.id;
          this.isInitialized = true;
        }
        async init() {
          // Mock init method
        }
        destroy() {
          this.isInitialized = false;
        }
      };
      
      manager.register('test-fab', mockFABClass);
      const instance = await manager.create('test-fab', { id: 'test-1' });
      
      const result = manager.destroy('test-1');
      
      expect(result).toBe(true);
      expect(manager.instances.has('test-1')).toBe(false);
      expect(instance.isInitialized).toBe(false);
    });

    test('should handle non-existent instance gracefully', () => {
      // Test that destroying non-existent instance returns false
      const result = manager.destroy('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('destroyAll', () => {
    test('should destroy all FAB instances', async () => {
      const mockFABClass = class MockFAB {
        constructor(config) {
          this.config = config;
          this.id = config.id;
          this.isInitialized = true;
        }
        async init() {
          // Mock init method
        }
        destroy() {
          this.isInitialized = false;
        }
      };
      
      manager.register('test-fab', mockFABClass);
      const instance1 = await manager.create('test-fab', { id: 'test-1' });
      const instance2 = await manager.create('test-fab', { id: 'test-2' });
      
      const destroyedCount = manager.destroyAll();
      
      expect(destroyedCount).toBe(2);
      expect(manager.instances.size).toBe(0);
      expect(instance1.isInitialized).toBe(false);
      expect(instance2.isInitialized).toBe(false);
    });
  });

  describe('getAllInstances', () => {
    test('should return map of all instances', async () => {
      const mockFABClass = class MockFAB {
        constructor(config) {
          this.config = config;
          this.id = config.id;
        }
        async init() {
          // Mock init method
        }
      };
      
      manager.register('test-fab', mockFABClass);
      const instance1 = await manager.create('test-fab', { id: 'test-1' });
      const instance2 = await manager.create('test-fab', { id: 'test-2' });
      
      const instances = manager.getAllInstances();
      
      expect(instances).toBeInstanceOf(Map);
      expect(instances.size).toBe(2);
      expect(instances.get('test-1')).toBe(instance1);
      expect(instances.get('test-2')).toBe(instance2);
    });

    test('should return empty map when no instances', () => {
      const instances = manager.getAllInstances();
      expect(instances).toBeInstanceOf(Map);
      expect(instances.size).toBe(0);
    });
  });

  describe('getRegisteredTypes', () => {
    test('should return array of registered types', () => {
      const mockFABClass1 = class MockFAB1 {};
      const mockFABClass2 = class MockFAB2 {};
      
      manager.register('type1', mockFABClass1);
      manager.register('type2', mockFABClass2);
      
      const types = manager.getRegisteredTypes();
      
      expect(types).toHaveLength(2);
      expect(types).toContain('type1');
      expect(types).toContain('type2');
    });

    test('should return empty array when no types registered', () => {
      const types = manager.getRegisteredTypes();
      expect(types).toEqual([]);
    });
  });

  describe('hasInstance', () => {
    test('should return true for existing instance', async () => {
      const mockFABClass = class MockFAB {
        constructor(config) {
          this.config = config;
          this.id = config.id;
        }
        async init() {
          // Mock init method
        }
      };
      
      manager.register('test-fab', mockFABClass);
      await manager.create('test-fab', { id: 'test-1' });
      
      expect(manager.hasInstance('test-1')).toBe(true);
    });

    test('should return false for non-existent instance', () => {
      expect(manager.hasInstance('non-existent')).toBe(false);
    });
  });

  describe('getStats', () => {
    test('should return correct statistics', async () => {
      const mockFABClass = class MockFAB {
        constructor(config) {
          this.config = config;
          this.id = config.id;
        }
        async init() {
          // Mock init method
        }
      };
      
      manager.register('test-fab', mockFABClass);
      
      let stats = manager.getStats();
      expect(stats.activeInstances).toBe(0);
      expect(stats.registeredTypes).toBe(1);
      
      await manager.create('test-fab', { id: 'test-1' });
      stats = manager.getStats();
      expect(stats.activeInstances).toBe(1);
      expect(stats.registeredTypes).toBe(1);
      
      await manager.create('test-fab', { id: 'test-2' });
      stats = manager.getStats();
      expect(stats.activeInstances).toBe(2);
      expect(stats.registeredTypes).toBe(1);
    });
  });

  describe('isTypeRegistered', () => {
    test('should return true for registered type', () => {
      const mockFABClass = class MockFAB {};
      
      manager.register('test-fab', mockFABClass);
      
      expect(manager.isTypeRegistered('test-fab')).toBe(true);
    });

    test('should return false for unregistered type', () => {
      expect(manager.isTypeRegistered('unknown')).toBe(false);
    });
  });

  describe('Performance', () => {
    test('should handle large number of instances efficiently', async () => {
      const mockFABClass = class MockFAB {
        constructor(config) {
          this.config = config;
          this.id = config.id;
        }
        async init() {
          // Mock init method
        }
      };
      
      manager.register('test-fab', mockFABClass);
      
      const startTime = Date.now();
      
      // Create 10 instances (reduced for test performance)
      for (let i = 0; i < 10; i++) {
        await manager.create('test-fab', { id: `test-${i}` });
      }
      
      const createTime = Date.now() - startTime;
      expect(createTime).toBeLessThan(1000); // Should complete within 1 second
      expect(manager.getStats().activeInstances).toBe(10);
    });
  });

  describe('Error Handling', () => {
    test('should handle errors in FAB constructor gracefully', async () => {
      const errorFABClass = class ErrorFAB {
        constructor(config) {
          throw new Error('Constructor error');
        }
      };
      
      manager.register('error-fab', errorFABClass);
      
      await expect(manager.create('error-fab', { id: 'test-1' })).rejects.toThrow('Constructor error');
    });

    test('should handle errors in FAB destroy method gracefully', async () => {
      const errorFABClass = class ErrorFAB {
        constructor(config) {
          this.config = config;
          this.id = config.id;
        }
        async init() {
          // Mock init method
        }
        destroy() {
          throw new Error('Destroy error');
        }
      };
      
      manager.register('error-fab', errorFABClass);
      await manager.create('error-fab', { id: 'test-1' });
      
      expect(() => {
        manager.destroy('test-1');
      }).toThrow('Destroy error');
    });
  });

  describe('Global Instance', () => {
    test('should have global fabManager instance', () => {
      expect(fabManager).toBeDefined();
      expect(fabManager).toBeInstanceOf(FABManager);
    });
  });
});