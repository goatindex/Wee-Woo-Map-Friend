# Architecture Decision Records (ADRs)

## ADR-001: Event-Driven Architecture vs Direct Method Calls

**Status**: Accepted  
**Date**: 2025-01-07  
**Context**: Current system uses direct method calls between components, creating tight coupling and cascade failures. **Aggressive refactor approach**: Replace entire communication system.

### Decision

We will implement an **Event-Driven Architecture (EDA)** using a centralized event bus for component communication.

### Options Considered

#### Option 1: Direct Method Calls (Current)
- **Pros**: Simple, direct, easy to understand
- **Cons**: Tight coupling, hard to test, cascade failures, difficult to extend

#### Option 2: Event-Driven Architecture
- **Pros**: Loose coupling, easy testing, resilient, extensible
- **Cons**: More complex, requires event management, debugging can be harder

#### Option 3: Hybrid Approach
- **Pros**: Best of both worlds, gradual migration
- **Cons**: Inconsistent patterns, maintenance overhead

### Tradeoffs

| Aspect | Direct Calls | Event-Driven | Hybrid |
|--------|-------------|--------------|---------|
| Coupling | Tight | Loose | Mixed |
| Testability | Hard | Easy | Medium |
| Resilience | Poor | Good | Medium |
| Complexity | Low | Medium | High |
| Extensibility | Poor | Good | Medium |

### Rationale

The current tight coupling is the root cause of system fragility. Event-driven architecture provides:
- **Resilience**: Components can fail independently
- **Testability**: Easy to mock events and test components in isolation
- **Extensibility**: New components can subscribe to existing events
- **Maintainability**: Clear separation of concerns

### Implementation

```typescript
interface EventBus {
  emit<T>(event: Event<T>): void;
  on<T>(eventType: string, handler: EventHandler<T>): void;
  off<T>(eventType: string, handler: EventHandler<T>): void;
}

interface MapDataLoadedEvent {
  type: 'map.data.loaded';
  payload: {
    category: string;
    features: GeoJSON.Feature[];
  };
}
```

---

## ADR-002: State Management: Redux Toolkit vs MobX vs Custom

**Status**: Accepted  
**Date**: 2025-01-07  
**Context**: Need centralized state management that handles complex data relationships and provides predictable updates. **Aggressive refactor approach**: Replace existing StateManager entirely.

### Decision

We will implement **Redux Toolkit (RTK)** for state management.

### Options Considered

#### Option 1: Redux Toolkit
- **Pros**: Mature, predictable, great dev tools, large ecosystem, Immer integration, TypeScript support
- **Cons**: Moderate bundle size (~50KB), learning curve

#### Option 2: MobX
- **Pros**: Simple, reactive, minimal boilerplate
- **Cons**: Magic, harder to debug, less predictable

#### Option 3: Custom Solution
- **Pros**: Tailored to needs, lightweight, full control
- **Cons**: More development, need to maintain, less community support

#### Option 4: Zustand
- **Pros**: Simple, lightweight, TypeScript-friendly
- **Cons**: Less mature, smaller ecosystem

### Tradeoffs

| Aspect | Redux Toolkit | MobX | Custom | Zustand |
|--------|---------------|------|--------|---------|
| Boilerplate | Medium | Low | Medium | Low |
| Predictability | High | Medium | High | High |
| Learning Curve | Medium | Medium | Medium | Low |
| Performance | Good | Good | Good | Good |
| Dev Tools | Excellent | Good | Custom | Good |
| Bundle Size | Medium | Medium | Small | Small |
| TypeScript | Excellent | Good | Custom | Good |
| Community | Large | Medium | Small | Growing |

### Rationale

Redux Toolkit chosen because:
- **Mature Ecosystem**: Large community, extensive documentation, proven track record
- **DevTools Integration**: Excellent debugging capabilities with Redux DevTools
- **TypeScript Support**: Built-in TypeScript support with `PayloadAction<T>`
- **Immer Integration**: Automatic immutable updates with "mutable" syntax
- **Bundle Size**: ~50KB is reasonable for the functionality provided
- **Future-Proof**: Industry standard with long-term support

### Implementation

```typescript
import { createSlice, configureStore } from '@reduxjs/toolkit';

const mapSlice = createSlice({
  name: 'map',
  initialState: {
    center: [0, 0],
    zoom: 10,
    layers: new Map()
  },
  reducers: {
    setCenter: (state, action) => {
      state.center = action.payload;
    },
    addLayer: (state, action) => {
      state.layers.set(action.payload.id, action.payload);
    }
  }
});

const store = configureStore({
  reducer: {
    map: mapSlice.reducer,
    sidebar: sidebarSlice.reducer,
    data: dataSlice.reducer
  }
});
```

