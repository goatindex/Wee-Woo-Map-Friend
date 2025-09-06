# Variable Naming Strategy for ES6 Migration

**Project:** WeeWoo Map Friend  
**Purpose:** Standardize variable names and naming conventions before ES6 migration  
**Date:** December 2024

## Executive Summary

Before starting the ES6 migration, we need to establish consistent naming conventions for all variables, functions, and modules. This document outlines the standardized naming strategy to ensure consistency across the refactored codebase.

---

## 1. Current Legacy Variable Analysis

### **Core State Variables (CRITICAL)**
These are the most frequently used variables that need careful migration:

| Legacy Variable | Current Usage | ES6 Target | Migration Strategy |
|----------------|---------------|------------|-------------------|
| `window.featureLayers` | Map layers by category | `stateManager.get('featureLayers')` | Direct state migration |
| `window.namesByCategory` | Category name arrays | `stateManager.get('namesByCategory')` | Direct state migration |
| `window.nameToKey` | Name-to-key mapping | `stateManager.get('nameToKey')` | Direct state migration |
| `window.emphasised` | Emphasis state tracking | `stateManager.get('emphasised')` | Direct state migration |
| `window.nameLabelMarkers` | Label marker references | `stateManager.get('nameLabelMarkers')` | Direct state migration |
| `window.pendingLabels` | Pending label queue | `stateManager.get('pendingLabels')` | Direct state migration |
| `window.activeListFilter` | Search filter state | `stateManager.get('activeListFilter')` | Direct state migration |
| `window.isBulkOperation` | Bulk operation flag | `stateManager.get('isBulkOperation')` | Direct state migration |

### **Configuration Variables (HIGH PRIORITY)**
| Legacy Variable | Current Usage | ES6 Target | Migration Strategy |
|----------------|---------------|------------|-------------------|
| `window.categoryMeta` | Category metadata | `configurationManager.get('categoryMeta')` | Configuration migration |
| `window.outlineColors` | Category outline colors | `configurationManager.get('outlineColors')` | Configuration migration |
| `window.baseOpacities` | Base opacity values | `configurationManager.get('baseOpacities')` | Configuration migration |
| `window.labelColorAdjust` | Label color adjustments | `configurationManager.get('labelColorAdjust')` | Configuration migration |
| `window.headerColorAdjust` | Header color adjustments | `configurationManager.get('headerColorAdjust')` | Configuration migration |

### **Utility Functions (MEDIUM PRIORITY)**
| Legacy Function | Current Usage | ES6 Target | Migration Strategy |
|----------------|---------------|------------|-------------------|
| `window.adjustHexColor()` | Color adjustment utility | `textFormatter.adjustHexColor()` | Utility migration |
| `window.sesStyle()` | SES styling function | `configurationManager.getStyle('ses')` | Configuration migration |
| `window.lgaStyle()` | LGA styling function | `configurationManager.getStyle('lga')` | Configuration migration |
| `window.cfaStyle()` | CFA styling function | `configurationManager.getStyle('cfa')` | Configuration migration |
| `window.frvStyle()` | FRV styling function | `configurationManager.getStyle('frv')` | Configuration migration |

### **Bulk Operation Manager (CRITICAL)**
| Legacy Function | Current Usage | ES6 Target | Migration Strategy |
|----------------|---------------|------------|-------------------|
| `window.BulkOperationManager` | Bulk operation coordination | `stateManager.bulkOperation` | State management migration |
| `window.beginBulkOperation()` | Start bulk operation | `stateManager.beginBulkOperation()` | State management migration |
| `window.endBulkOperation()` | End bulk operation | `stateManager.endBulkOperation()` | State management migration |

---

## 2. ES6 Naming Conventions

### **Module Naming**
- **Files:** `PascalCase.js` (e.g., `StateManager.js`, `ConfigurationManager.js`)
- **Classes:** `PascalCase` (e.g., `StateManager`, `ConfigurationManager`)
- **Instances:** `camelCase` (e.g., `stateManager`, `configurationManager`)

### **Variable Naming**
- **Constants:** `UPPER_SNAKE_CASE` (e.g., `DEFAULT_OPACITY`, `MAX_ZOOM_LEVEL`)
- **Private variables:** `_camelCase` (e.g., `_state`, `_initialized`)
- **Public variables:** `camelCase` (e.g., `featureLayers`, `namesByCategory`)
- **Event names:** `kebab-case` (e.g., `feature-layer-updated`, `bulk-operation-started`)

### **Function Naming**
- **Public methods:** `camelCase` (e.g., `getFeatureLayers()`, `updateActiveList()`)
- **Private methods:** `_camelCase` (e.g., `_migrateLegacyState()`, `_setupEventListeners()`)
- **Event handlers:** `handle` + `EventName` (e.g., `handleFeatureUpdate()`, `handleBulkOperationStart()`)

### **State Management Naming**
- **State keys:** `camelCase` (e.g., `featureLayers`, `activeListFilter`)
- **State paths:** `dot.notation` (e.g., `featureLayers.ses`, `ui.sidebarVisible`)
- **State events:** `state:` + `action` (e.g., `state:featureLayersUpdated`, `state:bulkOperationStarted`)

