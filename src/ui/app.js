// app.js - Main application script for the renderer process

// Import API from preload script
const { api } = window;

// Application state
let appConfig = null;
let darkMode = false;
let activeBots = [];
let commandHistory = [];
let activeSession = null;

// Custom events
export const AppEvents = {
  CONFIG_LOADED: 'app-config-loaded',
  DARK_MODE_CHANGED: 'app-dark-mode-changed',
  BOTS_STARTED: 'app-bots-started',
  BOTS_STOPPED: 'app-bots-stopped',
  COMMAND_SENT: 'app-command-sent',
  LOG_ADDED: 'app-log-added',
  LOGS_CLEARED: 'app-logs-cleared',
  SESSION_STARTED: 'app-session-started',
  SESSION_JOINED: 'app-session-joined',
  SESSION_ENDED: 'app-session-ended',
  DIRECTOR_COMMAND: 'app-director-command'
};

// Initialize the application
async function initializeApp() {
  try {
    // Load configuration
    appConfig = await api.getConfig();
    
    if (!appConfig) {
      addLogEntry('Error loading configuration. Using defaults.', 'error');
      appConfig = {
        LOG_LEVEL: 'info',
        BOT_PERSONALITIES: [],
        PLATFORMS: []
      };
    }
    
    // Dispatch config loaded event
    window.dispatchEvent(new CustomEvent(AppEvents.CONFIG_LOADED, { 
      detail: { config: appConfig } 
    }));
    
    // Check for dark mode preference
    const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    darkMode = localStorage.getItem('darkMode') === 'true' || systemPrefersDark;
    updateDarkMode();
    
    // Setup IPC event listeners
    setupIPCListeners();
    
    // Setup custom event listeners
    setupCustomEventListeners();
    
    addLogEntry('Application initialized successfully', 'info');
  } catch (error) {
    addLogEntry(`Initialization error: ${error.message}`, 'error');
  }
}

// Setup IPC event listeners
function setupIPCListeners() {
  api.onBotsStarted(() => {
    addLogEntry('All bots started successfully', 'info');
    updateBotStatus(true);
    window.dispatchEvent(new CustomEvent(AppEvents.BOTS_STARTED));
  });
  
  api.onBotsStopped(() => {
    addLogEntry('All bots stopped', 'info');
    updateBotStatus(false);
    window.dispatchEvent(new CustomEvent(AppEvents.BOTS_STOPPED));
  });
  
  api.onDirectorCommandSent((command) => {
    addLogEntry(`Director command sent: ${command}`, 'info');
    addCommandToHistory(command);
    window.dispatchEvent(new CustomEvent(AppEvents.COMMAND_SENT, { 
      detail: { command } 
    }));
  });
  
  api.onOpenSettings(() => {
    document.querySelector('settings-modal-component').open();
  });
  
  api.onCreateBot(() => {
    document.querySelector('add-bot-modal-component').open();
  });
  
  api.onToggleDarkMode((mode) => {
    darkMode = mode;
    updateDarkMode();
  });
  
  api.onOpenDocumentation(() => {
    addLogEntry('Documentation requested', 'info');
    // In a real app, this would open documentation
  });
}

// Setup custom event listeners
function setupCustomEventListeners() {
  // Listen for director commands from the UI
  window.addEventListener('director-command', handleDirectorCommand);
  
  // Listen for session events
  window.addEventListener('session-created', handleSessionCreated);
  window.addEventListener('session-ended', handleSessionEnded);
}

// Handle director command
function handleDirectorCommand(event) {
  const { command, sessionId } = event.detail;
  
  // Add to command history
  addCommandToHistory(command);
  
  // Send to main process
  api.sendDirectorCommand(command)
    .then(result => {
      if (!result.success) {
        addLogEntry(`Failed to send command: ${result.error}`, 'error');
      }
    })
    .catch(error => {
      addLogEntry(`Error sending command: ${error.message}`, 'error');
    });
  
  // Dispatch event for other components
  window.dispatchEvent(new CustomEvent(AppEvents.DIRECTOR_COMMAND, { 
    detail: { command, sessionId } 
  }));
}

// Handle session created
function handleSessionCreated(event) {
  const { sessionId, hostId, hostName, platform } = event.detail;
  
  // Store active session
  activeSession = {
    id: sessionId,
    hostId,
    hostName,
    platform,
    participants: []
  };
  
  // Log the event
  addLogEntry(`${hostName} started a live session on ${platform}`, 'info');
  
  // Dispatch event for other components
  window.dispatchEvent(new CustomEvent(AppEvents.SESSION_STARTED, { 
    detail: { sessionId, hostId, hostName, platform } 
  }));
}

