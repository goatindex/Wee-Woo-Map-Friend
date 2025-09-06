# Error Recovery & Resilience Architecture

**Project:** WeeWoo Map Friend  
**Date:** January 2025  
**Purpose:** Comprehensive guide for error recovery mechanisms and system resilience

## Overview

The WeeWoo Map Friend application implements a comprehensive error recovery and resilience architecture that ensures the application continues to function even when individual components fail. This system provides graceful degradation, automatic recovery, and user feedback to maintain a robust user experience.

## Architecture Principles

### **Core Resilience Principles**

1. **Fail Gracefully**: Never crash the entire application due to component failures
2. **Recover Automatically**: Attempt automatic recovery before falling back to degraded mode
3. **Inform Users**: Provide clear feedback about system status and limitations
4. **Maintain Functionality**: Continue with reduced functionality rather than complete failure
5. **Learn from Failures**: Log and monitor errors for continuous improvement

### **Error Recovery Hierarchy**

```
1. Immediate Retry (with backoff)
   ↓ (if fails)
2. Phase-Specific Recovery
   ↓ (if fails)
3. Graceful Degradation
   ↓ (if fails)
4. User Notification & Basic Functionality
```

## Error Recovery System

### **1. ApplicationBootstrap Error Recovery**

The `ApplicationBootstrap` class provides the core error recovery mechanisms:

#### **Enhanced Safe Execution**
```javascript
await this.safeExecute('core module initialization', async () => {
  await this.initializeCoreModules();
}, { 
  allowRecovery: true, 
  allowDegradation: false, // Core modules are critical
  maxRetries: 2,
  context: { critical: true }
});
```

#### **Recovery Options**
- **`allowRecovery`**: Enable automatic recovery attempts
- **`allowDegradation`**: Allow graceful degradation if recovery fails
- **`maxRetries`**: Maximum number of retry attempts
- **`context`**: Additional context for error handling

### **2. Phase-Specific Recovery Strategies**

#### **Module Initialization Recovery**
```javascript
async recoverFromModuleInitError(error, context) {
  const failedModule = context.moduleName;
  if (failedModule) {
    // Wait with exponential backoff
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Try to reimport the module
    const module = await import(`./${failedModule}.js`);
    const singletonName = failedModule.charAt(0).toLowerCase() + failedModule.slice(1);
    const moduleInstance = module[singletonName] || module.default;
    
    if (moduleInstance && typeof moduleInstance.init === 'function') {
      await moduleInstance.init();
      return true; // Recovery successful
    }
  }
  return false; // Recovery failed
}
```

#### **Data Loading Recovery**
```javascript
async recoverFromDataLoadingError(error, context) {
  try {
    // Try to load data with reduced functionality
    const { DataLoadingOrchestrator } = await import('./DataLoadingOrchestrator.js');
    const orchestrator = new DataLoadingOrchestrator();
    
    if (typeof orchestrator.init === 'function') {
      await orchestrator.init();
      return true;
    }
  } catch (recoveryError) {
    this.logger.warn('Data loading recovery failed', {
      recoveryError: recoveryError.message
    });
  }
  return false;
}
```

#### **Map System Recovery**
```javascript
async recoverFromMapSystemError(error, context) {
  try {
    // Try to reinitialize map with fallback configuration
    const { mapManager } = await import('./MapManager.js');
    if (mapManager && typeof mapManager.recover === 'function') {
      await mapManager.recover();
      return true;
    }
  } catch (recoveryError) {
    this.logger.warn('Map system recovery failed', {
      recoveryError: recoveryError.message
    });
  }
  return false;
}
```

#### **UI Component Recovery**
```javascript
async recoverFromUIError(error, context) {
  try {
    // Try to reinitialize UI components
    const { collapsibleManager } = await import('./CollapsibleManager.js');
    if (collapsibleManager && typeof collapsibleManager.recover === 'function') {
      await collapsibleManager.recover();
      return true;
    }
  } catch (recoveryError) {
    this.logger.warn('UI recovery failed', {
      recoveryError: recoveryError.message
    });
  }
  return false;
}
```

## Cleanup & Resource Management

### **Comprehensive Cleanup System**

The application implements a comprehensive cleanup system to prevent memory leaks and ensure proper resource management during application lifecycle events.

#### **Cleanup Architecture**

```
ApplicationBootstrap
├── Resource Tracking
│   ├── Event Listeners (8 tracked)
│   ├── Intervals (0 tracked)
│   ├── Timeouts (0 tracked)
│   ├── Modules (10 tracked)
│   └── Cleanup Functions (0 tracked)
├── Cleanup Methods
│   ├── cleanup() - Standard cleanup
│   ├── destroy() - Complete destruction
│   └── Registration methods
└── Module Cleanup
    ├── UIManager.cleanup()
    ├── MapManager.cleanup()
    ├── StateManager.cleanup()
    ├── SearchManager.cleanup()
    └── MobileDocsNavManager.destroy()
```

