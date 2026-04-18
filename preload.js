const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window-maximize'),
  closeWindow: () => ipcRenderer.invoke('window-close'),
  onWindowStateChanged: (cb) => ipcRenderer.on('window-state-changed', (e, state) => cb(state)),

  // Project management
  saveProject: (data, suggestedName) => ipcRenderer.invoke('save-project', { data, suggestedName }),
  quickSave: (data, filePath) => ipcRenderer.invoke('quick-save', { data, filePath }),
  loadProject: () => ipcRenderer.invoke('load-project'),

  // Export
  exportJSON: (data, suggestedName) => ipcRenderer.invoke('export-json', { data, suggestedName }),
  exportTXT: (content, suggestedName) => ipcRenderer.invoke('export-txt', { content, suggestedName }),

  // Utilities
  revealFile: (filePath) => ipcRenderer.invoke('reveal-file', filePath),

  // Discord Deployment
  deployTestConnection: (token, guildId) =>
    ipcRenderer.invoke('deploy-test-connection', { token, guildId }),
  deployToServer: (token, guildId, project, options) =>
    ipcRenderer.invoke('deploy-to-server', { token, guildId, project, options }),
  onDeployProgress: (cb) =>
    ipcRenderer.on('deploy-progress', (e, data) => cb(data)),

  // Feature 5: Webhook sender
  sendWebhook: (webhookUrl, messageData) =>
    ipcRenderer.invoke('send-webhook', { webhookUrl, messageData }),

  // Feature 4: Template import
  importTemplate: () => ipcRenderer.invoke('import-template'),

  // Open a URL in the system default browser (used for Stripe Checkout)
  openExternal: (url) => ipcRenderer.invoke('open-external', url)
});
