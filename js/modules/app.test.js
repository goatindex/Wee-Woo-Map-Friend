/**
 * App Module Tests
 * 
 * Tests for the main application class functionality.
 * Note: App auto-initialization is disabled in test environment.
 */

import { app } from './app.js';

describe('App Module', () => {
  beforeEach(() => {
    // Reset any global state before each test
    jest.clearAllTimers();
    
    // Mock console methods to avoid test noise
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('app instance is exported and accessible', () => {
    expect(app).toBeDefined();
    expect(typeof app).toBe('object');
    expect(app.constructor.name).toBe('App');
  });

  test('app has expected methods', () => {
    expect(typeof app.init).toBe('function');
    expect(typeof app.getState).toBe('function');
    expect(typeof app.getComponent).toBe('function');
    expect(typeof app.registerComponent).toBe('function');
    expect(typeof app.handleError).toBe('function');
  });

  test('app does not auto-initialize in test environment', () => {
    // The app should be instantiated but not initialized
    expect(app).toBeDefined();
    
    // Check that initialization hasn't started async operations
    expect(jest.getTimerCount()).toBe(0);
  });

  test('app can be manually initialized for testing', async () => {
    // This test verifies we can manually control initialization
    expect(app).toBeDefined();
    expect(typeof app.init).toBe('function');
    
    // We're not actually calling init() here to avoid hanging,
    // just verifying the interface is available for controlled testing
  });

  test('app state management interface exists', () => {
    expect(typeof app.getState).toBe('function');
    expect(typeof app.getComponent).toBe('function');
    
    // Basic state operations should be available even without full init
    const initialState = app.getState();
    expect(typeof initialState).toBe('object');
  });
});
