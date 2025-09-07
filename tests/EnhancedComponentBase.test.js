import { EnhancedComponentBase } from '../js/modules/EnhancedComponentBase.js';
import { StructuredLogger } from '../js/modules/StructuredLogger.js';
import { ErrorBoundary } from '../js/modules/ErrorBoundary.js';
import { EnhancedEventBus } from '../js/modules/EnhancedEventBus.js';
import { ReduxStateManager } from '../js/modules/ReduxStateManager.js';

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

// Mock StateManager
const mockStateManager = {
  get: jest.fn(),
  set: jest.fn(),
  subscribe: jest.fn(),
  dispatch: jest.fn()
};

// Test component class
class TestComponent extends EnhancedComponentBase {
  constructor(container, options = {}) {
    super(container, options, mockEventBus, mockStateManager, mockErrorBoundary);
  }

  async render() {
    this.container.innerHTML = '<div class="test-content">Test Content</div>';
  }

  attachEvents() {
    this.container.addEventListener('click', this.handleClick.bind(this));
  }

  handleClick(event) {
    this.emit('test:click', { event });
  }

  async onStateChange(oldState, newState) {
    if (newState.visible !== oldState.visible) {
      if (newState.visible) {
        this.show();
      } else {
        this.hide();
      }
    }
  }
}

