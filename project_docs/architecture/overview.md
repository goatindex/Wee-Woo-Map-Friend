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
│ js/bootstrap.js │───▶│   device.js     │───▶│  preloader.js   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                                              │
         ▼                                              ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   loaders/*.js  │◀───│  UI components  │◀───│  state.js       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                                              ▲
         │                                              │
         └─────────────── config.js ───────────────────┘
```

### Core Principles

- **Component-Based Architecture**: All UI components extend ComponentBase for consistent lifecycle management
- **State Centralization**: Shared state managed through state.js with reactive updates
- **Progressive Enhancement**: Core functionality works everywhere, enhanced features on capable devices
- **Mobile-First Design**: Responsive design with 4-tier breakpoint system (480px/768px/1024px/1200px+)
- **Performance Optimization**: Canvas rendering, async operations, and smart caching strategies

## Key Components

### Entry Point & Core

- **`js/bootstrap.js`** — Application initialization, map setup, component registration
- **`js/device.js`** — Comprehensive device detection, platform optimization, native app behaviors
- **`js/state.js`** — Centralized state management for layers, names, emphasis, labels
- **`js/config.js`** — Configuration, styles, category metadata, responsive breakpoints

### Data & Services

- **`js/loaders/*.js`** — GeoJSON data loading and sidebar row creation
- **`js/preloader.js`** — Progressive data loading and initialization
- **`sw.js`** — Service Worker for offline support and performance caching

### User Interface

- **`js/ui/*.js`** — Sidebar management, collapsible behavior, responsive search
- **`js/fab/*.js`** — Floating Action Button framework (BaseFAB, FABManager, SidebarToggleFAB, DocsFAB)
- **`js/components/*.js`** — Reusable UI components extending ComponentBase

### Utilities & Support

- **`js/utils/*.js`** — DOM helpers, coordinate conversion, error handling, responsive utilities
- **`js/native/*.js`** — Native platform integration and feature detection

## Event Flow

### Data Loading & User Interaction

1. **Initialization**: Bootstrap loads device context and initializes components
2. **Data Loading**: Loaders fetch GeoJSON data and build sidebar rows
3. **User Interaction**: Users check/uncheck items in sidebar
4. **State Update**: Change handlers add/remove layers, labels, emphasis
5. **UI Sync**: `updateActiveList()` rebuilds "All Active" section

### Component Communication

- **EventBus**: Centralized event system for component communication
- **StateManager**: Reactive state updates trigger UI refreshes
- **FABManager**: Manages floating action button lifecycle and interactions

## Technology Stack

### Frontend

- **Mapping**: Leaflet.js with custom tile layers and GeoJSON rendering
- **Geometry**: Turf.js for spatial calculations and analysis
- **Styling**: CSS Custom Properties with semantic design system
- **JavaScript**: ES6+ with module system (hybrid approach for compatibility)

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

## Architecture Guidelines

### Development Principles

- **State Management**: Use `state.js` for shared state, avoid tight coupling
- **Configuration**: Add new settings to `config.js`
- **UI Components**: Keep UI logic in `js/ui/` directory
- **Data Loading**: Create loaders in `js/loaders/` with consistent patterns
- **Error Handling**: Use `js/utils/errorUI.js` for user-facing errors

### Component Standards

- **Base Class**: All UI components must extend ComponentBase
- **Lifecycle**: Implement consistent initialization, event handling, and cleanup
- **Event System**: Use EventBus for component communication
- **State Integration**: Integrate with StateManager for reactive updates

## Future Architecture Roadmap

### High Priority

- **Full ES Module Migration**: Complete conversion from window globals to ES modules
- **TypeScript Adoption**: Add type safety for better development experience
- **Testing Framework**: Comprehensive unit and integration testing
- **Performance Optimization**: Advanced Web Workers and caching strategies

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
- **[Performance & Optimization](performance.md)** - Performance strategies and optimization techniques
- **[Mobile & PWA Architecture](mobile-pwa.md)** - Progressive web app and native mobile architecture
- **[Development Workflows](../development/workflows.md)** - Development processes and best practices

## Quick Navigation

- **Getting Started**: [Quick Start Guide](../getting-started/quick-start.md)
- **Development**: [Developer Setup](../development/setup.md)
- **API Reference**: [API Documentation](../api/reference.md)
- **Templates**: [Documentation Templates](../templates/)

---

_This architecture overview provides the foundation for understanding the WeeWoo Map Friend system. For detailed implementation information, refer to the specific component and feature documentation._