---

## ADR-003: Dependency Injection: InversifyJS vs Manual vs Service Locator

**Status**: Accepted  
**Date**: 2025-01-07  
**Context**: Need to manage dependencies between components while maintaining testability and flexibility. **Aggressive refactor approach**: Replace existing module initialization entirely.

### Decision

We will implement **InversifyJS** for dependency injection.

### Options Considered

#### Option 1: InversifyJS
- **Pros**: Mature library, TypeScript support, decorator syntax, easy testing, large community
- **Cons**: Learning curve, bundle size (~15KB)

#### Option 2: Manual DI
- **Pros**: Simple, explicit, no magic
- **Cons**: Verbose, error-prone, hard to manage

#### Option 3: Service Locator
- **Pros**: Simple, flexible
- **Cons**: Hidden dependencies, hard to test, anti-pattern

#### Option 4: Awilix
- **Pros**: Simple setup, good documentation
- **Cons**: Less TypeScript support, smaller community

### Tradeoffs

| Aspect | InversifyJS | Manual | Service Locator | Awilix |
|--------|-------------|--------|-----------------|---------|
| Complexity | Medium | Low | Low | Low |
| Type Safety | Excellent | Medium | Low | Good |
| Testability | Excellent | Good | Poor | Good |
| Maintainability | Good | Medium | Poor | Good |
| Performance | Good | High | High | High |
| Bundle Size | Medium | Small | Small | Small |
| Learning Curve | Medium | Low | Low | Low |

### Rationale

InversifyJS chosen because:
- **Type Safety**: Compile-time dependency checking with decorators
- **Mature Library**: Well-established with comprehensive documentation
- **Decorator Support**: Clean, readable dependency injection syntax
- **Testing**: Easy to mock dependencies for testing
- **Community**: Large community and extensive resources
- **TypeScript First**: Designed with TypeScript in mind

### Implementation

```typescript
import { injectable, inject, Container } from 'inversify';

@injectable()
class MapManager {
  constructor(
    @inject('EventBus') private eventBus: EventBus,
    @inject('DataService') private dataService: DataService,
    @inject('StateManager') private stateManager: StateManager
  ) {}
}

@injectable()
class DataService {
  constructor(
    @inject('EventBus') private eventBus: EventBus,
    @inject('ConfigService') private configService: ConfigService
  ) {}
}

// Container setup
const container = new Container();
container.bind<EventBus>('EventBus').to(EventBus).inSingletonScope();
container.bind<DataService>('DataService').to(DataService).inSingletonScope();
container.bind<MapManager>('MapManager').to(MapManager).inSingletonScope();
```

---

## ADR-004: Error Handling: Centralized vs Distributed vs Hybrid

**Status**: Accepted  
**Date**: 2025-01-07  
**Context**: Current error handling is inconsistent and allows failures to cascade through the system.

### Decision

We will implement a **hybrid error handling approach** with centralized error boundaries and distributed error handling.

### Options Considered

#### Option 1: Centralized Error Handling
- **Pros**: Consistent, easy to manage, centralized logging
- **Cons**: Single point of failure, can be complex

#### Option 2: Distributed Error Handling
- **Pros**: Resilient, components handle own errors
- **Cons**: Inconsistent, hard to manage, duplicate code

#### Option 3: Hybrid Approach
- **Pros**: Best of both worlds, flexible, resilient
- **Cons**: More complex, requires coordination

### Tradeoffs

| Aspect | Centralized | Distributed | Hybrid |
|--------|-------------|-------------|---------|
| Consistency | High | Low | High |
| Resilience | Low | High | High |
| Complexity | Medium | Low | High |
| Maintainability | Good | Poor | Good |
| Performance | Medium | High | High |

### Rationale

Hybrid approach chosen because:
- **Resilience**: Components can handle their own errors
- **Consistency**: Centralized error boundaries for critical failures
- **Flexibility**: Different error handling strategies for different components
- **Maintainability**: Centralized logging and monitoring

### Implementation

