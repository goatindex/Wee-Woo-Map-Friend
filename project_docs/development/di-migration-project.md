# Dependency Injection Migration Project

> **📋 Cross-Reference**: See `di-migration-mapping.md` for complete dependency analysis and method call mapping.

## Migration Progress Tracker

| Module | Status | Phase | Dependencies | Notes |
|--------|--------|-------|--------------|-------|
| **Phase 1: Leaf Nodes** | | | | |
| CoordinateConverter | ✅ Complete | 1 | None | DI migration successful |
| TextFormatter | ✅ Complete | 1 | None | DI migration successful |
| StructuredLogger | ✅ Complete | 1 | None | DI migration successful |
| EventBus | ✅ Complete | 1 | None | DI migration successful |
| BaseService | ✅ Complete | 1 | None | DI migration successful |
| **Phase 2: Utilities** | | | | |
| FeatureEnhancer | ✅ Complete | 2 | EventBus, StateManager, StructuredLogger | DI migration successful |
| UtilityManager | ✅ Complete | 2 | StructuredLogger | DI migration successful |
| PathResolver | ✅ Complete | 2 | StructuredLogger | DI migration successful |
| ErrorUI | ✅ Complete | 2 | StructuredLogger | Successfully migrated with constructor bug fix |
| EnvironmentConfig | ✅ Complete | 2 | PathResolver, StructuredLogger | Successfully migrated with method name verification |
| **Phase 3: Data Loaders** | | | | |
| DataValidator | ✅ Complete | 3 | StructuredLogger, EventBus | Successfully migrated with event system integration |
| ProgressiveDataLoader | ✅ Complete | 3 | ConfigService, EventBus, StructuredLogger | Successfully migrated with BaseService inheritance |
| PolygonLoader | ✅ Complete | 3 | EventBus, StateManager, ConfigurationManager, LayerManager, StructuredLogger, LabelManager | Successfully migrated with complex dependency chain |
| AmbulanceLoader | ✅ Complete | 3 | EventBus, StateManager, ConfigurationManager, LayerManager, StructuredLogger | Successfully migrated with constructor bug fix |
| PoliceLoader | ✅ Complete | 3 | EventBus, StateManager, ConfigurationManager, LayerManager, StructuredLogger | Successfully migrated with constructor bug fix |
| **Phase 4: Core Modules** | | | | |
| LayerManager | ✅ Complete | 4 | EventBus, StateManager, ConfigurationManager | Successfully migrated with Leaflet library mocking |
| MapManager | ✅ Complete | 4 | EventBus, StateManager, ConfigurationManager, StructuredLogger | Successfully migrated with comprehensive browser API mocking |
| DeviceManager | ✅ Complete | 4 | StructuredLogger | Successfully migrated with comprehensive browser API mocking |
| DataLoadingOrchestrator | ✅ Complete | 4 | EventBus, StateManager, ConfigurationManager, StructuredLogger | Successfully migrated with cascading dependency resolution |
| EmphasisManager | ✅ Complete | 4 | StructuredLogger, StateManager | Successfully migrated from mock logger to proper DI with BaseService inheritance |
| **Phase 5: Application Bootstrap** | | | | |
| ApplicationBootstrap | ⏳ Pending | 5 | All modules | Migrate last |

**Legend**: 🔄 In Progress | ⏳ Pending | ✅ Complete | ❌ Failed

## Lessons Learned from CoordinateConverter Migration

### ✅ **Critical Success Factors**

1. **Singleton Removal is Essential**
   - **Issue**: Module-level singleton instantiation conflicts with DI container
   - **Solution**: Remove `export const instance = new Class()` patterns
   - **Impact**: Prevents "undefined is not an object" errors during module loading

2. **Legacy Function Management**
   - **Issue**: Legacy compatibility functions break when singleton is removed
   - **Solution**: Replace with error messages guiding users to DI container
   - **Pattern**: 
     ```javascript
     export const legacyFunction = () => {
       throw new Error('Legacy function not available. Use DI container to get instance.');
     };
     ```

3. **Core Module Dependencies Must Be Fixed First**
   - **Issue**: Target module may depend on other modules that have issues
   - **Solution**: Fix StateManager.watch() and MapManager panes before DI migration
   - **Discovery**: StateManager missing `watch()` method (alias for `subscribe()`)
   - **Discovery**: MapManager panes references need null checks

4. **Testing Strategy Validation**
   - **Success**: DI container resolution testing works perfectly
   - **Success**: Functional testing (coordinate conversion) validates end-to-end
   - **Success**: Logger injection testing confirms proper dependency resolution

## Lessons Learned from TextFormatter Migration

### ✅ **New Critical Success Factors**

5. **Enhanced Legacy Function Audit**
   - **Issue**: TextFormatter had 7 legacy functions vs CoordinateConverter's 3
   - **Solution**: Audit ALL exported functions, not just the main singleton
   - **Pattern**: Check for `export const functionName = ...` patterns
   - **Impact**: Prevents missing legacy function updates

6. **Dependency Usage Verification**
   - **Issue**: Some dependencies are imported but not actively used
   - **Solution**: Verify actual usage vs. imported dependencies
   - **Discovery**: TextFormatter imports StateManager but doesn't use it in tested methods
   - **Application**: Only inject dependencies that are actually used

7. **Event Bus Dependency Pattern**
   - **Issue**: TextFormatter uses EventBus for reactive text formatting events
   - **Solution**: EventBus injection pattern is well-established and proven
   - **Pattern**: `@inject(TYPES.EventBus) private eventBus`
   - **Impact**: EventBus dependency can be replicated across modules

8. **Direct Module Testing Strategy**
   - **Issue**: DI container testing fails when application bootstrap fails
   - **Solution**: Use direct module testing as primary validation method
   - **Discovery**: Can validate DI migration success independently of full application
   - **Application**: Test DI pattern with mock dependencies directly

## Lessons Learned from StructuredLogger Migration

### ✅ **New Critical Success Factors**

9. **BaseService Circular Dependency Prevention**
   - **Issue**: BaseService importing services directly creates circular dependencies
   - **Solution**: BaseService must use DI for all its dependencies
   - **Discovery**: BaseService was importing StructuredLogger directly, causing circular dependency
   - **Application**: Always use DI in BaseService, never direct imports

10. **Leaf Node BaseService Decision**
    - **Issue**: True leaf nodes (no dependencies) shouldn't extend BaseService
    - **Solution**: Only extend BaseService when service has actual dependencies
    - **Discovery**: StructuredLogger had no dependencies but was extending BaseService
    - **Application**: Audit dependencies before deciding to extend BaseService

11. **Method Name Verification**
    - **Issue**: Test methods must match actual method names in the service
    - **Solution**: Always verify actual method names before writing tests
    - **Discovery**: Test called `getCurrentLevel()` but method was `getLevel()`
    - **Application**: Use `grep` to find actual method definitions before testing

12. **Legacy Function Complexity Scaling**
    - **Issue**: Some services have many more legacy functions than others
    - **Solution**: Always audit ALL exported functions comprehensively
    - **Discovery**: StructuredLogger had 6 legacy functions vs CoordinateConverter's 3
    - **Application**: Use comprehensive legacy function mapping for all services

## Lessons Learned from EventBus Migration

### ✅ **New Critical Success Factors**

