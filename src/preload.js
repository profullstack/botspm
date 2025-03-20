// preload.js - Exposes Electron API to renderer process

import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  // Configuration
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  
  // Bot control
  startBots: () => ipcRenderer.send('start-bots'),
  stopBots: () => ipcRenderer.send('stop-bots'),
  
  // Director commands
  sendDirectorCommand: (command) => ipcRenderer.invoke('send-director-command', command),
  
  // User authentication
  authenticateUser: (username, password) => 
    ipcRenderer.invoke('authenticate-user', { username, password }),
  
  registerUser: (username, password) => 
    ipcRenderer.invoke('register-user', { username, password }),
  
  // User settings
  saveUserSettings: (userId, settings) => 
    ipcRenderer.invoke('save-user-settings', { userId, settings }),
  
  getUserSettings: (userId) => 
    ipcRenderer.invoke('get-user-settings', { userId }),
  
  // Bot management
  getUserBots: (userId) => 
    ipcRenderer.invoke('get-user-bots', { userId }),
  
  createBot: (userId, botData) => 
    ipcRenderer.invoke('create-bot', { userId, botData }),
  
  // Event listeners
  onBotsStarted: (callback) => ipcRenderer.on('bots-started', () => callback()),
  onBotsStopped: (callback) => ipcRenderer.on('bots-stopped', () => callback()),
  onDirectorCommandSent: (callback) => ipcRenderer.on('director-command-sent', (_, command) => callback(command)),
  onOpenSettings: (callback) => ipcRenderer.on('open-settings', () => callback()),
  onCreateBot: (callback) => ipcRenderer.on('create-bot', () => callback()),
  onToggleDarkMode: (callback) => ipcRenderer.on('toggle-dark-mode', (_, darkMode) => callback(darkMode)),
  onOpenDocumentation: (callback) => ipcRenderer.on('open-documentation', () => callback()),
  
  // System information
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  
  // File operations
  openFile: (options) => ipcRenderer.invoke('open-file', options),
  saveFile: (options, data) => ipcRenderer.invoke('save-file', options, data),
  
  // Remove event listeners (to prevent memory leaks)
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners('bots-started');
    ipcRenderer.removeAllListeners('bots-stopped');
    ipcRenderer.removeAllListeners('director-command-sent');
    ipcRenderer.removeAllListeners('open-settings');
    ipcRenderer.removeAllListeners('create-bot');
    ipcRenderer.removeAllListeners('toggle-dark-mode');
    ipcRenderer.removeAllListeners('open-documentation');
  }
});

// Log when preload script has run
console.log('Preload script loaded');