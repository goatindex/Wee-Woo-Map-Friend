/**
 * @module utils/errorUI
 * Sidebar error messaging and online/offline notifications.
 */
// Utility for showing dismissible error messages in the sidebar
window.showSidebarError = function(message) {
  const sidebar = document.getElementById('layerMenu');
  if (!sidebar) return;
  const errMsg = document.createElement('div');
  errMsg.style.color = '#d32f2f';
  errMsg.style.background = '#fff4f4';
  errMsg.style.border = '1px solid #d32f2f';
  errMsg.style.borderRadius = '6px';
  errMsg.style.padding = '8px';
  errMsg.style.margin = '8px 0';
  errMsg.style.position = 'relative';
  errMsg.textContent = message;
  // Add close button
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.title = 'Dismiss';
  closeBtn.style.position = 'absolute';
  closeBtn.style.top = '4px';
  closeBtn.style.right = '8px';
  closeBtn.style.background = 'none';
  closeBtn.style.border = 'none';
  closeBtn.style.color = '#d32f2f';
  closeBtn.style.fontSize = '1.2em';
  closeBtn.style.cursor = 'pointer';
  closeBtn.onclick = () => errMsg.remove();
  errMsg.appendChild(closeBtn);
  sidebar.insertBefore(errMsg, sidebar.firstChild);
}

// Utility for offline detection
window.isOffline = function() {
  return !navigator.onLine;
}

window.setupOfflineListener = function() {
  window.addEventListener('offline', () => {
    window.showSidebarError('You are offline. Map data may not load.');
  });
  window.addEventListener('online', () => {
    window.showSidebarError('You are back online. Try reloading the map.');
  });
};
