/**
 * Test suite for ComponentBase class
 * Validates the foundational component system
 */

import { ComponentBase } from '../js/modules/ComponentBase.js';

describe('ComponentBase', () => {
  let container;
  let component;

  beforeEach(() => {
    // Create a test container
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    // Clean up
    if (component && !component.isDestroyed) {
      component.destroy();
    }
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe('Constructor', () => {
    test('should create component with DOM element', () => {
      component = new ComponentBase(container);
      
      expect(component.container).toBe(container);
      expect(component.isInitialized).toBe(false);
      expect(component.isDestroyed).toBe(false);
    });

    test('should create component with selector string', () => {
      component = new ComponentBase('#test-container');
      
      expect(component.container).toBe(container);
    });

    test('should throw error for invalid container', () => {
      expect(() => {
        new ComponentBase('#non-existent');
      }).toThrow('ComponentBase: Container not found');
    });

    test('should merge options with defaults', () => {
      const options = { customOption: 'test' };
      component = new ComponentBase(container, options);
      
      expect(component.options).toMatchObject({
        autoInit: true,
        className: 'component',
        enableLogging: true,
        customOption: 'test'
      });
    });
  });

  describe('Lifecycle', () => {
    test('should initialize component', async () => {
      // Create a mock component that implements render
      class TestComponent extends ComponentBase {
        async render() {
          this.container.innerHTML = '<div>Test Content</div>';
        }
      }

      component = new TestComponent(container, { autoInit: false });
      
      expect(component.isInitialized).toBe(false);
      
      await component.init();
      
      expect(component.isInitialized).toBe(true);
      expect(container.innerHTML).toContain('Test Content');
    });

    test('should not initialize twice', async () => {
      class TestComponent extends ComponentBase {
        async render() {
          this.renderCount = (this.renderCount || 0) + 1;
        }
      }

      component = new TestComponent(container, { autoInit: false });
      
      await component.init();
      await component.init(); // Second call should be ignored
      
      expect(component.renderCount).toBe(1);
    });

    test('should destroy component', () => {
      component = new ComponentBase(container);
      component.destroy();
      
      expect(component.isDestroyed).toBe(true);
      expect(component.isInitialized).toBe(false);
      expect(container._component).toBeUndefined();
    });
  });

  describe('State Management', () => {
    beforeEach(() => {
      class TestComponent extends ComponentBase {
        async render() {
          this.container.innerHTML = '<div>Test</div>';
        }
      }
      component = new TestComponent(container, { autoInit: false });
    });

    test('should update state', async () => {
      const newState = { test: 'value' };
      
      await component.update(newState);
      
      expect(component.state).toMatchObject(newState);
    });

    test('should emit state change events', async () => {
      const mockHandler = jest.fn();
      component.on('component:stateChange', mockHandler);
      
      await component.update({ test: 'value' });
      
      expect(mockHandler).toHaveBeenCalledWith({
        component,
        oldState: {},
        newState: { test: 'value' }
      });
    });
  });

  describe('Visibility', () => {
    beforeEach(() => {
      class TestComponent extends ComponentBase {
        async render() {
          this.container.innerHTML = '<div>Test</div>';
        }
      }
      component = new TestComponent(container);
    });

    test('should show and hide component', () => {
      component.hide();
      expect(container.hidden).toBe(true);
      
      component.show();
      expect(container.hidden).toBe(false);
    });

    test('should toggle visibility', () => {
      const result1 = component.toggle();
      expect(container.hidden).toBe(true);
      expect(result1).toBe(false);
      
      const result2 = component.toggle();
      expect(container.hidden).toBe(false);
      expect(result2).toBe(true);
    });

    test('should check visibility state', () => {
      expect(component.isVisible()).toBe(true);
      
      component.hide();
      expect(component.isVisible()).toBe(false);
    });
  });

  describe('DOM Utilities', () => {
    beforeEach(async () => {
      class TestComponent extends ComponentBase {
        async render() {
          this.container.innerHTML = `
            <div class="test-class">
              <span id="test-span">Content</span>
              <p class="test-p">Paragraph</p>
            </div>
          `;
        }
      }
      component = new TestComponent(container);
      await component.render(); // Render the component before testing
    });

    test('should find single element', () => {
      const span = component.find('#test-span');
      expect(span.tagName).toBe('SPAN');
      expect(span.textContent).toBe('Content');
    });

    test('should find multiple elements', () => {
      const elements = component.findAll('div, span, p');
      expect(elements.length).toBe(3);
    });

    test('should manage CSS classes', () => {
      component.addClass('new-class');
      expect(container.classList.contains('new-class')).toBe(true);
      
      component.removeClass('new-class');
      expect(container.classList.contains('new-class')).toBe(false);
      
      component.toggleClass('toggle-class');
      expect(container.classList.contains('toggle-class')).toBe(true);
    });
  });

  describe('Static Methods', () => {
    test('should create and initialize component', async () => {
      class TestComponent extends ComponentBase {
        async render() {
          this.container.innerHTML = '<div>Static Test</div>';
        }
      }

      component = await TestComponent.create(container);
      
      expect(component).toBeInstanceOf(TestComponent);
      expect(component.isInitialized).toBe(true);
      expect(container.innerHTML).toContain('Static Test');
    });

    test('should find component from element', () => {
      class TestComponent extends ComponentBase {
        async render() {}
      }

      component = new TestComponent(container);
      
      const found = ComponentBase.fromElement(container);
      expect(found).toBe(component);
    });
  });
});
