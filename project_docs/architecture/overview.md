# System Architecture Overview

## Overview

WeeWoo Map Friend is built on a modern, responsive architecture that prioritizes performance, maintainability, and cross-platform compatibility. The system combines Leaflet.js mapping with a custom component framework, progressive web app capabilities, and native mobile app support through Capacitor.

## High-Level Architecture

### System Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   index.html    │───▶│  PWA manifest   │───▶│ service worker  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                                              │
         ▼                                              ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│js/modules/main.js│───▶│ES6Bootstrap.js  │───▶│  Modern Modules │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                      │                      │
         ▼                      ▼                      ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Legacy Loaders │◀───│  UI Managers    │◀───│ StateManager    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                                              ▲
         │                                              │
         └─────────────── config.js ───────────────────┘
         │
         ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   SWC Build     │───▶│ dist/modules/   │───▶│ GitHub Pages    │
│   System        │    │ (Compiled JS)   │    │ Deployment      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Core Principles

- **ES6 Module Architecture**: Modern modular design with clear separation of concerns
- **Event-Driven Communication**: globalEventBus for loose coupling between modules
- **State Centralization**: Shared state managed through StateManager with reactive updates
- **Progressive Enhancement**: Core functionality works everywhere, enhanced features on capable devices
- **Mobile-First Design**: Responsive design with 4-tier breakpoint system (480px/768px/1024px/1200px+)
- **Performance Optimization**: Canvas rendering, async operations, and smart caching strategies
- **Legacy Compatibility**: Backward compatibility maintained during modernization
- **Modern Build System**: SWC-based compilation for TypeScript decorators and ES6 modules
- **Structured Logging**: Service-specific logging with context-aware structured output

## Key Components

### Entry Point & Core

- **`js/modules/ES6Bootstrap.js`** — Modern ES6 application initialization and module coordination
- **`js/modules/main.js`** — Primary ES6 entry point for the application
- **`js/modules/AppBootstrap.js`** — Core application initialization and lifecycle management
- **`js/modules/DeviceManager.js`** — Comprehensive device detection, platform optimization, native app behaviors
- **`js/modules/StateManager.js`** — Centralized state management for layers, names, emphasis, labels
- **`js/config.js`** — Configuration, styles, category metadata, responsive breakpoints

### Data & Services

- **`js/modules/PolygonLoader.js`** — Modern ES6 GeoJSON data loading and sidebar row creation
- **`js/modules/AmbulanceLoader.js`** — Modern ambulance station data loading
- **`js/modules/PoliceLoader.js`** — Modern police station data loading
- **`js/modules/CfaFacilitiesLoader.js`** — Modern CFA facilities data loading
- **`js/modules/SesFacilitiesLoader.js`** — Modern SES facilities data loading
- **`js/modules/SesUnitsLoader.js`** — Modern SES units data loading
- **`js/modules/MapManager.js`** — Modern map system management and layer coordination
- **`js/modules/LayerManager.js`** — Advanced layer management and optimization
- **`sw.js`** — Service Worker for offline support and performance caching

### User Interface

- **`js/modules/UIManager.js`** — Unified UI component coordination and management
- **`js/modules/CollapsibleManager.js`** — Modern collapsible sidebar section management
- **`js/modules/SearchManager.js`** — Advanced search functionality with debouncing and indexing
- **`js/modules/ActiveListManager.js`** — Modern active list management
- **`js/modules/FABManager.js`** — Modern floating action button management system

### Legacy Compatibility System

- **`ApplicationBootstrap.setupLegacyCompatibility()`** — Centralized legacy compatibility management
- **Legacy Bootstrap Functions** — `window.AppBootstrap`, `window.ApplicationBootstrap` for backward compatibility
- **Core Module Global Exposures** — Automatic global exposure of 19 core modules with error handling
- **No Duplicate Exposures** — All individual module global exposures removed and consolidated
- **Legacy Utility Functions** — `window.getMap()`, `window.BulkOperationManager`, device functions
- **Event System Compatibility** — Legacy event mapping and forwarding to modern event system

### Floating Action Buttons

- **`js/modules/BaseFAB.js`** — Base floating action button component
- **`js/modules/DocsFAB.js`** — Documentation floating action button
- **`js/modules/SidebarToggleFAB.js`** — Sidebar toggle floating action button

### Utilities & Support

- **`js/modules/CoordinateConverter.js`** — Modern coordinate conversion and projection management
- **`js/modules/ErrorUI.js`** — Advanced error display and notification system
- **`js/modules/TextFormatter.js`** — Text formatting and name normalization utilities
- **`js/modules/FeatureEnhancer.js`** — Feature enhancement and marker management
- **`js/modules/EmphasisManager.js`** — Feature emphasis management
- **`js/modules/LabelManager.js`** — Label management and positioning
- **`js/modules/UtilityManager.js`** — General utility functions
- **`js/modules/DeviceManager.js`** — Device detection and platform optimization

