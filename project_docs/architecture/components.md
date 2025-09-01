# Component Architecture

## Overview

The WeeWoo Map Friend application uses a modern ES6 module architecture that provides clear separation of concerns, event-driven communication, and unified state management. This architecture ensures maintainability, consistency, and extensibility across the entire application while maintaining backward compatibility with legacy systems.

## Core Principles

### 1. **ES6 Module Architecture**

- Modern ES6 modules with clear separation of concerns
- Consistent interface and behavior across modules
- Shared functionality through well-defined APIs

### 2. **Lifecycle Management**

- Standardized initialization, rendering, and cleanup
- Automatic resource management and memory leak prevention
- Predictable module behavior

### 3. **Event-Driven Communication**

- Loose coupling between modules via globalEventBus
- Publish/subscribe pattern for module interaction
- Namespaced events for organized communication

### 4. **State Management**

- Centralized state with reactive updates through StateManager
- Automatic re-rendering on state changes
- State persistence and restoration capabilities

## Modern ES6 Module Architecture

### **Module Hierarchy**

```
ES6Bootstrap (Central Coordinator)
    ↓
Specialized Managers (UIManager, StateManager, etc.)
    ↓
Feature Modules (CollapsibleManager, SearchManager, etc.)
    ↓
Legacy Compatibility Layer (Backward Compatibility)
```

### **Core ES6 Modules**

#### **ES6Bootstrap**
- Central coordination of all modern modules
- Phased initialization and dependency management
- Legacy system integration and fallback handling

#### **UIManager**
- Unified UI component coordination
- Responsive breakpoint management
- Component lifecycle and state coordination

#### **StateManager**
- Centralized state management
- Reactive updates and change propagation
- State persistence and restoration

#### **Specialized Managers**
- **CollapsibleManager**: Sidebar section management
- **SearchManager**: Advanced search functionality
- **FABManager**: Floating action button management
- **MapManager**: Map system coordination
- **LayerManager**: Layer management and optimization

## Legacy ComponentBase Class (Maintained for Compatibility)

### **Class Hierarchy**

```
EventBus (Event System)
    ↓
ComponentBase (Lifecycle & State)
    ↓
Specific Components (UI Implementation)
```

### **Key Features**

#### **Container Management**

- Automatic DOM element resolution
- Container reference tracking
- Component-to-DOM binding

#### **Lifecycle Hooks**

- `beforeInit()` - Pre-initialization setup
- `afterInit()` - Post-initialization configuration
- `onStateChange()` - State update handling
- `destroy()` - Cleanup and resource management

#### **Event System Integration**

- Inherits full EventBus functionality
- Component-specific event handling
- Automatic event cleanup on destruction

#### **State Management**

- Reactive state updates
- State change events
- State persistence capabilities

## ES6 Migration Status

### **Migration Completion: 95-98% Complete**

The project has successfully completed a comprehensive migration to ES6 modules:

#### **Completed Phases**
- ✅ **Phase 1**: Dependency Resolution & Function Registry
- ✅ **Phase 2**: State Management & Configuration
- ✅ **Phase 3**: Active List System Migration
- ✅ **Phase 4**: Map Integration & Layer Management
- ✅ **Phase 5**: Legacy Function Migration
- ✅ **Phase 6**: Core Map System Migration
- ✅ **Phase 7**: UI Components Migration

#### **Migration Benefits**
- **Maintainability**: Clear module boundaries and responsibilities
- **Performance**: Modern JavaScript engine optimizations
- **Scalability**: Easy to add new features and modules
- **Testing**: Improved testability with modular architecture
- **Development Experience**: Better debugging and development tools

## Modern ES6 Module Lifecycle

### **1. Module Initialization**

```javascript
// Modern ES6 module initialization
import { UIManager } from './UIManager.js';

class MyModule {
  async init() {
    await UIManager.init();
    // Module setup
  }
}
```

### **2. Event-Driven Communication**

```javascript
// Using globalEventBus for module communication
import { globalEventBus } from './globalEventBus.js';

globalEventBus.emit('ui:component:ready', { component: 'sidebar' });
globalEventBus.on('state:updated', this.handleStateChange.bind(this));
```

## Legacy Component Lifecycle (Maintained for Compatibility)

### **1. Construction**

```javascript
class MyComponent extends window.ComponentBase {
  constructor(container, options = {}) {
    super(container, options);
    // Component setup
  }
}
```

**What Happens:**

