# Archived Modules

This directory contains modules that have been archived but may be useful in the future.

## DataService.js

**Archived Date:** 2025-09-08  
**Reason:** Circular dependency with BaseService, not currently used by application  
**Status:** Fully functional but unused  

### What it provides:
- Comprehensive data loading service with caching, validation, and progress tracking
- Multi-source data loading (API, file, mock)
- Advanced error handling and statistics
- Event-driven architecture with subscribers
- Batch loading capabilities
- Full InversifyJS dependency injection integration

### Why it was archived:
- The application currently uses simple fetch() calls in individual loaders (PolygonLoader, SesUnitsLoader, etc.)
- No modules actually import or use DataService
- Causing circular dependency issues with BaseService
- Current simple architecture works well for the application's needs

### When to consider restoring:
- If the application needs advanced data loading features
- If implementing real-time data updates
- If adding complex data validation requirements
- If implementing sophisticated caching strategies
- If adding multiple data sources beyond static GeoJSON files

### Dependencies when restored:
- BaseService.js (needs circular dependency resolution)
- DataValidator.js
- ConfigService.js
- EventBus.js
- InversifyJS decorators (@injectable, @inject)

### Migration notes:
- Would need to refactor to avoid circular dependency with BaseService
- Consider using composition instead of inheritance
- May need to update interface definitions
- Test thoroughly with existing data loaders
