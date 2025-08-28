/**
 * BaseFAB - Abstract base class for all FAB components
 * Provides lifecycle, state, and DOM management
 */
class BaseFAB {
  constructor(config = {}) {
    this.config = Object.assign(this.getDefaultConfig(), config);
    this.isInitialized = false;
    this.observers = [];
    this.eventListeners = [];
    this.dom = this.config.dom || document;
    this.storage = this.config.storage || window.localStorage;
    this.id = this.config.id || null;
  }

  getDefaultConfig() {
    return {
      id: null,
      position: 'fixed',
      top: '20px',
      right: '20px',
      width: '56px',
      height: '56px',
      zIndex: 9999,
      icon: '☰',
      ariaLabel: 'Floating Action Button',
      ariaControls: null,
      ariaExpanded: 'true',
      title: 'FAB',
      className: 'fab',
      style: {},
    };
  }

  init() {
    if (this.isInitialized) return;
    this.createElement();
    this.addEventListeners();
    this.isInitialized = true;
  }

  createElement() {
    this.button = this.dom.createElement('button');
    this.button.id = this.id || '';
    this.button.className = this.config.className;
    this.button.textContent = this.config.icon;
    this.button.setAttribute('aria-label', this.config.ariaLabel);
    if (this.config.ariaControls) {
      this.button.setAttribute('aria-controls', this.config.ariaControls);
    }
    this.button.setAttribute('aria-expanded', this.config.ariaExpanded);
    this.button.title = this.config.title;
    Object.assign(this.button.style, {
      position: this.config.position,
      top: this.config.top,
      right: this.config.right,
      width: this.config.width,
      height: this.config.height,
      zIndex: this.config.zIndex,
      ...this.config.style,
    });
    this.dom.body.appendChild(this.button);
  }

  addEventListeners() {
    // Example: click event
    const clickHandler = this.onClick.bind(this);
    this.button.addEventListener('click', clickHandler);
    this.eventListeners.push({ type: 'click', handler: clickHandler });
  }

  removeEventListeners() {
    this.eventListeners.forEach(({ type, handler }) => {
      this.button.removeEventListener(type, handler);
    });
    this.eventListeners = [];
  }

  onClick(e) {
    // To be overridden by subclasses
  }

  saveState(key, value) {
    try {
      this.storage.setItem(key, JSON.stringify(value));
    } catch {}
  }

  loadState(key) {
    try {
      const value = this.storage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  }

  destroy() {
    this.removeEventListeners();
    if (this.button && this.button.parentNode) {
      this.button.parentNode.removeChild(this.button);
    }
    this.isInitialized = false;
    this.observers.forEach(obs => obs.disconnect());
    this.observers = [];
  }
}

window.BaseFAB = BaseFAB;
export default BaseFAB;