- Container element resolution
- Options merging with defaults
- State initialization
- Method binding

### **2. Initialization**

```javascript
async init() {
  // Called automatically if autoInit: true
  // Or manually via component.init()
}
```

**Lifecycle Sequence:**

1. **Pre-Init Hook**: `beforeInit()` - Setup, validation, dependencies
2. **Rendering**: `render()` - DOM structure creation
3. **Event Binding**: `attachEvents()` - Event listener setup
4. **Post-Init Hook**: `afterInit()` - Final configuration, external integrations

### **3. Active State**

```javascript
// Component is fully functional
// Responds to events and state changes
// Handles user interactions
```

**Capabilities:**

- Event emission and listening
- State updates and re-rendering
- User interaction handling
- External API communication

### **4. Destruction**

```javascript
destroy() {
  // Called automatically or manually
  // Cleans up all resources
}
```

**Cleanup Process:**

1. Event listener removal
2. DOM reference cleanup
3. State cleanup
4. Component marking as destroyed

## Event System

### **EventBus Integration**

Components inherit the full EventBus functionality:

```javascript
// Listen to events
this.on('user:click', (data) => {
  console.log('User clicked:', data);
});

// Emit events
this.emit('component:updated', {
  component: this,
  timestamp: Date.now(),
});

// One-time listeners
this.once('component:ready', () => {
  console.log('Component is ready');
});
```

### **Event Namespacing**

Use namespaced events for organized communication:

```javascript
// Component-specific events
this.emit('sidebar:collapsed', { section: 'layers' });
this.emit('sidebar:expanded', { section: 'layers' });

// Application-wide events
this.emit('app:stateChanged', {
  oldState: previousState,
  newState: currentState,
});
```

### **Event Priorities**

Set listener priorities for ordered execution:

```javascript
this.on('data:loaded', highPriorityHandler, { priority: 10 });
this.on('data:loaded', normalPriorityHandler, { priority: 0 });
this.on('data:loaded', lowPriorityHandler, { priority: -10 });
```

## State Management

### **State Structure**

```javascript
class MyComponent extends window.ComponentBase {
  constructor(container, options) {
    super(container, options);

    // Initialize component state
    this.state = {
      isVisible: true,
      data: null,
      loading: false,
      error: null,
    };
  }
}
```

### **State Updates**

```javascript
// Update state and trigger re-render
await this.update({
  loading: true,
  data: newData
});

// Handle state changes
async onStateChange(oldState, newState) {
  if (newState.loading !== oldState.loading) {
    this.updateLoadingUI(newState.loading);
  }

  if (newState.data !== oldState.data) {
    await this.renderData(newState.data);
  }
}
```

### **State Persistence**

```javascript
// Save state to localStorage
this.saveState('userPreferences', {
  theme: 'dark',
  sidebarCollapsed: false,
});

// Restore state from localStorage
const preferences = this.loadState('userPreferences');
if (preferences) {
  this.state = { ...this.state, ...preferences };
}
```

## Component Patterns

### **1. Basic Component Template**

```javascript
class BasicComponent extends window.ComponentBase {
  constructor(container, options = {}) {
    super(container, options);
    this.init();
  }

  async render() {
    this.container.innerHTML = `
      <div class="basic-component">
        <h3>Basic Component</h3>
        <div class="content"></div>
      </div>
    `;
  }

  attachEvents() {
    const content = this.find('.content');
    content.addEventListener('click', this.handleClick.bind(this));
  }

  handleClick(event) {
    this.emit('component:clicked', { event, component: this });
  }
}
```

### **2. Data-Driven Component**

```javascript
class DataComponent extends window.ComponentBase {
  constructor(container, options = {}) {
    super(container, {
      autoInit: false, // Don't auto-init
      ...options,
    });
  }

  async beforeInit() {
    // Load data before rendering
    this.state.data = await this.fetchData();
  }

  async render() {
    if (!this.state.data) {
      this.container.innerHTML = '<div>Loading...</div>';
      return;
    }

    this.container.innerHTML = `
      <div class="data-component">
        ${this.state.data
          .map(
            (item) => `
          <div class="item">${item.name}</div>
        `
          )
          .join('')}
      </div>
    `;
  }

  async fetchData() {
    // Data fetching logic
    const response = await fetch('/api/data');
    return response.json();
  }
}
```

### **3. Interactive Component**

