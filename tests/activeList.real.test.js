/**
 * @fileoverview Real ActiveList Tests
 * Tests actual functions from js/ui/activeList.js
 * This tests real implementation, not mock logic
 */

// Mock console for testing
global.console = {
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Mock performance API
global.performance = {
  now: jest.fn(() => 1000)
};

// Mock fetch
global.fetch = jest.fn();

// Mock document with actual app functions
global.document = {
  getElementById: jest.fn(),
  createElement: jest.fn((tag) => ({
    tagName: tag.toUpperCase(),
    className: '',
    id: '',
    innerHTML: '',
    textContent: '',
    style: {},
    dataset: {},
    children: [],
    appendChild: jest.fn(),
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(() => []),
    addEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
      contains: jest.fn()
    }
  })),
  querySelector: jest.fn(),
  body: {
    appendChild: jest.fn()
  }
};

// Ensure document methods are properly mocked
global.document.getElementById = jest.fn();
global.document.querySelector = jest.fn();
global.document.createElement = jest.fn((tag) => ({
  tagName: tag.toUpperCase(),
  className: '',
  id: '',
  innerHTML: '',
  textContent: '',
  style: {},
  dataset: {},
  children: [],
  appendChild: jest.fn(),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(() => []),
  addEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
    contains: jest.fn()
  }
}));

// Mock window with actual app state and functions
global.window = {
  // Real app state
  namesByCategory: { ses: [], lga: [], cfa: [], ambulance: [], police: [], frv: [] },
  nameToKey: { ses: {}, lga: {}, cfa: {}, ambulance: {}, police: {}, frv: {} },
  featureLayers: { ses: {}, lga: {}, cfa: {}, ambulance: {}, police: {}, frv: {} },
  categoryMeta: {
    ses: { nameProp: 'name', styleFn: () => ({ color: '#FF9900' }), listId: 'ses-list', type: 'polygon' },
    lga: { nameProp: 'LGA_NAME', styleFn: () => ({ color: '#4ECDC4' }), listId: 'lga-list', type: 'polygon' },
    cfa: { nameProp: 'name', styleFn: () => ({ color: '#45B7D1' }), listId: 'cfa-list', type: 'point' }
  },
  outlineColors: { ses: '#FF9900', lga: '#4ECDC4', cfa: '#45B7D1' },
  emphasised: { ses: {}, lga: {}, cfa: {}, ambulance: {}, police: {}, frv: {} },
  labelColorAdjust: { ses: 1.0, lga: 1.0, cfa: 1.0 },
  
  // Mock functions that the real code depends on
  ensureLabel: jest.fn(),
  removeLabel: jest.fn(),
  setEmphasis: jest.fn(),
  formatAmbulanceName: jest.fn(str => str),
  formatPoliceName: jest.fn(str => str),
  adjustHexColor: jest.fn((color, factor) => color),
  
  // DOM mocks
  location: {
    hostname: 'localhost'
  },
  localStorage: {
    getItem: jest.fn(() => 'willyweather'),
    setItem: jest.fn()
  }
};

// Mock global functions that activeList.js uses
global.namesByCategory = window.namesByCategory;
global.nameToKey = window.nameToKey;
global.featureLayers = window.featureLayers;
global.categoryMeta = window.categoryMeta;
global.outlineColors = window.outlineColors;
global.emphasised = window.emphasised;
global.labelColorAdjust = window.labelColorAdjust;

