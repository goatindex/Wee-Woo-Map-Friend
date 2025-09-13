# Service Worker Documentation

## Overview

The WeeWoo Map Friend application uses a service worker for offline support and performance optimization through caching. The service worker has been updated to reflect the completion of the DataService migration.

## Current Configuration

### Cache Version
- **Current Version**: `v2.1.0-stable`
- **Previous Version**: `v2.1.0-no-dataservice` (migration state)
- **Updated**: 2025-01-11

### Cache Strategy
- **Static Cache**: Caches core application files on install
- **Runtime Cache**: Caches dynamic resources on demand
- **Cache Invalidation**: Graceful updates with user notification

## Recent Changes (2025-01-11)

### DataService Migration Completion
The service worker was updated to reflect the completed DataService migration:

1. **Cache Version Updated**
   - Changed from `v2.1.0-no-dataservice` to `v2.1.0-stable`
   - Removes migration-specific cache invalidation behavior

2. **Static Assets Cleaned**
   - Removed `DataService.js` from cached assets (file no longer exists)
   - Updated asset list to reflect current module structure

3. **Cache Invalidation Messages Updated**
   - Changed from "DataService removed - force fresh load" to "Cache updated - migration completed"
   - Updated manual invalidation reason to "Manual cache invalidation"

### Files Modified
- `sw.js` - Service worker implementation
- `index.html` - Cache busting parameters and message handling

## Cache Control

### Manual Cache Invalidation
```javascript
// Force cache invalidation
navigator.serviceWorker.controller.postMessage({
  type: 'FORCE_CACHE_INVALIDATION',
  reason: 'Manual cache invalidation'
});
```

### Cache Version Update
To force cache invalidation for all users:
1. Update `CACHE_VERSION` in `sw.js`
2. Update cache busting parameters in `index.html`
3. Deploy changes

## Development Guidelines

### Testing Service Worker Changes
1. Use browser dev tools to inspect service worker
2. Test cache invalidation behavior
3. Verify offline functionality
4. Check for excessive reloading

### Cache Debugging
- Check `Application` tab in browser dev tools
- Monitor `Cache Storage` for cached resources
- Use `Network` tab to verify cache hits/misses

## Troubleshooting

### Common Issues
1. **Stale Cache**: Update cache version to force invalidation
2. **Excessive Reloading**: Check for aggressive cache invalidation logic
3. **Offline Issues**: Verify static assets are properly cached

### Cache Invalidation
If users experience stale content:
1. Update `CACHE_VERSION` in `sw.js`
2. Update cache busting parameters in `index.html`
3. Deploy and wait for service worker update

## Future Considerations

### Planned Improvements
1. **Graceful Updates**: Implement user-controlled updates instead of forced reloads
2. **Selective Invalidation**: Only invalidate specific outdated caches
3. **Update Notifications**: Notify users of available updates

### Migration Notes
- DataService migration completed 2025-09-08
- Service worker updated 2025-01-11 to reflect completion
- No further migration-related cache invalidation needed

