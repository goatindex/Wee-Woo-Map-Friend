/**
 * @fileoverview ActiveListManager Tests
 * Tests for the modern active list manager component.
 */

import { ActiveListManager } from './ActiveListManager.js';
import { stateManager } from '../modules/StateManager.js';
import { globalEventBus } from '../modules/EventBus.js';

// Mock data for testing
const mockData = {
  namesByCategory: {
    ses: ['Alpine Resorts', 'Ararat Rural City', 'Ballarat City'],
    lga: ['Ballarat', 'Bendigo', 'Geelong'],
    cfa: ['Ballarat Group', 'Bendigo Group', 'Geelong Group']
  },
  nameToKey: {
    ses: {
      'Alpine Resorts': 'alpine_resorts',
      'Ararat Rural City': 'ararat_rural_city',
      'Ballarat City': 'ballarat_city'
    },
    lga: {
      'Ballarat': 'ballarat',
      'Bendigo': 'bendigo',
      'Geelong': 'geelong'
    },
    cfa: {
      'Ballarat Group': 'ballarat_group',
      'Bendigo Group': 'bendigo_group',
      'Geelong Group': 'geelong_group'
    }
  },
  categoryMeta: {
    ses: { type: 'polygon' },
    lga: { type: 'polygon' },
    cfa: { type: 'point' }
  },
  outlineColors: {
    ses: '#ff6b35',
    lga: '#4ecdc4',
    cfa: '#45b7d1'
  },
  labelColorAdjust: {
    ses: 1.0,
    lga: 1.2,
    cfa: 0.8
  },
  featureLayers: {
    ses: {
      alpine_resorts: [{ getBounds: () => ({ getCenter: () => ({ lat: -37.1, lng: 146.4 }) }) }],
      ararat_rural_city: [{ getBounds: () => ({ getCenter: () => ({ lat: -37.3, lng: 142.9 }) }) }],
      ballarat_city: [{ getBounds: () => ({ getCenter: () => ({ lat: -37.6, lng: 143.8 }) }) }]
    },
    lga: {
      ballarat: [{ getBounds: () => ({ getCenter: () => ({ lat: -37.6, lng: 143.8 }) }) }],
      bendigo: [{ getBounds: () => ({ getCenter: () => ({ lat: -36.8, lng: 144.3 }) }) }],
      geelong: [{ getBounds: () => ({ getCenter: () => ({ lat: -38.1, lng: 144.4 }) }) }]
    },
    cfa: {
      ballarat_group: { lat: -37.6, lng: 143.8 },
      bendigo_group: { lat: -36.8, lng: 144.3 },
      geelong_group: { lat: -38.1, lng: 144.4 }
    }
  },
  emphasised: {
    ses: {},
    lga: {},
    cfa: {}
  }
};

// Helper functions for DOM creation
const createActiveListDOM = () => {
  const container = document.createElement('div');
  
  const header = document.createElement('h4');
  header.id = 'activeHeader';
  header.className = 'collapsed';
  header.innerHTML = '<span class="collapse-arrow">▼</span>All Active';
  
  const list = document.createElement('div');
  list.id = 'activeList';
  list.className = 'collapsible-list';
  list.style.display = 'none';
  
  container.appendChild(header);
  container.appendChild(list);
  
  return { container, header, list };
};

const createCategoryCheckboxes = () => {
  const container = document.createElement('div');
  
  Object.entries(mockData.namesByCategory).forEach(([category, names]) => {
    names.forEach(name => {
      const key = mockData.nameToKey[category][name];
      const label = document.createElement('label');
      label.className = 'sidebar-list-row';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `${category}_${key}`;
      
      const span = document.createElement('span');
      span.textContent = name;
      
      label.appendChild(checkbox);
      label.appendChild(span);
      container.appendChild(label);
    });
  });
  
  return container;
};

