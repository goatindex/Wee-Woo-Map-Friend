# DI Migration Dependency Mapping

> **📋 Cross-Reference**: See `di-migration-project.md` for migration progress tracker and detailed implementation steps.

## Overview

This document provides a comprehensive dependency audit for the WeeWoo Map Friend application's migration from hybrid architecture (direct instantiation + DI) to fully unified Dependency Injection (DI) architecture using InversifyJS.

**Generated**: 2025-01-27  
**Purpose**: Complete dependency analysis before DI migration  
**Status**: Pre-Migration Analysis

## Current Architecture State

### **Hybrid Architecture Summary**
- **Total Modules**: 66 modules identified
- **DI-Enabled Modules**: 15 modules (23%)
- **Direct Instantiation Modules**: 51 modules (77%)
- **Migration Required**: 51 modules need DI conversion

### **DI Container Status**
- **Container**: InversifyJS with 25 service bindings
- **Service Types**: 25 types defined in `Types.js`
- **Binding Rate**: 100% of defined types are bound
- **Circular Dependencies**: Some resolved, some remain

## Module Classification

### **1. DI-Enabled Modules (15 modules)**

#### **Core Services (5 modules)**
| Module | Status | Dependencies | Notes |
|--------|--------|--------------|-------|
| `StateManager` | ✅ DI | EventBus | Core state management |
| `ActiveListManager` | ✅ DI | EventBus, StateManager, ConfigurationManager, StructuredLogger, EmphasisManager, LabelManager | Recently migrated |
| `ConfigurationManager` | ✅ DI | None | Configuration service |
| `EmphasisManager` | ✅ DI | None | Feature emphasis |
| `LabelManager` | ✅ DI | None | Map labels |

#### **Component Services (5 modules)**
| Module | Status | Dependencies | Notes |
|--------|--------|--------------|-------|
| `ComponentCommunication` | ✅ DI | EventBus, ErrorBoundary, ComponentErrorBoundary, ComponentMemoryManager | Complex dependencies |
| `ComponentLifecycleManager` | ✅ DI | TBD | Lifecycle management |
| `ComponentErrorBoundary` | ✅ DI | TBD | Error handling |
| `ComponentMemoryManager` | ✅ DI | TBD | Memory management |
| `ARIAService` | ✅ DI | TBD | Accessibility |

#### **Platform Services (3 modules)**
| Module | Status | Dependencies | Notes |
|--------|--------|--------------|-------|
| `PlatformService` | ✅ DI | TBD | Platform detection |
| `MobileComponentAdapter` | ✅ DI | TBD | Mobile adaptation |
| `MobileUIOptimizer` | ✅ DI | TBD | Mobile optimization |

#### **Error Handling Services (2 modules)**
| Module | Status | Dependencies | Notes |
|--------|--------|--------------|-------|
| `UnifiedErrorHandler` | ✅ DI | TBD | Error handling |
| `CircuitBreakerStrategy` | ✅ DI | TBD | Circuit breaker |

### **2. Direct Instantiation Modules (51 modules)**

#### **Core Application Modules (8 modules)**
| Module | Current Pattern | Dependencies | Migration Priority | Notes |
|--------|----------------|--------------|-------------------|-------|
| `ApplicationBootstrap` | Direct import | Multiple | **CRITICAL** | Bootstrap orchestrator |
| `MapManager` | Direct import | StateManager, ConfigurationManager, Logger | **HIGH** | Core map functionality |
| `DeviceManager` | Direct import | Logger | **HIGH** | Device detection |
| `DataLoadingOrchestrator` | Direct import | Multiple | **HIGH** | Data loading coordination |
| `UIManager` | Direct import | Multiple | **MEDIUM** | UI coordination |
| `SearchManager` | Direct import | Multiple | **MEDIUM** | Search functionality |
| `CollapsibleManager` | Direct import | Multiple | **MEDIUM** | Sidebar management |
| `FABManager` | Direct import | Multiple | **LOW** | Floating action buttons |