// Handle session ended
function handleSessionEnded(event) {
  const { sessionId, hostId } = event.detail;
  
  // Clear active session if it matches
  if (activeSession && activeSession.id === sessionId) {
    const hostName = activeSession.hostName;
    activeSession = null;
    
    // Log the event
    addLogEntry(`${hostName} ended the live session`, 'info');
    
    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent(AppEvents.SESSION_ENDED, { 
      detail: { sessionId, hostId } 
    }));
  }
}

// Start all bots
export function startBots() {
  addLogEntry('Starting all bots...', 'info');
  api.startBots();
}

// Stop all bots
export function stopBots() {
  addLogEntry('Stopping all bots...', 'info');
  api.stopBots();
}

// Send director command
export async function sendDirectorCommand(command) {
  if (!command || typeof command !== 'string' || !command.trim()) return false;
  
  try {
    const result = await api.sendDirectorCommand(command);
    
    if (result.success) {
      return true;
    } else {
      addLogEntry(`Failed to send command: ${result.error}`, 'error');
      return false;
    }
  } catch (error) {
    addLogEntry(`Error sending command: ${error.message}`, 'error');
    return false;
  }
}

// Add command to history
export function addCommandToHistory(command) {
  commandHistory.unshift(command);
  if (commandHistory.length > 10) {
    commandHistory.pop();
  }
  
  return [...commandHistory];
}

// Get command history
export function getCommandHistory() {
  return [...commandHistory];
}

// Update bot status
function updateBotStatus(active) {
  const botCards = document.querySelectorAll('bot-card-component');
  botCards.forEach(card => {
    card.setActive(active);
  });
}

// Add log entry
export function addLogEntry(message, level = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const logEntry = {
    timestamp,
    level,
    message
  };
  
  window.dispatchEvent(new CustomEvent(AppEvents.LOG_ADDED, { 
    detail: { log: logEntry } 
  }));
  
  return logEntry;
}

// Clear logs
export function clearLogs() {
  window.dispatchEvent(new CustomEvent(AppEvents.LOGS_CLEARED));
  addLogEntry('Logs cleared', 'info');
}

// Save settings
export async function saveSettings(updatedConfig) {
  try {
    // Update config object
    appConfig = { ...appConfig, ...updatedConfig };
    
    // Save config to main process
    const result = await api.saveConfig(appConfig);
    
    if (result.success) {
      addLogEntry('Settings saved successfully', 'info');
      return true;
    } else {
      addLogEntry(`Failed to save settings: ${result.error}`, 'error');
      return false;
    }
  } catch (error) {
    addLogEntry(`Error saving settings: ${error.message}`, 'error');
    return false;
  }
}

// Update dark mode
export function updateDarkMode() {
  if (darkMode) {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
  localStorage.setItem('darkMode', darkMode.toString());
  
  window.dispatchEvent(new CustomEvent(AppEvents.DARK_MODE_CHANGED, { 
    detail: { darkMode } 
  }));
  
  return darkMode;
}

// Toggle dark mode
export function toggleDarkMode() {
  darkMode = !darkMode;
  return updateDarkMode();
}

// Get current config
export function getConfig() {
  return { ...appConfig };
}

// Create a new bot
export function createBot(botData) {
  // In a real app, this would communicate with the main process
  // to create a new bot in the database
  addLogEntry(`Bot ${botData.name} created`, 'info');
  
  // Add to active bots
  activeBots.push(botData);
  
  return true;
}

// Generate AI avatar
export async function generateAIAvatar(prompt) {
  // In a real app, this would call an AI image generation API
  addLogEntry(`Generating avatar with prompt: ${prompt}`, 'info');
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Return a placeholder URL
  return `https://picsum.photos/seed/${Date.now()}/200`;
}

// Generate AI background
export async function generateAIBackground() {
  // In a real app, this would call an AI image generation API
  addLogEntry('Generating stream background', 'info');
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Return a placeholder URL
  return `https://picsum.photos/seed/${Date.now()}/1280/720`;
}

// Get active session
export function getActiveSession() {
  return activeSession;
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);

// Export public API
export default {
  startBots,
  stopBots,
  sendDirectorCommand,
  addCommandToHistory,
  getCommandHistory,
  addLogEntry,
  clearLogs,
  saveSettings,
  updateDarkMode,
  toggleDarkMode,
  getConfig,
  createBot,
  generateAIAvatar,
  generateAIBackground,
  getActiveSession
};