13. **Event System Dependency Pattern**
    - **Issue**: EventBus is a foundational service used by many modules
    - **Solution**: EventBus injection pattern is well-established and proven
    - **Pattern**: `@inject(TYPES.EventBus) private eventBus`
    - **Impact**: EventBus dependency can be replicated across modules

14. **Legacy Function Object Pattern**
    - **Issue**: Some services export both singleton and convenience functions
    - **Solution**: Replace both singleton and convenience functions with error-throwing stubs
    - **Discovery**: EventBus had 6 legacy functions (singleton + 5 convenience functions)
    - **Application**: Always audit both singleton and convenience function exports

15. **Event System Testing Strategy**
    - **Issue**: Event systems need specific testing patterns for event emission/listening
    - **Solution**: Test event emission, listener registration, and cleanup
    - **Discovery**: EventBus testing requires testing event flow, not just method availability
    - **Application**: Test event systems with actual event emission and listener verification

## Lessons Learned from BaseService Migration

### ✅ **New Critical Success Factors**

16. **BaseService Already DI-Enabled**
    - **Issue**: BaseService was already using DI pattern but not properly bound
    - **Solution**: Ensure BaseService is properly bound in DependencyContainer
    - **Discovery**: BaseService was already using `@injectable()` and `@inject()` decorators
    - **Application**: Check existing DI patterns before assuming migration is needed

17. **BaseService Testing Strategy**
    - **Issue**: BaseService is a base class, not a standalone service
    - **Solution**: Test BaseService with mock dependencies to verify DI pattern
    - **Discovery**: BaseService testing requires testing inheritance and method availability
    - **Application**: Test base classes with mock dependencies to verify DI integration

### **📊 Pattern Summary from EventBus & BaseService Migrations**

#### **Event System Patterns**
- **EventBus Dependency**: `@inject(TYPES.EventBus) private eventBus`
- **Event Testing**: Test event flow, not just method availability
- **Event Cleanup**: Always test listener registration and cleanup

#### **Legacy Function Patterns**
- **Object Pattern**: Replace both singleton and convenience functions
- **Audit Pattern**: Always audit both singleton and convenience function exports
- **Error Pattern**: Use consistent error messages for all legacy functions

#### **Migration Status Patterns**
- **Verification Pattern**: Check existing DI patterns before assuming migration is needed
- **Binding Pattern**: Ensure proper binding in DependencyContainer
- **Testing Pattern**: Use appropriate testing strategy for each module type

#### **Testing Patterns**
- **Event System Testing**: Test event emission, listener registration, and cleanup
- **Base Class Testing**: Test with mock dependencies to verify DI pattern
- **Direct Module Testing**: Primary method for validation
- **DI Container Testing**: Secondary method (fails when bootstrap fails)

## Lessons Learned from ErrorUI Migration

### ✅ **New Critical Success Factors**

18. **Constructor Bug Pattern Recurrence**
    - **Issue**: Same `this.moduleLogger.createChild` instead of `this.logger.createChild` bug continues
    - **Solution**: Always check constructor for this specific bug pattern
    - **Discovery**: This bug appears in multiple modules during migration
    - **Application**: Add constructor bug check to migration checklist

19. **DOM API Mocking Pattern**
    - **Issue**: Modules with DOM manipulation need comprehensive DOM API mocking
    - **Solution**: Mock `document.getElementById`, `document.createElement`, `appendChild`, `insertBefore`, etc.
    - **Discovery**: ErrorUI requires extensive DOM mocking for testing
    - **Application**: Create DOM API mocking template for future modules

20. **Navigator Object Mocking**
    - **Issue**: `global.navigator` cannot be directly assigned
    - **Solution**: Use `Object.defineProperty(global, 'navigator', { value: { onLine: true }, writable: true })`
    - **Discovery**: Navigator mocking requires proper property definition
    - **Application**: Use proper property definition for all global object mocking

### **📊 Pattern Summary from ErrorUI Migration**

#### **DOM API Mocking Patterns**
- **Document Methods**: Mock `getElementById`, `createElement`, `querySelectorAll`
- **Element Methods**: Mock `appendChild`, `insertBefore`, `remove`, `parentNode.removeChild`
- **Event Listeners**: Mock `addEventListener` for online/offline events
- **Navigator Object**: Use `Object.defineProperty` for proper mocking

#### **Constructor Bug Patterns**
- **Bug Pattern**: `this.moduleLogger.createChild` instead of `this.logger.createChild`
- **Frequency**: This bug appears in multiple modules
- **Prevention**: Always check constructor for this specific pattern
- **Fix**: Replace with `this.logger.createChild({ module: 'ModuleName' })`

## Lessons Learned from EnvironmentConfig Migration

### ✅ **New Critical Success Factors**

21. **Method Name Verification in Tests**
    - **Issue**: Test calling non-existent method `getConfig()` instead of `getAllConfig()`
    - **Solution**: Always verify actual method names before writing tests
    - **Discovery**: EnvironmentConfig has `getAllConfig()` not `getConfig()`
    - **Application**: Use `grep` to find actual method definitions before writing tests

22. **Dependency Chain Testing**
    - **Issue**: EnvironmentConfig depends on PathResolver, which needs proper mocking
    - **Solution**: Mock all dependency methods that the module actually calls
    - **Discovery**: EnvironmentConfig calls multiple PathResolver methods
    - **Application**: Test dependency chain by mocking all called methods

### **📊 Pattern Summary from EnvironmentConfig Migration**

#### **Method Name Verification Patterns**
- **Test Method Names**: Always verify actual method names before writing tests
- **Grep Pattern**: Use `grep -n "get[A-Z][a-zA-Z]*("` to find method definitions
- **Method Discovery**: Check actual method names in source code before assuming

#### **Dependency Chain Testing Patterns**
- **Dependency Mocking**: Mock all methods that dependencies actually call
- **Chain Testing**: Test that dependency methods are called correctly
- **Method Verification**: Verify that all dependency methods are properly mocked

## Lessons Learned from DataValidator Migration

### ✅ **New Critical Success Factors**

23. **Event System Integration Pattern**
    - **Issue**: DataValidator uses EventBus for validation events and request handling
    - **Solution**: Inject EventBus and replace all globalEventBus references with this.eventBus
    - **Discovery**: DataValidator emits validation events and listens for validation requests
    - **Application**: EventBus injection pattern is well-established for modules with event communication

24. **Complex Legacy Function Audit**
    - **Issue**: DataValidator has 7 legacy functions (more than typical utility modules)
    - **Solution**: Audit all public methods and create corresponding legacy function stubs
    - **Discovery**: DataValidator has comprehensive public API with validation, sanitization, and statistics methods
    - **Application**: Complex modules require thorough legacy function mapping

25. **Event-Driven Testing Strategy**
    - **Issue**: DataValidator emits events during validation that need to be tested
    - **Solution**: Mock EventBus and verify event emission in tests
    - **Discovery**: DataValidator emits 'data.validation.completed' and 'data.sanitization.completed' events
    - **Application**: Test event emission and listener registration for event-driven modules

### **📊 Pattern Summary from DataValidator Migration**

#### **Event System Integration Patterns**
- **EventBus Injection**: `@inject(TYPES.EventBus) private eventBus`
- **Event Emission**: Replace `globalEventBus.emit()` with `this.eventBus.emit()`
- **Event Listening**: Replace `globalEventBus.on()` with `this.eventBus.on()`
- **Event Testing**: Mock EventBus and verify event emission in tests

