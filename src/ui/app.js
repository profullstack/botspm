// app.js - Main application script for the renderer process

// Import API from preload script
const { api } = window;

// Application state
let appConfig = null;
let darkMode = false;
let activeBots = [];
let commandHistory = [];
let activeSession = null;
let currentUser = null;
let userSettings = null;
let appState = 'login'; // 'login', 'setup', 'dashboard'

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
  DIRECTOR_COMMAND: 'app-director-command',
  USER_AUTHENTICATED: 'app-user-authenticated',
  USER_LOGGED_OUT: 'app-user-logged-out'
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
    
    // Check for stored user session
    const storedUserId = localStorage.getItem('userId');
    const storedUsername = localStorage.getItem('username');
    
    if (storedUserId && storedUsername) {
      // Auto-login with stored session
      currentUser = {
        id: storedUserId,
        username: storedUsername
      };
      
      // Load user settings
      await loadUserSettings();
      
      // Show dashboard or setup based on settings
      if (userSettings && Object.keys(userSettings).length > 0) {
        showDashboard();
      } else {
        showSetup();
      }
    } else {
      // Show login screen
      showLogin();
    }
    
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
  
  // Listen for user authentication events
  window.addEventListener('user-authenticated', handleUserAuthenticated);
  
  // Listen for setup events
  window.addEventListener('setup-complete', handleSetupComplete);
  window.addEventListener('setup-skipped', handleSetupSkipped);
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

// Handle user authenticated
async function handleUserAuthenticated(event) {
  const { username, userId } = event.detail;
  
  // Store user info
  currentUser = {
    id: userId,
    username
  };
  
  // Store in localStorage for session persistence
  localStorage.setItem('userId', userId);
  localStorage.setItem('username', username);
  
  // Load user settings
  await loadUserSettings();
  
  // Show dashboard or setup based on settings
  if (userSettings && Object.keys(userSettings).length > 0) {
    showDashboard();
  } else {
    showSetup();
  }
  
  addLogEntry(`User ${username} logged in successfully`, 'info');
}

// Handle setup complete
function handleSetupComplete() {
  showDashboard();
  addLogEntry('Setup completed successfully', 'info');
}

// Handle setup skipped
function handleSetupSkipped() {
  showDashboard();
  addLogEntry('Setup skipped', 'info');
}

// Load user settings
async function loadUserSettings() {
  if (!currentUser) return;
  
  try {
    userSettings = await api.getUserSettings(currentUser.id);
    return userSettings;
  } catch (error) {
    addLogEntry(`Failed to load user settings: ${error.message}`, 'error');
    return {};
  }
}

// Show login screen
function showLogin() {
  appState = 'login';
  updateAppState();
}

// Show setup screen
function showSetup() {
  appState = 'setup';
  updateAppState();
}

// Show dashboard
function showDashboard() {
  appState = 'dashboard';
  updateAppState();
  loadUserBots();
}

// Update app state
function updateAppState() {
  const loginComponent = document.querySelector('login-component');
  const setupComponent = document.querySelector('setup-component');
  const dashboardContainer = document.querySelector('.dashboard-container');
  
  if (loginComponent) {
    loginComponent.style.display = appState === 'login' ? 'block' : 'none';
  }
  
  if (setupComponent) {
    setupComponent.style.display = appState === 'setup' ? 'block' : 'none';
  }
  
  if (dashboardContainer) {
    dashboardContainer.style.display = appState === 'dashboard' ? 'block' : 'none';
  }
}

// Load user bots
async function loadUserBots() {
  if (!currentUser) return;
  
  try {
    const bots = await api.getUserBots(currentUser.id);
    
    // Update bots panel
    const botsPanel = document.querySelector('bots-panel-component');
    if (botsPanel) {
      botsPanel.updateBots(bots);
    }
    
    return bots;
  } catch (error) {
    addLogEntry(`Failed to load user bots: ${error.message}`, 'error');
    return [];
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

// Save user settings
export async function saveUserSettings(settings) {
  if (!currentUser) return false;
  
  try {
    const result = await api.saveUserSettings(currentUser.id, settings);
    
    if (result.success) {
      // Update local settings
      userSettings = { ...userSettings, ...settings };
      addLogEntry('User settings saved successfully', 'info');
      return true;
    } else {
      addLogEntry(`Failed to save user settings: ${result.message}`, 'error');
      return false;
    }
  } catch (error) {
    addLogEntry(`Error saving user settings: ${error.message}`, 'error');
    return false;
  }
}

// Get user settings
export function getUserSettings() {
  return { ...userSettings };
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
export async function createBot(botData) {
  if (!currentUser) return false;
  
  try {
    const result = await api.createBot(currentUser.id, botData);
    
    if (result.success) {
      addLogEntry(`Bot ${botData.name} created`, 'info');
      
      // Reload user bots
      await loadUserBots();
      
      return true;
    } else {
      addLogEntry(`Failed to create bot: ${result.message}`, 'error');
      return false;
    }
  } catch (error) {
    addLogEntry(`Error creating bot: ${error.message}`, 'error');
    return false;
  }
}

// Authenticate user
export async function authenticateUser(username, password) {
  try {
    const result = await api.authenticateUser(username, password);
    
    if (result.success) {
      // Dispatch event with user info
      window.dispatchEvent(new CustomEvent(AppEvents.USER_AUTHENTICATED, {
        detail: {
          userId: result.userId,
          username: result.username
        }
      }));
      
      return true;
    } else {
      return false;
    }
  } catch (error) {
    addLogEntry(`Authentication error: ${error.message}`, 'error');
    return false;
  }
}

// Register user
export async function registerUser(username, password) {
  try {
    const result = await api.registerUser(username, password);
    
    if (result.success) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    addLogEntry(`Registration error: ${error.message}`, 'error');
    return false;
  }
}

// Logout user
export function logoutUser() {
  // Clear user data
  currentUser = null;
  userSettings = null;
  
  // Clear stored session
  localStorage.removeItem('userId');
  localStorage.removeItem('username');
  
  // Dispatch event
  window.dispatchEvent(new CustomEvent(AppEvents.USER_LOGGED_OUT));
  
  // Show login screen
  showLogin();
  
  addLogEntry('User logged out', 'info');
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
  saveUserSettings,
  getUserSettings,
  updateDarkMode,
  toggleDarkMode,
  getConfig,
  createBot,
  authenticateUser,
  registerUser,
  logoutUser,
  generateAIAvatar,
  generateAIBackground,
  getActiveSession
};