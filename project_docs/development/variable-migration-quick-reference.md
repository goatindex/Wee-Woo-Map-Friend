# Variable Migration Quick Reference

**Project:** WeeWoo Map Friend  
**Purpose:** Quick reference for variable name changes during ES6 migration  
**Date:** December 2024

## 🚨 CRITICAL VARIABLES - MIGRATE FIRST

### **Core State Variables**
```javascript
// Legacy → ES6 Migration
window.featureLayers     → stateManager.get('featureLayers')
window.namesByCategory   → stateManager.get('namesByCategory')
window.nameToKey         → stateManager.get('nameToKey')
window.emphasised        → stateManager.get('emphasised')
window.nameLabelMarkers  → stateManager.get('nameLabelMarkers')
window.pendingLabels     → stateManager.get('pendingLabels')
window.activeListFilter  → stateManager.get('activeListFilter')
window.isBulkOperation   → stateManager.get('isBulkOperation')
```

### **Configuration Variables**
```javascript
// Legacy → ES6 Migration
window.categoryMeta        → configurationManager.get('categoryMeta')
window.outlineColors       → configurationManager.get('outlineColors')
window.baseOpacities       → configurationManager.get('baseOpacities')
window.labelColorAdjust    → configurationManager.get('labelColorAdjust')
window.headerColorAdjust   → configurationManager.get('headerColorAdjust')
```

### **Bulk Operation Manager**
```javascript
// Legacy → ES6 Migration
window.BulkOperationManager → stateManager.bulkOperation
window.beginBulkOperation() → stateManager.beginBulkOperation()
window.endBulkOperation()   → stateManager.endBulkOperation()
```

## 🔧 UTILITY FUNCTIONS

### **Color & Styling Functions**
```javascript
// Legacy → ES6 Migration
window.adjustHexColor() → textFormatter.adjustHexColor()
window.sesStyle()       → configurationManager.getStyle('ses')
window.lgaStyle()       → configurationManager.getStyle('lga')
window.cfaStyle()       → configurationManager.getStyle('cfa')
window.frvStyle()       → configurationManager.getStyle('frv')
```

## 🎯 UI FUNCTIONS

### **Active List Management**
```javascript
// Legacy → ES6 Migration
window.updateActiveList()     → activeListManager.updateActiveList()
window.beginActiveListBulk()  → activeListManager.beginBulkOperation()
window.endActiveListBulk()    → activeListManager.endBulkOperation()
window.createCheckbox()       → activeListManager.createCheckbox()
window.toggleAll()            → activeListManager.toggleAll()
```

### **UI Components**
```javascript
// Legacy → ES6 Migration
window.setupCollapsible() → collapsibleManager.setupCollapsible()
window.setEmphasis()      → featureEnhancer.setEmphasis()
window.ensureLabel()      → labelManager.ensureLabel()
window.removeLabel()      → labelManager.removeLabel()
```

### **Search Functions**
```javascript
// Legacy → ES6 Migration
window.initSearch()    → searchManager.initSearch()
window.performSearch() → searchManager.performSearch()
window.clearSearch()   → searchManager.clearSearch()
```

## 🗺️ MAP FUNCTIONS

### **Map & Layer Management**
```javascript
// Legacy → ES6 Migration
window.getMap()      → mapManager.getMap()
window.addLayer()    → layerManager.addLayer()
window.removeLayer() → layerManager.removeLayer()
window.toggleLayer() → layerManager.toggleLayer()
```

## 📊 CATEGORY STANDARDIZATION

### **Category IDs & Names**
```javascript
// Standardized category structure
const CATEGORIES = {
  ses: { id: 'ses', name: 'State Emergency Service', displayName: 'SES' },
  lga: { id: 'lga', name: 'Local Government Area', displayName: 'LGA' },
  cfa: { id: 'cfa', name: 'Country Fire Authority', displayName: 'CFA' },
  ambulance: { id: 'ambulance', name: 'Ambulance Victoria', displayName: 'Ambulance' },
  police: { id: 'police', name: 'Victoria Police', displayName: 'Police' },
  frv: { id: 'frv', name: 'Fire Rescue Victoria', displayName: 'FRV' }
};
```

## 🎪 EVENT NAMING

### **Event Categories**
```javascript
// Event naming pattern: category:action:target
'state:featureLayersUpdated'     // State changes
'ui:sidebarToggled'              // UI interactions
'map:layerAdded'                 // Map operations
'data:categoryLoaded'            // Data operations
'error:loadFailed'               // Error conditions
```

## 🔄 MIGRATION ORDER

### **Phase 1: Core State (Week 1)**
1. `window.featureLayers` → `stateManager.get('featureLayers')`
2. `window.namesByCategory` → `stateManager.get('namesByCategory')`
3. `window.nameToKey` → `stateManager.get('nameToKey')`
4. `window.emphasised` → `stateManager.get('emphasised')`

### **Phase 2: Configuration (Week 1)**
1. `window.categoryMeta` → `configurationManager.get('categoryMeta')`
2. `window.outlineColors` → `configurationManager.get('outlineColors')`
3. `window.baseOpacities` → `configurationManager.get('baseOpacities')`

### **Phase 3: Functions (Week 2)**
1. `window.BulkOperationManager` → `stateManager.bulkOperation`
2. `window.updateActiveList()` → `activeListManager.updateActiveList()`
3. `window.setupCollapsible()` → `collapsibleManager.setupCollapsible()`

### **Phase 4: Utilities (Week 2)**
1. `window.adjustHexColor()` → `textFormatter.adjustHexColor()`
2. `window.sesStyle()` → `configurationManager.getStyle('ses')`
3. `window.lgaStyle()` → `configurationManager.getStyle('lga')`

## ⚠️ CRITICAL NOTES

### **Breaking Changes**
- **State Access:** All `window.variable` access becomes `stateManager.get('variable')`
- **Function Calls:** All `window.function()` calls become `moduleManager.function()`
- **Event Names:** All events must follow new naming convention
- **Category References:** All category IDs must be standardized

### **Compatibility Layer**
- Legacy variables will be proxied during migration
- Legacy functions will be delegated to ES6 modules
- Gradual migration allows for testing at each step
- Full compatibility maintained until migration complete

### **Testing Requirements**
- Test all variable access patterns
- Test all function call patterns
- Test event emission and handling
- Test category data consistency
- Test state synchronization

---

**Usage:** Keep this reference handy during migration. Update as new patterns are discovered.
