/**
 * @module modules/Router
 * Simple client-side router for documentation navigation
 * Handles hash-based routing for documentation pages
 */

import { EventBus } from './EventBus.js';
// Temporarily use a mock logger to avoid DI issues during migration
const logger = {
  createChild: () => ({
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
    createChild: () => ({
      info: () => {},
      warn: () => {},
      error: () => {},
      debug: () => {}
    })
  })
};

/**
 * @class Router
 * @extends EventBus
 * Handles client-side routing for the documentation system
 */
export class Router extends EventBus {
  constructor() {
    super();
    
    this.routes = new Map();
    this.currentRoute = null;
    this.defaultRoute = 'intro';
    this.basePath = '#in_app_docs/';
    
    // Create module-specific logger
    // Logger will be set by BaseService constructor
    
    // Bind methods
    this.handleHashChange = this.handleHashChange.bind(this);
    this.handlePopState = this.handlePopState.bind(this);
    
    // Set up event listeners
    window.addEventListener('hashchange', this.handleHashChange);
    window.addEventListener('popstate', this.handlePopState);
    
    this.logger.info('Router initialized', {
      operation: 'constructor',
      defaultRoute: this.defaultRoute,
      basePath: this.basePath,
      routesCount: this.routes.size
    });
  }
  
  /**
   * Register a route
   * @param {string} path - Route path (without #in_app_docs/ prefix)
   * @param {Function} handler - Route handler function
   * @param {Object} options - Route options
   */
  register(path, handler, options = {}) {
    this.routes.set(path, {
      handler,
      options: {
        title: options.title || path,
        description: options.description || '',
        requiresAuth: options.requiresAuth || false,
        ...options
      }
    });
  }
  
  /**
   * Navigate to a route
   * @param {string} path - Route path
   * @param {Object} options - Navigation options
   * @param {boolean} options.replace - Replace current history entry
   * @param {Object} options.state - State object for history
   */
  navigate(path, options = {}) {
    const fullPath = this.basePath + path;
    
    if (options.replace) {
      window.history.replaceState(options.state || null, '', fullPath);
    } else {
      window.history.pushState(options.state || null, '', fullPath);
    }
    
    this.handleRoute(path);
  }
  
  /**
   * Handle route changes
   * @param {string} path - Route path
   * @private
   */
  async handleRoute(path) {
    const route = this.routes.get(path);
    
    if (!route) {
      // Try default route or show error
      if (path !== this.defaultRoute && this.routes.has(this.defaultRoute)) {
        this.navigate(this.defaultRoute, { replace: true });
        return;
      } else {
        this.emit('route:notFound', { path });
        return;
      }
    }
    
    // Check route requirements
    if (route.options.requiresAuth && !this.isAuthenticated()) {
      this.emit('route:unauthorized', { path, route });
      return;
    }
    
    const oldRoute = this.currentRoute;
    this.currentRoute = path;
    
    // Emit route change events
    this.emit('route:beforeChange', { from: oldRoute, to: path, route });
    
    try {
      // Execute route handler
      await route.handler(path, route.options);
      
      // Update document title if specified
      if (route.options.title) {
        document.title = `${route.options.title} - WeeWoo Map Friend Documentation`;
      }
      
      this.emit('route:changed', { from: oldRoute, to: path, route });
      
    } catch (error) {
      this.logger.error('Error handling route', {
        operation: 'navigate',
        path,
        route,
        error: error.message,
        stack: error.stack
      });
      this.emit('route:error', { path, route, error });
    }
  }
  
  /**
   * Handle hash change events
   * @param {HashChangeEvent} _event - Hash change event
   * @private
   */
  handleHashChange(_event) {
    const path = this.getPathFromHash();
    if (path) {
      this.handleRoute(path);
    }
  }
  
  /**
   * Handle popstate events (back/forward buttons)
   * @param {PopStateEvent} _event - Popstate event
   * @private
   */
  handlePopState(_event) {
    const path = this.getPathFromHash();
    if (path) {
      this.handleRoute(path);
    }
  }
  
  /**
   * Extract route path from current hash
   * @returns {string|null} Route path or null if not a docs route
   * @private
   */
  getPathFromHash() {
    const hash = window.location.hash;
    if (hash.startsWith(this.basePath)) {
      return hash.substring(this.basePath.length) || this.defaultRoute;
    }
    return null;
  }
  
  /**
   * Get current route path
   * @returns {string|null} Current route path
   */
  getCurrentRoute() {
    return this.currentRoute;
  }
  
  /**
   * Check if user is authenticated (placeholder for future use)
   * @returns {boolean} Always true for now
   * @private
   */
  isAuthenticated() {
    return true; // No auth required currently
  }
  
  /**
   * Go back in history
   */
  back() {
    window.history.back();
  }
  
  /**
   * Go forward in history
   */
  forward() {
    window.history.forward();
  }
  
