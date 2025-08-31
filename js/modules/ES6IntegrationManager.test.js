/**
 * @module modules/ES6IntegrationManager.test
 * Tests for ES6 module integration functionality
 */

import { ES6IntegrationManager } from './ES6IntegrationManager.js';

describe('ES6IntegrationManager', () => {
  let manager;
  
  beforeEach(() => {
    // Create a fresh instance for each test
    manager = new ES6IntegrationManager();
    
    // Mock window object for testing
    global.window = {
      BulkOperationManager: {
        begin: jest.fn(),
        end: jest.fn(),
        isActive: jest.fn(),
        markActiveListUpdatePending: jest.fn()
      },
      beginActiveListBulk: undefined,
      endActiveListBulk: undefined,
      updateActiveList: undefined,
      beginBulkOperation: undefined,
      endBulkOperation: undefined
    };
    
    // Mock globalEventBus
    global.globalEventBus = {
      emit: jest.fn()
    };
  });
  
  afterEach(() => {
    // Clean up
    delete global.window;
    delete global.globalEventBus;
  });
  
  describe('Initialization', () => {
    test('should initialize with correct default state', () => {
      expect(manager.integrationPhase).toBe('initializing');
      expect(manager.modulesLoaded.size).toBe(0);
      expect(manager.legacyFunctions.size).toBe(0);
      expect(manager.migrationStatus.size).toBe(0);
    });
    
    test('should register existing modules during init', async () => {
      await manager.init();
      
      expect(manager.modulesLoaded.size).toBeGreaterThan(0);
      expect(manager.modulesLoaded.has('ComponentBase')).toBe(true);
      expect(manager.modulesLoaded.has('StateManager')).toBe(true);
      expect(manager.modulesLoaded.has('EventBus')).toBe(true);
    });
    
    test('should create compatibility layers', async () => {
      await manager.init();
      
      expect(manager.legacyFunctions.size).toBeGreaterThan(0);
      expect(manager.legacyFunctions.has('BulkOperationManager')).toBe(true);
    });
  });
  
  describe('Compatibility Layers', () => {
    test('should create ActiveList compatibility functions', async () => {
      await manager.init();
      
      expect(typeof window.beginActiveListBulk).toBe('function');
      expect(typeof window.endActiveListBulk).toBe('function');
      expect(typeof window.updateActiveList).toBe('function');
    });
    
    test('should create State compatibility functions', async () => {
      await manager.init();
      
      expect(typeof window.beginBulkOperation).toBe('function');
      expect(typeof window.endBulkOperation).toBe('function');
    });
    
    test('should integrate with BulkOperationManager', async () => {
      await manager.init();
      
      // Test that compatibility functions call BulkOperationManager
      window.beginBulkOperation();
      expect(window.BulkOperationManager.begin).toHaveBeenCalledWith('legacy');
      
      window.endBulkOperation();
      expect(window.BulkOperationManager.end).toHaveBeenCalled();
    });
  });
  
  describe('Module Registration', () => {
    test('should register all expected modules', async () => {
      await manager.init();
      
      const expectedModules = [
        'ComponentBase',
        'StateManager',
        'EventBus',
        'Router',
        'LegacyBridge',
        'HamburgerMenu',
        'CollapsibleManager',
        'SearchManager',
        'ActiveListManager',
        'MobileDocsNavManager'
      ];
      
      expectedModules.forEach(moduleName => {
        expect(manager.isModuleLoaded(moduleName)).toBe(true);
      });
    });
  });
  
  describe('Migration Status', () => {
    test('should track migration status correctly', async () => {
      await manager.init();
      
      expect(manager.migrationStatus.get('BulkOperationManager')).toBe('migrated');
      expect(manager.migrationStatus.get('ActiveList')).toBe('migrated');
      expect(manager.migrationStatus.get('StateManager')).toBe('migrated');
    });
  });
  
  describe('Integration Validation', () => {
    test('should validate critical functions', async () => {
      await manager.init();
      
      const status = manager.getStatus();
      expect(status.phase).toBe('ready');
      expect(status.modulesLoaded.length).toBeGreaterThan(0);
      expect(status.legacyFunctions.length).toBeGreaterThan(0);
    });
    
    test('should emit integration events', async () => {
      await manager.init();
      
      expect(globalEventBus.emit).toHaveBeenCalledWith('es6:integrationReady', {
        manager: expect.any(ES6IntegrationManager)
      });
      
      expect(globalEventBus.emit).toHaveBeenCalledWith('es6:integrationValidated', 
        expect.objectContaining({
          modulesLoaded: expect.any(Number),
          legacyFunctions: expect.any(Number),
          migrationStatus: expect.any(Object)
        })
      );
    });
  });
  
  describe('Error Handling', () => {
    test('should handle initialization failures gracefully', async () => {
      // Mock a failure
      jest.spyOn(manager, 'migrateCoreFunctions').mockRejectedValue(new Error('Migration failed'));
      
      await expect(manager.init()).rejects.toThrow('Migration failed');
      
      expect(manager.integrationPhase).toBe('failed');
      expect(globalEventBus.emit).toHaveBeenCalledWith('es6:integrationFailed', 
        expect.objectContaining({
          error: expect.any(Error),
          manager: expect.any(ES6IntegrationManager)
        })
      );
    });
  });
  
  describe('Status Reporting', () => {
    test('should provide accurate status information', async () => {
      await manager.init();
      
      const status = manager.getStatus();
      
      expect(status.phase).toBe('ready');
      expect(status.modulesLoaded).toContain('ComponentBase');
      expect(status.legacyFunctions).toContain('BulkOperationManager');
      expect(status.migrationStatus.BulkOperationManager).toBe('migrated');
    });
    
    test('should check module loading status', async () => {
      await manager.init();
      
      expect(manager.isModuleLoaded('ComponentBase')).toBe(true);
      expect(manager.isModuleLoaded('NonExistentModule')).toBe(false);
    });
    
    test('should check integration readiness', async () => {
      expect(manager.isReady()).toBe(false);
      
      await manager.init();
      
      expect(manager.isReady()).toBe(true);
    });
  });
});
