// renderer.js - Renderer process for Multi-Platform AI Bots desktop application

// DOM Elements
const startBotsBtn = document.getElementById('startBotsBtn');
const stopBotsBtn = document.getElementById('stopBotsBtn');
const directorCommandInput = document.getElementById('directorCommandInput');
const sendCommandBtn = document.getElementById('sendCommandBtn');
const commandHistoryList = document.getElementById('commandHistoryList');
const botsList = document.getElementById('botsList');
const logsContent = document.getElementById('logsContent');
const clearLogsBtn = document.getElementById('clearLogsBtn');
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
const darkModeToggle = document.getElementById('darkModeToggle');
const logLevelSelect = document.getElementById('logLevelSelect');
const twoCaptchaApiKey = document.getElementById('twoCaptchaApiKey');
const openaiApiKey = document.getElementById('openaiApiKey');
const botPersonalitiesList = document.getElementById('botPersonalitiesList');
const addPersonalityBtn = document.getElementById('addPersonalityBtn');
const platformsList = document.getElementById('platformsList');
const addPlatformBtn = document.getElementById('addPlatformBtn');
const addBotBtn = document.getElementById('addBotBtn');
const addBotModal = document.getElementById('addBotModal');
const closeAddBotBtn = document.getElementById('closeAddBotBtn');
const botName = document.getElementById('botName');
const botPersona = document.getElementById('botPersona');
const botPlatform = document.getElementById('botPlatform');
const botGender = document.getElementById('botGender');
const createBotBtn = document.getElementById('createBotBtn');
const cancelAddBotBtn = document.getElementById('cancelAddBotBtn');

// Application state
let appConfig = null;
let darkMode = false;
let activeBots = [];
let commandHistory = [];

// Initialize the application
async function initializeApp() {
  try {
    // Load configuration
    appConfig = await window.api.getConfig();
    
    if (!appConfig) {
      addLogEntry('Error loading configuration. Using defaults.', 'error');
      appConfig = {
        LOG_LEVEL: 'info',
        BOT_PERSONALITIES: [],
        PLATFORMS: []
      };
    }
    
    // Initialize UI based on config
    updateUIFromConfig();
    
    // Check for dark mode preference
    const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    darkMode = localStorage.getItem('darkMode') === 'true' || systemPrefersDark;
    updateDarkMode();
    
    // Add event listeners
    setupEventListeners();
    
    addLogEntry('Application initialized successfully', 'info');
  } catch (error) {
    addLogEntry(`Initialization error: ${error.message}`, 'error');
  }
}

// Update UI elements based on configuration
function updateUIFromConfig() {
  // Update log level select
  logLevelSelect.value = appConfig.LOG_LEVEL || 'info';
  
  // Update API key fields
  twoCaptchaApiKey.value = localStorage.getItem('twoCaptchaApiKey') || '';
  openaiApiKey.value = localStorage.getItem('openaiApiKey') || '';
  
  // Update bot personalities list
  updateBotPersonalitiesList();
  
  // Update platforms list
  updatePlatformsList();
  
  // Update bot persona and platform dropdowns
  updateBotDropdowns();
}

// Update bot personalities list in settings
function updateBotPersonalitiesList() {
  botPersonalitiesList.innerHTML = '';
  
  if (!appConfig.BOT_PERSONALITIES || appConfig.BOT_PERSONALITIES.length === 0) {
    botPersonalitiesList.innerHTML = '<p>No personalities configured</p>';
    return;
  }
  
  appConfig.BOT_PERSONALITIES.forEach((personality, index) => {
    const personalityItem = document.createElement('div');
    personalityItem.className = 'setting-item';
    personalityItem.innerHTML = `
      <span>${personality.persona} (${personality.gender})</span>
      <div>
        <button class="icon-button edit-personality" data-index="${index}">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        <button class="icon-button delete-personality" data-index="${index}">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </button>
      </div>
    `;
    botPersonalitiesList.appendChild(personalityItem);
  });
  
  // Add event listeners for edit and delete buttons
  document.querySelectorAll('.edit-personality').forEach(button => {
    button.addEventListener('click', () => {
      const index = parseInt(button.getAttribute('data-index'));
      editPersonality(index);
    });
  });
  
  document.querySelectorAll('.delete-personality').forEach(button => {
    button.addEventListener('click', () => {
      const index = parseInt(button.getAttribute('data-index'));
      deletePersonality(index);
    });
  });
}