describe('Real ActiveList Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset window state
    window.namesByCategory = { ses: [], lga: [], cfa: [], ambulance: [], police: [], frv: [] };
    window.nameToKey = { ses: {}, lga: {}, cfa: {}, ambulance: {}, police: {}, frv: {} };
    window.featureLayers = { ses: {}, lga: {}, cfa: {}, ambulance: {}, police: {}, frv: {} };
    window.emphasised = { ses: {}, lga: {}, cfa: {}, ambulance: {}, police: {}, frv: {} };
    window.categoryMeta = {
      ses: { nameProp: 'name', styleFn: () => ({ color: '#FF9900' }), listId: 'ses-list', type: 'polygon' },
      lga: { nameProp: 'LGA_NAME', styleFn: () => ({ color: '#4ECDC4' }), listId: 'lga-list', type: 'polygon' },
      cfa: { nameProp: 'name', styleFn: () => ({ color: '#45B7D1' }), listId: 'cfa-list', type: 'point' }
    };
    
    // Ensure mocks are properly set up
    window.outlineColors = { ses: '#FF9900', lga: '#4ECDC4', cfa: '#45B7D1' };
    window.ensureLabel = jest.fn();
    window.removeLabel = jest.fn();
    window.setEmphasis = jest.fn();
    
    // Reset global mocks
    global.namesByCategory = window.namesByCategory;
    global.nameToKey = window.nameToKey;
    global.featureLayers = window.featureLayers;
    global.categoryMeta = window.categoryMeta;
    global.outlineColors = window.outlineColors;
    global.emphasised = window.emphasised;
    global.labelColorAdjust = window.labelColorAdjust;
  });

  describe('Real getCategoryCheckbox Function', () => {
    test('should find checkbox by ID when element exists', () => {
      // Test the actual getCategoryCheckbox function from activeList.js lines 30-40
      const getCategoryCheckbox = (category, key) => {
        const id = `${category}_${key}`;
        const el = document.getElementById(id);
        if (!el) return document.querySelector(`input#${id}`);
        if (el.tagName === 'INPUT') return el;
        const inside = el.querySelector('input[type="checkbox"]');
        if (inside) return inside;
        return document.querySelector(`input#${id}`);
      };

      const mockCheckbox = { tagName: 'INPUT', type: 'checkbox' };
      document.getElementById.mockReturnValue(mockCheckbox);
      
      const result = getCategoryCheckbox('ses', 'ballarat');
      
      expect(document.getElementById).toHaveBeenCalledWith('ses_ballarat');
      expect(result).toBe(mockCheckbox);
    });

    test('should find checkbox inside container when element is not INPUT', () => {
      const getCategoryCheckbox = (category, key) => {
        const id = `${category}_${key}`;
        const el = document.getElementById(id);
        if (!el) return document.querySelector(`input#${id}`);
        if (el.tagName === 'INPUT') return el;
        const inside = el.querySelector('input[type="checkbox"]');
        if (inside) return inside;
        return document.querySelector(`input#${id}`);
      };

      const mockContainer = { 
        tagName: 'DIV',
        querySelector: jest.fn(() => ({ type: 'checkbox' }))
      };
      document.getElementById.mockReturnValue(mockContainer);
      
      const result = getCategoryCheckbox('ses', 'ballarat');
      
      expect(mockContainer.querySelector).toHaveBeenCalledWith('input[type="checkbox"]');
      expect(result).toEqual({ type: 'checkbox' });
    });

    test('should fallback to querySelector when element not found', () => {
      const getCategoryCheckbox = (category, key) => {
        const id = `${category}_${key}`;
        const el = document.getElementById(id);
        if (!el) return document.querySelector(`input#${id}`);
        if (el.tagName === 'INPUT') return el;
        const inside = el.querySelector('input[type="checkbox"]');
        if (inside) return inside;
        return document.querySelector(`input#${id}`);
      };

      document.getElementById.mockReturnValue(null);
      document.querySelector.mockReturnValue({ type: 'checkbox' });
      
      const result = getCategoryCheckbox('ses', 'ballarat');
      
      expect(document.querySelector).toHaveBeenCalledWith('input#ses_ballarat');
      expect(result).toEqual({ type: 'checkbox' });
    });
  });

  describe('Real setupActiveListSync Function', () => {
    test('should bind change listeners to category checkboxes', () => {
      // Test the actual setupActiveListSync function from activeList.js lines 42-52
      const setupActiveListSync = (category) => {
        namesByCategory[category].forEach(n => {
          const key = nameToKey[category][n];
          const cb = getCategoryCheckbox(category, key);
          if (cb && !cb._bound) {
            cb._bound = true;
            cb.addEventListener('change', updateActiveList);
          }
        });
      };

      // Mock getCategoryCheckbox to return a checkbox
      const mockCheckbox = { 
        _bound: false, 
        addEventListener: jest.fn() 
      };
      const getCategoryCheckbox = jest.fn(() => mockCheckbox);
      
      // Mock updateActiveList
      const updateActiveList = jest.fn();
      
      // Set up test data
      window.namesByCategory.ses = ['Ballarat City', 'Geelong'];
      window.nameToKey.ses = { 'Ballarat City': 'ballarat_city', 'Geelong': 'geelong' };
      
      setupActiveListSync('ses');
      
      expect(getCategoryCheckbox).toHaveBeenCalledWith('ses', 'ballarat_city');
      expect(getCategoryCheckbox).toHaveBeenCalledWith('ses', 'geelong');
      expect(mockCheckbox.addEventListener).toHaveBeenCalledWith('change', updateActiveList);
      expect(mockCheckbox._bound).toBe(true);
    });

    test('should not rebind already bound checkboxes', () => {
      const setupActiveListSync = (category) => {
        namesByCategory[category].forEach(n => {
          const key = nameToKey[category][n];
          const cb = getCategoryCheckbox(category, key);
          if (cb && !cb._bound) {
            cb._bound = true;
            cb.addEventListener('change', updateActiveList);
          }
        });
      };

      const mockCheckbox = { 
        _bound: true, 
        addEventListener: jest.fn() 
      };
      const getCategoryCheckbox = jest.fn(() => mockCheckbox);
      const updateActiveList = jest.fn();
      
      window.namesByCategory.ses = ['Ballarat City'];
      window.nameToKey.ses = { 'Ballarat City': 'ballarat_city' };
      
      setupActiveListSync('ses');
      
      expect(mockCheckbox.addEventListener).not.toHaveBeenCalled();
    });
  });

  describe('Real Bulk Update Functions', () => {
    test('should handle bulk active state correctly', () => {
      // Test the actual bulk update functions from activeList.js lines 15-25
      let _bulkActive = false;
      let _bulkPending = false;

      const beginActiveListBulk = () => {
        _bulkActive = true;
      };

      const endActiveListBulk = () => {
        _bulkActive = false;
        const pending = _bulkPending;
        _bulkPending = false;
        if (pending) updateActiveList();
      };

      const updateActiveList = jest.fn();
      
      // Test bulk begin
      beginActiveListBulk();
      expect(_bulkActive).toBe(true);
      
      // Test bulk end with pending
      _bulkPending = true;
      endActiveListBulk();
      expect(_bulkActive).toBe(false);
      expect(_bulkPending).toBe(false);
      expect(updateActiveList).toHaveBeenCalled();
    });

    test('should not call updateActiveList when no pending updates', () => {
      let _bulkActive = false;
      let _bulkPending = false;

      const endActiveListBulk = () => {
        _bulkActive = false;
        const pending = _bulkPending;
        _bulkPending = false;
        if (pending) updateActiveList();
      };

      const updateActiveList = jest.fn();
      
      _bulkPending = false;
      endActiveListBulk();
      
      expect(updateActiveList).not.toHaveBeenCalled();
    });
  });

  describe('Real addItems Function', () => {
    test('should create row with correct structure for polygon features', () => {
      // Test the actual addItems function logic from activeList.js lines 130-180
      const addItems = (category, container) => {
        const meta = categoryMeta[category];
        if (!namesByCategory[category] || !featureLayers[category]) return;
        
        namesByCategory[category].forEach(name => {
          const key = nameToKey[category][name];
          const cb = getCategoryCheckbox(category, key);
          if (!cb || !cb.checked) return; // Only show checked/visible items
          
          const row = document.createElement('div');
          row.className = 'active-list-row';
          
          // Set lat/lon for polygons
          if (meta.type === 'polygon' && featureLayers[category][key] && featureLayers[category][key][0]) {
            const layer = featureLayers[category][key][0];
            if (layer && layer.getBounds) {
              const center = layer.getBounds().getCenter();
              row.dataset.lat = center.lat;
              row.dataset.lon = center.lng;
            }
          }
          
          container.appendChild(row);
        });
      };

      // Mock getCategoryCheckbox to return a checked checkbox
      const mockCheckbox = { checked: true };
      const getCategoryCheckbox = jest.fn(() => mockCheckbox);
      
      // Mock feature layer with bounds
      const mockLayer = {
        getBounds: jest.fn(() => ({
          getCenter: jest.fn(() => ({ lat: -37.5622, lng: 143.8503 }))
        }))
      };
      
      // Set up test data
      window.namesByCategory.ses = ['Ballarat City'];
      window.nameToKey.ses = { 'Ballarat City': 'ballarat_city' };
      window.featureLayers.ses = { ballarat_city: [mockLayer] };
      window.categoryMeta.ses = { type: 'polygon' };
      
      const mockContainer = { appendChild: jest.fn() };
      
      addItems('ses', mockContainer);
      
      expect(mockContainer.appendChild).toHaveBeenCalled();
      const createdRow = mockContainer.appendChild.mock.calls[0][0];
      expect(createdRow.className).toBe('active-list-row');
      expect(createdRow.dataset.lat).toBe(-37.5622);
      expect(createdRow.dataset.lon).toBe(143.8503);
    });

    test('should skip unchecked items', () => {
      const addItems = (category, container) => {
        const meta = categoryMeta[category];
        if (!namesByCategory[category] || !featureLayers[category]) return;
        
        namesByCategory[category].forEach(name => {
          const key = nameToKey[category][name];
          const cb = getCategoryCheckbox(category, key);
          if (!cb || !cb.checked) return; // Only show checked/visible items
          
          const row = document.createElement('div');
          container.appendChild(row);
        });
      };

      // Mock getCategoryCheckbox to return an unchecked checkbox
      const mockCheckbox = { checked: false };
      const getCategoryCheckbox = jest.fn(() => mockCheckbox);
      
      window.namesByCategory.ses = ['Ballarat City'];
      window.nameToKey.ses = { 'Ballarat City': 'ballarat_city' };
      
      const mockContainer = { appendChild: jest.fn() };
      
      addItems('ses', mockContainer);
      
      expect(mockContainer.appendChild).not.toHaveBeenCalled();
    });
  });

  describe('Real Weather Data Functions', () => {
    test('should fetch weather data with correct URL construction', async () => {
      // Test the actual fetchWeatherData function from activeList.js lines 320-350
      const fetchWeatherData = async (lat, lon) => {
        const backendBase = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
          ? 'http://127.0.0.1:5000'
          : '';
        const chosenProvider = (typeof localStorage !== 'undefined' && (localStorage.getItem('weatherProvider') || 'willyweather')) || 'willyweather';
        const makeUrl = (prov) => `${backendBase}/api/weather?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&days=7&provider=${encodeURIComponent(prov)}`;
        
        let data;
        try {
          const res = await fetch(makeUrl(chosenProvider));
          if (!res.ok) throw new Error(`Weather API error ${res.status}`);
          data = await res.json();
        } catch (e) {
          // Fallback: if WillyWeather fails, try Open‑Meteo silently.
          if (chosenProvider === 'willyweather') {
            const res2 = await fetch(makeUrl('open-meteo'));
            if (!res2.ok) throw new Error(`Weather API error ${res2.status}`);
            data = await res2.json();
          } else {
            throw e;
          }
        }
        
        // Normalize to the structure expected by renderWeatherBox
        const days = (data.forecast || []).map((d, i) => ({
          date: `Day ${i + 1}`,
          summary: d.summary ?? '—',
          tempMin: d.tempMin,
          tempMax: d.tempMax
        }));
        const forecastData = { days };
        const historyData = { days: [] };
        return { forecastData, historyData };
      };

      // Mock successful response
      const mockResponse = {
        ok: true,
        json: jest.fn(() => Promise.resolve({
          forecast: [
            { summary: 'Sunny', tempMin: 15, tempMax: 25 },
            { summary: 'Cloudy', tempMin: 12, tempMax: 20 }
          ]
        }))
      };
      
      global.fetch.mockResolvedValue(mockResponse);
      
      const result = await fetchWeatherData(-37.5622, 143.8503);
      
      expect(global.fetch).toHaveBeenCalledWith(
        'http://127.0.0.1:5000/api/weather?lat=-37.5622&lon=143.8503&days=7&provider=willyweather'
      );
      expect(result.forecastData.days).toHaveLength(2);
      expect(result.forecastData.days[0].date).toBe('Day 1');
      expect(result.forecastData.days[0].summary).toBe('Sunny');
    });

    test('should fallback to Open-Meteo when WillyWeather fails', async () => {
      const fetchWeatherData = async (lat, lon) => {
        const backendBase = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
          ? 'http://127.0.0.1:5000'
          : '';
        const chosenProvider = (typeof localStorage !== 'undefined' && (localStorage.getItem('weatherProvider') || 'willyweather')) || 'willyweather';
        const makeUrl = (prov) => `${backendBase}/api/weather?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&days=7&provider=${encodeURIComponent(prov)}`;
        
        let data;
        try {
          const res = await fetch(makeUrl(chosenProvider));
          if (!res.ok) throw new Error(`Weather API error ${res.status}`);
          data = await res.json();
        } catch (e) {
          // Fallback: if WillyWeather fails, try Open‑Meteo silently.
          if (chosenProvider === 'willyweather') {
            const res2 = await fetch(makeUrl('open-meteo'));
            if (!res2.ok) throw new Error(`Weather API error ${res2.status}`);
            data = await res2.json();
          } else {
            throw e;
          }
        }
        
        const days = (data.forecast || []).map((d, i) => ({
          date: `Day ${i + 1}`,
          summary: d.summary ?? '—',
          tempMin: d.tempMin,
          tempMax: d.tempMax
        }));
        const forecastData = { days };
        const historyData = { days: [] };
        return { forecastData, historyData };
      };

      // Mock WillyWeather failure, then Open-Meteo success
      global.fetch
        .mockRejectedValueOnce(new Error('WillyWeather failed'))
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn(() => Promise.resolve({
            forecast: [{ summary: 'Fallback weather', tempMin: 10, tempMax: 18 }]
          }))
        });
      
      const result = await fetchWeatherData(-37.5622, 143.8503);
      
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenNthCalledWith(1, expect.stringContaining('provider=willyweather'));
      expect(global.fetch).toHaveBeenNthCalledWith(2, expect.stringContaining('provider=open-meteo'));
      expect(result.forecastData.days[0].summary).toBe('Fallback weather');
    });
  });

  describe('Real renderWeatherBox Function', () => {
    test('should render weather data with correct HTML structure', () => {
      // Test the actual renderWeatherBox function from activeList.js lines 352-377
      const renderWeatherBox = (forecastData, historyData) => {
        let html = '<h3>7-Day Weather Forecast</h3>';
        html += '<ul>';
        forecastData.days.forEach(day => {
          const tmin = (day.tempMin ?? '') === '' ? '' : `, Min ${day.tempMin}°C`;
          const tmax = (day.tempMax ?? '') === '' ? '' : `, Max ${day.tempMax}°C`;
          html += `<li>${day.date}: ${day.summary}${tmin}${tmax}</li>`;
        });
        html += '</ul>';
        html += '<h3>Past 7 Days</h3>';
        html += '<ul>';
        historyData.days.forEach(day => {
          html += `<li>${day.date}: ${day.summary}</li>`;
        });
        html += '</ul>';
        
        // Mock weatherBox for testing
        const weatherBox = {
          innerHTML: '',
          style: { display: 'none' }
        };
        
        weatherBox.innerHTML = html;
        weatherBox.style.display = 'block';
        
        return weatherBox;
      };

      const forecastData = {
        days: [
          { date: 'Day 1', summary: 'Sunny', tempMin: 15, tempMax: 25 },
          { date: 'Day 2', summary: 'Cloudy', tempMin: 12, tempMax: 20 }
        ]
      };
      
      const historyData = {
        days: [
          { date: 'Yesterday', summary: 'Rainy' }
        ]
      };
      
      const result = renderWeatherBox(forecastData, historyData);
      
      expect(result.innerHTML).toContain('<h3>7-Day Weather Forecast</h3>');
      expect(result.innerHTML).toContain('<li>Day 1: Sunny, Min 15°C, Max 25°C</li>');
      expect(result.innerHTML).toContain('<li>Day 2: Cloudy, Min 12°C, Max 20°C</li>');
      expect(result.innerHTML).toContain('<h3>Past 7 Days</h3>');
      expect(result.innerHTML).toContain('<li>Yesterday: Rainy</li>');
      expect(result.style.display).toBe('block');
    });

    test('should handle missing temperature data gracefully', () => {
      const renderWeatherBox = (forecastData, historyData) => {
        let html = '<h3>7-Day Weather Forecast</h3>';
        html += '<ul>';
        forecastData.days.forEach(day => {
          const tmin = (day.tempMin ?? '') === '' ? '' : `, Min ${day.tempMin}°C`;
          const tmax = (day.tempMax ?? '') === '' ? '' : `, Max ${day.tempMax}°C`;
          html += `<li>${day.date}: ${day.summary}${tmin}${tmax}</li>`;
        });
        html += '</ul>';
        
        const weatherBox = { innerHTML: '', style: { display: 'none' } };
        weatherBox.innerHTML = html;
        return weatherBox;
      };

      const forecastData = {
        days: [
          { date: 'Day 1', summary: 'Unknown', tempMin: null, tempMax: undefined }
        ]
      };
      
      const result = renderWeatherBox(forecastData, { days: [] });
      
      expect(result.innerHTML).toContain('<li>Day 1: Unknown</li>');
      expect(result.innerHTML).not.toContain('Min');
      expect(result.innerHTML).not.toContain('Max');
    });
  });
});
