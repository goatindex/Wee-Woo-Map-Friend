/**
 * @fileoverview SidebarToggleFab - Floating Action Button for Sidebar Toggle
 * @description Material Design-style FAB that replaces the sidebar toggle button
 */

/**
 * Floating Action Button for sidebar toggle
 */
class SidebarToggleFab {
  constructor() {
    this.isVisible = false;
    this.sidebarMinimized = false;
    this.fabButton = null;
    this.sidebarMenu = null;
  }

  init() {
    this.sidebarMenu = document.getElementById('layerMenu');
    if (!this.sidebarMenu) {
      console.error('SidebarToggleFab: layerMenu not found');
      return;
    }

    this.createFAB();
    this.attachEventListeners();
    this.updateVisibility();
  }

  createFAB() {
    // Remove any existing sidebar toggle
    const existingToggle = document.getElementById('sidebarToggle');
    if (existingToggle) {
      existingToggle.remove();
    }

    // Create FAB button directly (no container needed)
    this.fabButton = document.createElement('button');
    this.fabButton.id = 'sidebarToggle'; // Keep same ID for compatibility
    this.fabButton.className = 'sidebar-fab'; // Match CSS class name
    this.fabButton.innerHTML = '☰'; // Hamburger icon
    this.fabButton.setAttribute('aria-label', 'Toggle sidebar');
    this.fabButton.setAttribute('aria-controls', 'layerMenu');
    this.fabButton.setAttribute('aria-expanded', 'true');
    this.fabButton.title = 'Hide panel';

    // Add directly to body
    document.body.appendChild(this.fabButton);
  }

  attachEventListeners() {
    if (this.fabButton) {
      this.fabButton.addEventListener('click', () => {
        this.toggleSidebar();
      });
    }

    // Listen for sidebar state changes
    if (this.sidebarMenu) {
      const observer = new MutationObserver(() => {
        this.updateState();
      });
      observer.observe(this.sidebarMenu, { 
        attributes: true, 
        attributeFilter: ['class'] 
      });
    }

    // Update on window resize
    window.addEventListener('resize', () => {
      this.updateVisibility();
    });
  }

  toggleSidebar() {
    if (!this.sidebarMenu) return;

    const isMinimized = this.sidebarMenu.classList.contains('sidebar-minimized');
    
    if (isMinimized) {
      // Expand sidebar
      this.sidebarMenu.classList.remove('sidebar-minimized');
      try { this.sidebarMenu.inert = false; } catch {}
      this.fabButton.setAttribute('aria-expanded', 'true');
      this.fabButton.title = 'Hide panel';
      this.fabButton.innerHTML = '→'; // Arrow when expanded (ready to hide)
      localStorage.setItem('sidebarMinimized', '0');
    } else {
      // Minimize sidebar  
      this.sidebarMenu.classList.add('sidebar-minimized');
      try { this.sidebarMenu.inert = true; } catch {}
      this.fabButton.setAttribute('aria-expanded', 'false');
      this.fabButton.title = 'Show panel';
      this.fabButton.innerHTML = '☰'; // Hamburger when minimized (ready to show)
      localStorage.setItem('sidebarMinimized', '1');
    }

    this.updateState();
  }

  updateState() {
    if (!this.sidebarMenu) return;

    this.sidebarMinimized = this.sidebarMenu.classList.contains('sidebar-minimized');
    this.updateVisibility();
    this.updateIcon();
  }

  updateIcon() {
    if (!this.fabButton) return;

    if (this.sidebarMinimized) {
      this.fabButton.innerHTML = '☰'; // Hamburger when minimized (ready to show)
      this.fabButton.setAttribute('aria-expanded', 'false');
      this.fabButton.title = 'Show panel';
      this.fabButton.classList.add('minimized');
    } else {
      this.fabButton.innerHTML = '→'; // Arrow when expanded (ready to hide)
      this.fabButton.setAttribute('aria-expanded', 'true');
      this.fabButton.title = 'Hide panel';
      this.fabButton.classList.remove('minimized');
    }
  }

  updateVisibility() {
    if (!this.fabButton) return;

    // Show FAB when sidebar is minimized or on larger screens
    const shouldShow = this.sidebarMinimized || window.innerWidth >= 768;
    
    if (shouldShow && !this.isVisible) {
      this.show();
    } else if (!shouldShow && this.isVisible) {
      this.hide();
    }
  }

  show() {
    if (this.isVisible || !this.fabButton) return;
    
    this.isVisible = true;
    this.fabButton.style.display = 'flex';
  }

  hide() {
    if (!this.isVisible || !this.fabButton) return;
    
    this.isVisible = false;
    this.fabButton.style.display = 'none';
  }

  // Initialize with existing sidebar state
  restoreState() {
    if (!this.sidebarMenu) return;

    try {
      const saved = localStorage.getItem('sidebarMinimized');
      const computedStyle = getComputedStyle(document.documentElement);
      const mobileBreakpoint = parseInt(computedStyle.getPropertyValue('--mobile-large')?.replace('px', '')) || 768;
      const shouldMinimize = saved === '1' || (saved === null && window.innerWidth < mobileBreakpoint);
      
      if (shouldMinimize) {
        this.sidebarMenu.classList.add('sidebar-minimized');
        try { this.sidebarMenu.inert = true; } catch {}
      }
      
      this.updateState();
    } catch (error) {
      console.warn('SidebarToggleFab: Error restoring state:', error);
    }
  }
  
  // Update visual state (for external calls like reset)
  updateVisualState(isMinimized) {
    if (!this.fabButton) return;
    
    this.fabButton.innerHTML = isMinimized ? '☰' : '→';
    this.fabButton.title = isMinimized ? 'Show panel' : 'Hide panel';
    this.fabButton.setAttribute('aria-expanded', isMinimized ? 'false' : 'true');
  }
}

// Global initialization
window.SidebarToggleFab = {
  instance: null,
  
  create: function() {
    if (this.instance) {
      console.warn('SidebarToggleFab: Instance already exists');
      return this.instance;
    }
    
    const createInstance = () => {
      const fab = new SidebarToggleFab();
      fab.init();
      fab.restoreState();
      this.instance = fab;
      return fab;
    };
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', createInstance);
      return null; // Return null when waiting for DOM
    } else {
      return createInstance();
    }
  },
  
  // Expose updateVisualState for external calls
  updateVisualState: function(isMinimized) {
    if (this.instance && this.instance.updateVisualState) {
      this.instance.updateVisualState(isMinimized);
    }
  }
};