describe('EnhancedComponentBase', () => {
  let container;
  let component;

  beforeEach(() => {
    // Create a test container
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
    
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (component) {
      component.destroy();
    }
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe('constructor', () => {
    it('should create component with container element', () => {
      component = new TestComponent(container);
      
      expect(component.container).toBe(container);
      expect(component.id).toBeDefined();
      expect(component.name).toBe('TestComponent');
      expect(component.type).toBe('component');
      expect(component.isInitialized).toBe(false);
      expect(component.isDestroyed).toBe(false);
    });

    it('should create component with container selector', () => {
      component = new TestComponent('#test-container');
      
      expect(component.container).toBe(container);
      expect(component.id).toBeDefined();
    });

    it('should throw error for non-existent container', () => {
      expect(() => {
        new TestComponent('#non-existent');
      }).toThrow('Container not found');
    });

    it('should merge options with defaults', () => {
      const options = {
        id: 'custom-id',
        name: 'Custom Name',
        type: 'custom-type',
        className: 'custom-class',
        enableARIA: false
      };
      
      component = new TestComponent(container, options);
      
      expect(component.id).toBe('custom-id');
      expect(component.name).toBe('Custom Name');
      expect(component.type).toBe('custom-type');
      expect(component.options.className).toBe('custom-class');
      expect(component.options.enableARIA).toBe(false);
    });
  });

  describe('initialization', () => {
    it('should initialize component successfully', async () => {
      component = new TestComponent(container);
      
      await component.init();
      
      expect(component.isInitialized).toBe(true);
      expect(component.status.status).toBe('ready');
      expect(component.status.health).toBe('healthy');
      expect(component.container.innerHTML).toBe('<div class="test-content">Test Content</div>');
    });

    it('should not initialize already initialized component', async () => {
      component = new TestComponent(container);
      
      await component.init();
      await component.init(); // Second call
      
      expect(mockLogger.createChild().warn).toHaveBeenCalledWith(
        'Component already initialized or destroyed',
        expect.any(Object)
      );
    });

    it('should not initialize destroyed component', async () => {
      component = new TestComponent(container);
      component.destroy();
      
      await component.init();
      
      expect(mockLogger.createChild().warn).toHaveBeenCalledWith(
        'Component already initialized or destroyed',
        expect.any(Object)
      );
    });

    it('should handle initialization errors', async () => {
      class FailingComponent extends TestComponent {
        async render() {
          throw new Error('Render failed');
        }
      }
      
      component = new FailingComponent(container);
      
      await expect(component.init()).rejects.toThrow('Render failed');
      
      expect(component.status.status).toBe('error');
      expect(component.status.health).toBe('unhealthy');
      expect(mockErrorBoundary.catch).toHaveBeenCalled();
    });
  });

  describe('ARIA setup', () => {
    it('should set up ARIA attributes when enabled', async () => {
      component = new TestComponent(container, { enableARIA: true });
      
      await component.init();
      
      expect(container.getAttribute('role')).toBe('region');
      expect(container.getAttribute('aria-label')).toBe('TestComponent');
    });

    it('should not set up ARIA attributes when disabled', async () => {
      component = new TestComponent(container, { enableARIA: false });
      
      await component.init();
      
      expect(container.getAttribute('role')).toBeNull();
      expect(container.getAttribute('aria-label')).toBeNull();
    });

    it('should use custom ARIA attributes from options', async () => {
      component = new TestComponent(container, {
        enableARIA: true,
        role: 'button',
        ariaLabel: 'Custom Label',
        ariaDescribedBy: 'description-id'
      });
      
      await component.init();
      
      expect(container.getAttribute('role')).toBe('button');
      expect(container.getAttribute('aria-label')).toBe('Custom Label');
      expect(container.getAttribute('aria-describedby')).toBe('description-id');
    });
  });

  describe('keyboard navigation', () => {
    it('should set up keyboard navigation when enabled', async () => {
      component = new TestComponent(container, { enableKeyboardNavigation: true });
      
      await component.init();
      
      expect(container.hasAttribute('tabindex')).toBe(true);
      expect(container.getAttribute('tabindex')).toBe('0');
    });

    it('should handle keyboard events', async () => {
      component = new TestComponent(container, { enableKeyboardNavigation: true });
      const activationSpy = jest.spyOn(component, 'handleActivation');
      
      await component.init();
      
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      container.dispatchEvent(event);
      
      expect(activationSpy).toHaveBeenCalled();
    });
  });

  describe('focus management', () => {
    it('should set up focus management when enabled', async () => {
      component = new TestComponent(container, { enableFocusManagement: true });
      const focusSpy = jest.spyOn(component, 'handleFocus');
      
      await component.init();
      
      const event = new FocusEvent('focus');
      container.dispatchEvent(event);
      
      expect(focusSpy).toHaveBeenCalled();
    });
  });

  describe('state management', () => {
    it('should update component state', async () => {
      component = new TestComponent(container);
      await component.init();
      
      await component.update({ visible: true, count: 5 });
      
      expect(component.state.visible).toBe(true);
      expect(component.state.count).toBe(5);
    });

    it('should call onStateChange when state updates', async () => {
      component = new TestComponent(container);
      const stateChangeSpy = jest.spyOn(component, 'onStateChange');
      
      await component.init();
      await component.update({ visible: true });
      
      expect(stateChangeSpy).toHaveBeenCalledWith({}, { visible: true });
    });

    it('should not update destroyed component', async () => {
      component = new TestComponent(container);
      await component.init();
      component.destroy();
      
      await component.update({ visible: true });
      
      expect(component.state.visible).toBeUndefined();
    });
  });

  describe('visibility management', () => {
    it('should show component', async () => {
      component = new TestComponent(container);
      await component.init();
      
      component.hide();
      expect(component.isVisible()).toBe(false);
      
      component.show();
      expect(component.isVisible()).toBe(true);
    });

    it('should hide component', async () => {
      component = new TestComponent(container);
      await component.init();
      
      component.hide();
      expect(component.isVisible()).toBe(false);
    });

    it('should toggle component visibility', async () => {
      component = new TestComponent(container);
      await component.init();
      
      const initialVisible = component.isVisible();
      const newVisible = component.toggle();
      
      expect(newVisible).toBe(!initialVisible);
      expect(component.isVisible()).toBe(newVisible);
    });
  });

  describe('DOM manipulation', () => {
    it('should find elements within component', async () => {
      component = new TestComponent(container);
      await component.init();
      
      const element = component.find('.test-content');
      expect(element).toBeDefined();
      expect(element.textContent).toBe('Test Content');
    });

    it('should find all elements within component', async () => {
      component = new TestComponent(container);
      await component.init();
      
      const elements = component.findAll('div');
      expect(elements.length).toBe(1);
    });

    it('should add CSS class', async () => {
      component = new TestComponent(container);
      await component.init();
      
      component.addClass('test-class');
      expect(container.classList.contains('test-class')).toBe(true);
    });

    it('should remove CSS class', async () => {
      component = new TestComponent(container);
      await component.init();
      
      component.addClass('test-class');
      component.removeClass('test-class');
      expect(container.classList.contains('test-class')).toBe(false);
    });

    it('should toggle CSS class', async () => {
      component = new TestComponent(container);
      await component.init();
      
      const result1 = component.toggleClass('test-class');
      expect(result1).toBe(true);
      expect(container.classList.contains('test-class')).toBe(true);
      
      const result2 = component.toggleClass('test-class');
      expect(result2).toBe(false);
      expect(container.classList.contains('test-class')).toBe(false);
    });
  });

  describe('event handling', () => {
    it('should emit events', async () => {
      component = new TestComponent(container);
      await component.init();
      
      const handler = jest.fn();
      component.on('test:event', handler);
      
      component.emit('test:event', { data: 'test' });
      
      expect(handler).toHaveBeenCalledWith({ data: 'test' });
      expect(mockEventBus.emit).toHaveBeenCalledWith('test:event', expect.objectContaining({
        data: 'test',
        componentId: component.id,
        component: component
      }));
    });

    it('should unsubscribe from events', async () => {
      component = new TestComponent(container);
      await component.init();
      
      const handler = jest.fn();
      const unsubscribe = component.on('test:event', handler);
      
      component.emit('test:event', { data: 'test' });
      expect(handler).toHaveBeenCalledTimes(1);
      
      unsubscribe();
      component.emit('test:event', { data: 'test' });
      expect(handler).toHaveBeenCalledTimes(1); // Should not be called again
    });

    it('should handle event errors gracefully', async () => {
      component = new TestComponent(container);
      await component.init();
      
      const handler = jest.fn(() => {
        throw new Error('Handler error');
      });
      component.on('test:event', handler);
      
      component.emit('test:event', { data: 'test' });
      
      expect(handler).toHaveBeenCalled();
      expect(mockErrorBoundary.catch).toHaveBeenCalled();
    });
  });

  describe('component status', () => {
    it('should report ready status correctly', async () => {
      component = new TestComponent(container);
      
      expect(component.isReady()).toBe(false);
      
      await component.init();
      
      expect(component.isReady()).toBe(true);
    });

    it('should report healthy status correctly', async () => {
      component = new TestComponent(container);
      
      expect(component.isHealthy()).toBe(false);
      
      await component.init();
      
      expect(component.isHealthy()).toBe(true);
    });

    it('should get component status', async () => {
      component = new TestComponent(container);
      await component.init();
      
      const status = component.getStatus();
      
      expect(status.id).toBe(component.id);
      expect(status.name).toBe(component.name);
      expect(status.type).toBe(component.type);
      expect(status.status).toBe('ready');
      expect(status.health).toBe('healthy');
    });
  });

  describe('refresh', () => {
    it('should refresh component', async () => {
      component = new TestComponent(container);
      await component.init();
      
      const renderSpy = jest.spyOn(component, 'render');
      const attachEventsSpy = jest.spyOn(component, 'attachEvents');
      
      await component.refresh();
      
      expect(renderSpy).toHaveBeenCalled();
      expect(attachEventsSpy).toHaveBeenCalled();
    });

    it('should not refresh destroyed component', async () => {
      component = new TestComponent(container);
      await component.init();
      component.destroy();
      
      const renderSpy = jest.spyOn(component, 'render');
      
      await component.refresh();
      
      expect(renderSpy).not.toHaveBeenCalled();
    });
  });

  describe('destruction', () => {
    it('should destroy component and clean up resources', async () => {
      component = new TestComponent(container);
      await component.init();
      
      const handler = jest.fn();
      component.on('test:event', handler);
      
      component.destroy();
      
      expect(component.isDestroyed).toBe(true);
      expect(component.isInitialized).toBe(false);
      expect(component.status.status).toBe('destroyed');
      expect(container._component).toBeUndefined();
    });

    it('should not destroy already destroyed component', () => {
      component = new TestComponent(container);
      component.destroy();
      
      component.destroy(); // Second call
      
      expect(component.isDestroyed).toBe(true);
    });
  });

  describe('static methods', () => {
    it('should throw error for create method', () => {
      expect(() => {
        EnhancedComponentBase.create(container);
      }).toThrow('EnhancedComponentBase.create() must be implemented by subclasses');
    });

    it('should find component from element', async () => {
      component = new TestComponent(container);
      await component.init();
      
      const foundComponent = EnhancedComponentBase.fromElement(container);
      
      expect(foundComponent).toBe(component);
    });

    it('should return null for element without component', () => {
      const element = document.createElement('div');
      const foundComponent = EnhancedComponentBase.fromElement(element);
      
      expect(foundComponent).toBeNull();
    });
  });
});