#### **Complex Legacy Function Patterns**
- **Comprehensive API**: Modules with many public methods need extensive legacy function stubs
- **Method Mapping**: Map all public methods to legacy function stubs
- **Error Consistency**: Use consistent error messages for all legacy functions

## Lessons Learned from ProgressiveDataLoader Migration

### ✅ **New Critical Success Factors**

26. **BaseService Inheritance Pattern**
    - **Issue**: ProgressiveDataLoader extends BaseService but wasn't properly injecting StructuredLogger
    - **Solution**: Add StructuredLogger to constructor and pass it to super()
    - **Discovery**: BaseService requires StructuredLogger to be injected and passed to super()
    - **Application**: Always inject StructuredLogger when extending BaseService

27. **Already DI-Enabled Module Pattern**
    - **Issue**: ProgressiveDataLoader was already using DI pattern but not added to ApplicationBootstrap
    - **Solution**: Add module to ApplicationBootstrap with useDI: true
    - **Discovery**: Some modules are already DI-enabled but not properly integrated
    - **Application**: Check existing DI patterns before assuming migration is needed

28. **Method Name Verification in Tests**
    - **Issue**: Test calling non-existent methods like getLoadingPhases() and getLoadingStrategies()
    - **Solution**: Always verify actual method names before writing tests
    - **Discovery**: ProgressiveDataLoader has getOverallProgress(), getLoadingProgress(), getStatistics() methods
    - **Application**: Use grep to find actual method definitions before testing

## Lessons Learned from PolygonLoader Migration

### ✅ **New Critical Success Factors**

29. **Complex Dependency Chain Testing**
    - **Issue**: PolygonLoader has 6 dependencies (EventBus, StateManager, ConfigurationManager, LayerManager, StructuredLogger, LabelManager)
    - **Solution**: Mock all dependency methods that the module actually calls
    - **Discovery**: Each dependency needs specific methods mocked (isReady, get, set, addLayer, etc.)
    - **Application**: For complex modules, audit all dependency method calls and mock them comprehensively

30. **Constructor Bug Pattern Recurrence**
    - **Issue**: Same `this.moduleLogger.createChild` instead of `this.logger.createChild` bug appeared again
    - **Solution**: Always check constructor for this specific bug pattern during migration
    - **Discovery**: This bug pattern is consistent across multiple modules
    - **Application**: Add constructor bug check to migration checklist for all modules

31. **Method Availability Verification in Tests**
    - **Issue**: Test calling non-existent methods like `getLoadedCategories()` and `cleanup()`
    - **Solution**: Always verify actual method names and availability before writing tests
    - **Discovery**: Some methods only exist as legacy functions, not on the instance
    - **Application**: Use `grep` to find actual method definitions and check instance vs legacy function availability

32. **Window Object Mocking for Browser APIs**
    - **Issue**: PolygonLoader uses `window.navigator.onLine` which is undefined in Node.js test environment
    - **Solution**: Mock window object with proper navigator properties
    - **Discovery**: Modules with browser API dependencies need comprehensive window mocking
    - **Application**: Create window mocking template for modules with browser dependencies

### **📊 Pattern Summary from PolygonLoader Migration**

#### **Complex Dependency Chain Patterns**
- **Dependency Count**: 6 dependencies require comprehensive mocking
- **Method Mocking**: Each dependency needs specific methods mocked (isReady, get, set, addLayer, etc.)
- **Testing Strategy**: Mock all dependency methods that the module actually calls

#### **Constructor Bug Patterns**
- **Bug Pattern**: `this.moduleLogger.createChild` instead of `this.logger.createChild`
- **Frequency**: This bug appears in multiple modules during migration
- **Prevention**: Always check constructor for this specific pattern
- **Fix**: Replace with `this.logger.createChild({ module: 'ModuleName' })`

#### **Method Availability Patterns**
- **Instance Methods**: Check actual method availability on the instance
- **Legacy Functions**: Some methods only exist as legacy functions, not on the instance
- **Method Discovery**: Use `grep` to find actual method definitions before testing
- **Status Methods**: Use `getStatus()` to access internal state instead of non-existent methods

#### **Browser API Mocking Patterns**
- **Window Object**: Mock `window.navigator.onLine` for offline detection
- **Browser APIs**: Mock all browser-specific APIs used by the module
- **Test Environment**: Ensure test environment has all required browser globals

### **📊 Pattern Summary from ProgressiveDataLoader Migration**

#### **BaseService Inheritance Patterns**
- **StructuredLogger Injection**: Always inject StructuredLogger when extending BaseService
- **Super Constructor**: Pass StructuredLogger to super() constructor
- **Method Access**: BaseService provides this.logger for logging

#### **Already DI-Enabled Module Patterns**
- **Verification**: Check existing DI patterns before assuming migration is needed
- **Integration**: Add to ApplicationBootstrap with useDI: true
- **Testing**: Test with proper dependency injection

### ⚠️ **Enhanced Common Pitfalls to Avoid**

4. **Incomplete Legacy Function Audit**
   - **Problem**: Missing legacy functions during migration
   - **Prevention**: Audit ALL exports, not just main singleton
   - **Pattern**: Use grep to find all `export const` patterns

5. **Unused Dependency Injection**
   - **Problem**: Injecting dependencies that aren't actually used
   - **Prevention**: Verify actual usage before adding to constructor
   - **Pattern**: Check method calls to injected dependencies

6. **Constructor Bug Pattern**
   - **Problem**: `this.moduleLogger.createChild` instead of `this.logger.createChild`
   - **Prevention**: Always check constructor for this specific bug pattern
   - **Pattern**: This bug appears in multiple modules during migration

7. **Over-reliance on DI Container Testing**
   - **Problem**: DI container not available when application bootstrap fails
   - **Prevention**: Use direct module testing as primary method
   - **Pattern**: Test with mock dependencies independently

8. **BaseService Circular Dependencies**
   - **Problem**: BaseService importing services directly creates circular dependencies
   - **Prevention**: Always use DI in BaseService, never direct imports
   - **Pattern**: `@inject(TYPES.ServiceName) private serviceName`

9. **Inappropriate BaseService Inheritance**
   - **Problem**: Leaf nodes extending BaseService when they have no dependencies
   - **Prevention**: Only extend BaseService when service has actual dependencies
   - **Pattern**: Audit dependencies before deciding inheritance

10. **Method Name Mismatches in Tests**
   - **Problem**: Test methods calling non-existent methods
   - **Prevention**: Always verify actual method names before writing tests
   - **Pattern**: Use `grep` to find actual method definitions

11. **Incomplete Legacy Function Object Audit**
    - **Problem**: Missing both singleton and convenience function exports
    - **Prevention**: Always audit both singleton and convenience function exports
    - **Pattern**: Use `grep` to find all `export const` patterns, check for both singleton and convenience functions

12. **Event System Testing Oversight**
    - **Problem**: Testing event systems like regular modules instead of event flow
    - **Prevention**: Test event emission, listener registration, and cleanup
    - **Pattern**: Test actual event flow, not just method availability

13. **Base Class Testing Misconception**
    - **Problem**: Testing base classes as standalone services
    - **Prevention**: Test base classes with mock dependencies to verify DI pattern
    - **Pattern**: Test inheritance and method availability, not standalone functionality