---

## 3. Migration Mapping Strategy

### **Phase 1: Core State Variables**
```javascript
// Legacy → ES6 Migration Map
const STATE_MIGRATION_MAP = {
  // Core state variables
  'window.featureLayers': 'stateManager.get("featureLayers")',
  'window.namesByCategory': 'stateManager.get("namesByCategory")',
  'window.nameToKey': 'stateManager.get("nameToKey")',
  'window.emphasised': 'stateManager.get("emphasised")',
  'window.nameLabelMarkers': 'stateManager.get("nameLabelMarkers")',
  'window.pendingLabels': 'stateManager.get("pendingLabels")',
  'window.activeListFilter': 'stateManager.get("activeListFilter")',
  'window.isBulkOperation': 'stateManager.get("isBulkOperation")',
  
  // Configuration variables
  'window.categoryMeta': 'configurationManager.get("categoryMeta")',
  'window.outlineColors': 'configurationManager.get("outlineColors")',
  'window.baseOpacities': 'configurationManager.get("baseOpacities")',
  'window.labelColorAdjust': 'configurationManager.get("labelColorAdjust")',
  'window.headerColorAdjust': 'configurationManager.get("headerColorAdjust")',
  
  // Utility functions
  'window.adjustHexColor': 'textFormatter.adjustHexColor',
  'window.sesStyle': 'configurationManager.getStyle("ses")',
  'window.lgaStyle': 'configurationManager.getStyle("lga")',
  'window.cfaStyle': 'configurationManager.getStyle("cfa")',
  'window.frvStyle': 'configurationManager.getStyle("frv")',
  
  // Bulk operation functions
  'window.BulkOperationManager': 'stateManager.bulkOperation',
  'window.beginBulkOperation': 'stateManager.beginBulkOperation',
  'window.endBulkOperation': 'stateManager.endBulkOperation'
};
```

### **Phase 2: Function Migration**
```javascript
// Legacy function → ES6 method mapping
const FUNCTION_MIGRATION_MAP = {
  // UI functions
  'window.updateActiveList': 'activeListManager.updateActiveList',
  'window.beginActiveListBulk': 'activeListManager.beginBulkOperation',
  'window.endActiveListBulk': 'activeListManager.endBulkOperation',
  'window.createCheckbox': 'activeListManager.createCheckbox',
  'window.setupCollapsible': 'collapsibleManager.setupCollapsible',
  'window.setEmphasis': 'featureEnhancer.setEmphasis',
  'window.ensureLabel': 'labelManager.ensureLabel',
  'window.removeLabel': 'labelManager.removeLabel',
  'window.toggleAll': 'activeListManager.toggleAll',
  
  // Search functions
  'window.initSearch': 'searchManager.initSearch',
  'window.performSearch': 'searchManager.performSearch',
  'window.clearSearch': 'searchManager.clearSearch',
  
  // Map functions
  'window.getMap': 'mapManager.getMap',
  'window.addLayer': 'layerManager.addLayer',
  'window.removeLayer': 'layerManager.removeLayer',
  'window.toggleLayer': 'layerManager.toggleLayer'
};
```

---

## 4. Category Naming Standardization

### **Category Identifiers**
Standardize on these category names throughout the system:

| Category | Display Name | Internal ID | Color | Style Function |
|----------|--------------|-------------|-------|----------------|
| SES | State Emergency Service | `ses` | `#FF9900` | `getStyle('ses')` |
| LGA | Local Government Area | `lga` | `#001A70` | `getStyle('lga')` |
| CFA | Country Fire Authority | `cfa` | `#FF0000` | `getStyle('cfa')` |
| Ambulance | Ambulance Victoria | `ambulance` | `#d32f2f` | `getStyle('ambulance')` |
| Police | Victoria Police | `police` | `#145088` | `getStyle('police')` |
| FRV | Fire Rescue Victoria | `frv` | `#DC143C` | `getStyle('frv')` |

### **Category Data Structure**
```javascript
// Standardized category data structure
const CATEGORY_STRUCTURE = {
  ses: {
    id: 'ses',
    name: 'State Emergency Service',
    displayName: 'SES',
    color: '#FF9900',
    opacity: 0.2,
    weight: 3,
    fillColor: 'orange',
    fillOpacity: 0.2,
    dashArray: null
  },
  lga: {
    id: 'lga',
    name: 'Local Government Area',
    displayName: 'LGA',
    color: '#001A70',
    opacity: 0.1,
    weight: 1.5,
    fillColor: '#0082CA',
    fillOpacity: 0.1,
    dashArray: '8 8'
  },
  // ... other categories
};
```

---

## 5. Event Naming Convention

### **Event Categories**
- **State Events:** `state:` prefix (e.g., `state:featureLayersUpdated`)
- **UI Events:** `ui:` prefix (e.g., `ui:sidebarToggled`)
- **Map Events:** `map:` prefix (e.g., `map:layerAdded`)
- **Data Events:** `data:` prefix (e.g., `data:categoryLoaded`)
- **Error Events:** `error:` prefix (e.g., `error:loadFailed`)