### Native Platform Integration

- **`js/native/features.js`** — Native app features integration with graceful web fallbacks
- **Capacitor Integration** — Native mobile app capabilities (geolocation, haptics, status bar)
- **Platform Detection** — Automatic detection of native vs. web environment
- **Feature Fallbacks** — Web API fallbacks when native features unavailable

### Testing & Development

- **`js/testing/PerformanceTestSuite.js`** — Performance testing and benchmarking framework
- **`js/testing/Phase1TestFramework.js`** — Phase 1 testing framework for migration validation
- **`js/testing/run-phase1-tests.js`** — Test execution and reporting system

### Web Workers

- **`js/workers/geometryWorker.js`** — Background geometry processing for performance optimization
- **Async Processing** — Heavy spatial calculations without blocking main thread
- **Performance Enhancement** — Improved responsiveness during complex operations

### Logging Architecture

- **`js/modules/StructuredLogger.js`** — Centralized structured logging system with multiple transports
- **`js/modules/BaseService.js`** — Base service class providing `this.logger` property to all extending services
- **Service-Specific Logging** — Each service gets its own logger instance with module context
- **Dual Logging Patterns**:
  - **Services extending BaseService**: Use `this.logger.debug()`, `this.logger.info()`, etc.
  - **Services extending BaseService**: Also have `this.log()` and `this.logError()` methods for backward compatibility
  - **DependencyContainer**: Uses direct `logger.info()` calls since it doesn't extend BaseService
- **Structured Output** — All logs include service context, timestamps, and structured metadata
- **Performance Tracking** — Built-in performance timing and metrics collection

## Event Flow

### Data Loading & User Interaction

1. **Initialization**: ES6Bootstrap coordinates modern module initialization
2. **Data Loading**: Modern loaders fetch GeoJSON data and build sidebar rows
3. **User Interaction**: Users check/uncheck items in sidebar
4. **State Update**: Modern state management handles layers, labels, emphasis
5. **UI Sync**: Unified UI management coordinates "All Active" section updates

### Component Communication

- **globalEventBus**: Modern event-driven communication between ES6 modules
- **StateManager**: Reactive state updates with modern ES6 state management
- **UIManager**: Unified UI coordination and component lifecycle management
- **Module Integration**: Seamless integration between all ES6 modules

## Technology Stack

### Frontend

- **Mapping**: Leaflet.js with custom tile layers and GeoJSON rendering
- **Geometry**: Turf.js for spatial calculations and analysis
- **Styling**: CSS Custom Properties with semantic design system
- **JavaScript**: ES6+ with modern module system and comprehensive ES6 migration completed

### PWA & Mobile

- **Service Worker**: Multi-strategy caching (cache-first, network-first, stale-while-revalidate)
- **Manifest**: Installable PWA with native app behaviors
- **Capacitor**: Native mobile app deployment to iOS/Android

### Performance

- **SVG Rendering**: High-performance polygon rendering via Leaflet.js SVG layers
- **Async Operations**: Background processing for heavy geometry calculations
- **Lazy Loading**: Progressive data loading for large datasets
- **Smart Caching**: Intelligent cache management with offline support

## Error Handling & Recovery Architecture

### **Error Classification**

- **User Errors**: Invalid inputs, out-of-bounds operations, unsupported actions
- **System Errors**: Network failures, data corruption, resource exhaustion
- **Platform Errors**: Browser compatibility, device limitations, permission issues
- **Data Errors**: Invalid GeoJSON, missing coordinates, corrupted data files

### **Recovery Strategies**

- **Graceful Degradation**: System continues functioning with reduced capabilities
- **Automatic Retry**: Network operations retry with exponential backoff
- **Fallback Data**: Use cached or default data when primary sources fail
- **User Notification**: Clear error messages with actionable recovery steps

### **Error Boundaries**

- **Component Isolation**: Errors in one component don't crash the entire system
- **State Recovery**: System can recover from error states without full restart
- **Data Preservation**: User work is preserved during error recovery
- **Performance Monitoring**: Track error rates and recovery times

### **Resource Management & Cleanup**

- **Comprehensive Cleanup**: All resources tracked and cleaned up automatically
- **Memory Management**: Prevents memory leaks from untracked resources
- **Event Listener Management**: Automatic removal of all tracked event listeners
- **Module Lifecycle**: Each module implements its own cleanup logic
- **Graceful Shutdown**: Complete application destruction when needed
- **Automatic Triggers**: Page unload/hide events trigger cleanup automatically

