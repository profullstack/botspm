// app.js - Main application script for the renderer process

// Import API from preload script for Electron-specific functionality
const { api: electronApi } = window;

// Import our API client for backend communication
import apiClient from './api-client.js';

// Application state
let appConfig = null;
let darkMode = false; // Default to light mode, will be updated based on preferences
let activeBots = [];
let commandHistory = [];
let activeSession = null;
let currentUser = null;
let userSettings = null;
let appState = 'login'; // 'login', 'setup', 'dashboard'
let activePage = 'dashboard'; // 'dashboard', 'bots', 'sessions', 'director', 'logs', 'settings'

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
  USER_LOGGED_OUT: 'app-user-logged-out',
  BOT_CREATED: 'app-bot-created',
  BOT_UPDATED: 'app-bot-updated',
  PERSONALITY_EDIT: 'app-personality-edit'
};

// Initialize the application
async function initializeApp() {
  try {
    // Load configuration
    appConfig = await electronApi.getConfig();
    
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
    const savedDarkModePref = localStorage.getItem('darkMode');
    
    // Set dark mode based on saved preference or system preference
    if (savedDarkModePref === 'true') {
      darkMode = true;
    } else if (savedDarkModePref === 'false') {
      darkMode = false;
    } else if (savedDarkModePref === 'system') {
      darkMode = systemPrefersDark;
    } else {
      // If no preference is saved, use system preference
      darkMode = systemPrefersDark;
      localStorage.setItem('darkMode', 'system');
    }
    
    updateDarkMode();
    
    // Setup media query listener for system preference changes
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    darkModeMediaQuery.addEventListener('change', (e) => {
      if (localStorage.getItem('darkMode') === 'system') {
        darkMode = e.matches;
        updateDarkMode();
      }
    });
    
    // Setup IPC event listeners
    setupIPCListeners();
    
    // Setup custom event listeners
    setupCustomEventListeners();
    
    // Check for stored user session
    const storedUserId = localStorage.getItem('userId');
    const storedUsername = localStorage.getItem('username');
    const storedToken = apiClient.getAuthToken();
    
    if (storedUserId && storedUsername && storedToken) {
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
  electronApi.onBotsStarted(() => {
    addLogEntry('All bots started successfully', 'info');
    updateBotStatus(true);
    window.dispatchEvent(new CustomEvent(AppEvents.BOTS_STARTED));
  });
  
  electronApi.onBotsStopped(() => {
    addLogEntry('All bots stopped', 'info');
    updateBotStatus(false);
    window.dispatchEvent(new CustomEvent(AppEvents.BOTS_STOPPED));
  });
  
  electronApi.onDirectorCommandSent((command) => {
    addLogEntry(`Director command sent: ${command}`, 'info');
    addCommandToHistory(command);
    window.dispatchEvent(new CustomEvent(AppEvents.COMMAND_SENT, { 
      detail: { command } 
    }));
  });
  
  electronApi.onOpenSettings(() => {
    document.querySelector('settings-modal-component').open();
  });
  
  electronApi.onCreateBot(() => {
    document.querySelector('add-bot-modal-component').open();
  });
  
  electronApi.onToggleDarkMode((mode) => {
    darkMode = mode;
    updateDarkMode();
  });
  
  electronApi.onOpenDocumentation(() => {
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
  
  // Listen for bot events
  window.addEventListener('bot-created', handleBotCreated);
  window.addEventListener('bot-updated', handleBotUpdated);
  window.addEventListener('edit-bot-personality', handleEditBotPersonality);
  
  // Listen for navigation events
  window.addEventListener('nav-changed', handleNavChanged);
}

// Handle navigation change
function handleNavChanged(event) {
  const { page } = event.detail;
  activePage = page;
  
  // Update UI based on the active page
  updateActivePage();
  
  addLogEntry(`Navigated to ${page}`, 'info');
}

// Update active page in the UI
function updateActivePage() {
  // Hide all page content
  const dashboardView = document.getElementById('dashboard-view');
  const botsView = document.getElementById('bots-view');
  const settingsView = document.getElementById('settings-view');
  
  if (dashboardView) dashboardView.style.display = 'none';
  if (botsView) botsView.style.display = 'none';
  if (settingsView) settingsView.style.display = 'none';
  
  // Show the active page content
  switch (activePage) {
    case 'dashboard':
      if (dashboardView) dashboardView.style.display = 'block';
      break;
    case 'bots':
      if (botsView) botsView.style.display = 'block';
      break;
    case 'settings':
      if (settingsView) settingsView.style.display = 'block';
      break;
    // Add cases for other pages as needed
  }
}

// Handle director command
function handleDirectorCommand(event) {
  const { command, sessionId } = event.detail;
  
  // Add to command history
  addCommandToHistory(command);
  
  // Send to API
  apiClient.director.sendCommand(command)
    .then(result => {
      if (!result.success) {
        addLogEntry(`Failed to send command: ${result.message}`, 'error');
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

// Handle bot created
function handleBotCreated(event) {
  const { botName } = event.detail;
  addLogEntry(`Bot "${botName}" created successfully`, 'info');
  
  // Reload bots
  loadUserBots();
  
  // Dispatch event for other components
  window.dispatchEvent(new CustomEvent(AppEvents.BOT_CREATED, { 
    detail: { botName } 
  }));
}

// Handle bot updated
function handleBotUpdated(event) {
  const { botId, botName, persona, gender } = event.detail;
  addLogEntry(`Bot "${botName}" updated successfully`, 'info');
  
  // Reload bots
  loadUserBots();
  
  // Dispatch event for other components
  window.dispatchEvent(new CustomEvent(AppEvents.BOT_UPDATED, { 
    detail: { botId, botName, persona, gender } 
  }));
}

// Handle edit bot personality
function handleEditBotPersonality(event) {
  const { botId } = event.detail;
  
  // Get bot personality component
  const personalityComponent = document.querySelector('bot-personality-component');
  
  if (personalityComponent) {
    // Get bot data
    apiClient.bots.get(botId)
      .then(bot => {
        if (bot) {
          // Set bot data in component
          personalityComponent.botData = bot;
          
          // Show component
          personalityComponent.style.display = 'block';
          
          // Dispatch event for other components
          window.dispatchEvent(new CustomEvent(AppEvents.PERSONALITY_EDIT, { 
            detail: { botId, botName: bot.bot_name } 
          }));
        } else {
          addLogEntry(`Bot with ID ${botId} not found`, 'error');
        }
      })
      .catch(error => {
        addLogEntry(`Error loading bot: ${error.message}`, 'error');
      });
  }
}

// Load user settings
async function loadUserSettings() {
  if (!currentUser) return;
  
  try {
    userSettings = await apiClient.settings.get(currentUser.id);
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
  
  // Update navigation component with the current user
  const navComponent = document.querySelector('navigation-component');
  if (navComponent && currentUser) {
    navComponent.updateUser(currentUser);
  }
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
  
  // If showing dashboard, also update the active page
  if (appState === 'dashboard') {
    updateActivePage();
  }
}

// Load user bots
async function loadUserBots() {
  if (!currentUser) return;
  
  try {
    const bots = await apiClient.bots.getAll(currentUser.id);
    
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
  electronApi.startBots();
}

// Stop all bots
export function stopBots() {
  addLogEntry('Stopping all bots...', 'info');
  electronApi.stopBots();
}

// Send director command
export async function sendDirectorCommand(command) {
  if (!command || typeof command !== 'string' || !command.trim()) return false;
  
  try {
    const result = await apiClient.director.sendCommand(command);
    
    if (result.success) {
      return true;
    } else {
      addLogEntry(`Failed to send command: ${result.message}`, 'error');
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
    const result = await electronApi.saveConfig(appConfig);
    
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
    const result = await apiClient.settings.save(currentUser.id, settings);
    
    if (result.success) {
      // Update local settings
      userSettings = { ...userSettings, ...settings };
      addLogEntry('User settings saved successfully', 'info');
      
      // Apply dark mode setting if it was changed
      if (settings.DARK_MODE !== undefined) {
        applyDarkModeSetting(settings.DARK_MODE);
      }
      
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

// Apply dark mode setting
function applyDarkModeSetting(darkModeSetting) {
  const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (darkModeSetting === 'true') {
    darkMode = true;
  } else if (darkModeSetting === 'false') {
    darkMode = false;
  } else if (darkModeSetting === 'system') {
    darkMode = systemPrefersDark;
  }
  
  localStorage.setItem('darkMode', darkModeSetting);
  updateDarkMode();
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
  
  window.dispatchEvent(new CustomEvent(AppEvents.DARK_MODE_CHANGED, { 
    detail: { darkMode } 
  }));
  
  return darkMode;
}

// Toggle dark mode
export function toggleDarkMode() {
  darkMode = !darkMode;
  const darkModeValue = darkMode ? 'true' : 'false';
  localStorage.setItem('darkMode', darkModeValue);
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
    const result = await apiClient.bots.create(currentUser.id, botData);
    
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

// Update bot personality
export async function updateBotPersonality(botId, personalityData) {
  try {
    const result = await apiClient.bots.updatePersonality(botId, personalityData);
    
    if (result.success) {
      addLogEntry(`Bot personality updated`, 'info');
      
      // Reload user bots
      await loadUserBots();
      
      return true;
    } else {
      addLogEntry(`Failed to update bot personality: ${result.message}`, 'error');
      return false;
    }
  } catch (error) {
    addLogEntry(`Error updating bot personality: ${error.message}`, 'error');
    return false;
  }
}

// Get bot by ID
export async function getBot(botId) {
  try {
    return await apiClient.bots.get(botId);
  } catch (error) {
    addLogEntry(`Error getting bot: ${error.message}`, 'error');
    return null;
  }
}

// Authenticate user
export async function authenticateUser(username, password) {
  try {
    const result = await apiClient.auth.login(username, password);
    
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
    const result = await apiClient.auth.register(username, password);
    
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
  apiClient.auth.logout();
  
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
  updateBotPersonality,
  getBot,
  authenticateUser,
  registerUser,
  logoutUser,
  generateAIAvatar,
  generateAIBackground,
  getActiveSession
};