14. **Migration Status Assumption**
    - **Problem**: Assuming migration is needed without checking existing DI patterns
    - **Prevention**: Check existing DI patterns before assuming migration is needed
    - **Pattern**: Always verify current state before starting migration

### ⚠️ **Common Pitfalls to Avoid**

1. **Module Load Time Instantiation**
   - **Problem**: Instantiating classes at module load time before DI container is ready
   - **Prevention**: Always remove singleton exports during migration

2. **Missing Method Dependencies**
   - **Problem**: Other modules expect methods that don't exist (e.g., StateManager.watch)
   - **Prevention**: Audit method calls before migration, add missing methods

3. **Null Reference Errors**
   - **Problem**: Accessing properties that may not be initialized yet
   - **Prevention**: Add null checks for optional properties (e.g., `this.map.panes`)

### 📋 **Updated Migration Checklist (Enhanced from StructuredLogger Migration)**

For each module migration:

1. **Pre-Migration Audit (Enhanced)**
   - [ ] Check for singleton exports to remove
   - [ ] **NEW**: Audit ALL exported functions (not just main singleton)
   - [ ] **NEW**: Verify actual usage vs. imported dependencies
   - [ ] **NEW**: Determine if service should extend BaseService (has dependencies)
   - [ ] **NEW**: Check existing DI patterns before assuming migration is needed
   - [ ] **NEW**: Audit both singleton and convenience function exports
   - [ ] Identify all method calls to this module
   - [ ] Verify dependencies are available and working
   - [ ] Check for legacy compatibility functions

2. **Core Module Fixes** (if needed)
   - [ ] Add missing methods to StateManager (watch, etc.)
   - [ ] Fix MapManager null reference issues
   - [ ] Ensure all core modules can initialize
   - [ ] **NEW**: Fix BaseService circular dependencies if present

3. **DI Migration Steps (Refined)**
   - [ ] Add `@injectable()` decorator
   - [ ] Add `@inject()` decorators for dependencies
   - [ ] **NEW**: Verify EventBus pattern if module uses events
   - [ ] **NEW**: Only extend BaseService if service has actual dependencies
   - [ ] Add to Types.js
   - [ ] Add to DependencyContainer.js
   - [ ] Update ApplicationBootstrap.js
   - [ ] Remove singleton exports
   - [ ] **NEW**: Update ALL legacy functions (not just main ones)

4. **Testing (Enhanced)**
   - [ ] **NEW**: Direct module testing (primary method)
   - [ ] **NEW**: Verify actual method names before testing
   - [ ] **NEW**: Event system testing (if applicable) - test event flow, not just methods
   - [ ] **NEW**: Base class testing (if applicable) - test with mock dependencies
   - [ ] DI container resolution test (secondary method)
   - [ ] Functional capability test
   - [ ] Logger injection test
   - [ ] Downstream dependency test

## Lessons Learned from MapManager Migration

### ✅ **New Critical Success Factors**

33. **Comprehensive Browser API Mocking**
    - **Issue**: MapManager requires extensive browser API mocking (window, document, L (Leaflet))
    - **Solution**: Mock all browser APIs used by the module in test environment
    - **Discovery**: MapManager uses window.addEventListener, document.getElementById, L.map, L.tileLayer, L.control.zoom
    - **Application**: Create comprehensive browser API mocking template for map-related modules

34. **Leaflet Library Mocking Strategy**
    - **Issue**: MapManager depends on Leaflet library (L global object) which is undefined in Node.js
    - **Solution**: Mock L object with all required methods (map, tileLayer, control.zoom, layerGroup)
    - **Discovery**: Leaflet methods return objects that need to be properly mocked (map with createPane, getPane, getBounds)
    - **Application**: Mock Leaflet objects with proper return values and method chains

35. **Map Object Method Chain Mocking**
    - **Issue**: Map objects need to return objects with specific methods (getBounds returns bounds with getNorth, getSouth, etc.)
    - **Solution**: Mock map methods to return objects with all required sub-methods
    - **Discovery**: MapManager calls map.getBounds().getNorth() - bounds object needs these methods
    - **Application**: Mock complex object return values with all required method chains

36. **Document Object Mocking for DOM Operations**
    - **Issue**: MapManager uses document.getElementById and document.createElement for DOM operations
    - **Solution**: Mock document object with proper methods and return values
    - **Discovery**: Document methods need to return proper element objects
    - **Application**: Mock document object for modules with DOM dependencies

### **📊 Pattern Summary from MapManager Migration**

#### **Browser API Mocking Patterns**
- **Window Object**: Mock `addEventListener` for event handling
- **Document Object**: Mock `getElementById`, `createElement` for DOM operations
- **Leaflet Library**: Mock `L.map`, `L.tileLayer`, `L.control.zoom`, `L.layerGroup`
- **Map Objects**: Mock complex return values with method chains (getBounds with getNorth, getSouth, etc.)

#### **Complex Object Mocking Patterns**
- **Method Chains**: Mock objects that return other objects with methods
- **Return Values**: Ensure mocked methods return objects with all required sub-methods
- **Object Structure**: Match the structure of real browser/library objects

#### **Map-Specific Mocking Patterns**
- **Map Creation**: Mock L.map to return map object with all required methods
- **Map Methods**: Mock createPane, getPane, getBounds, getCenter, getZoom
- **Map Controls**: Mock L.control.zoom to return control object with addTo method
- **Map Layers**: Mock L.tileLayer to return layer object with addTo method

## Lessons Learned from DeviceManager Migration

### ✅ **New Critical Success Factors**

37. **Playwright Page Context Testing Pattern**
    - **Issue**: Direct Node.js imports fail in test environment due to module path resolution
    - **Solution**: Use Playwright's page.evaluate() to run tests in browser context
    - **Discovery**: DeviceManager test failed with "Cannot find module" when using direct imports
    - **Application**: Use page.evaluate() for all module testing instead of direct Node.js imports

38. **Browser API Dependency Testing**
    - **Issue**: DeviceManager depends on extensive browser APIs (window, document, navigator, screen, getComputedStyle)
    - **Solution**: Test in actual browser environment where all APIs are available
    - **Discovery**: DeviceManager uses window.innerWidth, document.documentElement, navigator.userAgent, screen.orientation
    - **Application**: Test browser-dependent modules in actual browser context, not Node.js

39. **Device Context Detection Testing**
    - **Issue**: DeviceManager provides comprehensive device context detection
    - **Solution**: Test actual device context detection in browser environment
    - **Discovery**: DeviceManager detects platform, browser, breakpoint, touch capabilities, PWA status
    - **Application**: Test device detection modules in real browser environment for accurate results

40. **Legacy Function Object Pattern for Complex APIs**
    - **Issue**: DeviceManager has complex legacy API with multiple objects (deviceManager, deviceContext) and functions
    - **Solution**: Create comprehensive legacy function stubs for all exported objects and functions
    - **Discovery**: DeviceManager exports deviceManager object, deviceContext object, and standalone functions
    - **Application**: Audit all exports comprehensively for complex modules with multiple API surfaces

### **📊 Pattern Summary from DeviceManager Migration**

