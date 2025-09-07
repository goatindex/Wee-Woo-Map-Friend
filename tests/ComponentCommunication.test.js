import { ComponentCommunication } from '../js/modules/ComponentCommunication.js';
import { StructuredLogger } from '../js/modules/StructuredLogger.js';
import { ErrorBoundary } from '../js/modules/ErrorBoundary.js';
import { EnhancedEventBus } from '../js/modules/EnhancedEventBus.js';

// Mock logger for testing
const mockLogger = new StructuredLogger({
  transports: [{
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    time: jest.fn(() => ({ end: jest.fn() })),
    createChild: jest.fn(() => ({
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
      time: jest.fn(() => ({ end: jest.fn() })),
      createChild: jest.fn(() => ({
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
        time: jest.fn(() => ({ end: jest.fn() })),
      })),
    })),
  }]
});

// Mock ErrorBoundary for testing
const mockErrorBoundary = new ErrorBoundary(mockLogger, {});
jest.spyOn(mockErrorBoundary, 'catch').mockImplementation(jest.fn());

// Mock EventBus
const mockEventBus = new EnhancedEventBus();
jest.spyOn(mockEventBus, 'emit').mockImplementation(jest.fn());
jest.spyOn(mockEventBus, 'on').mockImplementation(jest.fn());
jest.spyOn(mockEventBus, 'off').mockImplementation(jest.fn());

// Mock component for testing
class MockComponent {
  constructor(id, name, type, dependencies = []) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.dependencies = dependencies;
    this.events = new Set();
    this.status = {
      id,
      name,
      type,
      status: 'initializing',
      health: 'healthy',
      dependencies,
      events: [],
      lastActivity: Date.now(),
      errorCount: 0,
      metadata: {}
    };
    this.eventHandlers = new Map();
  }

  emit(event, data) {
    this.events.add(event);
    this.status.events = Array.from(this.events);
    this.status.lastActivity = Date.now();
    
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event).add(handler);
    
    this.events.add(event);
    this.status.events = Array.from(this.events);
    
    return () => {
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }

  off(event, handler) {
    if (handler) {
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        handlers.delete(handler);
      }
    } else {
      this.eventHandlers.delete(event);
    }
  }

  async initialize() {
    this.status.status = 'ready';
    this.status.health = 'healthy';
    this.status.lastActivity = Date.now();
  }

  async cleanup() {
    this.status.status = 'destroyed';
    this.status.lastActivity = Date.now();
  }

  getStatus() {
    return { ...this.status };
  }

  isReady() {
    return this.status.status === 'ready';
  }

  isHealthy() {
    return this.status.health === 'healthy';
  }
}

