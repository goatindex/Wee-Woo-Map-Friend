/**
 * DocsFAB - FAB for documentation navigation, using unified BaseFAB
 */
import BaseFAB from './BaseFAB.js';

class DocsFAB extends BaseFAB {
  constructor(config = {}) {
    super(Object.assign({
      id: 'docsFab',
      className: 'docs-fab',
      icon: '📄',
      ariaLabel: 'Open documentation',
      title: 'Docs',
    }, config));
  }

  onClick(e) {
    if (window.openDocs) {
      window.openDocs();
    } else {
      console.error('DocsFAB: openDocs function not found');
    }
  }
}

window.FABManager.register('docsFab', DocsFAB);
export default DocsFAB;