```typescript
class ErrorBoundary {
  catch(error: Error, context: ErrorContext): ErrorResult {
    // Centralized error handling
    this.logger.error('Error caught by boundary', { error, context });
    
    // Determine recovery strategy
    const strategy = this.getRecoveryStrategy(error, context);
    return this.executeRecovery(strategy, error, context);
  }
}

class ComponentErrorHandler {
  handleError(error: Error, component: string): void {
    // Component-specific error handling
    this.logger.warn(`Error in ${component}`, { error });
    
    // Emit error event for other components
    this.eventBus.emit('component.error', { component, error });
  }
}
```

---

## ADR-005: Data Loading: Eager vs Lazy vs Progressive

**Status**: Accepted  
**Date**: 2025-01-07  
**Context**: Current data loading blocks the entire application and causes cascade failures.

### Decision

We will implement **progressive data loading** with lazy loading for non-critical data.

### Options Considered

#### Option 1: Eager Loading
- **Pros**: All data available immediately, simple
- **Cons**: Slow startup, blocks UI, memory intensive

#### Option 2: Lazy Loading
- **Pros**: Fast startup, memory efficient
- **Cons**: Loading delays, complex state management

#### Option 3: Progressive Loading
- **Pros**: Fast startup, good UX, efficient
- **Cons**: Complex implementation, state management

### Tradeoffs

| Aspect | Eager | Lazy | Progressive |
|--------|-------|------|-------------|
| Startup Time | Slow | Fast | Fast |
| Memory Usage | High | Low | Medium |
| User Experience | Poor | Good | Excellent |
| Complexity | Low | Medium | High |
| State Management | Simple | Complex | Medium |

### Rationale

Progressive loading chosen because:
- **User Experience**: Fast startup with immediate feedback
- **Performance**: Load critical data first, then background load
- **Resilience**: Non-critical data failures don't block the app
- **Scalability**: Can handle large datasets efficiently

### Implementation

```typescript
class ProgressiveDataLoader {
  async loadCriticalData(): Promise<void> {
    // Load essential data first
    await this.loadData(['ses', 'lga']);
    this.eventBus.emit('data.critical.loaded');
  }
  
  async loadSecondaryData(): Promise<void> {
    // Load secondary data in background
    await this.loadData(['cfa', 'ambulance', 'police']);
    this.eventBus.emit('data.secondary.loaded');
  }
  
  async loadOnDemand(category: string): Promise<void> {
    // Load data when needed
    await this.loadData([category]);
    this.eventBus.emit('data.loaded', { category });
  }
}
```

---

## ADR-006: Platform Support: Monolithic vs Modular vs Microservices

**Status**: Accepted  
**Date**: 2025-01-07  
**Context**: Need to support multiple platforms (GitHub Pages, mobile apps, custom domains) while maintaining code reuse.

### Decision

We will implement a **modular architecture** with platform-specific adapters.

### Options Considered

#### Option 1: Monolithic
- **Pros**: Simple, single codebase, easy to maintain
- **Cons**: Platform-specific code mixed in, hard to optimize

#### Option 2: Modular
- **Pros**: Code reuse, platform-specific optimizations, maintainable
- **Cons**: More complex, requires good architecture

#### Option 3: Microservices
- **Pros**: Independent scaling, technology diversity
- **Cons**: Overkill, complex deployment, network overhead

### Tradeoffs

| Aspect | Monolithic | Modular | Microservices |
|--------|------------|---------|---------------|
| Complexity | Low | Medium | High |
| Code Reuse | Low | High | Medium |
| Performance | Good | Good | Variable |
| Maintainability | Medium | Good | Complex |
| Deployment | Simple | Medium | Complex |

### Rationale

Modular architecture chosen because:
- **Code Reuse**: Core logic shared across platforms
- **Platform Optimization**: Platform-specific adapters for optimization
- **Maintainability**: Clear separation of concerns
- **Scalability**: Easy to add new platforms

### Implementation

```typescript
// Core platform-agnostic logic
abstract class MapManager {
  abstract renderMap(): void;
  abstract addLayer(layer: Layer): void;
}

// Platform-specific implementations
class WebMapManager extends MapManager {
  renderMap(): void {
    // Leaflet.js implementation
  }
}

class MobileMapManager extends MapManager {
  renderMap(): void {
    // Native map implementation
  }
}

// Platform detection and instantiation
class PlatformFactory {
  createMapManager(): MapManager {
    if (this.isMobile()) return new MobileMapManager();
    return new WebMapManager();
  }
}
```

---

## ADR-007: Testing Strategy: Unit vs Integration vs E2E

