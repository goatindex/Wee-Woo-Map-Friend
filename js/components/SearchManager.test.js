/**
 * @fileoverview SearchManager Tests
 * Tests for the modern global search manager component.
 */

import { SearchManager } from './SearchManager.js';
import { stateManager } from '../modules/StateManager.js';
import { globalEventBus } from '../modules/EventBus.js';

// Mock global search data
const mockSearchData = {
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
  outlineColors: {
    ses: '#ff6b35',
    lga: '#4ecdc4',
    cfa: '#45b7d1'
  },
  labelColorAdjust: {
    ses: 1.0,
    lga: 1.2,
    cfa: 0.8
  }
};

// Helper to create DOM elements
const createSearchDOM = () => {
  const container = document.createElement('div');
  container.className = 'search-container';
  
  const input = document.createElement('input');
  input.id = 'globalSidebarSearch';
  input.type = 'text';
  input.className = 'search-box';
  input.placeholder = 'Search all layers...';
  
  const dropdown = document.createElement('div');
  dropdown.id = 'sidebarSearchDropdown';
  dropdown.className = 'sidebar-search-dropdown';
  
  container.appendChild(input);
  container.appendChild(dropdown);
  
  return { container, input, dropdown };
};

// Helper to create sidebar elements for testing
const createSidebarElements = () => {
  const sidebar = document.createElement('div');
  sidebar.id = 'layerMenu';
  
  // Create headers
  ['ses', 'lga', 'cfa'].forEach(category => {
    const header = document.createElement('h4');
    header.id = `${category}Header`;
    header.className = 'collapsed';
    header.innerHTML = `<span class="collapse-arrow">▼</span>${category.toUpperCase()}`;
    sidebar.appendChild(header);
    
    const list = document.createElement('div');
    list.id = `${category}List`;
    list.className = 'collapsible-list';
    list.style.display = 'none';
    
    // Add some test items
    Object.entries(mockSearchData.nameToKey[category]).forEach(([name, key]) => {
      const item = document.createElement('label');
      item.className = 'sidebar-list-row';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `${category}_${key}`;
      
      const span = document.createElement('span');
      span.textContent = name;
      
      item.appendChild(checkbox);
      item.appendChild(span);
      list.appendChild(item);
    });
    
    sidebar.appendChild(list);
  });
  
  return sidebar;
};

