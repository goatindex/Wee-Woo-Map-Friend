/**
 * @fileoverview Tests for FABManager component
 */

import { FABManager, fabManager } from './FABManager.js';

// Mock StructuredLogger
jest.mock('./StructuredLogger.js', () => ({
  logger: {
    createChild: jest.fn(() => ({
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    }))
  }
}));

// Mock BaseFAB
class MockFAB {
  constructor(config = {}) {
    this.config = config;
    this.id = config.id || null;
    this.isInitialized = false;
  }

  async init() {
    this.isInitialized = true;
  }

  destroy() {
    this.isInitialized = false;
  }
}

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
      manager.register('test-fab', MockFAB);
      
      expect(manager.types.has('test-fab')).toBe(true);
      expect(manager.types.get('test-fab')).toBe(MockFAB);
    });

    test('should allow multiple registrations', () => {
      class AnotherFAB extends MockFAB {}
      
      manager.register('fab1', MockFAB);
      manager.register('fab2', AnotherFAB);
      
      expect(manager.types.size).toBe(2);
      expect(manager.types.get('fab1')).toBe(MockFAB);
      expect(manager.types.get('fab2')).toBe(AnotherFAB);
    });
  });

  describe('create', () => {
    test('should create FAB instance', async () => {
      manager.register('test-fab', MockFAB);
      
      const instance = await manager.create('test-fab', { id: 'my-fab' });
      
      expect(instance).toBeInstanceOf(MockFAB);
      expect(instance.id).toBe('my-fab');
      expect(instance.isInitialized).toBe(true);
      expect(manager.instances.has('my-fab')).toBe(true);
    });

    test('should return existing instance if found', async () => {
      manager.register('test-fab', MockFAB);
      
      const instance1 = await manager.create('test-fab', { id: 'my-fab' });
      const instance2 = await manager.create('test-fab', { id: 'my-fab' });
      
      expect(instance1).toBe(instance2);
      expect(manager.instances.size).toBe(1);
    });

    test('should throw error for unregistered type', async () => {
      await expect(manager.create('unknown-fab')).rejects.toThrow(
        "FAB type 'unknown-fab' not registered"
      );
    });

    test('should use type as ID if no ID provided', async () => {
      manager.register('test-fab', MockFAB);
      
      const instance = await manager.create('test-fab');
      
      expect(instance.id).toBe('test-fab');
      expect(manager.instances.has('test-fab')).toBe(true);
    });

    test('should handle creation errors', async () => {
      class ErrorFAB {
        constructor(config = {}) {
          this.config = config;
          this.id = config.id || 'error-fab';
        }
        
        async init() {
          throw new Error('Init failed');
        }
      }
      
      manager.register('error-fab', ErrorFAB);
      
      try {
        await manager.create('error-fab');
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error.message).toBe('Init failed');
        expect(manager.instances.size).toBe(0);
      }
    });
  });

  describe('getInstance', () => {
    test('should return instance if exists', async () => {
      manager.register('test-fab', MockFAB);
      const instance = await manager.create('test-fab', { id: 'my-fab' });
      
      const retrieved = manager.getInstance('my-fab');
      
      expect(retrieved).toBe(instance);
    });

    test('should return null if instance does not exist', () => {
      const retrieved = manager.getInstance('nonexistent');
      
      expect(retrieved).toBeNull();
    });
  });

  describe('getAllInstances', () => {
    test('should return all instances', async () => {
      manager.register('fab1', MockFAB);
      manager.register('fab2', MockFAB);
      
      await manager.create('fab1', { id: 'instance1' });
      await manager.create('fab2', { id: 'instance2' });
      
      const instances = manager.getAllInstances();
      
      expect(instances).toBeInstanceOf(Map);
      expect(instances.size).toBe(2);
      expect(instances.has('instance1')).toBe(true);
      expect(instances.has('instance2')).toBe(true);
    });
  });

  describe('getRegisteredTypes', () => {
    test('should return array of registered types', () => {
      manager.register('fab1', MockFAB);
      manager.register('fab2', MockFAB);
      
      const types = manager.getRegisteredTypes();
      
      expect(types).toEqual(['fab1', 'fab2']);
    });
  });

  describe('isTypeRegistered', () => {
    test('should return true for registered type', () => {
      manager.register('test-fab', MockFAB);
      
      expect(manager.isTypeRegistered('test-fab')).toBe(true);
    });

    test('should return false for unregistered type', () => {
      expect(manager.isTypeRegistered('unknown-fab')).toBe(false);
    });
  });

  describe('hasInstance', () => {
    test('should return true for existing instance', async () => {
      manager.register('test-fab', MockFAB);
      await manager.create('test-fab', { id: 'my-fab' });
      
      expect(manager.hasInstance('my-fab')).toBe(true);
    });

    test('should return false for non-existing instance', () => {
      expect(manager.hasInstance('nonexistent')).toBe(false);
    });
  });

  describe('destroy', () => {
    test('should destroy specific instance', async () => {
      manager.register('test-fab', MockFAB);
      const instance = await manager.create('test-fab', { id: 'my-fab' });
      const destroySpy = jest.spyOn(instance, 'destroy');
      
      const result = manager.destroy('my-fab');
      
      expect(result).toBe(true);
      expect(destroySpy).toHaveBeenCalled();
      expect(manager.instances.has('my-fab')).toBe(false);
    });

    test('should return false for non-existing instance', () => {
      const result = manager.destroy('nonexistent');
      
      expect(result).toBe(false);
    });
  });

  describe('destroyAll', () => {
    test('should destroy all instances', async () => {
      manager.register('fab1', MockFAB);
      manager.register('fab2', MockFAB);
      
      const instance1 = await manager.create('fab1', { id: 'instance1' });
      const instance2 = await manager.create('fab2', { id: 'instance2' });
      
      const destroy1Spy = jest.spyOn(instance1, 'destroy');
      const destroy2Spy = jest.spyOn(instance2, 'destroy');
      
      const count = manager.destroyAll();
      
      expect(count).toBe(2);
      expect(destroy1Spy).toHaveBeenCalled();
      expect(destroy2Spy).toHaveBeenCalled();
      expect(manager.instances.size).toBe(0);
    });

    test('should return 0 when no instances exist', () => {
      const count = manager.destroyAll();
      
      expect(count).toBe(0);
    });
  });

  describe('getStats', () => {
    test('should return manager statistics', async () => {
      manager.register('fab1', MockFAB);
      manager.register('fab2', MockFAB);
      
      await manager.create('fab1', { id: 'instance1' });
      
      const stats = manager.getStats();
      
      expect(stats).toEqual({
        registeredTypes: 2,
        activeInstances: 1,
        types: ['fab1', 'fab2'],
        instances: ['instance1']
      });
    });
  });

  describe('clear', () => {
    test('should clear all registrations and instances', async () => {
      manager.register('fab1', MockFAB);
      manager.register('fab2', MockFAB);
      
      await manager.create('fab1', { id: 'instance1' });
      await manager.create('fab2', { id: 'instance2' });
      
      manager.clear();
      
      expect(manager.types.size).toBe(0);
      expect(manager.instances.size).toBe(0);
    });
  });
});

describe('fabManager singleton', () => {
  test('should be instance of FABManager', () => {
    expect(fabManager).toBeInstanceOf(FABManager);
  });

  test('should be available on window object', () => {
    expect(window.FABManager).toBe(fabManager);
  });
});