```javascript
class InteractiveComponent extends window.ComponentBase {
  constructor(container, options = {}) {
    super(container, options);
  }

  async render() {
    this.container.innerHTML = `
      <div class="interactive-component">
        <button class="btn-primary">Click Me</button>
        <div class="counter">0</div>
      </div>
    `;
  }

  attachEvents() {
    const button = this.find('.btn-primary');
    button.addEventListener('click', this.handleButtonClick.bind(this));
  }

  handleButtonClick() {
    const counter = this.find('.counter');
    const currentCount = parseInt(counter.textContent) || 0;
    counter.textContent = currentCount + 1;

    this.emit('counter:incremented', {
      newCount: currentCount + 1,
    });
  }
}
```

## Real-World Component Examples

### **1. SidebarToggleFAB Component**

This is an actual component from the codebase that demonstrates real FAB implementation:

```javascript
// From js/fab/SidebarToggleFAB.js
class SidebarToggleFAB extends window.BaseFAB {
  constructor(config = {}) {
    super(
      Object.assign(
        {
          id: 'sidebarToggle',
          className: 'fab fab-button',
          icon: '☰',
          ariaLabel: 'Toggle sidebar',
          ariaControls: 'layerMenu',
          ariaExpanded: 'true',
          title: 'Hide panel',
        },
        config
      )
    );
  }

  init() {
    super.init();
    this.sidebarMenu = document.getElementById('layerMenu');
    this.restoreState();
  }

  onClick(e) {
    const minimized = this.sidebarMenu.classList.toggle('sidebar-minimized');
    this.updateButtonState(minimized);
    this.saveState('sidebarMinimized', minimized ? 1 : 0);
  }
}

// Registration with FABManager
window.FABManager.register('sidebarToggle', SidebarToggleFAB);
```

**Key Implementation Details:**

- **State Persistence**: Saves sidebar state to localStorage
- **Accessibility**: Proper ARIA attributes for screen readers
- **Event Handling**: Extends BaseFAB click handling
- **DOM Integration**: Direct manipulation of sidebar element

### **2. ActiveListManager Component**

This component manages the sidebar's active features list:

```javascript
// From js/components/ActiveListManager.js
class ActiveListManager extends window.ComponentBase {
  constructor(container, options = {}) {
    super(container, {
      autoInit: false,
      ...options,
    });

    this.state = {
      activeFeatures: new Map(),
      filterText: '',
      isUpdating: false,
    };
  }

  async beforeInit() {
    // Load existing active features from state
    this.loadActiveFeatures();
  }

  async render() {
    this.container.innerHTML = `
      <div class="active-list-container">
        <div class="active-list-header">
          <h3>All Active Features</h3>
          <input type="text" class="filter-input" placeholder="Filter features...">
        </div>
        <div class="active-features-list"></div>
      </div>
    `;
  }

  attachEvents() {
    const filterInput = this.find('.filter-input');
    filterInput.addEventListener('input', this.handleFilterChange.bind(this));
  }

  handleFilterChange(event) {
    const filterText = event.target.value.toLowerCase();
    this.update({ filterText });
    this.filterActiveFeatures();
  }

  filterActiveFeatures() {
    const featuresList = this.find('.active-features-list');
    const filteredFeatures = Array.from(this.state.activeFeatures.values()).filter((feature) =>
      feature.name.toLowerCase().includes(this.state.filterText)
    );

    this.renderFeaturesList(filteredFeatures);
  }
}
```

**Key Implementation Details:**

- **State Management**: Uses ComponentBase state system
- **Event Handling**: Filter input with debounced updates
- **DOM Manipulation**: Dynamic list rendering
- **Performance**: Efficient filtering and rendering

## FAB (Floating Action Button) Components

### **FAB Architecture**

The FAB system extends ComponentBase with specialized functionality:

```javascript
class SidebarToggleFAB extends window.BaseFAB {
  constructor(config = {}) {
    super(
      Object.assign(
        {
          id: 'sidebarToggle',
          className: 'fab fab-button',
          icon: '☰',
          ariaLabel: 'Toggle sidebar',
          ariaControls: 'layerMenu',
          ariaExpanded: 'true',
          title: 'Hide panel',
        },
        config
      )
    );
  }

  init() {
    super.init();
    this.sidebarMenu = document.getElementById('layerMenu');
    this.restoreState();
  }

  onClick(e) {
    // FAB-specific click handling
    const minimized = this.sidebarMenu.classList.toggle('sidebar-minimized');
    this.updateButtonState(minimized);
    this.saveState('sidebarMinimized', minimized ? 1 : 0);
  }
}
```