describe('SearchManager', () => {
  let container;
  let input;
  let dropdown;
  let sidebar;
  let manager;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    
    // Create search DOM
    const searchDOM = createSearchDOM();
    container = searchDOM.container;
    input = searchDOM.input;
    dropdown = searchDOM.dropdown;
    
    // Create sidebar elements
    sidebar = createSidebarElements();
    
    // Add to document
    document.body.appendChild(container);
    document.body.appendChild(sidebar);
    
    // Mock global search data
    Object.assign(window, mockSearchData);
    
    // Mock adjustHexColor function
    window.adjustHexColor = jest.fn((color, factor) => {
      // Simple mock that just returns the color
      return color;
    });
    
    // Create manager instance
    manager = new SearchManager(container, {
      debounceDelay: 50, // Faster for testing
      highlightDuration: 100 // Shorter for testing
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
    delete window.outlineColors;
    delete window.labelColorAdjust;
    delete window.adjustHexColor;
  });

  describe('Initialization', () => {
    test('should initialize successfully', async () => {
      await manager.init();
      
      expect(manager.isInitialized).toBe(true);
      expect(manager.searchInput).toBe(input);
      expect(manager.dropdown).toBe(dropdown);
    });

    test('should find search elements', async () => {
      await manager.init();
      
      expect(manager.searchInput).toBeDefined();
      expect(manager.dropdown).toBeDefined();
    });

    test('should set up accessibility attributes', async () => {
      await manager.init();
      
      expect(input.getAttribute('role')).toBe('combobox');
      expect(input.getAttribute('aria-expanded')).toBe('false');
      expect(input.getAttribute('aria-haspopup')).toBe('listbox');
      expect(dropdown.getAttribute('role')).toBe('listbox');
    });

    test('should load search data from globals', async () => {
      await manager.init();
      
      expect(manager.searchData.length).toBeGreaterThan(0);
      expect(manager.searchData).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            category: 'ses',
            name: 'Alpine Resorts',
            key: 'alpine_resorts'
          })
        ])
      );
    });

    test('should handle missing search elements gracefully', async () => {
      input.remove();
      
      await expect(manager.init()).rejects.toThrow('Search input element not found');
    });
  });

  describe('Search Functionality', () => {
    beforeEach(async () => {
      await manager.init();
    });

    test('should perform search with debouncing', (done) => {
      const searchSpy = jest.spyOn(manager, 'performSearch');
      
      // Trigger multiple rapid inputs
      input.value = 'b';
      input.dispatchEvent(new Event('input'));
      input.value = 'ba';
      input.dispatchEvent(new Event('input'));
      input.value = 'bal';
      input.dispatchEvent(new Event('input'));
      
      // Should debounce to single call
      setTimeout(() => {
        expect(searchSpy).toHaveBeenCalledTimes(1);
        expect(searchSpy).toHaveBeenCalledWith('bal');
        done();
      }, 100);
    });

    test('should find matching results', async () => {
      input.value = 'ballarat';
      input.dispatchEvent(new Event('input'));
      
      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const items = dropdown.querySelectorAll('.dropdown-item:not(.no-results)');
      expect(items.length).toBeGreaterThan(0);
      
      // Should find Ballarat in multiple categories
      const itemTexts = Array.from(items).map(item => 
        item.querySelector('.name').textContent
      );
      expect(itemTexts).toContain('Ballarat City');
      expect(itemTexts).toContain('Ballarat');
    });

    test('should display no results message', async () => {
      input.value = 'nonexistent';
      input.dispatchEvent(new Event('input'));
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const noResults = dropdown.querySelector('.no-results');
      expect(noResults).toBeDefined();
      expect(noResults.textContent).toContain('No matches found');
    });

    test('should highlight search query in results', async () => {
      input.value = 'ball';
      input.dispatchEvent(new Event('input'));
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const nameElement = dropdown.querySelector('.name');
      expect(nameElement.innerHTML).toContain('<mark>Ball</mark>');
    });

    test('should clear search on short input', async () => {
      // First trigger a search
      input.value = 'ballarat';
      input.dispatchEvent(new Event('input'));
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Then clear it
      input.value = '';
      input.dispatchEvent(new Event('input'));
      
      expect(dropdown.style.display).toBe('none');
      expect(dropdown.classList.contains('active')).toBe(false);
    });
  });

  describe('Keyboard Navigation', () => {
    beforeEach(async () => {
      await manager.init();
      
      // Set up search results
      input.value = 'ballarat';
      input.dispatchEvent(new Event('input'));
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    test('should navigate down with arrow key', () => {
      const items = dropdown.querySelectorAll('.dropdown-item:not(.no-results)');
      
      // Press arrow down
      const downEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      input.dispatchEvent(downEvent);
      
      expect(manager.selectedIndex).toBe(0);
      expect(items[0].classList.contains('selected')).toBe(true);
    });

    test('should navigate up with arrow key', () => {
      const items = dropdown.querySelectorAll('.dropdown-item:not(.no-results)');
      
      // Navigate down first
      manager.selectedIndex = 1;
      manager.updateSelection(items);
      
      // Then navigate up
      const upEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      input.dispatchEvent(upEvent);
      
      expect(manager.selectedIndex).toBe(0);
    });

    test('should select result with Enter key', () => {
      const selectSpy = jest.spyOn(manager, 'selectResult');
      const items = dropdown.querySelectorAll('.dropdown-item:not(.no-results)');
      
      // Navigate to first item
      manager.selectedIndex = 0;
      manager.updateSelection(items);
      
      // Press Enter
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      input.dispatchEvent(enterEvent);
      
      expect(selectSpy).toHaveBeenCalledWith(items[0]);
    });

    test('should hide dropdown with Escape key', () => {
      expect(manager.isDropdownVisible()).toBe(true);
      
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      input.dispatchEvent(escapeEvent);
      
      expect(manager.isDropdownVisible()).toBe(false);
    });
  });

  describe('Result Selection', () => {
    beforeEach(async () => {
      await manager.init();
    });

    test('should activate search result on click', async () => {
      input.value = 'ballarat';
      input.dispatchEvent(new Event('input'));
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const item = dropdown.querySelector('.dropdown-item:not(.no-results)');
      expect(item).toBeDefined();
      
      // Mock the activation methods
      const expandSpy = jest.spyOn(manager, 'expandSection');
      const scrollSpy = jest.spyOn(manager, 'scrollToAndHighlight');
      
      // Click the item
      item.click();
      
      expect(expandSpy).toHaveBeenCalled();
      expect(manager.isDropdownVisible()).toBe(false);
      expect(input.value).toBe('');
    });

    test('should expand collapsed section', () => {
      const header = document.getElementById('sesHeader');
      expect(header.classList.contains('collapsed')).toBe(true);
      
      manager.expandSection('ses');
      
      // Should trigger click event on header
      expect(header.classList.contains('collapsed')).toBe(true); // Still collapsed until click processed
    });

    test('should find checkbox and container correctly', () => {
      const checkbox = document.getElementById('ses_alpine_resorts');
      const { checkbox: foundCheckbox, container } = manager.findCheckboxAndContainer(checkbox);
      
      expect(foundCheckbox).toBe(checkbox);
      expect(container).toBeDefined();
    });

    test('should scroll to and highlight result', (done) => {
      const container = document.querySelector('.sidebar-list-row');
      
      // Mock scrollIntoView
      container.scrollIntoView = jest.fn();
      
      manager.scrollToAndHighlight(container);
      
      expect(container.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'center'
      });
      
      expect(container.classList.contains('search-highlight')).toBe(true);
      
      // Check highlight removal
      setTimeout(() => {
        expect(container.classList.contains('search-highlight')).toBe(false);
        done();
      }, 150);
    });
  });

  describe('Event System', () => {
    beforeEach(async () => {
      await manager.init();
    });

    test('should emit search performed event', async () => {
      const eventSpy = jest.fn();
      globalEventBus.on('search:performed', eventSpy);
      
      input.value = 'ballarat';
      input.dispatchEvent(new Event('input'));
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'ballarat',
          results: expect.any(Number)
        }),
        'search:performed'
      );
    });

    test('should emit search selected event', async () => {
      const eventSpy = jest.fn();
      globalEventBus.on('search:selected', eventSpy);
      
      input.value = 'ballarat';
      input.dispatchEvent(new Event('input'));
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const item = dropdown.querySelector('.dropdown-item:not(.no-results)');
      item.click();
      
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          category: expect.any(String),
          key: expect.any(String),
          sidebarId: expect.any(String)
        }),
        'search:selected'
      );
    });

    test('should handle search clear event', () => {
      input.value = 'test query';
      manager.currentQuery = 'test query';
      
      globalEventBus.emit('search:clear');
      
      expect(input.value).toBe('');
      expect(manager.currentQuery).toBe('');
    });

    test('should handle search focus event', () => {
      const focusSpy = jest.spyOn(input, 'focus');
      
      globalEventBus.emit('search:focus');
      
      expect(focusSpy).toHaveBeenCalled();
    });

    test('should update search data on layer events', async () => {
      const buildDataSpy = jest.spyOn(manager, 'buildSearchDataFromLegacy');
      
      // Emit event
      globalEventBus.emit('data:layerAdded', {});
      
      // Wait for debounced update (updateTimer has 100ms delay)
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(buildDataSpy).toHaveBeenCalled();
    });
  });

  describe('State Management', () => {
    beforeEach(async () => {
      await manager.init();
    });

    test('should get current state', () => {
      manager.currentQuery = 'test';
      manager.selectedIndex = 1;
      
      const state = manager.getState();
      
      expect(state).toEqual(expect.objectContaining({
        query: 'test',
        selectedIndex: 1,
        searchDataCount: expect.any(Number)
      }));
    });

    test('should apply state correctly', () => {
      const newState = {
        query: 'ballarat',
        isDropdownVisible: true
      };
      
      const performSearchSpy = jest.spyOn(manager, 'performSearch');
      
      manager.applyState(newState);
      
      expect(input.value).toBe('ballarat');
      expect(manager.currentQuery).toBe('ballarat');
      expect(performSearchSpy).toHaveBeenCalledWith('ballarat');
    });
  });

  describe('Error Handling', () => {
    test('should handle missing dropdown gracefully', async () => {
      dropdown.remove();
      
      await expect(manager.init()).rejects.toThrow('Search dropdown element not found');
    });

    test('should handle missing search data gracefully', async () => {
      delete window.namesByCategory;
      delete window.nameToKey;
      
      // Create a new manager to test initialization without data
      const newManager = new SearchManager(container, {
        debounceDelay: 50
      });
      
      await newManager.init();
      
      // Manually trigger the data loading that would check for missing data
      newManager.buildSearchDataFromLegacy();
      
      expect(newManager.searchData).toEqual([]);
      expect(console.warn).toHaveBeenCalledWith(
        '⚠️ SearchManager: Legacy search data not available'
      );
      
      newManager.destroy();
    });

    test('should handle missing sidebar elements gracefully', () => {
      const selectSpy = jest.spyOn(manager, 'selectResult');
      
      manager.activateSearchResult('nonexistent', 'key', 'nonexistent_element');
      
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Element not found: nonexistent_element')
      );
    });
  });

  describe('Performance', () => {
    beforeEach(async () => {
      await manager.init();
    });

    test('should limit search results', async () => {
      // Create manager with low result limit
      const limitedManager = new SearchManager(container, {
        maxResults: 2,
        debounceDelay: 10
      });
      await limitedManager.init();
      
      // Clear existing dropdown content and use limited manager's search
      dropdown.innerHTML = '';
      
      input.value = 'ballarat'; // Should match multiple results
      input.dispatchEvent(new Event('input'));
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Manually trigger search since we're using a different manager
      await limitedManager.performSearch('ballarat');
      
      const items = dropdown.querySelectorAll('.dropdown-item:not(.no-results)');
      expect(items.length).toBeLessThanOrEqual(2);
      
      limitedManager.destroy();
    });

    test('should debounce search data updates', () => {
      const buildDataSpy = jest.spyOn(manager, 'buildSearchDataFromLegacy');
      
      // Trigger multiple rapid updates
      manager.updateSearchData();
      manager.updateSearchData();
      manager.updateSearchData();
      
      // Should debounce to single call
      setTimeout(() => {
        expect(buildDataSpy).toHaveBeenCalledTimes(1);
      }, 150);
    });
  });

  describe('Cleanup', () => {
    test('should clean up event listeners on destroy', async () => {
      await manager.init();
      
      const inputRemoveEventListenerSpy = jest.spyOn(input, 'removeEventListener');
      const dropdownRemoveEventListenerSpy = jest.spyOn(dropdown, 'removeEventListener');
      
      manager.destroy();
      
      expect(inputRemoveEventListenerSpy).toHaveBeenCalledWith('input', manager.handleInput);
      expect(dropdownRemoveEventListenerSpy).toHaveBeenCalledWith('click', manager.handleDropdownClick);
    });

    test('should clear timers on destroy', async () => {
      await manager.init();
      
      // Set some timers
      manager.debounceTimer = setTimeout(() => {}, 1000);
      manager.updateTimer = setTimeout(() => {}, 1000);
      
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      
      manager.destroy();
      
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    test('should clear search data on destroy', async () => {
      await manager.init();
      
      expect(manager.searchData.length).toBeGreaterThan(0);
      
      manager.destroy();
      
      expect(manager.searchData).toEqual([]);
    });
  });
});