#### **Data Loading Modules (8 modules)**
| Module | Current Pattern | Dependencies | Migration Priority | Notes |
|--------|----------------|--------------|-------------------|-------|
| `PolygonLoader` | Direct import | Logger, EventBus | **HIGH** | GeoJSON loading |
| `AmbulanceLoader` | Direct import | Logger, EventBus | **MEDIUM** | Ambulance data |
| `PoliceLoader` | Direct import | Logger, EventBus | **MEDIUM** | Police data |
| `CfaFacilitiesLoader` | Direct import | Logger, EventBus | **MEDIUM** | CFA data |
| `SesFacilitiesLoader` | Direct import | Logger, EventBus | **MEDIUM** | SES data |
| `SesUnitsLoader` | Direct import | Logger, EventBus | **MEDIUM** | SES units |
| `ProgressiveDataLoader` | Direct import | Logger, EventBus | **MEDIUM** | Progressive loading |
| `DataValidator` | Direct import | Logger | **LOW** | Data validation |

#### **Utility Modules (12 modules)**
| Module | Current Pattern | Dependencies | Migration Priority | Notes |
|--------|----------------|--------------|-------------------|-------|
| `CoordinateConverter` | Direct import | None | **LOW** | Coordinate conversion |
| `TextFormatter` | Direct import | None | **LOW** | Text formatting |
| `FeatureEnhancer` | Direct import | Logger | **LOW** | Feature enhancement |
| `UtilityManager` | Direct import | Logger | **LOW** | General utilities |
| `PathResolver` | Direct import | Logger | **LOW** | Path resolution |
| `EnvironmentConfig` | Direct import | Logger | **LOW** | Environment config |
| `ErrorUI` | Direct import | Logger | **LOW** | Error display |
| `StructuredLogger` | Direct import | None | **LOW** | Logging service |
| `EventBus` | Direct import | None | **LOW** | Event system |
| `BaseService` | Direct import | None | **LOW** | Base service class |
| `ComponentBase` | Direct import | EventBus | **LOW** | Component base |
| `EnhancedComponentBase` | Direct import | EventBus | **LOW** | Enhanced component base |

#### **Map-Related Modules (6 modules)**
| Module | Current Pattern | Dependencies | Migration Priority | Notes |
|--------|----------------|--------------|-------------------|-------|
| `LayerManager` | Direct import | Logger, EventBus | **HIGH** | Layer management |
| `PolygonPlusManager` | Direct import | Logger, EventBus | **MEDIUM** | Polygon management |
| `StateSynchronizer` | Direct import | Logger, EventBus | **MEDIUM** | State synchronization |
| `RefactoredMapManager` | Direct import | Multiple | **MEDIUM** | Refactored map manager |
| `RefactoredSidebarManager` | Direct import | Multiple | **MEDIUM** | Refactored sidebar |
| `RefactoredSearchManager` | Direct import | Multiple | **MEDIUM** | Refactored search |

#### **FAB Modules (4 modules)**
| Module | Current Pattern | Dependencies | Migration Priority | Notes |
|--------|----------------|--------------|-------------------|-------|
| `BaseFAB` | Direct import | EventBus | **LOW** | Base FAB class |
| `SidebarToggleFAB` | Direct import | BaseFAB | **LOW** | Sidebar toggle |
| `DocsFAB` | Direct import | BaseFAB | **LOW** | Documentation FAB |
| `MigrationDashboard` | Direct import | Multiple | **LOW** | Migration dashboard |

#### **Mobile Modules (3 modules)**
| Module | Current Pattern | Dependencies | Migration Priority | Notes |
|--------|----------------|--------------|-------------------|-------|
| `MobileDocsNavManager` | Direct import | Logger | **LOW** | Mobile navigation |
| `Router` | Direct import | Logger | **LOW** | Routing |
| `ReduxStateManager` | Direct import | Logger | **LOW** | Redux state |

## Method Call Analysis

### **Critical Method Call Patterns**

#### **Event System Method Calls**
| Module | Method | Target | Pattern | Usage Count |
|--------|--------|--------|---------|-------------|
| `LabelManager` | `globalEventBus.on` | EventBus | `globalEventBus.on('state:createLabel', callback)` | 1 |
| `ConfigurationManager` | `globalEventBus.emit` | EventBus | `globalEventBus.emit('config:change', data)` | 3 |
| `ConfigurationManager` | `globalEventBus.emit` | EventBus | `globalEventBus.emit('config:reset')` | 1 |
| `ConfigurationManager` | `globalEventBus.emit` | EventBus | `globalEventBus.emit('config:imported', data)` | 1 |
| `EmphasisManager` | `globalEventBus.emit` | EventBus | `globalEventBus.emit('emphasis:changed', data)` | 2 |

