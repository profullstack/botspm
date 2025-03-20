// settings-modal-component.js - Settings modal web component

import { getConfig, saveSettings, toggleDarkMode, AppEvents } from '../app.js';

class SettingsModalComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.isOpen = false;
    this.config = null;
  }

  connectedCallback() {
    this.render();
    this.addEventListeners();
    
    // Listen for config loaded event
    window.addEventListener(AppEvents.CONFIG_LOADED, this.handleConfigLoaded.bind(this));
    window.addEventListener(AppEvents.DARK_MODE_CHANGED, this.handleDarkModeChanged.bind(this));
  }

  disconnectedCallback() {
    window.removeEventListener(AppEvents.CONFIG_LOADED, this.handleConfigLoaded.bind(this));
    window.removeEventListener(AppEvents.DARK_MODE_CHANGED, this.handleDarkModeChanged.bind(this));
  }

  handleConfigLoaded(event) {
    this.config = event.detail.config;
    this.updateSettingsUI();
  }

  handleDarkModeChanged(event) {
    const darkModeToggle = this.shadowRoot.getElementById('darkModeToggle');
    if (darkModeToggle) {
      darkModeToggle.checked = event.detail.darkMode;
    }
  }

  open() {
    this.isOpen = true;
    this.config = getConfig();
    this.updateSettingsUI();
    this.updateModalVisibility();
  }

  close() {
    this.isOpen = false;
    this.updateModalVisibility();
  }

  updateModalVisibility() {
    const modal = this.shadowRoot.querySelector('.modal');
    if (modal) {
      if (this.isOpen) {
        modal.classList.add('show');
      } else {
        modal.classList.remove('show');
      }
    }
  }

  updateSettingsUI() {
    if (!this.config) return;
    
    // Update log level select
    const logLevelSelect = this.shadowRoot.getElementById('logLevelSelect');
    if (logLevelSelect) {
      logLevelSelect.value = this.config.LOG_LEVEL || 'info';
    }
    
    // Update API key fields
    const twoCaptchaApiKey = this.shadowRoot.getElementById('twoCaptchaApiKey');
    const openaiApiKey = this.shadowRoot.getElementById('openaiApiKey');
    
    if (twoCaptchaApiKey) {
      twoCaptchaApiKey.value = localStorage.getItem('twoCaptchaApiKey') || '';
    }
    
    if (openaiApiKey) {
      openaiApiKey.value = localStorage.getItem('openaiApiKey') || '';
    }
    
    // Update bot personalities list
    this.updateBotPersonalitiesList();
    
    // Update platforms list
    this.updatePlatformsList();
  }

  updateBotPersonalitiesList() {
    const botPersonalitiesList = this.shadowRoot.getElementById('botPersonalitiesList');
    if (!botPersonalitiesList || !this.config || !this.config.BOT_PERSONALITIES) return;
    
    botPersonalitiesList.innerHTML = '';
    
    if (this.config.BOT_PERSONALITIES.length === 0) {
      botPersonalitiesList.innerHTML = '<p>No personalities configured</p>';
      return;
    }
    
    this.config.BOT_PERSONALITIES.forEach((personality, index) => {
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
    this.shadowRoot.querySelectorAll('.edit-personality').forEach(button => {
      button.addEventListener('click', (e) => {
        const index = parseInt(e.currentTarget.getAttribute('data-index'));
        this.editPersonality(index);
      });
    });
    
    this.shadowRoot.querySelectorAll('.delete-personality').forEach(button => {
      button.addEventListener('click', (e) => {
        const index = parseInt(e.currentTarget.getAttribute('data-index'));
        this.deletePersonality(index);
      });
    });
  }

  updatePlatformsList() {
    const platformsList = this.shadowRoot.getElementById('platformsList');
    if (!platformsList || !this.config || !this.config.PLATFORMS) return;
    
    platformsList.innerHTML = '';
    
    if (this.config.PLATFORMS.length === 0) {
      platformsList.innerHTML = '<p>No platforms configured</p>';
      return;
    }
    
    this.config.PLATFORMS.forEach((platform, index) => {
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
    this.shadowRoot.querySelectorAll('.edit-platform').forEach(button => {
      button.addEventListener('click', (e) => {
        const index = parseInt(e.currentTarget.getAttribute('data-index'));
        this.editPlatform(index);
      });
    });
    
    this.shadowRoot.querySelectorAll('.delete-platform').forEach(button => {
      button.addEventListener('click', (e) => {
        const index = parseInt(e.currentTarget.getAttribute('data-index'));
        this.deletePlatform(index);
      });
    });
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        
        .modal {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 1000;
          justify-content: center;
          align-items: center;
        }
        
        .modal.show {
          display: flex;
        }
        
        .modal-content {
          background-color: var(--modal-bg, #ffffff);
          border-radius: 0.5rem;
          width: 80%;
          max-width: 800px;
          max-height: 90vh;
          box-shadow: 0 4px 8px var(--shadow-color, rgba(0, 0, 0, 0.1));
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        
        .modal-header {
          padding: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border-color, #dee2e6);
        }
        
        .modal-body {
          padding: 1rem;
          overflow-y: auto;
          max-height: 70vh;
        }
        
        .modal-footer {
          padding: 1rem;
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
          border-top: 1px solid var(--border-color, #dee2e6);
        }
        
        h2, h3, h4 {
          margin: 0;
          color: var(--text-color, #212529);
        }
        
        .close-button {
          background-color: transparent;
          color: var(--text-color, #212529);
          font-size: 1.5rem;
          padding: 0;
          width: 30px;
          height: 30px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .settings-section {
          margin-bottom: 1.5rem;
        }
        
        .settings-section h3 {
          margin-bottom: 0.5rem;
          padding-bottom: 0.25rem;
          border-bottom: 1px solid var(--border-color, #dee2e6);
        }
        
        .setting-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
          padding: 0.5rem;
          border-radius: 0.25rem;
        }
        
        .setting-item:hover {
          background-color: var(--background-color, #f8f9fa);
        }
        
        .setting-item input[type="text"],
        .setting-item input[type="password"],
        .setting-item select {
          padding: 0.5rem;
          border-radius: 0.25rem;
          border: 1px solid var(--input-border, #ced4da);
          background-color: var(--input-bg, #ffffff);
          color: var(--text-color, #212529);
          width: 60%;
        }
        
        .switch {
          position: relative;
          display: inline-block;
          width: 50px;
          height: 24px;
        }
        
        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: var(--secondary-color, #6c757d);
          transition: .4s;
        }
        
        .slider:before {
          position: absolute;
          content: "";
          height: 16px;
          width: 16px;
          left: 4px;
          bottom: 4px;
          background-color: white;
          transition: .4s;
        }
        
        input:checked + .slider {
          background-color: var(--primary-color, #4a6cf7);
        }
        
        input:checked + .slider:before {
          transform: translateX(26px);
        }
        
        .slider.round {
          border-radius: 24px;
        }
        
        .slider.round:before {
          border-radius: 50%;
        }
        
        button {
          cursor: pointer;
          border: none;
          border-radius: 0.25rem;
          padding: 0.5rem 1rem;
          font-size: 0.9rem;
          transition: background-color 0.2s, transform 0.1s;
        }
        
        button:active {
          transform: translateY(1px);
        }
        
        .primary-button {
          background-color: var(--primary-color, #4a6cf7);
          color: white;
        }
        
        .primary-button:hover {
          filter: brightness(1.1);
        }
        
        .secondary-button {
          background-color: var(--secondary-color, #6c757d);
          color: white;
        }
        
        .secondary-button:hover {
          filter: brightness(1.1);
        }
        
        .icon-button {
          background-color: transparent;
          color: var(--text-color, #212529);
          padding: 0.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .icon-button:hover {
          background-color: var(--border-color, #dee2e6);
        }
      </style>
      
      <div class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Settings</h2>
            <button id="closeSettingsBtn" class="close-button">&times;</button>
          </div>
          <div class="modal-body">
            <div class="settings-section">
              <h3>General Settings</h3>
              <div class="setting-item">
                <label for="darkModeToggle">Dark Mode</label>
                <label class="switch">
                  <input type="checkbox" id="darkModeToggle">
                  <span class="slider round"></span>
                </label>
              </div>
              <div class="setting-item">
                <label for="logLevelSelect">Log Level</label>
                <select id="logLevelSelect">
                  <option value="debug">Debug</option>
                  <option value="info">Info</option>
                  <option value="warn">Warning</option>
                  <option value="error">Error</option>
                </select>
              </div>
            </div>
            
            <div class="settings-section">
              <h3>API Keys</h3>
              <div class="setting-item">
                <label for="twoCaptchaApiKey">2Captcha API Key</label>
                <input type="password" id="twoCaptchaApiKey" placeholder="Enter 2Captcha API Key">
              </div>
              <div class="setting-item">
                <label for="openaiApiKey">OpenAI API Key</label>
                <input type="password" id="openaiApiKey" placeholder="Enter OpenAI API Key">
              </div>
            </div>
            
            <div class="settings-section">
              <h3>Bot Personalities</h3>
              <div id="botPersonalitiesList"></div>
              <button id="addPersonalityBtn" class="secondary-button">Add Personality</button>
            </div>
            
            <div class="settings-section">
              <h3>Platforms</h3>
              <div id="platformsList"></div>
              <button id="addPlatformBtn" class="secondary-button">Add Platform</button>
            </div>
          </div>
          <div class="modal-footer">
            <button id="saveSettingsBtn" class="primary-button">Save Settings</button>
            <button id="cancelSettingsBtn" class="secondary-button">Cancel</button>
          </div>
        </div>
      </div>
    `;
  }

  addEventListeners() {
    const closeSettingsBtn = this.shadowRoot.getElementById('closeSettingsBtn');
    const saveSettingsBtn = this.shadowRoot.getElementById('saveSettingsBtn');
    const cancelSettingsBtn = this.shadowRoot.getElementById('cancelSettingsBtn');
    const darkModeToggle = this.shadowRoot.getElementById('darkModeToggle');
    const addPersonalityBtn = this.shadowRoot.getElementById('addPersonalityBtn');
    const addPlatformBtn = this.shadowRoot.getElementById('addPlatformBtn');
    
    closeSettingsBtn.addEventListener('click', () => this.close());
    cancelSettingsBtn.addEventListener('click', () => this.close());
    
    saveSettingsBtn.addEventListener('click', () => this.saveSettings());
    
    darkModeToggle.addEventListener('change', () => {
      toggleDarkMode();
    });
    
    addPersonalityBtn.addEventListener('click', () => this.addPersonality());
    addPlatformBtn.addEventListener('click', () => this.addPlatform());
  }

  async saveSettings() {
    if (!this.config) return;
    
    // Get values from form
    const logLevelSelect = this.shadowRoot.getElementById('logLevelSelect');
    const twoCaptchaApiKey = this.shadowRoot.getElementById('twoCaptchaApiKey');
    const openaiApiKey = this.shadowRoot.getElementById('openaiApiKey');
    
    // Update config object
    this.config.LOG_LEVEL = logLevelSelect.value;
    
    // Save API keys to localStorage (not in config for security)
    localStorage.setItem('twoCaptchaApiKey', twoCaptchaApiKey.value);
    localStorage.setItem('openaiApiKey', openaiApiKey.value);
    
    // Save config to main process
    const success = await saveSettings(this.config);
    
    if (success) {
      this.close();
    }
  }

  addPersonality() {
    // In a real app, this would open a dialog to add a new personality
    const persona = prompt('Enter persona name:');
    if (!persona) return;
    
    const gender = prompt('Enter gender (M, F, or random):');
    if (!gender || !['M', 'F', 'random'].includes(gender)) {
      alert('Invalid gender. Must be M, F, or random.');
      return;
    }
    
    if (!this.config.BOT_PERSONALITIES) {
      this.config.BOT_PERSONALITIES = [];
    }
    
    this.config.BOT_PERSONALITIES.push({ persona, gender });
    this.updateBotPersonalitiesList();
  }

  editPersonality(index) {
    const personality = this.config.BOT_PERSONALITIES[index];
    
    const persona = prompt('Enter persona name:', personality.persona);
    if (!persona) return;
    
    const gender = prompt('Enter gender (M, F, or random):', personality.gender);
    if (!gender || !['M', 'F', 'random'].includes(gender)) {
      alert('Invalid gender. Must be M, F, or random.');
      return;
    }
    
    this.config.BOT_PERSONALITIES[index] = { persona, gender };
    this.updateBotPersonalitiesList();
  }

  deletePersonality(index) {
    if (confirm('Are you sure you want to delete this personality?')) {
      this.config.BOT_PERSONALITIES.splice(index, 1);
      this.updateBotPersonalitiesList();
    }
  }

  addPlatform() {
    // In a real app, this would open a dialog to add a new platform
    const name = prompt('Enter platform name:');
    if (!name) return;
    
    const rtmpTemplate = prompt('Enter RTMP template:');
    if (!rtmpTemplate) return;
    
    const accountCreationUrl = prompt('Enter account creation URL:');
    if (!accountCreationUrl) return;
    
    if (!this.config.PLATFORMS) {
      this.config.PLATFORMS = [];
    }
    
    this.config.PLATFORMS.push({ name, rtmpTemplate, accountCreationUrl });
    this.updatePlatformsList();
  }

  editPlatform(index) {
    const platform = this.config.PLATFORMS[index];
    
    const name = prompt('Enter platform name:', platform.name);
    if (!name) return;
    
    const rtmpTemplate = prompt('Enter RTMP template:', platform.rtmpTemplate);
    if (!rtmpTemplate) return;
    
    const accountCreationUrl = prompt('Enter account creation URL:', platform.accountCreationUrl);
    if (!accountCreationUrl) return;
    
    this.config.PLATFORMS[index] = { name, rtmpTemplate, accountCreationUrl };
    this.updatePlatformsList();
  }

  deletePlatform(index) {
    if (confirm('Are you sure you want to delete this platform?')) {
      this.config.PLATFORMS.splice(index, 1);
      this.updatePlatformsList();
    }
  }
}

customElements.define('settings-modal-component', SettingsModalComponent);