## Security Architecture

### **Data Validation & Integrity**

- **Input Sanitization**: All user inputs are validated and sanitized before processing
- **GeoJSON Validation**: Incoming GeoJSON data is validated for structure and coordinate integrity
- **XSS Prevention**: User-generated content is properly escaped and sanitized
- **CORS Policy**: Configured for appropriate cross-origin resource sharing

### **Platform Security**

- **File Protocol Considerations**: Development environment uses `file://` protocol with appropriate security measures
- **HTTPS Enforcement**: Production deployments enforce HTTPS for all communications
- **Service Worker Security**: Service worker implements secure caching strategies
- **Native App Security**: Capacitor apps follow platform-specific security guidelines

### **Data Source Security**

- **Source Verification**: All external data sources are verified and validated
- **Integrity Checks**: Data integrity is maintained through checksums and validation
- **Access Control**: Appropriate access controls for sensitive data
- **Audit Logging**: Security-relevant events are logged for monitoring

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

#### **Modern ES6 Architecture**
- **ES6Bootstrap**: Central coordination of all modern modules
- **Modular Design**: 15+ ES6 modules with clear separation of concerns
- **Event-Driven**: globalEventBus for loose coupling between modules
- **Performance Optimized**: Modern JavaScript features and optimizations

#### **Legacy Compatibility Status**

**What's Been Migrated (Modern ES6)**:
- ✅ **All Core Modules**: StateManager, UIManager, MapManager, etc.
- ✅ **Data Loading**: PolygonLoader, AmbulanceLoader, PoliceLoader, etc.
- ✅ **UI Components**: CollapsibleManager, SearchManager, FABManager, etc.
- ✅ **Utilities**: CoordinateConverter, ErrorUI, TextFormatter, etc.
- ✅ **Event System**: globalEventBus for module communication
- ✅ **State Management**: Modern reactive state with StateManager
- ✅ **Map State Management**: Serializable map state with circular reference handling

**What Remains Legacy (Window Globals)**:
- ⚠️ **Global State Objects**: `window.featureLayers`, `window.emphasised`, `window.namesByCategory`
- ⚠️ **Global Functions**: Some utility functions still attached to `window` object
- ⚠️ **Legacy Event Handlers**: Some DOM event handlers still use legacy patterns
- ⚠️ **Configuration**: Some configuration still uses global `window` variables

**Consolidated Legacy Compatibility System (January 2025)**:
- ✅ **Centralized Management**: All legacy compatibility handled through `ApplicationBootstrap.setupLegacyCompatibility()`
- ✅ **Modular Design**: Organized into focused sub-methods for different compatibility aspects
- ✅ **Error Resilience**: Graceful handling of missing modules with comprehensive logging
- ✅ **Performance Optimized**: Only loads modules when needed, no impact on application performance
- ✅ **19 Core Modules**: Automatically exposed globally with both classes and instances
- ✅ **No Duplicate Exposures**: All individual module global exposures removed and consolidated
- ✅ **Legacy Utility Functions**: getMap(), BulkOperationManager, device functions
- ✅ **Event System Compatibility**: Legacy events automatically mapped and forwarded

**Recent Critical Fixes (2025)**:
- ✅ **Map Initialization**: Fixed duplicate initialization and circular reference issues
- ✅ **State Serialization**: Implemented proper map state serialization strategy
- ✅ **Legacy Compatibility**: Consolidated, centralized legacy compatibility system
- ✅ **Duplicate Global Exposures**: Removed all individual module global exposures
- ✅ **Error Handling**: Enhanced error recovery with graceful degradation
- ✅ **Performance**: Optimized map loading and state management

**Migration Benefits**
- **Maintainability**: Clear module boundaries and responsibilities
- **Performance**: Modern JavaScript engine optimizations
- **Scalability**: Easy to add new features and modules
- **Testing**: Improved testability with modular architecture
- **Development Experience**: Better debugging and development tools

**Legacy Compatibility Strategy**:
- **Centralized Management**: All legacy compatibility handled in one place for easy maintenance
- **Gradual Migration**: Legacy code is gradually being replaced with ES6 modules
- **Backward Compatibility**: Legacy functions remain available during transition
- **No Breaking Changes**: Existing functionality continues to work during migration
- **Error Resilience**: Graceful handling of missing modules prevents failures
- **Future Cleanup**: Legacy code will be removed once migration is 100% complete

## Architecture Guidelines

### Development Principles

- **State Management**: Use `StateManager` for shared state with reactive updates
- **Configuration**: Add new settings to `ConfigurationManager`
- **UI Components**: Use ES6 modules in `js/modules/` directory
- **Data Loading**: Use modern loaders like `PolygonLoader` with consistent patterns
- **Error Handling**: Use `ErrorUI` module for user-facing errors