// Update platforms list in settings
function updatePlatformsList() {
  platformsList.innerHTML = '';
  
  if (!appConfig.PLATFORMS || appConfig.PLATFORMS.length === 0) {
    platformsList.innerHTML = '<p>No platforms configured</p>';
    return;
  }
  
  appConfig.PLATFORMS.forEach((platform, index) => {
    const platformItem = document.createElement('div');
    platformItem.className = 'setting-item';
    platformItem.innerHTML = `
      <span>${platform.name}</span>
      <div>
        <button class="icon-button edit-platform" data-index="${index}">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        <button class="icon-button delete-platform" data-index="${index}">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </button>
      </div>
    `;
    platformsList.appendChild(platformItem);
  });
  
  // Add event listeners for edit and delete buttons
  document.querySelectorAll('.edit-platform').forEach(button => {
    button.addEventListener('click', () => {
      const index = parseInt(button.getAttribute('data-index'));
      editPlatform(index);
    });
  });
  
  document.querySelectorAll('.delete-platform').forEach(button => {
    button.addEventListener('click', () => {
      const index = parseInt(button.getAttribute('data-index'));
      deletePlatform(index);
    });
  });
}

// Update bot dropdowns in add bot modal
function updateBotDropdowns() {
  // Clear existing options
  botPersona.innerHTML = '';
  botPlatform.innerHTML = '';
  
  // Add personality options
  if (appConfig.BOT_PERSONALITIES && appConfig.BOT_PERSONALITIES.length > 0) {
    appConfig.BOT_PERSONALITIES.forEach((personality, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = personality.persona;
      botPersona.appendChild(option);
    });
  } else {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'No personalities available';
    option.disabled = true;
    option.selected = true;
    botPersona.appendChild(option);
  }
  
  // Add platform options
  if (appConfig.PLATFORMS && appConfig.PLATFORMS.length > 0) {
    appConfig.PLATFORMS.forEach((platform, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = platform.name;
      botPlatform.appendChild(option);
    });
  } else {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'No platforms available';
    option.disabled = true;
    option.selected = true;
    botPlatform.appendChild(option);
  }
}

// Setup event listeners
function setupEventListeners() {
  // Bot control buttons
  startBotsBtn.addEventListener('click', startBots);
  stopBotsBtn.addEventListener('click', stopBots);
  
  // Director command
  sendCommandBtn.addEventListener('click', sendDirectorCommand);
  directorCommandInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendDirectorCommand();
    }
  });
  
  // Logs
  clearLogsBtn.addEventListener('click', clearLogs);
  
  // Settings
  settingsBtn.addEventListener('click', openSettingsModal);
  closeSettingsBtn.addEventListener('click', closeSettingsModal);
  saveSettingsBtn.addEventListener('click', saveSettings);
  cancelSettingsBtn.addEventListener('click', closeSettingsModal);
  darkModeToggle.addEventListener('change', () => {
    darkMode = darkModeToggle.checked;
    updateDarkMode();
  });
  
  // Add personality/platform
  addPersonalityBtn.addEventListener('click', addPersonality);
  addPlatformBtn.addEventListener('click', addPlatform);
  
  // Add bot
  addBotBtn.addEventListener('click', openAddBotModal);
  closeAddBotBtn.addEventListener('click', closeAddBotModal);
  createBotBtn.addEventListener('click', createBot);
  cancelAddBotBtn.addEventListener('click', closeAddBotModal);
  
  // IPC event listeners
  window.api.onBotsStarted(() => {
    addLogEntry('All bots started successfully', 'info');
    updateBotStatus(true);
  });
  
  window.api.onBotsStopped(() => {
    addLogEntry('All bots stopped', 'info');
    updateBotStatus(false);
  });
  
  window.api.onDirectorCommandSent((command) => {
    addLogEntry(`Director command sent: ${command}`, 'info');
    addCommandToHistory(command);
  });
  
  window.api.onOpenSettings(() => {
    openSettingsModal();
  });
  
  window.api.onCreateBot(() => {
    openAddBotModal();
  });
  
  window.api.onToggleDarkMode((mode) => {
    darkMode = mode;
    updateDarkMode();
    darkModeToggle.checked = mode;
  });
  
  window.api.onOpenDocumentation(() => {
    addLogEntry('Documentation requested', 'info');
    // In a real app, this would open documentation
  });
}

// Start all bots
function startBots() {
  addLogEntry('Starting all bots...', 'info');
  window.api.startBots();
}

// Stop all bots
function stopBots() {
  addLogEntry('Stopping all bots...', 'info');
  window.api.stopBots();
}

// Send director command
function sendDirectorCommand() {
  const command = directorCommandInput.value.trim();
  if (!command) return;
  
  window.api.sendDirectorCommand(command)
    .then(result => {
      if (result.success) {
        directorCommandInput.value = '';
      } else {
        addLogEntry(`Failed to send command: ${result.error}`, 'error');
      }
    })
    .catch(error => {
      addLogEntry(`Error sending command: ${error.message}`, 'error');
    });
}

