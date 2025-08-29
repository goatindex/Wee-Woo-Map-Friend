/**
 * DocsFAB - FAB for documentation navigation, using unified BaseFAB
 */

class DocsFAB extends window.BaseFAB {
  constructor(config = {}) {
    super(Object.assign({
      id: 'docsFab',
      className: 'fab fab-button',
      icon: '📄',
      ariaLabel: 'Open documentation',
      title: 'Docs',
    }, config));
  }

  onClick(e) {
    if (window.AppBootstrap && typeof window.AppBootstrap.openDocs === 'function') {
      window.AppBootstrap.openDocs('intro');
    } else {
      console.error('DocsFAB: AppBootstrap.openDocs method not found');
    }
  }
}

window.FABManager.register('docsFab', DocsFAB);
console.log('DocsFAB loaded successfully - version 20250101_004');