#### **Cleanup Features**

- **Resource Tracking**: All resources are tracked for automatic cleanup
- **Event Listener Management**: Automatic removal of all tracked event listeners
- **Module Lifecycle**: Each module implements its own cleanup logic
- **Memory Management**: Prevents memory leaks from untracked resources
- **Graceful Shutdown**: Complete application destruction when needed

#### **Automatic Cleanup Triggers**

- **Page Unload**: `beforeunload` event triggers full cleanup
- **Page Hide**: `pagehide` event triggers cleanup with state preservation
- **Manual Cleanup**: Programmatic cleanup via `applicationBootstrap.cleanup()`
- **Complete Destruction**: `applicationBootstrap.destroy()` for full shutdown

#### **Cleanup Implementation**

```javascript
// Resource tracking
this.cleanupFunctions = [];
this.eventListeners = [];
this.intervals = [];
this.timeouts = [];
this.initializedModules = new Set();

// Cleanup method
async cleanup(options = {}) {
  const { force = false, reason = 'manual', preserveState = false } = options;
  
  // 1. Clear all timeouts
  this.timeouts.forEach(({ id, name }) => {
    clearTimeout(id);
    this.logger.debug('Timeout cleared', { name });
  });
  
  // 2. Clear all intervals
  this.intervals.forEach(({ id, name }) => {
    clearInterval(id);
    this.logger.debug('Interval cleared', { name });
  });
  
  // 3. Remove all event listeners
  this.eventListeners.forEach(({ target, event, listener, options }) => {
    target.removeEventListener(event, listener, options);
    this.logger.debug('Event listener removed', { event });
  });
  
  // 4. Call module cleanup functions
  for (const { name, instance } of this.initializedModules) {
    if (instance && typeof instance.cleanup === 'function') {
      await instance.cleanup();
    }
  }
  
  // 5. Reset state if not preserving
  if (!preserveState) {
    this.initialized = false;
    this.deviceContext = null;
    this.nativeFeatures = null;
  }
}
```

#### **Module Cleanup Examples**

**UIManager Cleanup:**
```javascript
async cleanup() {
  // Clear resize timeout
  if (this.resizeTimeout) {
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = null;
  }
  
  // Clear components and reset state
  this.components.clear();
  this.initialized = false;
  this.responsiveBreakpoints.clear();
}
```

**MapManager Cleanup:**
```javascript
async cleanup() {
  // Remove map from DOM
  if (this.map) {
    this.map.remove();
    this.map = null;
  }
  
  // Clear references and reset state
  this.baseTileLayer = null;
  this.zoomControl = null;
  this.mapPanes = {};
  this.initialized = false;
}
```

**StateManager Cleanup:**
```javascript
async cleanup() {
  // Clear all watchers and bulk operations
  this.watchers.clear();
  this.bulkOperation = null;
  
  // Reset state to initial values
  this._state = {
    layers: {},
    names: {},
    emphasised: {},
    labels: {},
    deviceContext: null,
    windowSize: { width: window.innerWidth, height: window.innerHeight }
  };
  
  this.initialized = false;
}
```

#### **Testing Cleanup System**

```javascript
// Test cleanup functionality
const bootstrap = window.applicationBootstrap;
console.log('Tracked modules:', bootstrap.initializedModules.size);
console.log('Event listeners:', bootstrap.eventListeners.length);
console.log('Intervals:', bootstrap.intervals.length);
console.log('Timeouts:', bootstrap.timeouts.length);

// Test cleanup execution
await bootstrap.cleanup({ reason: 'test', preserveState: true });
console.log('Cleanup completed successfully');
```

## Graceful Degradation System

### **Degraded Mode Implementation**

When recovery fails, the system enters graceful degradation mode:

```javascript
async gracefulDegradation(phase, error) {
  // Set degraded mode flags
  stateManager.set('degradedMode', true);
  stateManager.set('degradedPhase', phase);
  stateManager.set('degradedError', error.message);
  
  // Emit event for other components
  globalEventBus.emit('app:degradedMode', { phase, error });
  
  // Show user notification
  this.showDegradedModeNotification(phase, error);
  
  return true; // Continue with degraded functionality
}
```

### **Degraded Mode Features**

#### **State Management**
- **`degradedMode`**: Boolean flag indicating degraded state
- **`degradedPhase`**: The phase where degradation occurred
- **`degradedError`**: Error message for debugging
- **`degradedTimestamp`**: When degradation occurred