### **Event Naming Pattern**
```javascript
// Event naming pattern: category:action:target
const EVENT_NAMES = {
  // State events
  'state:featureLayersUpdated': 'Feature layers state updated',
  'state:bulkOperationStarted': 'Bulk operation started',
  'state:bulkOperationEnded': 'Bulk operation ended',
  'state:activeListFilterChanged': 'Active list filter changed',
  
  // UI events
  'ui:sidebarToggled': 'Sidebar visibility toggled',
  'ui:collapsibleSectionToggled': 'Collapsible section toggled',
  'ui:searchPerformed': 'Search performed',
  'ui:checkboxToggled': 'Checkbox toggled',
  
  // Map events
  'map:layerAdded': 'Map layer added',
  'map:layerRemoved': 'Map layer removed',
  'map:layerToggled': 'Map layer toggled',
  'map:emphasisChanged': 'Map emphasis changed',
  
  // Data events
  'data:categoryLoaded': 'Data category loaded',
  'data:categoryLoadFailed': 'Data category load failed',
  'data:labelsUpdated': 'Labels updated',
  'data:searchResultsUpdated': 'Search results updated',
  
  // Error events
  'error:loadFailed': 'Data load failed',
  'error:renderFailed': 'Render operation failed',
  'error:stateSyncFailed': 'State synchronization failed'
};
```

---

## 6. Migration Implementation Strategy

### **Step 1: Create Migration Maps**
```javascript
// Create comprehensive migration maps
const MIGRATION_MAPS = {
  variables: STATE_MIGRATION_MAP,
  functions: FUNCTION_MIGRATION_MAP,
  events: EVENT_NAMES,
  categories: CATEGORY_STRUCTURE
};
```

### **Step 2: Implement Compatibility Layer**
```javascript
// Legacy compatibility layer
class LegacyCompatibility {
  constructor() {
    this.migrationMaps = MIGRATION_MAPS;
    this.setupLegacyProxies();
  }
  
  setupLegacyProxies() {
    // Set up proxies for legacy variables
    Object.keys(this.migrationMaps.variables).forEach(legacyVar => {
      this.createLegacyProxy(legacyVar, this.migrationMaps.variables[legacyVar]);
    });
  }
  
  createLegacyProxy(legacyVar, es6Target) {
    // Create proxy that redirects to ES6 system
    Object.defineProperty(window, legacyVar.replace('window.', ''), {
      get: () => this.evaluateES6Target(es6Target),
      set: (value) => this.setES6Target(es6Target, value),
      configurable: true
    });
  }
}
```

### **Step 3: Gradual Migration**
1. **Phase 1:** Migrate core state variables
2. **Phase 2:** Migrate configuration variables
3. **Phase 3:** Migrate utility functions
4. **Phase 4:** Migrate UI functions
5. **Phase 5:** Remove legacy compatibility layer

---

## 7. Quality Assurance

### **Naming Consistency Checks**
- [ ] All variables follow camelCase convention
- [ ] All functions follow camelCase convention
- [ ] All classes follow PascalCase convention
- [ ] All constants follow UPPER_SNAKE_CASE convention
- [ ] All events follow kebab-case convention
- [ ] All category IDs are consistent across the system

### **Migration Validation**
- [ ] Legacy variables have ES6 equivalents
- [ ] Legacy functions have ES6 method equivalents
- [ ] Event names are consistent and descriptive
- [ ] Category data structure is standardized
- [ ] Compatibility layer works correctly
- [ ] No naming conflicts exist

---

## 8. Implementation Timeline

### **Week 1: Planning & Setup**
- [ ] Review and approve naming conventions
- [ ] Create migration maps
- [ ] Set up compatibility layer
- [ ] Test compatibility layer

### **Week 2: Core Migration**
- [ ] Migrate state variables
- [ ] Migrate configuration variables
- [ ] Update all references
- [ ] Test state synchronization

### **Week 3: Function Migration**
- [ ] Migrate utility functions
- [ ] Migrate UI functions
- [ ] Update all function calls
- [ ] Test function compatibility

### **Week 4: Cleanup & Validation**
- [ ] Remove legacy compatibility layer
- [ ] Validate naming consistency
- [ ] Update documentation
- [ ] Final testing

---

## 9. Success Criteria

### **Naming Consistency**
- ✅ All variables follow established conventions
- ✅ No naming conflicts or ambiguities
- ✅ Clear distinction between public and private members
- ✅ Consistent event naming across the system

### **Migration Completeness**
- ✅ All legacy variables have ES6 equivalents
- ✅ All legacy functions have ES6 method equivalents
- ✅ Compatibility layer works during transition
- ✅ No broken references after migration

### **Code Quality**
- ✅ Improved readability and maintainability
- ✅ Clear separation of concerns
- ✅ Consistent API across modules
- ✅ Better error handling and debugging

---

**Next Steps:** Review this naming strategy with the team, make any necessary adjustments, and begin implementation before starting the ES6 migration process.
