// preload.js - Exposes specific Node.js APIs to the renderer process

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    // Bot control
    startBots: () => ipcRenderer.send('start-bots'),
    stopBots: () => ipcRenderer.send('stop-bots'),
    
    // Configuration
    getConfig: () => ipcRenderer.invoke('get-config'),
    saveConfig: (config) => ipcRenderer.invoke('save-config', config),
    
    // Director commands
    sendDirectorCommand: (command) => ipcRenderer.invoke('send-director-command', command),
    
    // Event listeners
    onBotsStarted: (callback) => ipcRenderer.on('bots-started', callback),
    onBotsStopped: (callback) => ipcRenderer.on('bots-stopped', callback),
    onDirectorCommandSent: (callback) => ipcRenderer.on('director-command-sent', (_, command) => callback(command)),
    onOpenSettings: (callback) => ipcRenderer.on('open-settings', callback),
    onCreateBot: (callback) => ipcRenderer.on('create-bot', callback),
    onToggleDarkMode: (callback) => ipcRenderer.on('toggle-dark-mode', (_, darkMode) => callback(darkMode)),
    onOpenDocumentation: (callback) => ipcRenderer.on('open-documentation', callback),
    
    // Remove event listeners
    removeAllListeners: (channel) => {
      ipcRenderer.removeAllListeners(channel);
    }
  }
);