// Mock legacy functions
const mockLegacyFunctions = () => {
  window.setEmphasis = jest.fn();
  window.ensureLabel = jest.fn();
  window.removeLabel = jest.fn();
  window.formatAmbulanceName = jest.fn((name) => `AMB: ${name}`);
  window.formatPoliceName = jest.fn((name) => `POL: ${name}`);
  window.adjustHexColor = jest.fn((color, factor) => color);
  
  // Mock fetch for weather API
  global.fetch = jest.fn(() => 
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        forecast: [
          { summary: 'Sunny', tempMin: 12, tempMax: 25 },
          { summary: 'Cloudy', tempMin: 10, tempMax: 22 },
          { summary: 'Rainy', tempMin: 8, tempMax: 18 }
        ]
      })
    })
  );
};

describe('ActiveListManager', () => {
  let container;
  let header;
  let list;
  let checkboxContainer;
  let manager;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    
    // Create DOM elements
    const activeListDOM = createActiveListDOM();
    container = activeListDOM.container;
    header = activeListDOM.header;
    list = activeListDOM.list;
    
    checkboxContainer = createCategoryCheckboxes();
    
    // Add to document
    document.body.appendChild(container);
    document.body.appendChild(checkboxContainer);
    
    // Mock global data
    Object.assign(window, mockData);
    
    // Mock legacy functions
    mockLegacyFunctions();
    
    // Create manager instance
    manager = new ActiveListManager(container, {
      bulkUpdateDelay: 10, // Faster for testing
      animationDuration: 50
    });

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    if (manager) {
      manager.destroy();
    }
    jest.restoreAllMocks();
    jest.clearAllTimers();
    
    // Clean up global mocks
    delete window.namesByCategory;
    delete window.nameToKey;
    delete window.categoryMeta;
    delete window.outlineColors;
    delete window.labelColorAdjust;
    delete window.featureLayers;
    delete window.emphasised;
    delete window.setEmphasis;
    delete window.ensureLabel;
    delete window.removeLabel;
    delete window.formatAmbulanceName;
    delete window.formatPoliceName;
    delete window.adjustHexColor;
  });

  describe('Initialization', () => {
    test('should initialize successfully', async () => {
      await manager.init();
      
      expect(manager.isInitialized).toBe(true);
      expect(manager.activeList).toBe(list);
      expect(manager.headerElement).toBe(header);
    });

    test('should find DOM elements', async () => {
      await manager.init();
      
      expect(manager.activeList).toBeDefined();
      expect(manager.headerElement).toBeDefined();
    });

    test('should set up accessibility attributes', async () => {
      await manager.init();
      
      expect(list.getAttribute('role')).toBe('list');
      expect(list.getAttribute('aria-label')).toBe('Active layers list');
      expect(header.getAttribute('aria-expanded')).toBe('true');
      expect(header.getAttribute('aria-controls')).toBe(list.id);
    });

    test('should sync with existing checkboxes', async () => {
      // Check some boxes before init
      const checkbox1 = document.getElementById('ses_alpine_resorts');
      const checkbox2 = document.getElementById('lga_ballarat');
      checkbox1.checked = true;
      checkbox2.checked = true;
      
      await manager.init();
      
      const sesActive = manager.activeItems.get('ses');
      const lgaActive = manager.activeItems.get('lga');
      
      expect(sesActive.has('alpine_resorts')).toBe(true);
      expect(lgaActive.has('ballarat')).toBe(true);
    });

    test('should create weather box if enabled', async () => {
      await manager.init();
      
      expect(manager.weatherBox).toBeDefined();
      expect(manager.weatherBox.id).toBe('weatherBox');
      expect(manager.weatherBox.style.display).toBe('none');
    });

    test('should handle missing active list element', async () => {
      list.remove();
      
      await expect(manager.init()).rejects.toThrow('Active list element not found');
    });
  });

  describe('Checkbox Synchronization', () => {
    beforeEach(async () => {
      await manager.init();
    });

    test('should handle checkbox changes', () => {
      const checkbox = document.getElementById('ses_alpine_resorts');
      
      checkbox.checked = true;
      checkbox.dispatchEvent(new Event('change'));
      
      const sesActive = manager.activeItems.get('ses');
      expect(sesActive.has('alpine_resorts')).toBe(true);
    });

    test('should remove items when unchecked', () => {
      const checkbox = document.getElementById('ses_alpine_resorts');
      
      // First check it
      checkbox.checked = true;
      checkbox.dispatchEvent(new Event('change'));
      
      // Then uncheck it
      checkbox.checked = false;
      checkbox.dispatchEvent(new Event('change'));
      
      const sesActive = manager.activeItems.get('ses');
      expect(sesActive.has('alpine_resorts')).toBe(false);
    });

    test('should bind event listeners only once', async () => {
      const checkbox = document.getElementById('ses_alpine_resorts');
      
      expect(checkbox._modernBound).toBe(true);
      
      // Re-init shouldn't double-bind
      await manager.init();
      
      expect(checkbox._modernBound).toBe(true);
    });
  });

  describe('Active List Rendering', () => {
    beforeEach(async () => {
      await manager.init();
    });

    test('should render empty list initially', () => {
      manager.updateActiveList();
      
      // Should have header but no items
      const items = list.querySelectorAll('.active-list-row');
      expect(items.length).toBe(0);
      expect(header.classList.contains('collapsed')).toBe(true);
    });

    test('should render active items', () => {
      // Activate some items
      const checkbox1 = document.getElementById('ses_alpine_resorts');
      const checkbox2 = document.getElementById('lga_ballarat');
      
      checkbox1.checked = true;
      checkbox1.dispatchEvent(new Event('change'));
      checkbox2.checked = true;
      checkbox2.dispatchEvent(new Event('change'));
      
      // Wait for update
      setTimeout(() => {
        const items = list.querySelectorAll('.active-list-row');
        expect(items.length).toBe(2);
        expect(header.classList.contains('collapsed')).toBe(false);
      }, 20);
    });

    test('should create header row with correct columns', () => {
      // Activate an item to trigger rendering
      const checkbox = document.getElementById('ses_alpine_resorts');
      checkbox.checked = true;
      checkbox.dispatchEvent(new Event('change'));
      
      setTimeout(() => {
        const headerRow = list.querySelector('.active-list-header');
        expect(headerRow).toBeDefined();
        
        const headers = headerRow.querySelectorAll('.active-list-icon-header');
        expect(headers.length).toBe(3); // Emphasise, Labels, Weather
      }, 20);
    });

    test('should format display names correctly', () => {
      // Mock ambulance category
      window.namesByCategory.ambulance = ['Test Ambulance'];
      window.nameToKey.ambulance = { 'Test Ambulance': 'test_ambulance' };
      
      // Create checkbox for ambulance
      const label = document.createElement('label');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = 'ambulance_test_ambulance';
      label.appendChild(checkbox);
      checkboxContainer.appendChild(label);
      
      checkbox.checked = true;
      checkbox.dispatchEvent(new Event('change'));
      
      setTimeout(() => {
        const nameSpan = list.querySelector('.active-list-name');
        expect(window.formatAmbulanceName).toHaveBeenCalledWith('Test Ambulance');
      }, 20);
    });
  });

  describe('Bulk Operations', () => {
    beforeEach(async () => {
      await manager.init();
    });

    test('should support bulk update mode', () => {
      manager.beginBulkUpdate();
      
      expect(manager.bulkUpdateActive).toBe(true);
      
      // Changes during bulk should be pending
      const checkbox = document.getElementById('ses_alpine_resorts');
      checkbox.checked = true;
      checkbox.dispatchEvent(new Event('change'));
      
      expect(manager.bulkUpdatePending).toBe(true);
      
      // End bulk should trigger update
      const updateSpy = jest.spyOn(manager, 'updateActiveList');
      manager.endBulkUpdate();
      
      expect(manager.bulkUpdateActive).toBe(false);
      expect(updateSpy).toHaveBeenCalled();
    });

    test('should clear all active items', () => {
      // Activate some items first
      const checkbox1 = document.getElementById('ses_alpine_resorts');
      const checkbox2 = document.getElementById('lga_ballarat');
      
      checkbox1.checked = true;
      checkbox1.dispatchEvent(new Event('change'));
      checkbox2.checked = true;
      checkbox2.dispatchEvent(new Event('change'));
      
      // Clear all
      manager.clearAllActive();
      
      expect(checkbox1.checked).toBe(false);
      expect(checkbox2.checked).toBe(false);
      expect(manager.activeItems.get('ses').size).toBe(0);
      expect(manager.activeItems.get('lga').size).toBe(0);
    });
  });

  describe('Item Controls', () => {
    beforeEach(async () => {
      await manager.init();
      
      // Activate an item for testing
      const checkbox = document.getElementById('ses_alpine_resorts');
      checkbox.checked = true;
      checkbox.dispatchEvent(new Event('change'));
    });

    test('should handle remove button clicks', async () => {
      // First activate an item to create a remove button
      const checkbox = document.getElementById('ses_alpine_resorts');
      checkbox.checked = true;
      checkbox.dispatchEvent(new Event('change'));
      
      // Wait for the list to update
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const removeBtn = list.querySelector('.active-list-remove-btn');
      expect(removeBtn).toBeDefined();
      
      removeBtn.click();
      
      // Wait for the removal to process
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(checkbox.checked).toBe(false);
    });

    test('should handle emphasis toggle', (done) => {
      setTimeout(() => {
        const emphasisCheckbox = list.querySelector('.active-list-row input[title="Emphasise"]');
        expect(emphasisCheckbox).toBeDefined();
        
        emphasisCheckbox.checked = true;
        emphasisCheckbox.dispatchEvent(new Event('change'));
        
        expect(window.setEmphasis).toHaveBeenCalledWith('ses', 'alpine_resorts', true, false);
        done();
      }, 20);
    });

    test('should handle label toggle', (done) => {
      setTimeout(() => {
        const labelCheckbox = list.querySelector('.active-list-row input[title="Show Name"]');
        expect(labelCheckbox).toBeDefined();
        
        // Should be checked by default and show label
        expect(labelCheckbox.checked).toBe(true);
        expect(window.ensureLabel).toHaveBeenCalled();
        
        // Uncheck to hide label
        labelCheckbox.checked = false;
        labelCheckbox.dispatchEvent(new Event('change'));
        
        expect(window.removeLabel).toHaveBeenCalledWith('ses', 'alpine_resorts');
        done();
      }, 20);
    });

    test('should handle weather toggle', async () => {
      return new Promise((resolve) => {
        setTimeout(async () => {
          const weatherCheckbox = list.querySelector('.sevenSevenCheckbox');
          expect(weatherCheckbox).toBeDefined();
          
          weatherCheckbox.checked = true;
          weatherCheckbox.dispatchEvent(new Event('change'));
          
          // Wait for async weather fetch
          await new Promise(r => setTimeout(r, 50));
          
          expect(global.fetch).toHaveBeenCalled();
          expect(manager.weatherBox.style.display).toBe('block');
          resolve();
        }, 20);
      });
    });
  });

  describe('Weather Integration', () => {
    beforeEach(async () => {
      await manager.init();
    });

    test('should fetch weather data correctly', async () => {
      const weatherData = await manager.fetchWeatherData(-37.6, 143.8);
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('lat=-37.6&lon=143.8')
      );
      
      expect(weatherData.forecastData.days).toHaveLength(3);
      expect(weatherData.forecastData.days[0]).toEqual(
        expect.objectContaining({
          summary: 'Sunny',
          tempMin: 12,
          tempMax: 25
        })
      );
    });

    test('should render weather box correctly', () => {
      const weatherData = {
        forecastData: {
          days: [
            { date: 'Day 1', summary: 'Sunny', tempMin: 12, tempMax: 25 },
            { date: 'Day 2', summary: 'Cloudy', tempMin: 10, tempMax: 22 }
          ]
        },
        historyData: { days: [] }
      };
      
      manager.renderWeatherBox(weatherData);
      
      expect(manager.weatherBox.style.display).toBe('block');
      expect(manager.weatherBox.innerHTML).toContain('7-Day Weather Forecast');
      expect(manager.weatherBox.innerHTML).toContain('Sunny');
      expect(manager.weatherBox.innerHTML).toContain('Min 12°C, Max 25°C');
    });

    test('should hide weather box', () => {
      manager.weatherBox.style.display = 'block';
      manager.hideWeatherBox();
      
      expect(manager.weatherBox.style.display).toBe('none');
      expect(manager.currentWeatherLocation).toBe(null);
    });

    test('should handle weather API errors', async () => {
      global.fetch.mockRejectedValueOnce(new Error('API Error'));
      manager.weatherProvider = 'open-meteo'; // Set to non-willyweather to avoid fallback
      
      await expect(manager.fetchWeatherData(-37.6, 143.8)).rejects.toThrow('API Error');
    });

    test('should fallback to open-meteo on willyweather failure', async () => {
      // First call fails, second succeeds
      global.fetch
        .mockRejectedValueOnce(new Error('WillyWeather Error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ forecast: [] })
        });
      
      manager.weatherProvider = 'willyweather';
      await manager.fetchWeatherData(-37.6, 143.8);
      
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenLastCalledWith(
        expect.stringContaining('provider=open-meteo')
      );
    });
  });

  describe('Event System', () => {
    beforeEach(async () => {
      await manager.init();
    });

    test('should emit item toggled events', () => {
      const eventSpy = jest.fn();
      globalEventBus.on('activeList:itemToggled', eventSpy);
      
      const checkbox = document.getElementById('ses_alpine_resorts');
      checkbox.checked = true;
      checkbox.dispatchEvent(new Event('change'));
      
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'ses',
          key: 'alpine_resorts',
          active: true,
          total: 1
        }),
        'activeList:itemToggled'
      );
    });

    test('should emit updated events', (done) => {
      const eventSpy = jest.fn();
      globalEventBus.on('activeList:updated', eventSpy);
      
      const checkbox = document.getElementById('ses_alpine_resorts');
      checkbox.checked = true;
      checkbox.dispatchEvent(new Event('change'));
      
      setTimeout(() => {
        expect(eventSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            totalItems: 1,
            categories: expect.arrayContaining(['ses'])
          }),
          'activeList:updated'
        );
        done();
      }, 20);
    });

    test('should handle search selected events', () => {
      const updateSpy = jest.spyOn(manager, 'updateActiveList');
      
      globalEventBus.emit('search:selected', {
        category: 'ses',
        key: 'alpine_resorts'
      });
      
      setTimeout(() => {
        expect(updateSpy).toHaveBeenCalled();
      }, 150);
    });

    test('should handle data update events', () => {
      const syncSpy = jest.spyOn(manager, 'syncWithExistingCheckboxes');
      
      globalEventBus.emit('data:layerAdded', {});
      
      setTimeout(() => {
        expect(syncSpy).toHaveBeenCalled();
      }, 150);
    });
  });

  describe('State Management', () => {
    beforeEach(async () => {
      await manager.init();
    });

    test('should get current state', () => {
      // Activate some items
      manager.activeItems.set('ses', new Set(['alpine_resorts', 'ballarat_city']));
      manager.activeItems.set('lga', new Set(['ballarat']));
      manager.weatherProvider = 'open-meteo';
      
      const state = manager.getState();
      
      expect(state.activeItems).toEqual({
        ses: ['alpine_resorts', 'ballarat_city'],
        lga: ['ballarat'],
        cfa: [],
        ambulance: [],
        police: [],
        frv: []
      });
      expect(state.weatherProvider).toBe('open-meteo');
      expect(state.bulkUpdateActive).toBe(false);
    });

    test('should apply state correctly', () => {
      const newState = {
        activeItems: {
          ses: ['alpine_resorts'],
          cfa: ['ballarat_group']
        },
        weatherProvider: 'open-meteo',
        bulkUpdateActive: true
      };
      
      const updateSpy = jest.spyOn(manager, 'updateActiveList');
      
      manager.applyState(newState);
      
      expect(manager.activeItems.get('ses')).toEqual(new Set(['alpine_resorts']));
      expect(manager.activeItems.get('cfa')).toEqual(new Set(['ballarat_group']));
      expect(manager.weatherProvider).toBe('open-meteo');
      expect(manager.bulkUpdateActive).toBe(true);
      expect(updateSpy).toHaveBeenCalled();
    });

    test('should get all active items', () => {
      // Activate some items
      const checkbox1 = document.getElementById('ses_alpine_resorts');
      const checkbox2 = document.getElementById('lga_ballarat');
      
      checkbox1.checked = true;
      checkbox1.dispatchEvent(new Event('change'));
      checkbox2.checked = true;
      checkbox2.dispatchEvent(new Event('change'));
      
      const allActive = manager.getAllActiveItems();
      
      expect(allActive).toHaveLength(2);
      expect(allActive).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            category: 'ses',
            key: 'alpine_resorts',
            name: 'Alpine Resorts'
          }),
          expect.objectContaining({
            category: 'lga',
            key: 'ballarat',
            name: 'Ballarat'
          })
        ])
      );
    });
  });

  describe('Legacy Compatibility', () => {
    beforeEach(async () => {
      await manager.init();
    });

    test('should expose legacy global functions', () => {
      expect(window.beginActiveListBulk).toBeDefined();
      expect(window.endActiveListBulk).toBeDefined();
      expect(window.updateActiveList).toBeDefined();
    });

    test('should call manager methods from legacy functions', () => {
      window.modernActiveListManager = manager;
      
      const beginSpy = jest.spyOn(manager, 'beginBulkUpdate');
      const endSpy = jest.spyOn(manager, 'endBulkUpdate');
      const updateSpy = jest.spyOn(manager, 'updateActiveList');
      
      window.beginActiveListBulk();
      expect(beginSpy).toHaveBeenCalled();
      
      window.endActiveListBulk();
      expect(endSpy).toHaveBeenCalled();
      
      window.updateActiveList();
      expect(updateSpy).toHaveBeenCalled();
    });

    test('should handle missing legacy data gracefully', async () => {
      delete window.namesByCategory;
      delete window.nameToKey;
      
      const newManager = new ActiveListManager(container);
      await newManager.init();
      
      newManager.updateActiveList();
      
      // Should not crash
      expect(newManager.isInitialized).toBe(true);
      
      newManager.destroy();
    });
  });

  describe('Cleanup', () => {
    test('should clean up event listeners on destroy', async () => {
      await manager.init();
      
      const checkbox = document.getElementById('ses_alpine_resorts');
      expect(checkbox._modernBound).toBe(true);
      
      manager.destroy();
      
      expect(checkbox._modernBound).toBe(false);
    });

    test('should remove weather box on destroy', async () => {
      await manager.init();
      
      const weatherBox = manager.weatherBox;
      expect(weatherBox.parentNode).toBeDefined();
      
      manager.destroy();
      
      expect(weatherBox.parentNode).toBe(null);
    });

    test('should clear state on destroy', async () => {
      await manager.init();
      
      // Add some state
      manager.activeItems.set('ses', new Set(['alpine_resorts']));
      manager.currentWeatherLocation = { lat: -37.6, lng: 143.8 };
      
      manager.destroy();
      
      expect(manager.activeItems.size).toBe(0);
      expect(manager.currentWeatherLocation).toBe(null);
      expect(manager.isInitialized).toBe(false);
    });

    test('should clear timers on destroy', async () => {
      await manager.init();
      
      manager.bulkUpdateTimer = setTimeout(() => {}, 1000);
      
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      
      manager.destroy();
      
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });
});