#### **User Notifications**
- **Visual Indicators**: Styled notifications about limited functionality
- **Auto-Dismiss**: Notifications automatically disappear after timeout
- **Recovery Feedback**: Clear indication when recovery is attempted

#### **Component Adaptation**
- **Reduced Functionality**: Components adapt to work with missing dependencies
- **Fallback Behavior**: Alternative implementations when primary features fail
- **Progressive Enhancement**: Features work better as dependencies become available

## Network Error Handling

### **Connectivity Monitoring**

```javascript
async checkNetworkConnectivity() {
  try {
    const response = await fetch('/favicon.ico', { 
      method: 'HEAD',
      cache: 'no-cache',
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    return response.ok;
  } catch (error) {
    this.logger.warn('Network connectivity check failed', {
      error: error.message
    });
    return false;
  }
}
```

### **Network Error Recovery**

```javascript
async handleNetworkError(error, operation, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Wait with exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Check connectivity before retry
      const isOnline = await this.checkNetworkConnectivity();
      if (!isOnline) {
        continue; // Still offline, try again
      }
      
      this.logger.info(`Retrying ${operation}, attempt ${attempt}/${maxRetries}`);
      return true; // Indicate retry should be attempted
      
    } catch (retryError) {
      this.logger.warn(`Retry attempt ${attempt} failed for ${operation}`, {
        retryError: retryError.message
      });
    }
  }
  
  return false; // All retries failed
}
```

### **Offline/Online Event Handling**

```javascript
setupNetworkMonitoring() {
  window.addEventListener('online', () => {
    this.logger.info('Network connection restored');
    globalEventBus.emit('app:networkOnline');
    
    // Try to recover from network-related degraded mode
    if (this.isDegradedMode()) {
      const degradedInfo = this.getDegradedModeInfo();
      if (degradedInfo && degradedInfo.phase === 'data loading') {
        this.logger.info('Attempting to recover from network-related degraded mode');
        // Trigger data loading retry
      }
    }
  });
  
  window.addEventListener('offline', () => {
    this.logger.warn('Network connection lost');
    globalEventBus.emit('app:networkOffline');
    this.showOfflineNotification();
  });
}
```

## User Experience Features

### **Visual Notifications**

