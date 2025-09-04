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
         │                                              │
         ▼                                              ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Legacy Loaders │◀───│  UI Managers    │◀───│ StateManager    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                                              ▲
         │                                              │
         └─────────────── config.js ───────────────────┘
```

### Core Principles

- **ES6 Module Architecture**: Modern modular design with clear separation of concerns
- **Event-Driven Communication**: globalEventBus for loose coupling between modules
- **State Centralization**: Shared state managed through StateManager with reactive updates
- **Progressive Enhancement**: Core functionality works everywhere, enhanced features on capable devices
- **Mobile-First Design**: Responsive design with 4-tier breakpoint system (480px/768px/1024px/1200px+)
- **Performance Optimization**: Canvas rendering, async operations, and smart caching strategies
- **Legacy Compatibility**: Backward compatibility maintained during modernization

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
- **`js/native/*.js`** — Native platform integration and feature detection

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
- **Legacy Compatibility**: Backward compatibility maintained for existing functionality
- **Performance Optimized**: Modern JavaScript features and optimizations

#### **Migration Benefits**
- **Maintainability**: Clear module boundaries and responsibilities
- **Performance**: Modern JavaScript engine optimizations
- **Scalability**: Easy to add new features and modules
- **Testing**: Improved testability with modular architecture
- **Development Experience**: Better debugging and development tools

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
