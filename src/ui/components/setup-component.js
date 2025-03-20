// setup-component.js - Setup web component for configuring environment variables

import { saveUserSettings, getUserSettings } from '../app.js';

class SetupComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.settings = {};
    this.currentTab = 'api-keys';
  }

  connectedCallback() {
    this.loadSettings();
    this.render();
    this.addEventListeners();
  }

  async loadSettings() {
    try {
      this.settings = await getUserSettings();
    } catch (error) {
      console.error('Failed to load settings:', error);
      this.settings = {};
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 100%;
          background-color: var(--background-color, #f8f9fa);
          padding: 2rem;
          box-sizing: border-box;
          overflow-y: auto;
        }
        
        .setup-container {
          max-width: 800px;
          margin: 0 auto;
          background-color: var(--card-background, #ffffff);
          border-radius: var(--border-radius-md, 0.5rem);
          box-shadow: 0 4px 6px var(--shadow-color, rgba(0, 0, 0, 0.1));
          overflow: hidden;
        }
        
        .setup-header {
          padding: 1.5rem;
          background-color: var(--primary-color, #4a6cf7);
          color: white;
        }
        
        .setup-header h1 {
          margin: 0;
          font-size: 1.5rem;
        }
        
        .setup-header p {
          margin: 0.5rem 0 0 0;
          opacity: 0.9;
        }
        
        .setup-tabs {
          display: flex;
          border-bottom: 1px solid var(--border-color, #dee2e6);
          background-color: var(--background-color, #f8f9fa);
        }
        
        .setup-tab {
          padding: 1rem 1.5rem;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          font-weight: 500;
          color: var(--text-muted, #6c757d);
          transition: all 0.2s;
        }
        
        .setup-tab:hover {
          color: var(--text-color, #212529);
        }
        
        .setup-tab.active {
          color: var(--primary-color, #4a6cf7);
          border-bottom-color: var(--primary-color, #4a6cf7);
        }
        
        .setup-content {
          padding: 1.5rem;
        }
        
        .tab-panel {
          display: none;
        }
        
        .tab-panel.active {
          display: block;
        }
        
        .form-group {
          margin-bottom: 1.5rem;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          color: var(--text-color, #212529);
          font-weight: 500;
        }
        
        .form-group input {
          width: 100%;
          padding: 0.75rem;
          border-radius: var(--border-radius-sm, 0.25rem);
          border: 1px solid var(--border-color, #dee2e6);
          background-color: var(--input-bg, #ffffff);
          color: var(--text-color, #212529);
          font-size: 1rem;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        
        .form-group input:focus {
          border-color: var(--primary-color, #4a6cf7);
          box-shadow: 0 0 0 3px rgba(74, 108, 247, 0.25);
          outline: none;
        }
        
        .form-group .help-text {
          margin-top: 0.5rem;
          font-size: 0.85rem;
          color: var(--text-muted, #6c757d);
        }
        
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 2rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border-color, #dee2e6);
        }
        
        .primary-button {
          background-color: var(--primary-color, #4a6cf7);
          color: white;
          border: none;
          border-radius: var(--border-radius-sm, 0.25rem);
          padding: 0.75rem 1.5rem;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s, transform 0.1s;
        }
        
        .primary-button:hover {
          background-color: var(--primary-color-hover, #3a5ce5);
        }
        
        .primary-button:active {
          transform: translateY(1px);
        }
        
        .secondary-button {
          background-color: var(--secondary-color, #6c757d);
          color: white;
          border: none;
          border-radius: var(--border-radius-sm, 0.25rem);
          padding: 0.75rem 1.5rem;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s, transform 0.1s;
        }
        
        .secondary-button:hover {
          background-color: var(--secondary-color-hover, #5a6268);
        }
        
        .secondary-button:active {
          transform: translateY(1px);
        }
        
        .success-message {
          background-color: var(--success-color, #28a745);
          color: white;
          padding: 1rem;
          border-radius: var(--border-radius-sm, 0.25rem);
          margin-bottom: 1.5rem;
          display: none;
        }
        
        .success-message.show {
          display: block;
        }
        
        .error-message {
          background-color: var(--danger-color, #dc3545);
          color: white;
          padding: 1rem;
          border-radius: var(--border-radius-sm, 0.25rem);
          margin-bottom: 1.5rem;
          display: none;
        }
        
        .error-message.show {
          display: block;
        }
      </style>
      
      <div class="setup-container">
        <div class="setup-header">
          <h1>Application Setup</h1>
          <p>Configure your environment settings</p>
        </div>
        
        <div class="setup-tabs">
          <div class="setup-tab ${this.currentTab === 'api-keys' ? 'active' : ''}" data-tab="api-keys">API Keys</div>
          <div class="setup-tab ${this.currentTab === 'platforms' ? 'active' : ''}" data-tab="platforms">Platforms</div>
          <div class="setup-tab ${this.currentTab === 'database' ? 'active' : ''}" data-tab="database">Database</div>
          <div class="setup-tab ${this.currentTab === 'logging' ? 'active' : ''}" data-tab="logging">Logging</div>
        </div>
        
        <div class="setup-content">
          <div id="successMessage" class="success-message">Settings saved successfully!</div>
          <div id="errorMessage" class="error-message">Failed to save settings. Please try again.</div>
          
          <!-- API Keys Tab -->
          <div class="tab-panel ${this.currentTab === 'api-keys' ? 'active' : ''}" data-tab="api-keys">
            <div class="form-group">
              <label for="openaiApiKey">OpenAI API Key</label>
              <input type="password" id="openaiApiKey" placeholder="Enter your OpenAI API key" value="${this.settings.OPENAI_API_KEY || ''}">
              <div class="help-text">Required for generating bot responses using GPT models.</div>
            </div>
            
            <div class="form-group">
              <label for="twoCaptchaApiKey">2Captcha API Key</label>
              <input type="password" id="twoCaptchaApiKey" placeholder="Enter your 2Captcha API key" value="${this.settings.TWO_CAPTCHA_API_KEY || ''}">
              <div class="help-text">Required for solving CAPTCHAs during platform authentication.</div>
            </div>
          </div>
          
          <!-- Platforms Tab -->
          <div class="tab-panel ${this.currentTab === 'platforms' ? 'active' : ''}" data-tab="platforms">
            <h3>TikTok</h3>
            <div class="form-group">
              <label for="tiktokUsername">TikTok Username</label>
              <input type="text" id="tiktokUsername" placeholder="Enter your TikTok username" value="${this.settings.TIKTOK_USERNAME || ''}">
            </div>
            
            <div class="form-group">
              <label for="tiktokPassword">TikTok Password</label>
              <input type="password" id="tiktokPassword" placeholder="Enter your TikTok password" value="${this.settings.TIKTOK_PASSWORD || ''}">
            </div>
            
            <div class="form-group">
              <label for="tiktokStreamKey">TikTok Stream Key</label>
              <input type="password" id="tiktokStreamKey" placeholder="Enter your TikTok stream key" value="${this.settings.TIKTOK_STREAM_KEY || ''}">
            </div>
            
            <h3>YouTube</h3>
            <div class="form-group">
              <label for="youtubeEmail">YouTube Email</label>
              <input type="text" id="youtubeEmail" placeholder="Enter your YouTube email" value="${this.settings.YOUTUBE_EMAIL || ''}">
            </div>
            
            <div class="form-group">
              <label for="youtubePassword">YouTube Password</label>
              <input type="password" id="youtubePassword" placeholder="Enter your YouTube password" value="${this.settings.YOUTUBE_PASSWORD || ''}">
            </div>
            
            <div class="form-group">
              <label for="youtubeStreamKey">YouTube Stream Key</label>
              <input type="password" id="youtubeStreamKey" placeholder="Enter your YouTube stream key" value="${this.settings.YOUTUBE_STREAM_KEY || ''}">
            </div>
            
            <h3>X.com (Twitter)</h3>
            <div class="form-group">
              <label for="xcomUsername">X.com Username</label>
              <input type="text" id="xcomUsername" placeholder="Enter your X.com username" value="${this.settings.XCOM_USERNAME || ''}">
            </div>
            
            <div class="form-group">
              <label for="xcomPassword">X.com Password</label>
              <input type="password" id="xcomPassword" placeholder="Enter your X.com password" value="${this.settings.XCOM_PASSWORD || ''}">
            </div>
            
            <div class="form-group">
              <label for="xcomStreamKey">X.com Stream Key</label>
              <input type="password" id="xcomStreamKey" placeholder="Enter your X.com stream key" value="${this.settings.XCOM_STREAM_KEY || ''}">
            </div>
          </div>
          
          <!-- Database Tab -->
          <div class="tab-panel ${this.currentTab === 'database' ? 'active' : ''}" data-tab="database">
            <div class="form-group">
              <label for="dbPath">Database Path</label>
              <input type="text" id="dbPath" placeholder="Enter database path" value="${this.settings.DB_PATH || 'user-data/bots.sqlite'}">
              <div class="help-text">Path where the SQLite database will be stored.</div>
            </div>
          </div>
          
          <!-- Logging Tab -->
          <div class="tab-panel ${this.currentTab === 'logging' ? 'active' : ''}" data-tab="logging">
            <div class="form-group">
              <label for="logLevel">Log Level</label>
              <select id="logLevel">
                <option value="debug" ${this.settings.LOG_LEVEL === 'debug' ? 'selected' : ''}>Debug</option>
                <option value="info" ${this.settings.LOG_LEVEL === 'info' || !this.settings.LOG_LEVEL ? 'selected' : ''}>Info</option>
                <option value="warn" ${this.settings.LOG_LEVEL === 'warn' ? 'selected' : ''}>Warning</option>
                <option value="error" ${this.settings.LOG_LEVEL === 'error' ? 'selected' : ''}>Error</option>
              </select>
              <div class="help-text">Controls the verbosity of application logs.</div>
            </div>
            
            <div class="form-group">
              <label for="logFile">Log File</label>
              <input type="text" id="logFile" placeholder="Enter log file path" value="${this.settings.LOG_FILE || 'user-data/logs/app.log'}">
              <div class="help-text">Path where log files will be stored.</div>
            </div>
          </div>
          
          <div class="form-actions">
            <button id="saveSettingsBtn" class="primary-button">Save Settings</button>
            <button id="skipSetupBtn" class="secondary-button">Skip Setup</button>
          </div>
        </div>
      </div>
    `;
  }

  addEventListeners() {
    // Tab switching
    const tabs = this.shadowRoot.querySelectorAll('.setup-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.getAttribute('data-tab');
        this.switchTab(tabName);
      });
    });
    
    // Save settings
    const saveSettingsBtn = this.shadowRoot.getElementById('saveSettingsBtn');
    saveSettingsBtn.addEventListener('click', () => this.saveSettings());
    
    // Skip setup
    const skipSetupBtn = this.shadowRoot.getElementById('skipSetupBtn');
    skipSetupBtn.addEventListener('click', () => this.skipSetup());
  }

  switchTab(tabName) {
    this.currentTab = tabName;
    
    // Update tab active state
    const tabs = this.shadowRoot.querySelectorAll('.setup-tab');
    tabs.forEach(tab => {
      if (tab.getAttribute('data-tab') === tabName) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
    
    // Update panel visibility
    const panels = this.shadowRoot.querySelectorAll('.tab-panel');
    panels.forEach(panel => {
      if (panel.getAttribute('data-tab') === tabName) {
        panel.classList.add('active');
      } else {
        panel.classList.remove('active');
      }
    });
  }

  async saveSettings() {
    try {
      // Collect settings from all tabs
      const settings = {
        // API Keys
        OPENAI_API_KEY: this.shadowRoot.getElementById('openaiApiKey').value,
        TWO_CAPTCHA_API_KEY: this.shadowRoot.getElementById('twoCaptchaApiKey').value,
        
        // Platforms - TikTok
        TIKTOK_USERNAME: this.shadowRoot.getElementById('tiktokUsername').value,
        TIKTOK_PASSWORD: this.shadowRoot.getElementById('tiktokPassword').value,
        TIKTOK_STREAM_KEY: this.shadowRoot.getElementById('tiktokStreamKey').value,
        
        // Platforms - YouTube
        YOUTUBE_EMAIL: this.shadowRoot.getElementById('youtubeEmail').value,
        YOUTUBE_PASSWORD: this.shadowRoot.getElementById('youtubePassword').value,
        YOUTUBE_STREAM_KEY: this.shadowRoot.getElementById('youtubeStreamKey').value,
        
        // Platforms - X.com
        XCOM_USERNAME: this.shadowRoot.getElementById('xcomUsername').value,
        XCOM_PASSWORD: this.shadowRoot.getElementById('xcomPassword').value,
        XCOM_STREAM_KEY: this.shadowRoot.getElementById('xcomStreamKey').value,
        
        // Database
        DB_PATH: this.shadowRoot.getElementById('dbPath').value,
        
        // Logging
        LOG_LEVEL: this.shadowRoot.getElementById('logLevel').value,
        LOG_FILE: this.shadowRoot.getElementById('logFile').value
      };
      
      // Save settings
      const success = await saveUserSettings(settings);
      
      if (success) {
        // Show success message
        const successMessage = this.shadowRoot.getElementById('successMessage');
        successMessage.classList.add('show');
        
        // Hide error message if visible
        const errorMessage = this.shadowRoot.getElementById('errorMessage');
        errorMessage.classList.remove('show');
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          successMessage.classList.remove('show');
        }, 3000);
        
        // Update local settings
        this.settings = settings;
        
        // Notify app that setup is complete
        this.dispatchEvent(new CustomEvent('setup-complete', {
          bubbles: true,
          composed: true
        }));
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      
      // Show error message
      const errorMessage = this.shadowRoot.getElementById('errorMessage');
      errorMessage.textContent = `Failed to save settings: ${error.message}`;
      errorMessage.classList.add('show');
      
      // Hide success message if visible
      const successMessage = this.shadowRoot.getElementById('successMessage');
      successMessage.classList.remove('show');
    }
  }

  skipSetup() {
    // Notify app that setup is skipped
    this.dispatchEvent(new CustomEvent('setup-skipped', {
      bubbles: true,
      composed: true
    }));
  }
}

customElements.define('setup-component', SetupComponent);