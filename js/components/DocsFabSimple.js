/**
 * @fileoverview DocsFab - Simple Floating Action Button for Documentation Navigation
 * @description Material Design-style FAB that replaces sidebar navigation
 */

/**
 * Simple Floating Action Button for documentation navigation
 */
class DocsFab {
  constructor() {
    this.isExpanded = false;
    this.fabButton = null;
    this.fabMenu = null;
    
    // Documentation topics
    this.topics = [
      { id: 'intro', label: 'Welcome', icon: '👋' },
      { id: 'usage', label: 'Usage', icon: '📖' },
      { id: 'adding-layers', label: 'Adding Layers', icon: '➕' },
      { id: 'layers', label: 'Layers & Categories', icon: '🗂️' },
      { id: 'troubleshooting', label: 'Troubleshooting', icon: '🔧' }
    ];
  }

  init() {
    this.createFAB();
    this.attachEventListeners();
  }

  createFAB() {
    const container = document.getElementById('docsFabContainer');
    if (!container) {
      console.error('DocsFab: Container #docsFabContainer not found');
      return;
    }

    // Create FAB button
    this.fabButton = document.createElement('button');
    this.fabButton.className = 'docs-fab-button';
    this.fabButton.innerHTML = '📚';
    this.fabButton.setAttribute('aria-label', 'Documentation menu');
    this.fabButton.setAttribute('aria-expanded', 'false');

    // Create menu
    this.fabMenu = document.createElement('div');
    this.fabMenu.className = 'docs-fab-menu';
    this.fabMenu.setAttribute('aria-hidden', 'true');

    // Create menu items
    this.topics.forEach(topic => {
      const menuItem = document.createElement('button');
      menuItem.className = 'docs-fab-menu-item';
      menuItem.innerHTML = `${topic.icon} ${topic.label}`;
      menuItem.setAttribute('data-doc', topic.id);
      menuItem.setAttribute('aria-label', `Open ${topic.label} documentation`);
      
      menuItem.addEventListener('click', () => {
        this.openDoc(topic.id);
        this.collapse();
      });
      
      this.fabMenu.appendChild(menuItem);
    });

    // Add to container
    container.appendChild(this.fabButton);
    container.appendChild(this.fabMenu);
  }

  attachEventListeners() {
    if (this.fabButton) {
      this.fabButton.addEventListener('click', () => {
        this.toggle();
      });
    }

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isExpanded) {
        this.collapse();
      }
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (this.isExpanded && !e.target.closest('#docsFabContainer')) {
        this.collapse();
      }
    });
  }

  toggle() {
    if (this.isExpanded) {
      this.collapse();
    } else {
      this.expand();
    }
  }

  expand() {
    if (this.isExpanded) return;
    
    this.isExpanded = true;
    this.fabButton.setAttribute('aria-expanded', 'true');
    this.fabMenu.setAttribute('aria-hidden', 'false');
    this.fabButton.classList.add('expanded');
    this.fabMenu.classList.add('expanded');
  }

  collapse() {
    if (!this.isExpanded) return;
    
    this.isExpanded = false;
    this.fabButton.setAttribute('aria-expanded', 'false');
    this.fabMenu.setAttribute('aria-hidden', 'true');
    this.fabButton.classList.remove('expanded');
    this.fabMenu.classList.remove('expanded');
  }

  openDoc(docId) {
    // First open the docs drawer
    const docsDrawer = document.getElementById('docsDrawer');
    if (docsDrawer) {
      docsDrawer.hidden = false;
    }
    
    // Then use the existing openDocs function
    if (window.openDocs) {
      window.openDocs(docId);
    } else {
      console.error('openDocs function not found');
    }
  }
}

// Static method for creating FAB
window.DocsFab = {
  create: function() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        const fab = new DocsFab();
        fab.init();
      });
    } else {
      const fab = new DocsFab();
      fab.init();
    }
  }
};
