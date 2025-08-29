/**
 * SidebarToggleFAB - FAB for toggling sidebar, using unified BaseFAB
 */

class SidebarToggleFAB extends window.BaseFAB {
  constructor(config = {}) {
    super(Object.assign({
      id: 'sidebarToggle',
      className: 'fab fab-button',
      icon: '☰',
      ariaLabel: 'Toggle sidebar',
      ariaControls: 'layerMenu',
      ariaExpanded: 'true',
      title: 'Hide panel',
    }, config));
    this.sidebarMenu = null;
  }

  init() {
    super.init();
    this.sidebarMenu = document.getElementById('layerMenu');
    this.restoreState();
  }

  onClick(e) {
    if (!this.sidebarMenu) return;
    const minimized = this.sidebarMenu.classList.toggle('sidebar-minimized');
    try { this.sidebarMenu.inert = minimized; } catch {}
    this.button.setAttribute('aria-expanded', minimized ? 'false' : 'true');
    this.button.title = minimized ? 'Show panel' : 'Hide panel';
    this.button.textContent = minimized ? '☰' : '→';
    this.saveState('sidebarMinimized', minimized ? 1 : 0);
  }

  restoreState() {
    if (!this.sidebarMenu) return;
    const saved = this.loadState('sidebarMinimized');
    const computedStyle = getComputedStyle(document.documentElement);
    const mobileBreakpoint = parseInt(computedStyle.getPropertyValue('--mobile-large')?.replace('px', '')) || 768;
    const shouldMinimize = saved === 1 || (saved === null && window.innerWidth < mobileBreakpoint);
    if (shouldMinimize) {
      this.sidebarMenu.classList.add('sidebar-minimized');
      try { this.sidebarMenu.inert = true; } catch {}
      this.button.setAttribute('aria-expanded', 'false');
      this.button.title = 'Show panel';
      this.button.textContent = '☰';
    } else {
      this.sidebarMenu.classList.remove('sidebar-minimized');
      try { this.sidebarMenu.inert = false; } catch {}
      this.button.setAttribute('aria-expanded', 'true');
      this.button.title = 'Hide panel';
      this.button.textContent = '→';
    }
  }
}

// Register with FABManager
console.log('SidebarToggleFAB: Registering with FABManager');
window.FABManager.register('sidebarToggle', SidebarToggleFAB);
console.log('SidebarToggleFAB: Registration complete');
console.log('SidebarToggleFAB loaded successfully - version 20250101_004');