**Status**: Accepted  
**Date**: 2025-01-07  
**Context**: Need comprehensive testing strategy that ensures reliability and maintainability.

### Decision

We will implement a **comprehensive testing pyramid** with unit, integration, and E2E tests.

### Options Considered

#### Option 1: Unit Tests Only
- **Pros**: Fast, isolated, easy to write
- **Cons**: Don't catch integration issues, limited coverage

#### Option 2: E2E Tests Only
- **Pros**: Full user journey testing, high confidence
- **Cons**: Slow, brittle, hard to debug

#### Option 3: Testing Pyramid
- **Pros**: Balanced coverage, fast feedback, reliable
- **Cons**: More complex, requires discipline

### Tradeoffs

| Aspect | Unit Only | E2E Only | Pyramid |
|--------|-----------|----------|---------|
| Speed | Fast | Slow | Balanced |
| Reliability | High | Low | High |
| Coverage | Limited | Full | Comprehensive |
| Maintenance | Low | High | Medium |
| Debugging | Easy | Hard | Medium |

### Rationale

Testing pyramid chosen because:
- **Coverage**: Comprehensive test coverage
- **Speed**: Fast feedback for developers
- **Reliability**: Tests that don't break easily
- **Maintainability**: Balanced approach to testing

### Implementation

```typescript
// Unit Tests (70%)
describe('MapManager', () => {
  it('should render map with default configuration', () => {
    const mapManager = new MapManager(mockEventBus, mockDataService);
    mapManager.renderMap();
    expect(mockMapElement).toHaveBeenCalled();
  });
});

// Integration Tests (20%)
describe('Map and Sidebar Integration', () => {
  it('should update map when sidebar selection changes', async () => {
    const app = new Application();
    await app.initialize();
    
    app.sidebar.selectLayer('ses');
    await waitFor(() => {
      expect(app.map.hasLayer('ses')).toBe(true);
    });
  });
});

// E2E Tests (10%)
describe('User Journey', () => {
  it('should allow user to select layers and view map', async () => {
    await page.goto('/');
    await page.click('[data-testid="ses-header"]');
    await page.click('[data-testid="ses-item-1"]');
    await expect(page.locator('.map-layer')).toBeVisible();
  });
});
```

---

## ADR-008: Performance: Optimization vs Simplicity vs Flexibility

**Status**: Accepted  
**Date**: 2025-01-07  
**Context**: Need to balance performance optimization with code simplicity and flexibility.

### Decision

We will implement **performance-first design** with configurable optimization levels.

### Options Considered

#### Option 1: Simplicity First
- **Pros**: Easy to understand, quick to develop
- **Cons**: Poor performance, hard to optimize later

#### Option 2: Performance First
- **Pros**: Fast, scalable, good user experience
- **Cons**: More complex, harder to develop

#### Option 3: Balanced Approach
- **Pros**: Good performance, reasonable complexity
- **Cons**: May not be optimal for either

### Tradeoffs

| Aspect | Simplicity | Performance | Balanced |
|--------|------------|-------------|----------|
| Development Speed | Fast | Slow | Medium |
| Performance | Poor | Excellent | Good |
| Maintainability | Good | Medium | Good |
| Scalability | Poor | Excellent | Good |
| User Experience | Poor | Excellent | Good |

### Rationale

Performance-first chosen because:
- **User Experience**: Fast, responsive application
- **Scalability**: Can handle growth and new features
- **Competitive Advantage**: Better than alternatives
- **Future-Proof**: Ready for mobile and advanced features

### Implementation

```typescript
class PerformanceManager {
  private optimizationLevel: 'low' | 'medium' | 'high';
  
  constructor(level: 'low' | 'medium' | 'high' = 'medium') {
    this.optimizationLevel = level;
  }
  
  optimizeDataLoading(data: any[]): any[] {
    switch (this.optimizationLevel) {
      case 'high':
        return this.aggressiveOptimization(data);
      case 'medium':
        return this.moderateOptimization(data);
      case 'low':
        return data;
    }
  }
}
```

---

## ADR-009: Accessibility: ARIA Implementation vs Basic HTML vs Custom Solution

**Status**: Accepted  
**Date**: 2025-01-07  
**Context**: Need to ensure the application is accessible to users with disabilities, particularly screen reader users and keyboard-only users.

### Decision

We will implement **comprehensive ARIA labels and semantic HTML** with focus management for accessibility.

### Options Considered

#### Option 1: Basic HTML Accessibility
- **Pros**: Simple, minimal effort, works with screen readers
- **Cons**: Limited functionality, poor user experience, not WCAG compliant