// Add command to history
function addCommandToHistory(command) {
  commandHistory.unshift(command);
  if (commandHistory.length > 10) {
    commandHistory.pop();
  }
  
  updateCommandHistoryUI();
}

// Update command history UI
function updateCommandHistoryUI() {
  commandHistoryList.innerHTML = '';
  
  commandHistory.forEach(command => {
    const li = document.createElement('li');
    li.textContent = command;
    commandHistoryList.appendChild(li);
  });
}

// Update bot status
function updateBotStatus(active) {
  const botCards = document.querySelectorAll('.bot-card');
  botCards.forEach(card => {
    const statusIndicator = card.querySelector('.status-indicator');
    const statusText = card.querySelector('.status-text');
    
    if (active) {
      statusIndicator.classList.remove('status-inactive');
      statusIndicator.classList.add('status-active');
      statusText.textContent = 'Active';
    } else {
      statusIndicator.classList.remove('status-active');
      statusIndicator.classList.add('status-inactive');
      statusText.textContent = 'Inactive';
    }
  });
}

// Add log entry
function addLogEntry(message, level = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const logEntry = document.createElement('div');
  logEntry.className = `log-entry log-${level}`;
  logEntry.textContent = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  logsContent.appendChild(logEntry);
  logsContent.scrollTop = logsContent.scrollHeight;
}

// Clear logs
function clearLogs() {
  logsContent.innerHTML = '';
  addLogEntry('Logs cleared', 'info');
}

// Open settings modal
function openSettingsModal() {
  // Update UI with current settings
  darkModeToggle.checked = darkMode;
  logLevelSelect.value = appConfig.LOG_LEVEL || 'info';
  twoCaptchaApiKey.value = localStorage.getItem('twoCaptchaApiKey') || '';
  openaiApiKey.value = localStorage.getItem('openaiApiKey') || '';
  
  settingsModal.classList.add('show');
}

// Close settings modal
function closeSettingsModal() {
  settingsModal.classList.remove('show');
}

// Save settings
async function saveSettings() {
  try {
    // Update config object
    appConfig.LOG_LEVEL = logLevelSelect.value;
    
    // Save API keys to localStorage (not in config for security)
    localStorage.setItem('twoCaptchaApiKey', twoCaptchaApiKey.value);
    localStorage.setItem('openaiApiKey', openaiApiKey.value);
    localStorage.setItem('darkMode', darkMode.toString());
    
    // Save config to main process
    const result = await window.api.saveConfig(appConfig);
    
    if (result.success) {
      addLogEntry('Settings saved successfully', 'info');
      closeSettingsModal();
    } else {
      addLogEntry(`Failed to save settings: ${result.error}`, 'error');
    }
  } catch (error) {
    addLogEntry(`Error saving settings: ${error.message}`, 'error');
  }
}