### Component Standards

- **Base Class**: All UI components must extend ComponentBase
- **Lifecycle**: Implement consistent initialization, event handling, and cleanup
- **Event System**: Use EventBus for component communication
- **State Integration**: Integrate with StateManager for reactive updates

## Build System Architecture

### SWC Compilation Pipeline

The application uses **SWC (Speedy Web Compiler)** to transform TypeScript decorators and ES6 modules into browser-compatible JavaScript while preserving the sophisticated InversifyJS dependency injection architecture.

#### Build Process Flow

```
Source Code (js/modules/) 
    ↓
SWC Compilation (TypeScript decorators + ES6 modules)
    ↓
Path Stripping (--strip-leading-paths)
    ↓
Compiled JavaScript (dist/modules/)
    ↓
GitHub Pages Deployment
```

#### Key Features

- **Performance**: 40% faster than Babel (~477ms for 75 files)
- **Path Control**: Native `--strip-leading-paths` support prevents nested directories
- **Source Maps**: Excellent debugging support with proper source paths
- **TypeScript Support**: Native decorator transformation for InversifyJS
- **ES6 Modules**: Modern module system with browser compatibility

#### Build Configuration

**Package.json Scripts**:
```json
{
  "build:js": "swc js/modules --out-dir dist --strip-leading-paths --source-maps",
  "watch:js": "swc js/modules --out-dir dist --strip-leading-paths --watch --source-maps"
}
```

**SWC Configuration** (`.swcrc`):
```json
{
  "jsc": {
    "parser": {
      "syntax": "typescript",
      "decorators": true
    },
    "transform": {
      "decoratorMetadata": true,
      "legacyDecorator": true
    },
    "target": "es2020"
  },
  "module": {
    "type": "es6"
  },
  "sourceMaps": true
}
```

#### Output Structure

```
dist/
├── modules/           # Compiled JavaScript modules
│   ├── main.js       # Entry point
│   ├── main.js.map   # Source map
│   └── ...           # Other compiled modules
├── index.html        # Static HTML
├── css/              # Stylesheets
└── geojson/          # Data files
```

#### Integration with Architecture

The build system is tightly integrated with the core architecture:

- **Dependency Injection**: Preserves InversifyJS decorators (`@injectable`, `@inject`)
- **ES6 Modules**: Maintains modern module system for browser compatibility
- **Source Maps**: Enables debugging of original TypeScript source code
- **Performance**: Fast compilation supports rapid development cycles
- **Deployment**: Clean output structure compatible with GitHub Pages

This build system enables the sophisticated dependency injection architecture while providing excellent developer experience and deployment compatibility.

## Future Architecture Roadmap

### High Priority

- **TypeScript Adoption**: Add type safety for better development experience
- **Testing Framework**: Comprehensive unit and integration testing
- **Performance Optimization**: Advanced Web Workers and caching strategies
- **Documentation Modernization**: Complete documentation updates to reflect modern architecture

### Medium Priority

- **Plugin Architecture**: Extensible system for custom data sources
- **Real-time Data**: Live emergency alerts and traffic integration
- **Advanced Search**: Filter by distance, overlap, custom criteria
- **Push Notifications**: Emergency alerts via service worker

### Low Priority

- **Export/Import**: Save and share custom map configurations
- **Analytics**: Usage tracking and performance monitoring
- **Internationalization**: Multi-language support
- **Advanced Visualization**: 3D mapping and custom renderers

## Related Documentation

- **[Component Architecture](components.md)** - Detailed component design and patterns
- **[Data Flow & State Management](data-flow.md)** - In-depth state management and data flow
- **[AppBootstrap System](app-bootstrap.md)** - Application initialization and bootstrap architecture
- **[Data Loading Architecture](data-loading.md)** - GeoJSON loading, coordinate conversion, and error handling
- **[Performance Baselines](../templates/performance-baselines.md)** - Performance measurement and monitoring standards
- **[Terms of Reference](../terms-of-reference.md)** - Standardized terminology and vocabulary reference
- **[Mobile & PWA Architecture](#pwa--mobile)** - Progressive web app and native mobile architecture
- **[Development Workflows](../development/workflows.md)** - Development processes and best practices

## Quick Navigation

- **Getting Started**: [Quick Start Guide](../getting-started/quick-start.md)
- **Development**: [Developer Setup](../development/setup.md)
- **API Reference**: [API Documentation](../api/README.md)
- **Templates**: [Documentation Templates](../templates/)

---

_This architecture overview provides the foundation for understanding the WeeWoo Map Friend system. For detailed implementation information, refer to the specific component and feature documentation._