#### **Degraded Mode Notification**
```javascript
showDegradedModeNotification(phase, error) {
  const notification = document.createElement('div');
  notification.className = 'degraded-mode-notification';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #ff6b35;
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 10000;
    max-width: 300px;
  `;
  
  notification.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 8px;">⚠️ Limited Functionality</div>
    <div>Some features may not be available due to a technical issue.</div>
    <div style="margin-top: 8px;">
      <button onclick="this.parentElement.parentElement.remove()">Dismiss</button>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Auto-remove after 10 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 10000);
}
```

#### **Offline Notification**
```javascript
showOfflineNotification() {
  const notification = document.createElement('div');
  notification.className = 'offline-notification';
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 20px;
    background: #ff6b35;
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    z-index: 10000;
  `;
  
  notification.innerHTML = `
    <span>📡</span>
    <span>You're offline. Some features may not be available.</span>
  `;
  
  document.body.appendChild(notification);
}
```

## Error Monitoring & Logging

### **Structured Error Logging**

All error recovery mechanisms use the StructuredLogger system:

```javascript
this.logger.error('Bootstrap error', {
  error: error.message,
  stack: error.stack,
  context: { phase, retryCount, ...context }
});

this.logger.warn('Attempting error recovery for phase: ${phase}', {
  error: error.message,
  context
});

this.logger.info('Recovery successful for phase: ${phase}');
```

### **Event Emission**

Error events are emitted for monitoring and debugging:

```javascript
// Error occurrence
globalEventBus.emit('app:bootstrapError', { 
  error, 
  context: { phase, retryCount, ...context } 
});

// Degraded mode entry
globalEventBus.emit('app:degradedMode', { phase, error });

// Network status changes
globalEventBus.emit('app:networkOnline');
globalEventBus.emit('app:networkOffline');
```

## Testing Error Recovery

### **Test Coverage**

The error recovery system includes comprehensive tests:

```javascript
describe('ApplicationBootstrap Error Recovery', () => {
  test('should attempt error recovery for module initialization', async () => {
    const error = new Error('Module load failed');
    const context = { moduleName: 'TestModule' };
    
    const result = await bootstrap.attemptErrorRecovery(error, 'core module initialization', context);
    
    expect(result).toBe(false); // Should fail without actual module
    expect(mockEventBus.emit).toHaveBeenCalledWith('app:bootstrapError', expect.any(Object));
  });

  test('should handle graceful degradation', async () => {
    const error = new Error('Test error');
    const phase = 'test phase';
    
    const result = await bootstrap.gracefulDegradation(phase, error);
    
    expect(result).toBe(true);
    expect(mockStateManager.set).toHaveBeenCalledWith('degradedMode', true);
  });
});
```

### **Error Recovery Test Categories**

1. **Module Initialization Recovery**: Test module reinitialization
2. **Data Loading Recovery**: Test data loading fallbacks
3. **Map System Recovery**: Test map system recovery
4. **UI Component Recovery**: Test UI component recovery
5. **Network Error Handling**: Test network error retry logic
6. **Graceful Degradation**: Test degraded mode functionality
7. **User Notifications**: Test visual feedback systems

## Configuration & Tuning

### **Recovery Configuration**

Error recovery can be configured per phase:

```javascript
// Critical phases - no degradation allowed
await this.safeExecute('core module initialization', async () => {
  await this.initializeCoreModules();
}, { 
  allowRecovery: true, 
  allowDegradation: false,
  maxRetries: 2,
  context: { critical: true }
});

// Non-critical phases - allow degradation
await this.safeExecute('data loading', async () => {
  await this.loadComponents();
}, { 
  allowRecovery: true, 
  allowDegradation: true,
  maxRetries: 2,
  context: { feature: 'data' }
});
```

### **Retry Configuration**

Retry behavior can be tuned:

```javascript
// Exponential backoff with jitter
const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
const jitter = Math.random() * 1000; // Add jitter to prevent thundering herd
await new Promise(resolve => setTimeout(resolve, delay + jitter));
```

## Best Practices

### **1. Error Recovery Design**

- **Fail Fast**: Detect errors early and attempt recovery quickly
- **Fail Gracefully**: Never crash the entire application
- **Recover Automatically**: Attempt recovery before user intervention
- **Inform Users**: Provide clear feedback about system status

### **2. Degraded Mode Design**

- **Maintain Core Functionality**: Ensure basic features work
- **Progressive Enhancement**: Add features as dependencies become available
- **Clear Communication**: Inform users about limitations
- **Recovery Indicators**: Show when full functionality is restored

### **3. Network Error Handling**

- **Exponential Backoff**: Avoid overwhelming failing services
- **Circuit Breaker**: Stop retrying if service is consistently failing
- **Offline Detection**: Handle network connectivity changes
- **Cache Fallbacks**: Use cached data when possible

### **4. Monitoring & Observability**

- **Structured Logging**: Use consistent log formats
- **Error Metrics**: Track error rates and recovery success
- **User Feedback**: Monitor user experience during degraded mode
- **Performance Impact**: Measure recovery overhead

## Future Enhancements

### **Planned Improvements**

1. **Circuit Breaker Pattern**: Implement circuit breakers for external services
2. **Health Checks**: Add health check endpoints for monitoring
3. **Error Analytics**: Implement error analytics and reporting
4. **Recovery Metrics**: Add detailed recovery success metrics
5. **User Preferences**: Allow users to configure error handling behavior

### **Advanced Recovery Features**

1. **Predictive Recovery**: Use ML to predict and prevent failures
2. **Adaptive Retry**: Adjust retry strategies based on error patterns
3. **Service Mesh Integration**: Integrate with service mesh error handling
4. **Distributed Recovery**: Coordinate recovery across multiple instances

## Troubleshooting

### **Common Issues**

#### **Recovery Not Working**
- Check if recovery methods are implemented in target modules
- Verify error context is being passed correctly
- Check retry configuration and limits

#### **Degraded Mode Not Activating**
- Ensure `allowDegradation` is set to `true`
- Check if graceful degradation method is being called
- Verify state manager is working correctly

#### **User Notifications Not Showing**
- Check if DOM is ready when notifications are created
- Verify notification styling and positioning
- Check for JavaScript errors in notification creation

### **Debugging Tools**

```javascript
// Check degraded mode status
const isDegraded = applicationBootstrap.isDegradedMode();
const degradedInfo = applicationBootstrap.getDegradedModeInfo();

// Monitor error events
globalEventBus.on('app:bootstrapError', (data) => {
  console.log('Bootstrap error:', data);
});

globalEventBus.on('app:degradedMode', (data) => {
  console.log('Degraded mode:', data);
});
```

## Conclusion

The error recovery and resilience architecture provides a robust foundation for maintaining application functionality even when components fail. By implementing automatic recovery, graceful degradation, and user feedback, the system ensures a reliable user experience while providing clear visibility into system status and limitations.

For questions or issues with the error recovery system, refer to the test suite in `js/modules/ApplicationBootstrap.test.js` or consult the main `ApplicationBootstrap.js` implementation.

---

*This documentation provides comprehensive guidance for understanding, implementing, and maintaining the error recovery and resilience architecture in WeeWoo Map Friend.*