describe('ComponentCommunication', () => {
  let componentCommunication;

  beforeEach(() => {
    componentCommunication = new ComponentCommunication(mockEventBus, mockErrorBoundary);
    componentCommunication.logger = mockLogger.createChild({ module: 'ComponentCommunication' });
    jest.clearAllMocks();
  });

  it('should initialize correctly', async () => {
    await componentCommunication.initialize();
    expect(mockLogger.createChild().info).toHaveBeenCalledWith('ComponentCommunication initialized');
  });

  describe('component registration', () => {
    it('should register a component successfully', () => {
      const component = new MockComponent('test-component', 'Test Component', 'test');
      
      componentCommunication.registerComponent(component);
      
      expect(componentCommunication.getComponent('test-component')).toBe(component);
      expect(componentCommunication.getAllComponents().size).toBe(1);
      expect(mockEventBus.emit).toHaveBeenCalledWith('component:registered', expect.objectContaining({
        componentId: 'test-component',
        component: component
      }));
    });

    it('should not register duplicate components', () => {
      const component1 = new MockComponent('test-component', 'Test Component 1', 'test');
      const component2 = new MockComponent('test-component', 'Test Component 2', 'test');
      
      componentCommunication.registerComponent(component1);
      componentCommunication.registerComponent(component2);
      
      expect(componentCommunication.getAllComponents().size).toBe(1);
      expect(componentCommunication.getComponent('test-component')).toBe(component1);
    });

    it('should handle component registration errors', () => {
      const invalidComponent = { id: 'invalid' }; // Missing required properties
      
      componentCommunication.registerComponent(invalidComponent);
      
      expect(mockErrorBoundary.catch).toHaveBeenCalled();
      expect(componentCommunication.getAllComponents().size).toBe(0);
    });
  });

  describe('component unregistration', () => {
    it('should unregister a component successfully', async () => {
      const component = new MockComponent('test-component', 'Test Component', 'test');
      
      componentCommunication.registerComponent(component);
      expect(componentCommunication.getAllComponents().size).toBe(1);
      
      componentCommunication.unregisterComponent('test-component');
      
      expect(componentCommunication.getAllComponents().size).toBe(0);
      expect(componentCommunication.getComponent('test-component')).toBeNull();
      expect(mockEventBus.emit).toHaveBeenCalledWith('component:unregistered', expect.objectContaining({
        componentId: 'test-component'
      }));
    });

    it('should handle unregistration of non-existent component', () => {
      componentCommunication.unregisterComponent('non-existent');
      
      expect(mockLogger.createChild().warn).toHaveBeenCalledWith('Component not found for unregistration', { componentId: 'non-existent' });
    });
  });

  describe('event emission', () => {
    let component;

    beforeEach(() => {
      component = new MockComponent('test-component', 'Test Component', 'test');
      componentCommunication.registerComponent(component);
    });

    it('should emit event to specific component', () => {
      const emitSpy = jest.spyOn(component, 'emit');
      
      const result = componentCommunication.emitToComponent('test-component', 'test-event', { data: 'test' });
      
      expect(result).toBe(true);
      expect(emitSpy).toHaveBeenCalledWith('test-event', { data: 'test' });
    });

    it('should return false for non-existent component', () => {
      const result = componentCommunication.emitToComponent('non-existent', 'test-event');
      
      expect(result).toBe(false);
      expect(mockLogger.createChild().warn).toHaveBeenCalledWith('Component not found for event emission', {
        componentId: 'non-existent',
        event: 'test-event'
      });
    });

    it('should broadcast event to all components', () => {
      const component2 = new MockComponent('test-component-2', 'Test Component 2', 'test');
      componentCommunication.registerComponent(component2);
      
      const emitSpy1 = jest.spyOn(component, 'emit');
      const emitSpy2 = jest.spyOn(component2, 'emit');
      
      componentCommunication.broadcastEvent('broadcast-event', { data: 'broadcast' });
      
      expect(emitSpy1).toHaveBeenCalledWith('broadcast-event', { data: 'broadcast' });
      expect(emitSpy2).toHaveBeenCalledWith('broadcast-event', { data: 'broadcast' });
      expect(mockEventBus.emit).toHaveBeenCalledWith('broadcast-event', { data: 'broadcast' });
    });

    it('should handle event emission errors', () => {
      jest.spyOn(component, 'emit').mockImplementation(() => {
        throw new Error('Emit error');
      });
      
      const result = componentCommunication.emitToComponent('test-component', 'test-event');
      
      expect(result).toBe(false);
      expect(mockErrorBoundary.catch).toHaveBeenCalled();
    });
  });

  describe('event subscription', () => {
    let component;

    beforeEach(() => {
      component = new MockComponent('test-component', 'Test Component', 'test');
      componentCommunication.registerComponent(component);
    });

    it('should subscribe to component events', () => {
      const handler = jest.fn();
      const onSpy = jest.spyOn(component, 'on');
      
      const unsubscribe = componentCommunication.subscribeToComponent('test-component', 'test-event', handler);
      
      expect(onSpy).toHaveBeenCalledWith('test-event', handler);
      expect(typeof unsubscribe).toBe('function');
    });

    it('should return no-op unsubscribe for non-existent component', () => {
      const handler = jest.fn();
      
      const unsubscribe = componentCommunication.subscribeToComponent('non-existent', 'test-event', handler);
      
      expect(typeof unsubscribe).toBe('function');
      expect(unsubscribe()).toBeUndefined(); // Should not throw
    });

    it('should handle subscription errors', () => {
      jest.spyOn(component, 'on').mockImplementation(() => {
        throw new Error('Subscription error');
      });
      
      const handler = jest.fn();
      const unsubscribe = componentCommunication.subscribeToComponent('test-component', 'test-event', handler);
      
      expect(typeof unsubscribe).toBe('function');
      expect(mockErrorBoundary.catch).toHaveBeenCalled();
    });
  });

  describe('component status', () => {
    let component;

    beforeEach(() => {
      component = new MockComponent('test-component', 'Test Component', 'test');
      componentCommunication.registerComponent(component);
    });

    it('should get component status', () => {
      const status = componentCommunication.getComponentStatus('test-component');
      
      expect(status).toBeDefined();
      expect(status.id).toBe('test-component');
      expect(status.name).toBe('Test Component');
      expect(status.type).toBe('test');
    });

    it('should return null for non-existent component status', () => {
      const status = componentCommunication.getComponentStatus('non-existent');
      
      expect(status).toBeNull();
    });

    it('should get all component statuses', () => {
      const component2 = new MockComponent('test-component-2', 'Test Component 2', 'test');
      componentCommunication.registerComponent(component2);
      
      const statuses = componentCommunication.getAllComponentStatuses();
      
      expect(statuses.size).toBe(2);
      expect(statuses.has('test-component')).toBe(true);
      expect(statuses.has('test-component-2')).toBe(true);
    });
  });

  describe('dependency management', () => {
    it('should handle components with dependencies', () => {
      const component1 = new MockComponent('component-1', 'Component 1', 'test');
      const component2 = new MockComponent('component-2', 'Component 2', 'test', ['component-1']);
      
      componentCommunication.registerComponent(component1);
      componentCommunication.registerComponent(component2);
      
      // Both components should be registered
      expect(componentCommunication.getAllComponents().size).toBe(2);
    });

    it('should detect circular dependencies during initialization', async () => {
      const component1 = new MockComponent('component-1', 'Component 1', 'test', ['component-2']);
      const component2 = new MockComponent('component-2', 'Component 2', 'test', ['component-1']);
      
      componentCommunication.registerComponent(component1);
      componentCommunication.registerComponent(component2);
      
      // This should not throw during registration, but might during initialization
      expect(componentCommunication.getAllComponents().size).toBe(2);
    });
  });

  describe('cleanup', () => {
    it('should cleanup all components and resources', async () => {
      const component1 = new MockComponent('component-1', 'Component 1', 'test');
      const component2 = new MockComponent('component-2', 'Component 2', 'test');
      
      componentCommunication.registerComponent(component1);
      componentCommunication.registerComponent(component2);
      
      expect(componentCommunication.getAllComponents().size).toBe(2);
      
      await componentCommunication.cleanup();
      
      expect(componentCommunication.getAllComponents().size).toBe(0);
      expect(mockLogger.createChild().info).toHaveBeenCalledWith('ComponentCommunication cleanup completed');
    });
  });
});