#### **Playwright Testing Patterns**
- **Page Context**: Use page.evaluate() for module testing instead of direct Node.js imports
- **Browser Environment**: Test browser-dependent modules in actual browser context
- **Console Monitoring**: Use page.on('console') to monitor test execution
- **Navigation**: Use page.goto() and waitForLoadState() for proper test setup

#### **Browser API Testing Patterns**
- **Real Environment**: Test in actual browser where all APIs are available
- **Device Detection**: Test device context detection in real browser environment
- **API Availability**: Verify all required browser APIs are available in test context
- **Context Accuracy**: Get accurate device context from real browser environment

#### **Complex Legacy API Patterns**
- **Multiple Objects**: Create legacy stubs for all exported objects (deviceManager, deviceContext)
- **Standalone Functions**: Create legacy stubs for all standalone function exports
- **Comprehensive Coverage**: Ensure all public API surfaces have legacy function stubs
- **Error Consistency**: Use consistent error messages across all legacy functions

## Lessons Learned from DataLoadingOrchestrator Migration

### ✅ **New Critical Success Factors**

41. **Cascading Dependency Resolution Pattern**
    - **Issue**: DataLoadingOrchestrator migration revealed cascading dependency issues with modules importing StructuredLogger directly
    - **Solution**: Temporarily mock logger imports in dependent modules to break the cascade
    - **Discovery**: ErrorBoundary, ConfigService, and other modules were importing StructuredLogger directly, causing module load failures
    - **Application**: When migrating modules with many dependencies, expect and handle cascading dependency issues

42. **Singleton Export Removal is Critical**
    - **Issue**: DataLoadingOrchestrator had a singleton export `dataLoadingOrchestrator = new DataLoadingOrchestrator()` that was instantiated at module load time
    - **Solution**: Replace singleton exports with legacy function stubs that throw errors
    - **Discovery**: Singleton exports cause constructor calls during module loading, before DI container is available
    - **Application**: Always audit and replace singleton exports during DI migration

43. **Direct Module Testing Strategy for Complex Dependencies**
    - **Issue**: DI container testing failed due to cascading dependency issues
    - **Solution**: Use direct module instantiation with mock dependencies for testing
    - **Discovery**: Direct testing bypasses DI container dependency chains and allows isolated testing
    - **Application**: Use direct testing when DI container has complex dependency issues

44. **Temporary Mock Pattern for Migration Dependencies**
    - **Issue**: Modules importing StructuredLogger directly caused migration failures
    - **Solution**: Temporarily replace logger imports with mock objects during migration
    - **Discovery**: Mock pattern allows migration to proceed while maintaining functionality
    - **Application**: Use temporary mocks for modules that will be migrated later

### **📊 Pattern Summary from DataLoadingOrchestrator Migration**

#### **Cascading Dependency Resolution Patterns**
- **Dependency Cascade**: Modules importing StructuredLogger directly cause migration failures
- **Mock Resolution**: Temporarily mock logger imports to break dependency chains
- **Migration Order**: Migrate modules with many dependencies after their dependencies are migrated
- **Testing Strategy**: Use direct testing when DI container has complex issues

#### **Singleton Export Management Patterns**
- **Audit Pattern**: Always check for singleton exports during migration
- **Legacy Stub Pattern**: Replace singleton exports with error-throwing legacy functions
- **Module Load Prevention**: Prevent constructor calls during module loading
- **DI Container Integration**: Ensure modules are only instantiated via DI container

#### **Complex Module Testing Patterns**
- **Direct Testing**: Use direct module instantiation with mock dependencies
- **Dependency Mocking**: Mock all dependencies comprehensively
- **Isolated Testing**: Test modules independently of DI container
- **Migration Validation**: Verify DI pattern works with mock dependencies

## **Proven Migration Patterns (Updated from EventBus & BaseService)**

### **🔄 Event System Dependency Pattern**
```javascript
// Pattern: EventBus injection for event communication
@injectable()
export class ServiceName {
  constructor(
    @inject(TYPES.EventBus) private eventBus
  ) {
    // EventBus is foundational service used by many modules
  }
}
```

### **⚠️ Legacy Function Object Pattern**
```javascript
// Pattern: Replace both singleton and convenience functions
export const globalService = {
  method1: () => {
    console.warn('Legacy function called. Use DI container.');
    throw new Error('Legacy function not available.');
  }
};

export const convenienceFunction = () => {
  console.warn('Legacy function called. Use DI container.');
  throw new Error('Legacy function not available.');
};
```

### **✅ Migration Status Verification Pattern**
```javascript
// Pattern: Check existing DI patterns before migration
// 1. Check for @injectable() decorator
// 2. Check for @inject() decorators
// 3. Check for proper binding in DependencyContainer
// 4. Only migrate if not already DI-enabled
```

### **🧪 Event System Testing Pattern**
```javascript
// Pattern: Test event flow, not just method availability
test('should handle event emission and listening', async () => {
  const eventBus = new EventBus(mockLogger);
  let eventReceived = false;
  let eventData = null;
  
  // Add listener
  const unsubscribe = eventBus.on('test:event', (data) => {
    eventReceived = true;
    eventData = data;
  });
  
  // Emit event
  eventBus.emit('test:event', { message: 'test data' });
  
  // Verify and cleanup
  expect(eventReceived).toBe(true);
  expect(eventData.message).toBe('test data');
  unsubscribe();
});
```

### **🏗️ Base Class Testing Pattern**
```javascript
// Pattern: Test base classes with mock dependencies
test('should handle base class DI integration', async () => {
  const mockLogger = {
    createChild: () => ({ info: () => {}, error: () => {} })
  };
  
  const baseService = new BaseService(mockLogger);
  
  // Test inheritance and method availability
  expect(typeof baseService.initialize).toBe('function');
  expect(typeof baseService.cleanup).toBe('function');
  expect(typeof baseService.getStatus).toBe('function');
});
```

## **Current Status & Next Steps**

### **✅ Completed Migrations (Phase 1-4)**
- **Phase 1: Leaf Nodes** - CoordinateConverter, TextFormatter, StructuredLogger, EventBus, BaseService
- **Phase 2: Utilities** - FeatureEnhancer, UtilityManager, PathResolver, ErrorUI, EnvironmentConfig
- **Phase 3: Data Loaders** - DataValidator, ProgressiveDataLoader, PolygonLoader, AmbulanceLoader, PoliceLoader
- **Phase 4: Core Modules** - LayerManager, MapManager, DeviceManager, DataLoadingOrchestrator

### **🎯 Current Focus: StateManager Functionality Issue**

**Architectural Understanding**: ApplicationBootstrap remains as **direct instantiation** (this is correct) because:
- It's the root module that initializes the DI container
- It can't depend on DI because it creates the DI system
- This is the standard architectural pattern for bootstrap modules

**✅ RESOLVED Issues**:
1. **ApplicationBootstrap dependencies resolved** - Fixed incomplete moduleLogger assignment
2. **EnvironmentConfig syntax error** - Resolved during DI migration
3. **EventBus legacy function calls** - Migrated to DI-resolved instance
4. **EmphasisManager logger issue** - Migrated from mock logger to proper DI

**Current Issue**:
1. **StateManager functionality** - Tests show `stateManagerWorking: false`, indicating StateManager is not functioning properly

### **📋 Immediate Action Items**

