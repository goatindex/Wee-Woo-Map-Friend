/**
 * Method Call Analysis Script
 * Analyzes method calls and dependencies between modules
 */

// This script would be run in the browser to analyze runtime method calls
const analyzeMethodCalls = () => {
  const analysis = {
    moduleImports: {},
    methodCalls: {},
    dependencyGraph: {},
    interfaceUsage: {},
    errors: []
  };

  // Analyze each module's imports and method calls
  const modules = [
    'ApplicationBootstrap',
    'ActiveListManager', 
    'MapManager',
    'DeviceManager',
    'StateManager',
    'ConfigurationManager',
    'EmphasisManager',
    'LabelManager',
    'DataLoadingOrchestrator',
    'PolygonLoader',
    'LayerManager',
    'SearchManager',
    'UIManager',
    'CollapsibleManager',
    'FABManager'
  ];

  modules.forEach(moduleName => {
    try {
      const module = window[moduleName];
      if (module) {
        analysis.moduleImports[moduleName] = {
          type: typeof module,
          isClass: module.constructor?.name !== 'Object',
          methods: Object.getOwnPropertyNames(module).filter(prop => 
            typeof module[prop] === 'function'
          ),
          prototype: Object.getOwnPropertyNames(module.prototype || {}).filter(prop => 
            typeof module.prototype[prop] === 'function'
          )
        };

        // Analyze method calls within the module
        analysis.methodCalls[moduleName] = analyzeModuleMethodCalls(module);
      }
    } catch (error) {
      analysis.errors.push(`Error analyzing ${moduleName}: ${error.message}`);
    }
  });

  return analysis;
};

const analyzeModuleMethodCalls = (module) => {
  const calls = {
    internalCalls: [],
    externalCalls: [],
    eventEmissions: [],
    eventListeners: [],
    stateAccess: [],
    configurationAccess: []
  };

  // This would need to be implemented with more sophisticated analysis
  // For now, we'll analyze what we can from the module structure
  
  if (module.eventBus) {
    calls.eventEmissions.push('eventBus.emit');
    calls.eventListeners.push('eventBus.on');
  }
  
  if (module.stateManager) {
    calls.stateAccess.push('stateManager.getState');
    calls.stateAccess.push('stateManager.setState');
  }
  
  if (module.logger) {
    calls.externalCalls.push('logger.info');
    calls.externalCalls.push('logger.error');
    calls.externalCalls.push('logger.warn');
  }

  return calls;
};

// Export for use in browser
if (typeof window !== 'undefined') {
  window.analyzeMethodCalls = analyzeMethodCalls;
}

module.exports = { analyzeMethodCalls };