#### Option 2: ARIA Implementation
- **Pros**: Full accessibility, WCAG 2.1 AA compliant, excellent user experience
- **Cons**: More development effort, requires testing, maintenance overhead

#### Option 3: Custom Accessibility Solution
- **Pros**: Tailored to specific needs, full control
- **Cons**: More development, need to maintain, less standardized

### Tradeoffs

| Aspect | Basic HTML | ARIA Implementation | Custom Solution |
|--------|------------|-------------------|-----------------|
| Development Effort | Low | Medium | High |
| WCAG Compliance | Poor | Excellent | Variable |
| User Experience | Poor | Excellent | Good |
| Maintenance | Low | Medium | High |
| Testing Required | Low | High | High |
| Browser Support | Good | Excellent | Variable |

### Rationale

ARIA implementation chosen because:
- **WCAG Compliance**: Meets accessibility standards
- **User Experience**: Excellent experience for disabled users
- **Legal Requirements**: Meets accessibility legal requirements
- **Future-Proof**: Standard approach that will continue to work
- **Community Support**: Large community and resources

### Implementation

```typescript
// ARIA Component Base Class
abstract class AccessibleComponent {
  protected addARIALabels(element: HTMLElement, config: ARIAConfig): void {
    if (config.role) element.setAttribute('role', config.role);
    if (config.label) element.setAttribute('aria-label', config.label);
    if (config.describedBy) element.setAttribute('aria-describedby', config.describedBy);
    if (config.expanded !== undefined) element.setAttribute('aria-expanded', config.expanded.toString());
  }
  
  protected setupFocusManagement(container: HTMLElement): void {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    // Focus management logic
  }
}

// Map Component with ARIA
class MapComponent extends AccessibleComponent {
  render(): HTMLElement {
    const mapElement = document.createElement('div');
    this.addARIALabels(mapElement, {
      role: 'application',
      label: 'Interactive map showing emergency service boundaries',
      describedBy: 'map-instructions'
    });
    return mapElement;
  }
}
```

---

## ADR-010: Documentation Strategy: Lightweight vs Comprehensive vs None

**Status**: Accepted  
**Date**: 2025-01-07  
**Context**: Need to determine appropriate documentation level for current solo development phase with potential future team growth.

### Decision

We will implement **lightweight, self-documenting code** with JSDoc comments and clear TypeScript interfaces, deferring comprehensive API documentation until team growth or external integration needs arise.

### Options Considered

#### Option 1: No Documentation
- **Pros**: Fast development, no maintenance overhead
- **Cons**: Hard to understand code later, difficult for future team members

#### Option 2: Lightweight Documentation (Chosen)
- **Pros**: Self-documenting code, JSDoc for complex functions, clear interfaces
- **Cons**: Requires discipline, some maintenance overhead

#### Option 3: Comprehensive Documentation
- **Pros**: Complete documentation, easy for new team members
- **Cons**: High maintenance overhead, slows development, overkill for solo work

### Tradeoffs

| Aspect | No Documentation | Lightweight | Comprehensive |
|--------|------------------|-------------|---------------|
| Development Speed | Fast | Medium | Slow |
| Maintenance Overhead | None | Low | High |
| Team Onboarding | Poor | Good | Excellent |
| Solo Development | Good | Excellent | Poor |
| Future Team Growth | Poor | Good | Excellent |

### Rationale

Lightweight documentation chosen because:
- **Solo Development**: Current phase doesn't require extensive documentation
- **Self-Documenting Code**: Clear interfaces and function names reduce need for docs
- **Future-Proof**: JSDoc and TypeScript provide foundation for future documentation
- **Maintenance**: Low overhead while providing value
- **Team Growth**: Can scale up documentation when team grows

### Implementation

```typescript
// Good: Self-documenting code with clear interfaces
interface MapLayer {
  id: string;
  category: string;
  visible: boolean;
  data: GeoJSON.Feature[];
}

// Good: JSDoc for complex functions
/**
 * Loads GeoJSON data for a specific category with caching
 * @param category - The data category (ses, lga, cfa, etc.)
 * @param options - Loading options including cache strategy
 * @returns Promise resolving to GeoJSON features
 */
async loadData(category: string, options?: LoadOptions): Promise<GeoJSON.Feature[]>

// Good: Clear function names
async loadCriticalData(): Promise<void>
async loadSecondaryData(): Promise<void>
```