#### **Phase 5: StateManager Functionality Fix**
- [x] **Audit ApplicationBootstrap.js** - Understand current state, constructor, initialization flow
- [x] **Fix EnvironmentConfig syntax error** - Ensure it loads from compiled dist version
- [x] **Fix ApplicationBootstrap dependency resolution** - Make it properly resolve from DI container
- [x] **Fix EventBus legacy function calls** - Use DI-resolved instance instead of global
- [x] **Test incremental fixes** - Verify each fix maintains progress
- [ ] **Investigate StateManager functionality** - Determine why stateManagerWorking returns false
- [ ] **Fix StateManager initialization** - Ensure StateManager is properly initialized and functional
- [ ] **Test StateManager integration** - Verify StateManager works with other modules

#### **Phase 6: Final Integration Testing**
- [ ] **End-to-end application testing** - Verify full application loads and functions
- [ ] **Performance validation** - Ensure no performance regression
- [ ] **Mobile app compatibility** - Verify DI system works for mobile builds
- [ ] **Documentation update** - Update architecture documentation

### **🔧 Technical Approach**

1. **Keep ApplicationBootstrap as direct instantiation** ✅ (This is correct)
2. **Fix its dependency resolution** - Make it properly resolve from DI container
3. **Fix blocking issues** - EnvironmentConfig, EventBus legacy calls
4. **Ensure proper DI system initialization** - All other modules use DI

### **📊 Migration Status Summary**

| Phase | Status | Modules | Notes |
|-------|--------|---------|-------|
| **Phase 1: Leaf Nodes** | ✅ Complete | 5 modules | No dependencies, safe to migrate first |
| **Phase 2: Utilities** | ✅ Complete | 5 modules | Minimal dependencies, straightforward migration |
| **Phase 3: Data Loaders** | ✅ Complete | 5 modules | Medium complexity, event system integration |
| **Phase 4: Core Modules** | ✅ Complete | 4 modules | High complexity, browser API mocking required |
| **Phase 5: ApplicationBootstrap** | ⏳ In Progress | 1 module | **Dependency resolution, NOT migration** |
| **Phase 6: Final Testing** | ⏳ Pending | All modules | End-to-end validation |

### **🎯 Success Criteria**

- [ ] ApplicationBootstrap properly resolves dependencies from DI container
- [ ] All blocking issues resolved (EnvironmentConfig, EventBus)
- [ ] Full application loads and functions correctly
- [ ] All modules use DI except ApplicationBootstrap (which is correct)
- [ ] Performance maintained or improved
- [ ] Mobile app compatibility preserved

---

*This document will be updated as the ApplicationBootstrap dependency resolution progresses.*

## Project Overview

This document outlines the comprehensive migration of the WeeWoo Map Friend application from a hybrid architecture (direct instantiation + DI) to a fully unified Dependency Injection (DI) architecture using InversifyJS.

## Step-by-Step Migration Guide (Revised Order)

### **Migration Order Strategy**

**⚠️ CRITICAL**: The original plan started with core modules, but this approach is flawed due to complex dependencies.

**✅ REVISED APPROACH**:
1. **Start with leaf nodes** (utilities with no dependencies)
2. **Work backwards** from the dependency tree
3. **Migrate StateManager last** since everything depends on it

### **Module 1: CoordinateConverter Migration (Leaf Node)**

#### **Current Status**
- Direct instantiation with no dependencies
- Utility service with minimal complexity
- Safe starting point for migration

#### **Required Changes**

1. **Add Dependencies to Types.js**
   ```javascript
   CoordinateConverter: Symbol.for('CoordinateConverter'),
   ```

2. **Update CoordinateConverter Constructor**
   ```javascript
   // In js/modules/CoordinateConverter.js
   import { injectable, inject } from 'inversify';
   import { TYPES } from './Types.js';
   
   @injectable()
   export class CoordinateConverter {
     constructor() {
       // No dependencies - leaf node
     }
   }
   ```

3. **Update DependencyContainer Bindings**
   ```javascript
   this.container.bind(TYPES.CoordinateConverter).to(CoordinateConverter).inSingletonScope();
   ```

4. **Update ApplicationBootstrap**
   ```javascript
   { name: 'CoordinateConverter', path: '/dist/modules/CoordinateConverter.js', required: false, useDI: true }
   ```

#### **Enhanced Testing Strategy**
- **Immediate Test**: Verify CoordinateConverter resolves from DI container
- **Circular Dependency Test**: Verify no circular dependencies are created
- **Error Injection Test**: Inject invalid coordinates to test error handling
- **Downstream Test**: Verify other modules can use CoordinateConverter via DI
- **Integration Test**: Verify coordinate conversion works end-to-end

---

### **Module 2: TextFormatter Migration (Leaf Node)**

#### **Current Status**
- Direct instantiation with no dependencies
- Utility service for text processing
- Safe second migration target

#### **Required Changes**

1. **Add Dependencies to Types.js**
   ```javascript
   TextFormatter: Symbol.for('TextFormatter'),
   ```

2. **Update TextFormatter Constructor**
   ```javascript
   // In js/modules/TextFormatter.js
   import { injectable, inject } from 'inversify';
   import { TYPES } from './Types.js';
   
   @injectable()
   export class TextFormatter {
     constructor() {
       // No dependencies - leaf node
     }
   }
   ```

3. **Update DependencyContainer Bindings**
   ```javascript
   this.container.bind(TYPES.TextFormatter).to(TextFormatter).inSingletonScope();
   ```

4. **Update ApplicationBootstrap**
   ```javascript
   { name: 'TextFormatter', path: '/dist/modules/TextFormatter.js', required: false, useDI: true }
   ```

#### **Enhanced Testing Strategy**
- **Immediate Test**: Verify TextFormatter resolves from DI container
- **Circular Dependency Test**: Verify no circular dependencies are created
- **Error Injection Test**: Inject malformed text to test error handling
- **Downstream Test**: Verify other modules can use TextFormatter via DI
- **Integration Test**: Verify text formatting works end-to-end

---

### **Module 3: StateManager Migration (Core Dependency)**

#### **Current Status**
- Already using DI but has dependency issues
- `this.stateManager.watch is not a function` error
- **CRITICAL**: Everything depends on this - migrate LAST

#### **Required Changes**

1. **Add Missing Dependencies to Types.js**
   ```javascript
   // Add to js/modules/Types.js
   EventBus: Symbol.for('EventBus'),
   ConfigurationManager: Symbol.for('ConfigurationManager'),
   ```

2. **Update StateManager Constructor**
   ```javascript
   // In js/modules/StateManager.js
   import { injectable, inject } from 'inversify';
   import { TYPES } from './Types.js';
   
   @injectable()
   export class StateManager {
     constructor(
       @inject(TYPES.EventBus) private eventBus,
       @inject(TYPES.ConfigurationManager) private configurationManager
     ) {
       // ... existing constructor code
     }
   }
   ```

3. **Add Missing Watch Method**
   ```javascript
   // Add to StateManager class
   watch(property: string, callback: Function) {
     if (!this.subscribers.has(property)) {
       this.subscribers.set(property, new Set());
     }
     this.subscribers.get(property).add(callback);
   }
   ```

4. **Update DependencyContainer Bindings**
   ```javascript
   this.container.bind(TYPES.EventBus).toConstantValue(globalEventBus);
   this.container.bind(TYPES.ConfigurationManager).to(ConfigurationManager).inSingletonScope();
   ```