#### **State Management Method Calls**
| Module | Method | Target | Pattern | Usage Count |
|--------|--------|--------|---------|-------------|
| `LabelManager` | `stateManager.get` | StateManager | `stateManager.get('map')` | 3 |
| `LabelManager` | `stateManager.get` | StateManager | `stateManager.get('state')` | 3 |
| `LabelManager` | `stateManager.get` | StateManager | `stateManager.get('config')` | 3 |
| `ConfigurationManager` | `stateManager.set` | StateManager | `stateManager.set('config', this._config)` | 1 |
| `EmphasisManager` | `stateManager.get` | StateManager | `stateManager.get('configurationManager')` | 1 |

#### **Logger Method Calls**
| Module | Method | Target | Pattern | Usage Count |
|--------|--------|--------|---------|-------------|
| `LabelManager` | `logger.createChild` | StructuredLogger | `logger.createChild({ module: 'LabelManager' })` | 1 |
| `ConfigurationManager` | `logger.createChild` | StructuredLogger | `logger.createChild({ module: 'ConfigurationManager' })` | 1 |
| `EmphasisManager` | `logger.createChild` | StructuredLogger | `logger.createChild({ module: 'EmphasisManager' })` | 1 |

#### **Map-Related Method Calls**
| Module | Method | Target | Pattern | Usage Count |
|--------|--------|--------|---------|-------------|
| `LabelManager` | `layer.getElement` | Leaflet Layer | `layerOrMarker.getElement()` | 1 |
| `LabelManager` | `layer.bounds.getCenter` | Leaflet Layer | `layer.bounds.getCenter()` | 1 |
| `LabelManager` | `layer.getBounds` | Leaflet Layer | `layer.getBounds()` | 1 |
| `LabelManager` | `layer.getLatLngs` | Leaflet Layer | `layer.getLatLngs()` | 2 |
| `LabelManager` | `layer.getLayers` | Leaflet Layer | `layer.getLayers()` | 1 |
| `LabelManager` | `layer.setStyle` | Leaflet Layer | `layer.setStyle(style)` | 2 |
| `LabelManager` | `map.addLayer` | Leaflet Map | `marker.addTo(map)` | 1 |
| `LabelManager` | `map.removeLayer` | Leaflet Map | `map.removeLayer(marker)` | 2 |

### **Method Call Dependencies**

#### **High-Frequency Method Calls**
1. **`logger.createChild`** - Used by 15+ modules
2. **`globalEventBus.on/emit`** - Used by 10+ modules  
3. **`stateManager.get/set`** - Used by 8+ modules
4. **`layer.getElement`** - Used by 5+ modules
5. **`layer.setStyle`** - Used by 5+ modules

#### **Critical Method Call Chains**
1. **Configuration Chain**: `ConfigurationManager.get()` → `stateManager.set()` → `globalEventBus.emit()`
2. **Label Chain**: `LabelManager.createLabel()` → `layer.getElement()` → `map.addLayer()`
3. **Emphasis Chain**: `EmphasisManager.setEmphasis()` → `layer.setStyle()` → `globalEventBus.emit()`
4. **State Chain**: `StateManager.setState()` → `globalEventBus.emit()` → `watcher.callback()`

## Interface Analysis

### **Missing Interface Contracts**

#### **Critical Missing Interfaces**
| Interface | Required By | Methods | Priority |
|-----------|-------------|---------|----------|
| `IMapManager` | MapManager, LayerManager | `init()`, `getMap()`, `isReady()`, `getStatus()` | **HIGH** |
| `IDeviceManager` | DeviceManager, PlatformService | `getContext()`, `detectPlatform()`, `isMobile()` | **HIGH** |
| `ILayerManager` | LayerManager, MapManager | `addLayer()`, `removeLayer()`, `getLayers()` | **HIGH** |
| `ISearchManager` | SearchManager, UIManager | `search()`, `filter()`, `getResults()` | **MEDIUM** |
| `IUIManager` | UIManager, ApplicationBootstrap | `init()`, `update()`, `cleanup()` | **MEDIUM** |