// Update dark mode
function updateDarkMode() {
  if (darkMode) {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
  localStorage.setItem('darkMode', darkMode.toString());
}

// Add personality
function addPersonality() {
  // In a real app, this would open a dialog to add a new personality
  const persona = prompt('Enter persona name:');
  if (!persona) return;
  
  const gender = prompt('Enter gender (M, F, or random):');
  if (!gender || !['M', 'F', 'random'].includes(gender)) {
    addLogEntry('Invalid gender. Must be M, F, or random.', 'error');
    return;
  }
  
  if (!appConfig.BOT_PERSONALITIES) {
    appConfig.BOT_PERSONALITIES = [];
  }
  
  appConfig.BOT_PERSONALITIES.push({ persona, gender });
  updateBotPersonalitiesList();
  updateBotDropdowns();
}

// Edit personality
function editPersonality(index) {
  const personality = appConfig.BOT_PERSONALITIES[index];
  
  const persona = prompt('Enter persona name:', personality.persona);
  if (!persona) return;
  
  const gender = prompt('Enter gender (M, F, or random):', personality.gender);
  if (!gender || !['M', 'F', 'random'].includes(gender)) {
    addLogEntry('Invalid gender. Must be M, F, or random.', 'error');
    return;
  }
  
  appConfig.BOT_PERSONALITIES[index] = { persona, gender };
  updateBotPersonalitiesList();
  updateBotDropdowns();
}

// Delete personality
function deletePersonality(index) {
  if (confirm('Are you sure you want to delete this personality?')) {
    appConfig.BOT_PERSONALITIES.splice(index, 1);
    updateBotPersonalitiesList();
    updateBotDropdowns();
  }
}

// Add platform
function addPlatform() {
  // In a real app, this would open a dialog to add a new platform
  const name = prompt('Enter platform name:');
  if (!name) return;
  
  const rtmpTemplate = prompt('Enter RTMP template:');
  if (!rtmpTemplate) return;
  
  const accountCreationUrl = prompt('Enter account creation URL:');
  if (!accountCreationUrl) return;
  
  if (!appConfig.PLATFORMS) {
    appConfig.PLATFORMS = [];
  }
  
  appConfig.PLATFORMS.push({ name, rtmpTemplate, accountCreationUrl });
  updatePlatformsList();
  updateBotDropdowns();
}

// Edit platform
function editPlatform(index) {
  const platform = appConfig.PLATFORMS[index];
  
  const name = prompt('Enter platform name:', platform.name);
  if (!name) return;
  
  const rtmpTemplate = prompt('Enter RTMP template:', platform.rtmpTemplate);
  if (!rtmpTemplate) return;
  
  const accountCreationUrl = prompt('Enter account creation URL:', platform.accountCreationUrl);
  if (!accountCreationUrl) return;
  
  appConfig.PLATFORMS[index] = { name, rtmpTemplate, accountCreationUrl };
  updatePlatformsList();
  updateBotDropdowns();
}

// Delete platform
function deletePlatform(index) {
  if (confirm('Are you sure you want to delete this platform?')) {
    appConfig.PLATFORMS.splice(index, 1);
    updatePlatformsList();
    updateBotDropdowns();
  }
}

// Open add bot modal
function openAddBotModal() {
  botName.value = '';
  addBotModal.classList.add('show');
}

// Close add bot modal
function closeAddBotModal() {
  addBotModal.classList.remove('show');
}

// Create bot
function createBot() {
  const name = botName.value.trim();
  if (!name) {
    addLogEntry('Bot name is required', 'error');
    return;
  }
  
  const personaIndex = parseInt(botPersona.value);
  if (isNaN(personaIndex) || personaIndex < 0 || personaIndex >= appConfig.BOT_PERSONALITIES.length) {
    addLogEntry('Invalid persona selected', 'error');
    return;
  }
  
  const platformIndex = parseInt(botPlatform.value);
  if (isNaN(platformIndex) || platformIndex < 0 || platformIndex >= appConfig.PLATFORMS.length) {
    addLogEntry('Invalid platform selected', 'error');
    return;
  }
  
  const gender = botGender.value;
  
  // Create bot card
  const botCard = document.createElement('div');
  botCard.className = 'bot-card';
  botCard.innerHTML = `
    <div class="bot-header">
      <h3>${name}</h3>
      <div class="bot-status">
        <div class="status-indicator status-inactive"></div>
        <span class="status-text">Inactive</span>
      </div>
    </div>
    <div class="bot-details">
      <p><strong>Persona:</strong> ${appConfig.BOT_PERSONALITIES[personaIndex].persona}</p>
      <p><strong>Platform:</strong> ${appConfig.PLATFORMS[platformIndex].name}</p>
      <p><strong>Gender:</strong> ${gender}</p>
    </div>
    <div class="bot-actions">
      <button class="secondary-button bot-action-start">Start</button>
      <button class="secondary-button bot-action-stop" disabled>Stop</button>
    </div>
  `;
  
  botsList.appendChild(botCard);
  
  // Add event listeners for bot actions
  const startBtn = botCard.querySelector('.bot-action-start');
  const stopBtn = botCard.querySelector('.bot-action-stop');
  
  startBtn.addEventListener('click', () => {
    // In a real app, this would start the specific bot
    startBtn.disabled = true;
    stopBtn.disabled = false;
    const statusIndicator = botCard.querySelector('.status-indicator');
    const statusText = botCard.querySelector('.status-text');
    statusIndicator.classList.remove('status-inactive');
    statusIndicator.classList.add('status-active');
    statusText.textContent = 'Active';
    addLogEntry(`Bot ${name} started`, 'info');
  });
  
  stopBtn.addEventListener('click', () => {
    // In a real app, this would stop the specific bot
    startBtn.disabled = false;
    stopBtn.disabled = true;
    const statusIndicator = botCard.querySelector('.status-indicator');
    const statusText = botCard.querySelector('.status-text');
    statusIndicator.classList.remove('status-active');
    statusIndicator.classList.add('status-inactive');
    statusText.textContent = 'Inactive';
    addLogEntry(`Bot ${name} stopped`, 'info');
  });
  
  addLogEntry(`Bot ${name} created`, 'info');
  closeAddBotModal();
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);