5. **Update ApplicationBootstrap**
   ```javascript
   { name: 'StateManager', path: '/dist/modules/StateManager.js', required: true, useDI: true }
   ```

#### **Enhanced Testing Strategy**
- **Immediate Test**: Verify StateManager resolves from DI container
- **Circular Dependency Test**: Verify no circular dependencies with EventBus/ConfigurationManager
- **Error Injection Test**: Inject invalid state to test error handling and recovery
- **Downstream Test**: Verify ActiveListManager can use `stateManager.watch()`
- **Integration Test**: Verify state management works end-to-end
- **Performance Test**: Verify state updates don't cause performance degradation

---

### **Enhanced Testing Framework**

#### **Test Structure for Each Module**
```javascript
// tests/debug/test-[module]-di-migration.spec.js
test.describe('[Module] DI Migration', () => {
  test('should resolve from DI container', async ({ page }) => {
    // Test DI container resolution
    const module = await page.evaluate(() => {
      return window.DependencyContainer.getContainer().get(TYPES.ModuleName);
    });
    expect(module).toBeDefined();
  });
  
  test('should initialize without errors', async ({ page }) => {
    // Test module initialization
    const result = await page.evaluate(() => {
      try {
        const module = window.DependencyContainer.getContainer().get(TYPES.ModuleName);
        return module.init ? await module.init() : 'no init method';
      } catch (error) {
        return { error: error.message };
      }
    });
    expect(result.error).toBeUndefined();
  });
  
  test('should work with downstream dependencies', async ({ page }) => {
    // Test integration with other modules
    const integrationResult = await page.evaluate(() => {
      // Test that other modules can use this module
      return testDownstreamIntegration();
    });
    expect(integrationResult.success).toBe(true);
  });
  
  test('should handle circular dependencies gracefully', async ({ page }) => {
    // Test circular dependency detection
    const circularDeps = await page.evaluate(() => {
      return detectCircularDependencies(TYPES.ModuleName);
    });
    expect(circularDeps.length).toBe(0);
  });
  
  test('should handle error injection gracefully', async ({ page }) => {
    // Test error handling and recovery
    const errorResult = await page.evaluate(() => {
      try {
        // Inject invalid data to test error handling
        return injectErrorsAndTestRecovery(TYPES.ModuleName);
      } catch (error) {
        return { error: error.message, recovered: false };
      }
    });
    expect(errorResult.recovered).toBe(true);
  });
});
```

#### **Enhanced Success Criteria**
- ✅ Module resolves from DI container
- ✅ Module initializes without errors
- ✅ Downstream modules can use the migrated module
- ✅ **No circular dependencies detected**
- ✅ **Error injection handled gracefully**
- ✅ **Performance within 20% of baseline**
- ✅ All existing functionality preserved
- ✅ **Mobile app compatibility maintained**

#### **Error Injection Testing Patterns**
```javascript
// Error injection test utilities
const injectErrorsAndTestRecovery = (moduleType) => {
  const module = window.DependencyContainer.getContainer().get(moduleType);
  
  // Test 1: Invalid input data
  try {
    module.processData(null);
  } catch (error) {
    // Should handle gracefully
  }
  
  // Test 2: Network failures
  try {
    module.fetchData('invalid-url');
  } catch (error) {
    // Should have fallback mechanism
  }
  
  // Test 3: Memory pressure
  try {
    module.processLargeDataset(createLargeDataset());
  } catch (error) {
    // Should handle memory issues
  }
  
  return { recovered: true };
};
```

#### **Circular Dependency Detection**
```javascript
// Circular dependency detection utility
const detectCircularDependencies = (moduleType) => {
  const visited = new Set();
  const recursionStack = new Set();
  
  const checkDependencies = (type) => {
    if (recursionStack.has(type)) {
      return [type]; // Circular dependency found
    }
    
    if (visited.has(type)) {
      return []; // Already checked
    }
    
    visited.add(type);
    recursionStack.add(type);
    
    // Check dependencies of this module
    const dependencies = getModuleDependencies(type);
    for (const dep of dependencies) {
      const circular = checkDependencies(dep);
      if (circular.length > 0) {
        return [...circular, type];
      }
    }
    
    recursionStack.delete(type);
    return [];
  };
  
  return checkDependencies(moduleType);
};
```

---

## Project Overview

## Current Architecture Analysis

### **Hybrid Architecture Status (January 2025)**

The application currently uses a **hybrid architecture** with two distinct instantiation patterns:

#### **DI Container Pattern (InversifyJS) - 25 modules (36%)**
- **Infrastructure Services**: ComponentCommunication, ARIAService, PlatformService
- **Error Handling**: UnifiedErrorHandler, ErrorContext, CircuitBreakerStrategy
- **Mobile Services**: MobileComponentAdapter, MobileUIOptimizer
- **Advanced Features**: Circuit breakers, retry strategies, health checks

#### **Direct Instantiation Pattern (Singleton) - 44 modules (64%)**
- **Core Modules**: MapManager, DeviceManager, UIManager, CollapsibleManager
- **Data Loaders**: PolygonLoader, AmbulanceLoader, PoliceLoader
- **UI Components**: SearchManager, FABManager, LayerManager
- **Utilities**: CoordinateConverter, ErrorUI, TextFormatter

## Migration Scope

### **Total Modules Requiring Migration: 44 modules**

| **Category** | **Modules** | **Priority** | **Complexity** | **Risk Level** |
|--------------|-------------|--------------|----------------|----------------|
| **Core Infrastructure** | 8 modules | **HIGH** | High | High |
| **Data Management** | 7 modules | **HIGH** | Medium | Medium |
| **UI Components** | 12 modules | **MEDIUM** | Medium | Low |
| **Utilities** | 17 modules | **LOW** | Low | Low |

## Detailed Migration Plan

### **Phase 1: Core Infrastructure (HIGH Priority)**

#### **1.1 MapManager Migration**
- **Current**: Direct instantiation with complex Leaflet.js integration
- **Dependencies**: StateManager, LayerManager, CoordinateConverter
- **Challenges**: Circular dependencies, map state serialization
- **Estimated Effort**: 3-4 days
- **Risk**: High (core functionality)

#### **1.2 DeviceManager Migration**
- **Current**: Direct instantiation with platform detection
- **Dependencies**: PlatformService, ConfigurationManager
- **Challenges**: Platform-specific initialization
- **Estimated Effort**: 2-3 days
- **Risk**: High (mobile app functionality)

#### **1.3 UIManager Migration**
- **Current**: Direct instantiation with component coordination
- **Dependencies**: CollapsibleManager, SearchManager, FABManager
- **Challenges**: Component lifecycle management
- **Estimated Effort**: 2-3 days
- **Risk**: Medium (UI coordination)

#### **1.4 StateManager Migration**
- **Current**: Already using DI but needs dependency fixes
- **Dependencies**: EventBus, ConfigurationManager
- **Challenges**: Reactive state management, circular references
- **Estimated Effort**: 1-2 days
- **Risk**: High (state management)

### **Phase 2: Data Management (HIGH Priority)**

#### **2.1 Data Loaders Migration**
- **Modules**: PolygonLoader, AmbulanceLoader, PoliceLoader, CfaFacilitiesLoader, SesFacilitiesLoader, SesUnitsLoader
- **Dependencies**: StateManager, ConfigurationManager, CoordinateConverter
- **Challenges**: Async data loading, error handling
- **Estimated Effort**: 4-5 days
- **Risk**: Medium (data integrity)