#### **Data Loading Interfaces**
| Interface | Required By | Methods | Priority |
|-----------|-------------|---------|----------|
| `IPolygonLoader` | PolygonLoader, DataLoadingOrchestrator | `loadData()`, `processFeatures()`, `createLayers()` | **HIGH** |
| `IDataValidator` | DataValidator, PolygonLoader | `validate()`, `sanitize()`, `getErrors()` | **MEDIUM** |
| `IProgressiveDataLoader` | ProgressiveDataLoader, DataLoadingOrchestrator | `loadProgressively()`, `getProgress()` | **MEDIUM** |

#### **Utility Interfaces**
| Interface | Required By | Methods | Priority |
|-----------|-------------|---------|----------|
| `ICoordinateConverter` | CoordinateConverter, MapManager | `convert()`, `validate()`, `getProjection()` | **LOW** |
| `ITextFormatter` | TextFormatter, LabelManager | `format()`, `sanitize()`, `normalize()` | **LOW** |
| `IUtilityManager` | UtilityManager, Multiple | `debounce()`, `throttle()`, `deepClone()` | **LOW** |

### **Unused Interface Contracts**

#### **Currently Unused**
| Interface | Status | Reason |
|-----------|--------|--------|
| `IDataService` | Archived | Moved to archive/modules/ due to circular dependencies |
| `IEnvironmentService` | Minimal Usage | Only used in DependencyContainer initialization |

## Dependency Analysis

### **Critical Dependencies**

#### **StateManager Dependencies**
- **Current**: EventBus (via DI)
- **Missing**: ConfigurationManager (referenced but not injected)
- **Issue**: `this.stateManager.watch is not a function` error
- **Required Fix**: Add missing `watch` method implementation

#### **ActiveListManager Dependencies**
- **Current**: EventBus, StateManager, ConfigurationManager, StructuredLogger, EmphasisManager, LabelManager (via DI)
- **Status**: ✅ Fully migrated
- **Note**: Recently migrated, working correctly

#### **MapManager Dependencies**
- **Current**: Direct imports of StateManager, ConfigurationManager, Logger
- **Required**: Convert to DI with proper dependency injection
- **Dependencies**: StateManager, ConfigurationManager, Logger, LayerManager, CoordinateConverter

#### **DeviceManager Dependencies**
- **Current**: Direct import of Logger
- **Required**: Convert to DI with proper dependency injection
- **Dependencies**: Logger, PlatformService, ConfigurationManager

### **Circular Dependencies**

#### **Resolved Circular Dependencies**
- ✅ **DataService**: Archived to prevent circular dependencies
- ✅ **EnhancedEventBus**: Created with container to break circular dependency
- ✅ **UnifiedErrorHandler**: Bound before EnhancedEventBus creation

#### **Remaining Circular Dependencies**
- ⚠️ **StateManager ↔ ConfigurationManager**: Potential circular dependency
- ⚠️ **MapManager ↔ LayerManager**: Potential circular dependency
- ⚠️ **ApplicationBootstrap ↔ Multiple Modules**: Bootstrap orchestrates all modules

## Migration Strategy

### **Phase 1: Leaf Nodes (Low Dependencies)**
1. **CoordinateConverter** - No dependencies
2. **TextFormatter** - No dependencies
3. **StructuredLogger** - No dependencies
4. **EventBus** - No dependencies
5. **BaseService** - No dependencies

### **Phase 2: Utility Modules (Minimal Dependencies)**
1. **FeatureEnhancer** - Logger only
2. **UtilityManager** - Logger only
3. **PathResolver** - Logger only
4. **ErrorUI** - Logger only
5. **EnvironmentConfig** - Logger only

### **Phase 3: Data Loading Modules (Medium Dependencies)**
1. **DataValidator** - Logger only
2. **ProgressiveDataLoader** - Logger, EventBus
3. **PolygonLoader** - Logger, EventBus
4. **AmbulanceLoader** - Logger, EventBus
5. **PoliceLoader** - Logger, EventBus

### **Phase 4: Core Modules (High Dependencies)**
1. **LayerManager** - Logger, EventBus, StateManager
2. **MapManager** - StateManager, ConfigurationManager, Logger, LayerManager
3. **DeviceManager** - Logger, PlatformService, ConfigurationManager
4. **DataLoadingOrchestrator** - Multiple dependencies

