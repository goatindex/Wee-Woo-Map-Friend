/**
 * @jest-environment jsdom
 */

import { EmphasisManager, emphasisManager, setEmphasis } from './EmphasisManager.js';

describe('EmphasisManager', () => {
  let manager;
  let mockState;
  let mockConfig;
  let mockDependencies;

  beforeEach(() => {
    manager = new EmphasisManager();
    
    mockState = {
      emphasised: {},
      featureLayers: {
        ses: {
          'test-ses': [
            {
              setStyle: jest.fn(),
              options: { fillOpacity: 0.2 }
            }
          ]
        },
        ambulance: {
          'test-ambulance': {
            getElement: jest.fn(() => ({
              classList: {
                toggle: jest.fn()
              }
            }))
          }
        }
      }
    };
    
    mockConfig = {
      categoryMeta: {
        ses: {
          styleFn: jest.fn(() => ({ fillOpacity: 0.3 }))
        }
      }
    };
    
    mockDependencies = {
      state: mockState,
      config: mockConfig
    };
    
    jest.clearAllMocks();
  });

  describe('setEmphasis', () => {
    test('should set emphasis for polygon layers', () => {
      manager.setEmphasis('ses', 'test-ses', true, false, mockDependencies);
      
      expect(mockState.emphasised.ses['test-ses']).toBe(true);
      expect(mockState.featureLayers.ses['test-ses'][0].setStyle).toHaveBeenCalledWith({
        fillOpacity: 0.35 // 0.2 + 0.15
      });
    });

    test('should remove emphasis for polygon layers', () => {
      // First set emphasis
      manager.setEmphasis('ses', 'test-ses', true, false, mockDependencies);
      
      // Then remove it
      manager.setEmphasis('ses', 'test-ses', false, false, mockDependencies);
      
      expect(mockState.emphasised.ses['test-ses']).toBe(false);
      expect(mockState.featureLayers.ses['test-ses'][0].setStyle).toHaveBeenCalledWith({
        fillOpacity: 0.3 // From config
      });
    });

    test('should set emphasis for point markers', () => {
      const mockElement = {
        classList: {
          toggle: jest.fn()
        }
      };
      mockState.featureLayers.ambulance['test-ambulance'].getElement.mockReturnValue(mockElement);
      
      manager.setEmphasis('ambulance', 'test-ambulance', true, true, mockDependencies);
      
      expect(mockState.emphasised.ambulance['test-ambulance']).toBe(true);
      expect(mockElement.classList.toggle).toHaveBeenCalledWith('ambulance-emph', true);
    });

    test('should remove emphasis for point markers', () => {
      const mockElement = {
        classList: {
          toggle: jest.fn()
        }
      };
      mockState.featureLayers.ambulance['test-ambulance'].getElement.mockReturnValue(mockElement);
      
      manager.setEmphasis('ambulance', 'test-ambulance', false, true, mockDependencies);
      
      expect(mockState.emphasised.ambulance['test-ambulance']).toBe(false);
      expect(mockElement.classList.toggle).toHaveBeenCalledWith('ambulance-emph', false);
    });

    test('should handle missing feature layers gracefully', () => {
      const dependenciesNoLayers = {
        state: { emphasised: {} },
        config: mockConfig
      };
      
      expect(() => {
        manager.setEmphasis('unknown', 'test', true, false, dependenciesNoLayers);
      }).not.toThrow();
    });

    test('should handle missing marker element gracefully', () => {
      mockState.featureLayers.ambulance['test-ambulance'].getElement.mockReturnValue(null);
      
      expect(() => {
        manager.setEmphasis('ambulance', 'test-ambulance', true, true, mockDependencies);
      }).not.toThrow();
    });
  });

  describe('getEmphasis', () => {
    test('should return current emphasis state', () => {
      mockState.emphasised.ses = { 'test-ses': true };
      
      expect(manager.getEmphasis('ses', 'test-ses', mockDependencies)).toBe(true);
    });

    test('should return false for non-emphasised features', () => {
      expect(manager.getEmphasis('ses', 'test-ses', mockDependencies)).toBe(false);
    });

    test('should return false for missing categories', () => {
      expect(manager.getEmphasis('unknown', 'test', mockDependencies)).toBe(false);
    });
  });

  describe('toggleEmphasis', () => {
    test('should toggle emphasis from false to true', () => {
      const newState = manager.toggleEmphasis('ses', 'test-ses', false, mockDependencies);
      
      expect(newState).toBe(true);
      expect(mockState.emphasised.ses['test-ses']).toBe(true);
    });

    test('should toggle emphasis from true to false', () => {
      mockState.emphasised.ses = { 'test-ses': true };
      
      const newState = manager.toggleEmphasis('ses', 'test-ses', false, mockDependencies);
      
      expect(newState).toBe(false);
      expect(mockState.emphasised.ses['test-ses']).toBe(false);
    });
  });

  describe('clearCategoryEmphasis', () => {
    test('should clear all emphasis for a category', () => {
      mockState.emphasised.ses = {
        'test1': true,
        'test2': false,
        'test3': true
      };
      
      manager.clearCategoryEmphasis('ses', mockDependencies);
      
      expect(mockState.emphasised.ses['test1']).toBe(false);
      expect(mockState.emphasised.ses['test2']).toBe(false);
      expect(mockState.emphasised.ses['test3']).toBe(false);
    });

    test('should handle missing category gracefully', () => {
      expect(() => {
        manager.clearCategoryEmphasis('unknown', mockDependencies);
      }).not.toThrow();
    });
  });

  describe('clearAllEmphasis', () => {
    test('should clear emphasis across all categories', () => {
      mockState.emphasised = {
        ses: { 'test1': true, 'test2': false },
        lga: { 'test3': true }
      };
      
      manager.clearAllEmphasis(mockDependencies);
      
      expect(mockState.emphasised.ses['test1']).toBe(false);
      expect(mockState.emphasised.ses['test2']).toBe(false);
      expect(mockState.emphasised.lga['test3']).toBe(false);
    });

    test('should handle missing emphasis state gracefully', () => {
      const dependenciesNoEmphasis = {
        state: {},
        config: mockConfig
      };
      
      expect(() => {
        manager.clearAllEmphasis(dependenciesNoEmphasis);
      }).not.toThrow();
    });
  });

  describe('isPointFeature', () => {
    test('should identify point features correctly', () => {
      expect(manager.isPointFeature('ambulance', 'test-ambulance', mockDependencies)).toBe(true);
    });

    test('should identify polygon features correctly', () => {
      expect(manager.isPointFeature('ses', 'test-ses', mockDependencies)).toBe(false);
    });

    test('should handle missing features gracefully', () => {
      expect(manager.isPointFeature('unknown', 'test', mockDependencies)).toBe(false);
    });
  });

  describe('getEmphasisStats', () => {
    test('should return correct emphasis statistics', () => {
      mockState.emphasised = {
        ses: { 'test1': true, 'test2': false, 'test3': true },
        lga: { 'test4': false }
      };
      
      const stats = manager.getEmphasisStats(mockDependencies);
      
      expect(stats.total).toBe(4);
      expect(stats.byCategory.ses.total).toBe(3);
      expect(stats.byCategory.ses.emphasised).toBe(2);
      expect(stats.byCategory.lga.total).toBe(1);
      expect(stats.byCategory.lga.emphasised).toBe(0);
    });

    test('should handle missing emphasis state', () => {
      const dependenciesNoEmphasis = {
        state: {},
        config: mockConfig
      };
      
      const stats = manager.getEmphasisStats(dependenciesNoEmphasis);
      
      expect(stats.total).toBe(0);
      expect(stats.byCategory).toEqual({});
    });
  });

  describe('destroy', () => {
    test('should clear all emphasis and clean up', () => {
      mockState.emphasised = {
        ses: { 'test1': true },
        lga: { 'test2': true }
      };
      
      manager.destroy(mockDependencies);
      
      expect(mockState.emphasised.ses['test1']).toBe(false);
      expect(mockState.emphasised.lga['test2']).toBe(false);
    });
  });

  describe('Legacy compatibility', () => {
    test('should work with legacy function exports', () => {
      expect(setEmphasis).toBeDefined();
      expect(typeof setEmphasis).toBe('function');
      
      // Test that legacy function works
      setEmphasis('ses', 'test-ses', true, false, mockDependencies);
      expect(mockState.emphasised.ses['test-ses']).toBe(true);
    });

    test('should work with singleton instance', () => {
      expect(emphasisManager).toBeInstanceOf(EmphasisManager);
      expect(emphasisManager.setEmphasis).toBeDefined();
    });
  });

  describe('Error handling', () => {
    test('should handle setStyle errors gracefully', () => {
      mockState.featureLayers.ses['test-ses'][0].setStyle.mockImplementation(() => {
        throw new Error('setStyle failed');
      });
      
      expect(() => {
        manager.setEmphasis('ses', 'test-ses', true, false, mockDependencies);
      }).not.toThrow();
    });

    test('should handle missing config gracefully', () => {
      const dependenciesNoConfig = {
        state: mockState,
        config: {}
      };
      
      expect(() => {
        manager.setEmphasis('ses', 'test-ses', false, false, dependenciesNoConfig);
      }).not.toThrow();
    });
  });
});