### **FAB Registration**

```javascript
// Register with FABManager
window.FABManager.register('sidebarToggle', SidebarToggleFAB);

// FABs are automatically created and managed
// No manual instantiation required
```

## Performance Considerations

### **1. Component Initialization Performance**

#### **Lazy Initialization**

```javascript
// Use autoInit: false for heavy components
class HeavyComponent extends window.ComponentBase {
  constructor(container, options = {}) {
    super(container, {
      autoInit: false, // Don't auto-initialize
      ...options,
    });
  }

  // Initialize only when needed
  async initializeWhenVisible() {
    if (this.isElementVisible()) {
      await this.init();
    }
  }
}
```

#### **Batch Initialization**

```javascript
// Initialize multiple components in batches
async function initializeComponentsBatch(components, batchSize = 5) {
  for (let i = 0; i < components.length; i += batchSize) {
    const batch = components.slice(i, i + batchSize);

    // Initialize batch
    await Promise.all(batch.map((comp) => comp.init()));

    // Yield to keep UI responsive
    if (i + batchSize < components.length) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
  }
}
```

### **2. Memory Management**

#### **Event Listener Cleanup**

```javascript
// Always clean up event listeners
destroy() {
  // Remove all event listeners
  this.off('*'); // Remove all events

  // Clear DOM references
  this.container = null;
  this._elements = null;

  // Clear timers and intervals
  if (this._timers) {
    this._timers.forEach(timer => clearTimeout(timer));
    this._timers.clear();
  }
}
```

#### **DOM Reference Management**

```javascript
// Use weak references for DOM elements
class OptimizedComponent extends window.ComponentBase {
  constructor(container, options = {}) {
    super(container, options);

    // Use WeakMap for DOM element caching
    this._elementCache = new WeakMap();
  }

  find(selector) {
    // Check cache first
    if (this._elementCache.has(this.container)) {
      const cache = this._elementCache.get(this.container);
      if (cache.has(selector)) {
        return cache.get(selector);
      }
    }

    // Find and cache
    const element = this.container.querySelector(selector);
    if (element) {
      if (!this._elementCache.has(this.container)) {
        this._elementCache.set(this.container, new Map());
      }
      this._elementCache.get(this.container).set(selector, element);
    }

    return element;
  }
}
```

### **3. Rendering Performance**

#### **Conditional Rendering**

```javascript
// Only render when necessary
async render() {
  // Check if content actually changed
  if (this._lastRenderData === JSON.stringify(this.state.data)) {
    return; // Skip rendering if data hasn't changed
  }

  // Perform rendering
  this.container.innerHTML = this.generateHTML();
  this._lastRenderData = JSON.stringify(this.state.data);
}
```

#### **Debounced Updates**

```javascript
// Debounce frequent state updates
class DebouncedComponent extends window.ComponentBase {
  constructor(container, options = {}) {
    super(container, options);
    this._updateTimeout = null;
  }

  async update(newState) {
    // Clear existing timeout
    if (this._updateTimeout) {
      clearTimeout(this._updateTimeout);
    }

    // Debounce update
    this._updateTimeout = setTimeout(async () => {
      await super.update(newState);
      this._updateTimeout = null;
    }, 100); // 100ms debounce
  }
}
```

## Best Practices

### **1. Component Design**

- **Single Responsibility**: Each component should have one clear purpose
- **Composition over Inheritance**: Use composition for complex behaviors
- **Interface Consistency**: Follow established patterns for similar components
- **Error Handling**: Implement proper error boundaries and fallbacks

### **2. Event Management**

- **Event Naming**: Use descriptive, namespaced event names
- **Listener Cleanup**: Always remove listeners in destroy()
- **Event Data**: Pass relevant data with events, not just notifications
- **Event Documentation**: Document all events and their data structure

### **3. State Management**

- **Immutable Updates**: Don't directly modify state, use update()
- **State Validation**: Validate state changes before applying
- **Performance**: Only update state when necessary
- **Persistence**: Save important state for user experience

### **4. Memory Management**

- **Event Cleanup**: Remove all event listeners on destruction
- **DOM References**: Clear DOM references to prevent memory leaks
- **Timer Cleanup**: Clear any timers or intervals
- **Resource Disposal**: Dispose of external resources (API connections, etc.)

### **5. Performance Optimization**

- **Lazy Rendering**: Only render when necessary
- **Debounced Updates**: Debounce frequent state updates
- **Conditional Rendering**: Skip rendering for unchanged content
- **Event Throttling**: Throttle high-frequency events