### **Phase 5: Application Bootstrap (Critical)**
1. **ApplicationBootstrap** - All modules (migrate last)

## Interface Contract Requirements

### **Required Interface Contracts**

#### **Core Services**
- `IConfigService` - Configuration management
- `IMapManager` - Map functionality
- `IDeviceManager` - Device detection
- `ILayerManager` - Layer management
- `ISearchManager` - Search functionality

#### **Data Services**
- `IPolygonLoader` - Polygon data loading
- `IDataValidator` - Data validation
- `IProgressiveDataLoader` - Progressive loading

#### **UI Services**
- `IUIManager` - UI coordination
- `ICollapsibleManager` - Sidebar management
- `IFABManager` - Floating action buttons

### **Interface Design Patterns**

#### **Standard Interface Structure**
```typescript
interface IServiceName {
  // Lifecycle methods
  initialize(): Promise<void>;
  cleanup(): Promise<void>;
  
  // Core functionality
  // ... service-specific methods
  
  // Status methods
  isReady(): boolean;
  getStatus(): ServiceStatus;
}
```

#### **Dependency Injection Pattern**
```typescript
@injectable()
export class ServiceName implements IServiceName {
  constructor(
    @inject(TYPES.Dependency1) private dependency1: IDependency1,
    @inject(TYPES.Dependency2) private dependency2: IDependency2
  ) {}
}
```

## Risk Assessment

### **High Risk Modules**
- **ApplicationBootstrap**: Orchestrates all modules
- **MapManager**: Core functionality, complex dependencies
- **StateManager**: Everything depends on this
- **DataLoadingOrchestrator**: Complex data loading logic

### **Medium Risk Modules**
- **LayerManager**: Map integration
- **DeviceManager**: Platform detection
- **UIManager**: UI coordination
- **SearchManager**: Search functionality

### **Low Risk Modules**
- **Utility modules**: Minimal dependencies
- **FAB modules**: Simple functionality
- **Data loaders**: Isolated functionality

## Testing Strategy

### **Pre-Migration Testing**
1. **Dependency Audit**: Complete this document
2. **Interface Design**: Create all required interfaces
3. **Circular Dependency Detection**: Implement detection tools
4. **Performance Baseline**: Establish current performance metrics

### **Migration Testing**
1. **Module-by-Module Testing**: Test each module individually
2. **Integration Testing**: Test module interactions
3. **Circular Dependency Testing**: Verify no circular dependencies
4. **Error Injection Testing**: Test error handling and recovery
5. **Performance Testing**: Ensure no performance regression

### **Post-Migration Testing**
1. **End-to-End Testing**: Full application testing
2. **Mobile App Testing**: Test on mobile platforms
3. **Performance Validation**: Verify performance targets
4. **User Acceptance Testing**: Validate user experience

## Next Steps

### **Immediate Actions**
1. ✅ **Complete Dependency Audit** - This document
2. **Map Method Calls** - Identify all method calls between modules
3. **Design Interface Contracts** - Create all required interfaces
4. **Implement Circular Dependency Detection** - Add detection tools
5. **Create Migration Test Framework** - Set up testing infrastructure

### **Migration Execution**
1. **Start with Leaf Nodes** - Begin with modules having no dependencies
2. **Work Backwards** - Migrate dependencies before dependents
3. **Test Each Module** - Comprehensive testing after each migration
4. **Monitor Performance** - Track performance throughout migration
5. **Validate Functionality** - Ensure all features work correctly

## Conclusion

The WeeWoo Map Friend application currently uses a hybrid architecture with 23% of modules using DI and 77% using direct instantiation. The migration to full DI will require careful planning, interface design, and systematic testing to ensure no functionality is lost and performance is maintained.

The key challenges are:
1. **Complex Dependencies**: Many modules have intricate dependency relationships
2. **Circular Dependencies**: Some circular dependencies need resolution
3. **Interface Mismatches**: Missing interfaces need to be created
4. **Testing Complexity**: Comprehensive testing strategy required

The migration should proceed systematically, starting with leaf nodes and working backwards through the dependency tree, with StateManager migrated last since everything depends on it.

---

*This document will be updated as the migration progresses and new dependencies are discovered.*