#### **2.2 LayerManager Migration**
- **Current**: Direct instantiation with map layer management
- **Dependencies**: MapManager, StateManager, EmphasisManager
- **Challenges**: Layer state synchronization
- **Estimated Effort**: 2-3 days
- **Risk**: Medium (map rendering)

### **Phase 3: UI Components (MEDIUM Priority)**

#### **3.1 SearchManager Migration**
- **Current**: Direct instantiation with search functionality
- **Dependencies**: StateManager, ConfigurationManager
- **Challenges**: Search indexing, debouncing
- **Estimated Effort**: 2-3 days
- **Risk**: Low (search functionality)

#### **3.2 CollapsibleManager Migration**
- **Current**: Direct instantiation with sidebar management
- **Dependencies**: StateManager, ConfigurationManager
- **Challenges**: DOM manipulation, event handling
- **Estimated Effort**: 1-2 days
- **Risk**: Low (UI behavior)

#### **3.3 FABManager Migration**
- **Current**: Direct instantiation with floating action buttons
- **Dependencies**: StateManager, ConfigurationManager
- **Challenges**: FAB lifecycle management
- **Estimated Effort**: 1-2 days
- **Risk**: Low (UI components)

### **Phase 4: Utilities (LOW Priority)**

#### **4.1 Utility Services Migration**
- **Modules**: CoordinateConverter, ErrorUI, TextFormatter, FeatureEnhancer, UtilityManager
- **Dependencies**: ConfigurationManager, Logger
- **Challenges**: Minimal (mostly stateless)
- **Estimated Effort**: 3-4 days
- **Risk**: Low (utility functions)

## Implementation Strategy

### **Migration Approach: Incremental with Fallback**

1. **Convert Module to DI Pattern**
   - Add `@injectable()` decorator
   - Convert constructor to use `@inject()` decorators
   - Update dependency references

2. **Register in DependencyContainer**
   - Add service identifier to `Types.js`
   - Add binding in `DependencyContainer.js`
   - Ensure proper binding order

3. **Update Bootstrap System**
   - Add `useDI: true` flag to module initializer
   - Update `ApplicationBootstrap.initializeCoreModules()`
   - Test DI resolution

4. **Verify and Test**
   - Run integration tests
   - Verify functionality works
   - Check for performance regressions

### **Testing Strategy**

#### **Unit Testing**
- Test individual module DI resolution
- Verify dependency injection works correctly
- Test module initialization and cleanup

#### **Integration Testing**
- Test module interactions via DI container
- Verify application bootstrap works
- Test error handling and recovery

#### **Performance Testing**
- Measure startup time impact
- Monitor memory usage
- Test with large datasets

## Risk Assessment

### **High Risk Areas**

1. **Core Module Dependencies**
   - **Risk**: Breaking core functionality
   - **Mitigation**: Extensive testing, gradual rollout
   - **Rollback**: Keep direct instantiation as fallback

2. **Circular Dependencies**
   - **Risk**: DI container resolution failures
   - **Mitigation**: Careful dependency analysis, refactoring
   - **Rollback**: Use factory patterns or lazy loading

3. **Performance Impact**
   - **Risk**: Slower startup times
   - **Mitigation**: Performance monitoring, optimization
   - **Rollback**: Hybrid approach for performance-critical modules

### **Medium Risk Areas**

1. **Data Loading Modules**
   - **Risk**: Data corruption or loading failures
   - **Mitigation**: Comprehensive error handling, validation
   - **Rollback**: Fallback to direct instantiation

2. **UI Component Integration**
   - **Risk**: UI behavior changes
   - **Mitigation**: UI testing, user acceptance testing
   - **Rollback**: Component-level fallback

### **Low Risk Areas**

1. **Utility Modules**
   - **Risk**: Minimal (mostly stateless)
   - **Mitigation**: Basic testing
   - **Rollback**: Easy to revert

## Success Metrics

### **Technical Metrics**

- **Migration Completion**: 100% of modules using DI
- **Performance**: < 10% increase in startup time
- **Memory Usage**: < 15% increase in memory footprint
- **Error Rate**: < 1% increase in runtime errors

### **Quality Metrics**

- **Code Maintainability**: Improved dependency management
- **Testability**: Better unit testing capabilities
- **Debugging**: Clearer dependency chains
- **Documentation**: Complete DI architecture documentation

## Timeline and Resource Allocation

### **Phase 1: Core Infrastructure (4-6 weeks)**
- **Week 1-2**: MapManager, DeviceManager migration
- **Week 3-4**: UIManager, StateManager migration
- **Week 5-6**: Testing and optimization

### **Phase 2: Data Management (3-4 weeks)**
- **Week 1-2**: Data loaders migration
- **Week 3-4**: LayerManager migration and testing

### **Phase 3: UI Components (2-3 weeks)**
- **Week 1-2**: SearchManager, CollapsibleManager migration
- **Week 3**: FABManager and remaining UI components

### **Phase 4: Utilities (2-3 weeks)**
- **Week 1-2**: Utility services migration
- **Week 3**: Final testing and documentation

### **Total Estimated Duration: 11-16 weeks**

## Resource Requirements

### **Development Team**
- **Lead Developer**: 1 FTE (full-time equivalent)
- **Senior Developer**: 1 FTE
- **QA Engineer**: 0.5 FTE
- **DevOps Engineer**: 0.25 FTE

### **Tools and Infrastructure**
- **Testing Framework**: Playwright, Jest
- **Performance Monitoring**: Custom metrics, browser dev tools
- **Documentation**: Markdown, architecture diagrams
- **CI/CD**: GitHub Actions, automated testing

## Benefits of Full DI Migration

### **Immediate Benefits**

1. **Consistent Architecture**: Single instantiation pattern
2. **Better Testing**: Easier mocking and unit testing
3. **Improved Maintainability**: Clear dependency management
4. **Enhanced Debugging**: Traceable dependency chains

### **Long-term Benefits**

1. **Scalability**: Easy to add new services
2. **Flexibility**: Runtime dependency swapping
3. **Mobile App Support**: Better service management for native apps
4. **Plugin Architecture**: Extensible service system

### **Development Experience**

1. **IDE Support**: Better autocomplete and refactoring
2. **Documentation**: Self-documenting dependencies
3. **Onboarding**: Clearer code structure for new developers
4. **Debugging**: Better error messages and stack traces

## Rollback Strategy

### **Module-Level Rollback**
- Keep direct instantiation code as fallback
- Use feature flags to switch between patterns
- Gradual rollback of problematic modules

### **Phase-Level Rollback**
- Each phase can be rolled back independently
- Maintain hybrid architecture during transition
- Full rollback to current state if needed

### **Emergency Rollback**
- Complete rollback to pre-migration state
- Preserve all functionality
- Minimal downtime

## Conclusion

The DI migration project represents a significant architectural improvement that will enhance maintainability, testability, and scalability. While the migration is complex and carries some risk, the benefits far outweigh the costs, especially for the long-term success of the mobile app development and future feature additions.

The incremental approach with comprehensive testing and rollback strategies ensures that the migration can be completed safely while maintaining application stability throughout the process.

---

*This document will be updated as the migration progresses and new insights are gained.*