## Common Patterns

### **1. Component Factory**

```javascript
class ComponentFactory {
  static create(type, container, options = {}) {
    const ComponentClass = this.components.get(type);
    if (!ComponentClass) {
      throw new Error(`Unknown component type: ${type}`);
    }
    return new ComponentClass(container, options);
  }

  static register(type, ComponentClass) {
    this.components.set(type, ComponentClass);
  }

  static get components() {
    if (!this._components) {
      this._components = new Map();
    }
    return this._components;
  }
}

// Usage
ComponentFactory.register('sidebar', SidebarComponent);
const sidebar = ComponentFactory.create('sidebar', container);
```

### **2. Component Registry**

```javascript
class ComponentRegistry {
  constructor() {
    this.components = new Map();
  }

  register(id, component) {
    this.components.set(id, component);
  }

  get(id) {
    return this.components.get(id);
  }

  getAll() {
    return Array.from(this.components.values());
  }

  destroy(id) {
    const component = this.components.get(id);
    if (component) {
      component.destroy();
      this.components.delete(id);
    }
  }

  destroyAll() {
    this.components.forEach((component) => component.destroy());
    this.components.clear();
  }
}
```

### **3. Component Communication**

```javascript
// Parent component
class ParentComponent extends window.ComponentBase {
  async afterInit() {
    // Create child components
    this.childA = new ChildComponent(this.find('.child-a'));
    this.childB = new ChildComponent(this.find('.child-b'));

    // Listen to child events
    this.childA.on('data:ready', this.handleChildData.bind(this));
    this.childB.on('action:performed', this.handleChildAction.bind(this));
  }

  handleChildData(data) {
    // Process child data
    this.childB.update({ inputData: data });
  }

  handleChildAction(action) {
    // Handle child actions
    this.emit('parent:action', { action, source: 'child' });
  }
}
```

## Troubleshooting

### **Common Issues**

#### **Component Not Initializing**

- Check container element exists
- Verify constructor parameters
- Check for JavaScript errors in console
- Ensure ComponentBase is loaded

#### **Events Not Working**

- Verify event names match exactly
- Check event listener registration
- Ensure EventBus is properly loaded
- Verify component is initialized

#### **Memory Leaks**

- Check destroy() method implementation
- Verify event listener cleanup
- Clear DOM references
- Remove timers and intervals

#### **State Not Updating**

- Use update() method, don't modify state directly
- Check onStateChange implementation
- Verify state structure
- Check for JavaScript errors

### **Debugging Tips**

```javascript
// Enable component logging
const component = new MyComponent(container, {
  enableLogging: true,
});

// Listen to component lifecycle events
component.on('component:initialized', () => console.log('Initialized'));
component.on('component:stateChange', (data) => console.log('State changed:', data));
component.on('component:destroyed', () => console.log('Destroyed'));

// Check component state
console.log('Component state:', component.state);
console.log('Component options:', component.options);
console.log('Component container:', component.container);
```

## Related Documentation

- **[Architecture Overview](overview.md)** - System architecture and design
- **[Data Flow & State Management](data-flow.md)** - State management patterns
- **[Development Setup](../development/setup.md)** - Component development setup
- **[Testing Framework](../templates/testing-template.md)** - Component testing
- **[Event System](../architecture/overview.md#event-flow)** - Event system documentation in architecture overview

## Quick Reference

### **Essential Methods**

```javascript
// Lifecycle
await component.init(); // Initialize component
await component.render(); // Render DOM structure
component.destroy(); // Clean up and destroy

// State Management
await component.update(newState); // Update state and re-render
component.state; // Access current state

// Event System
component.on(event, handler); // Listen to events
component.emit(event, data); // Emit events
component.off(event, handler); // Remove event listener

// DOM Utilities
component.find(selector); // Find element in component
component.findAll(selector); // Find all elements
component.show(); // Show component
component.hide(); // Hide component
```

### **Component Template**

```javascript
class MyComponent extends window.ComponentBase {
  constructor(container, options = {}) {
    super(container, options);
  }

  async render() {
    // Implement DOM rendering
  }

  attachEvents() {
    // Implement event binding
  }

  async onStateChange(oldState, newState) {
    // Handle state changes
  }
}
```

---

_This component architecture provides the foundation for building maintainable, extensible UI components. Follow these patterns to ensure consistency and quality across the application._