---

## ADR-011: Phase 1 Implementation Patterns and Design Decisions

**Status**: Accepted  
**Date**: 2025-01-07  
**Context**: Phase 1 implementation required specific design decisions for ErrorBoundary, EnhancedEventBus, DependencyContainer, and ReduxStateManager implementations.

### Decision

We implemented specific patterns and design decisions for Phase 1 foundation systems based on practical implementation needs and architectural principles.

### Implementation Decisions

#### 1. ErrorBoundary Implementation Pattern
- **Circuit Breaker States**: CLOSED, OPEN, HALF_OPEN with configurable thresholds
- **Retry Strategy**: Exponential backoff with configurable max retries and initial delay
- **Graceful Degradation**: Primary/fallback operation pattern with error context
- **Integration**: Seamless integration with StructuredLogger for comprehensive error tracking

#### 2. EnhancedEventBus Design Pattern
- **Event Structure**: Typed events with unique IDs, timestamps, and rich metadata
- **Middleware Pipeline**: Sequential middleware processing with error isolation
- **Error Isolation**: Handler failures don't break other handlers or middleware
- **Backward Compatibility**: Maintains globalEventBus singleton pattern for migration

#### 3. DependencyContainer Architecture
- **Symbol-based Identifiers**: Type-safe service identification avoiding string literals
- **Singleton Scope**: Default singleton scope for all services
- **Mock Services**: Built-in mock services for testing and development
- **Extensibility**: Easy addition of new services through configureBindings method

#### 4. ReduxStateManager Structure
- **State Slices**: Four distinct slices (map, sidebar, data, ui) with clear boundaries
- **Immer Integration**: Automatic immutable updates with "mutable" syntax
- **DevTools Integration**: Full Redux DevTools support for debugging
- **Logging Integration**: Rich logging for all state changes with context

### Rationale

These implementation decisions were made to:

1. **Maintain Consistency**: All systems follow similar patterns and conventions
2. **Ensure Testability**: Comprehensive mocking and testing capabilities
3. **Provide Flexibility**: Configurable options for different use cases
4. **Enable Debugging**: Rich logging and debugging tools throughout
5. **Support Migration**: Backward compatibility where needed for smooth transition

### Implementation Examples

```typescript
// ErrorBoundary with Circuit Breaker
const errorBoundary = new ErrorBoundary(logger, {
  circuitBreaker: { failureThreshold: 5, timeout: 30000 }
});

// EnhancedEventBus with Middleware
const eventBus = new EnhancedEventBus();
eventBus.use(loggingMiddleware);
eventBus.use(errorHandlingMiddleware);

// DependencyContainer with Service Binding
container.bind<EventBus>(TYPES.EventBus).to(EnhancedEventBus).inSingletonScope();

// Redux Store with Slices
const store = configureStore({
  reducer: {
    map: mapSlice.reducer,
    sidebar: sidebarSlice.reducer,
    data: dataSlice.reducer,
    ui: uiSlice.reducer
  }
});
```

### Success Metrics

- **Error Handling**: Circuit breakers prevent cascade failures
- **Event System**: Reliable event processing with error isolation
- **Dependency Injection**: Type-safe, testable service resolution
- **State Management**: Predictable state updates with debugging support
- **Testing**: 100% test coverage for all foundation systems

---

## Summary of Decisions

| Decision | Pattern | Rationale |
|----------|---------|-----------|
| Event-Driven Architecture | Event Bus | Loose coupling, resilience |
| Redux Toolkit State Management | Redux Toolkit | Mature ecosystem, DevTools, TypeScript |
| InversifyJS DI Container | InversifyJS | Type safety, decorators, testing |
| ARIA Accessibility | ARIA Implementation | WCAG compliance, user experience |
| Lightweight Documentation | Self-documenting code + JSDoc | Solo development, future team growth |
| Hybrid Error Handling | Centralized + Distributed | Resilience, consistency |
| Progressive Data Loading | Critical first, lazy secondary | Fast startup, good UX |
| Modular Platform Support | Platform adapters | Code reuse, optimization |
| Testing Pyramid | Unit + Integration + E2E | Comprehensive coverage |
| Performance-First Design | Configurable optimization | Scalability, user experience |
| Phase 1 Implementation Patterns | Circuit Breaker + Event Bus + DI + Redux | Consistency, testability, debugging |

These decisions work together to create a resilient, maintainable, and extensible system that addresses the current fragility issues while supporting long-term growth.