  /**
   * Replace current route
   * @param {string} path - New route path
   */
  replace(path) {
    this.navigate(path, { replace: true });
  }
  
  /**
   * Initialize router and handle current route
   */
  init() {
    const path = this.getPathFromHash() || this.defaultRoute;
    this.handleRoute(path);
  }
  
  /**
   * Destroy router and clean up event listeners
   */
  destroy() {
    window.removeEventListener('hashchange', this.handleHashChange);
    window.removeEventListener('popstate', this.handlePopState);
    this.removeAllListeners();
  }
}

/**
 * Documentation router instance
 * Pre-configured for documentation navigation
 */
export class DocsRouter extends Router {
  constructor() {
    super();
    
    // Register default documentation routes
    this.registerDefaultRoutes();
  }
  
  /**
   * Register default documentation routes
   * @private
   */
  registerDefaultRoutes() {
    const docPages = [
      { path: 'intro', title: 'Welcome', file: 'intro.md' },
      { path: 'usage', title: 'Using the App', file: 'usage.md' },
      { path: 'adding-layers', title: 'Adding Layers', file: 'adding-layers.md' },
      { path: 'layers', title: 'Layers & Categories', file: 'layers.md' },
      { path: 'troubleshooting', title: 'Troubleshooting', file: 'troubleshooting.md' }
    ];
    
    docPages.forEach(({ path, title, file }) => {
      this.register(path, async (_routePath) => {
        await this.loadDocumentation(file, title);
      }, { title });
    });
  }
  
  /**
   * Load and display documentation content
   * @param {string} filename - Markdown filename
   * @param {string} title - Page title
   * @private
   */
  async loadDocumentation(filename, title) {
    try {
      this.emit('docs:loading', { filename, title });
      
      const response = await fetch(`in_app_docs/${filename}`);
      if (!response.ok) {
        throw new Error(`Failed to load ${filename}: ${response.status}`);
      }
      
      const content = await response.text();
      const parsedContent = this.parseMarkdown(content);
      
      // Update content
      const contentEl = document.getElementById('docsContent');
      if (contentEl) {
        contentEl.innerHTML = parsedContent;
      }
      
      // Update navigation highlighting
      this.updateNavigation();
      
      this.emit('docs:loaded', { filename, title, content: parsedContent });
      
    } catch (error) {
      this.logger.error('Failed to load documentation', {
        operation: 'loadDocumentation',
        filename,
        title,
        error: error.message,
        stack: error.stack
      });
      this.emit('docs:error', { filename, title, error });
      
      // Show error content
      const contentEl = document.getElementById('docsContent');
      if (contentEl) {
        contentEl.innerHTML = `
          <h2>Error Loading Documentation</h2>
          <p>Failed to load ${filename}. Please try again later.</p>
          <p class="error-details">${error.message}</p>
        `;
      }
    }
  }
  
  /**
   * Update navigation highlighting
   * @private
   */
  updateNavigation() {
    // Remove active class from all nav links
    document.querySelectorAll('.docs-toc a[data-doc]').forEach(link => {
      link.classList.remove('active');
    });
    
    // Add active class to current page
    const currentLink = document.querySelector(`.docs-toc a[data-doc="${this.currentRoute}"]`);
    if (currentLink) {
      currentLink.classList.add('active');
    }
    
    // Update mobile menu links too
    document.querySelectorAll('.docs-menu-link[data-doc]').forEach(link => {
      link.classList.remove('active');
    });
    
    const currentMobileLink = document.querySelector(`.docs-menu-link[data-doc="${this.currentRoute}"]`);
    if (currentMobileLink) {
      currentMobileLink.classList.add('active');
    }
  }
  
  /**
   * Basic markdown parser
   * @param {string} content - Markdown content
   * @returns {string} HTML content
   * @private
   */
  parseMarkdown(content) {
    return content
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/`(.*?)`/gim, '<code>$1</code>')
      .replace(/!\[([^\]]*)\]\(([^)]*)\)/gim, '<img alt="$1" src="$2" />')
      .replace(/\[([^\]]*)\]\(([^)]*)\)/gim, '<a href="$2">$1</a>')
      .replace(/\n\n/gim, '</p><p>')
      .replace(/^(.*)$/gim, '<p>$1</p>')
      .replace(/<p><h([1-6])>/gim, '<h$1>')
      .replace(/<\/h([1-6])><\/p>/gim, '</h$1>');
  }
}

// Create global router instances
export const router = () => {
  console.warn('router: Legacy function called. Use DI container to get Router instance.');
  throw new Error('Legacy function not available. Use DI container to get Router instance.');
};
export const docsRouter = () => {
  console.warn('docsRouter: Legacy function called. Use DI container to get DocsRouter instance.');
  throw new Error('Legacy function not available. Use DI container to get DocsRouter instance.');
};
