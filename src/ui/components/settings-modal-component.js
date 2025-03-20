// settings-modal-component.js - Component for application settings

import { saveUserSettings, getUserSettings } from '../app.js';

class SettingsModalComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.isOpen = false;
    this.activeTab = 'general';
    this.settings = {};
  }

  connectedCallback() {
    this.render();
    this.addEventListeners();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
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
          font-family: Arial, sans-serif;
        }
        
        :host(.open) {
          display: flex;
        }
        
        .modal {
          background-color: var(--card-background, #ffffff);
          border-radius: var(--border-radius-lg, 0.5rem);
          box-shadow: 0 4px 6px var(--shadow-color, rgba(0, 0, 0, 0.1));
          width: 800px;
          max-width: 90%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        
        .modal-header {
          padding: 1.5rem;
          border-bottom: 1px solid var(--border-color, #e9ecef);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .modal-header h2 {
          margin: 0;
          font-size: 1.5rem;
          color: var(--text-color, #333);
        }
        
        .close-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: var(--text-color-secondary, #6c757d);
        }
        
        .modal-body {
          padding: 0;
          overflow: hidden;
          display: flex;
          height: 500px;
        }
        
        .tabs {
          width: 200px;
          background-color: var(--sidebar-bg, #f8f9fa);
          border-right: 1px solid var(--border-color, #e9ecef);
          padding: 1rem 0;
          overflow-y: auto;
        }
        
        .tab-item {
          padding: 0.75rem 1.5rem;
          cursor: pointer;
          color: var(--text-color-secondary, #6c757d);
          transition: all 0.2s ease;
          border-left: 3px solid transparent;
        }
        
        .tab-item:hover {
          background-color: var(--hover-bg, rgba(0, 0, 0, 0.05));
          color: var(--text-color, #333);
        }
        
        .tab-item.active {
          background-color: var(--active-bg, rgba(74, 108, 247, 0.1));
          color: var(--primary-color, #4A6CF7);
          border-left-color: var(--primary-color, #4A6CF7);
          font-weight: 500;
        }
        
        .tab-content {
          flex: 1;
          padding: 1.5rem;
          overflow-y: auto;
        }
        
        .tab-pane {
          display: none;
        }
        
        .tab-pane.active {
          display: block;
        }
        
        .form-group {
          margin-bottom: 1.5rem;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: var(--text-color, #333);
        }
        
        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid var(--border-color, #ddd);
          border-radius: var(--border-radius-sm, 0.25rem);
          font-size: 1rem;
          background-color: var(--input-bg, #fff);
          color: var(--text-color, #333);
        }
        
        .form-group textarea {
          min-height: 100px;
          resize: vertical;
        }
        
        .form-group .hint {
          font-size: 0.85rem;
          color: var(--text-color-secondary, #6c757d);
          margin-top: 0.25rem;
        }
        
        .form-row {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        
        .form-row .form-group {
          flex: 1;
          margin-bottom: 0;
        }
        
        .section-title {
          font-size: 1.2rem;
          margin-top: 2rem;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--border-color, #e9ecef);
          color: var(--text-color, #333);
        }
        
        .section-title:first-child {
          margin-top: 0;
        }
        
        .modal-footer {
          padding: 1.5rem;
          border-top: 1px solid var(--border-color, #e9ecef);
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
        }
        
        .btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: var(--border-radius-sm, 0.25rem);
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .btn-primary {
          background-color: var(--primary-color, #4A6CF7);
          color: white;
        }
        
        .btn-primary:hover {
          background-color: var(--primary-color-hover, #3a5ce5);
        }
        
        .btn-secondary {
          background-color: var(--secondary-color, #6c757d);
          color: white;
        }
        
        .btn-secondary:hover {
          background-color: var(--secondary-color-hover, #5a6268);
        }
        
        .success-message,
        .error-message {
          padding: 0.75rem;
          border-radius: var(--border-radius-sm, 0.25rem);
          margin-bottom: 1rem;
          display: none;
        }
        
        .success-message {
          background-color: var(--success-color, #28a745);
          color: white;
        }
        
        .error-message {
          background-color: var(--danger-color, #dc3545);
          color: white;
        }
        
        .success-message.show,
        .error-message.show {
          display: block;
        }
        
        /* Dark mode styles */
        :host-context(body.dark-mode) .modal {
          background-color: var(--dark-card-background, #2a2a2a);
        }
        
        :host-context(body.dark-mode) .modal-header {
          border-bottom-color: var(--dark-border-color, #444);
        }
        
        :host-context(body.dark-mode) .modal-header h2 {
          color: var(--dark-text-color, #f8f9fa);
        }
        
        :host-context(body.dark-mode) .close-btn {
          color: var(--dark-text-color-secondary, #adb5bd);
        }
        
        :host-context(body.dark-mode) .tabs {
          background-color: var(--dark-sidebar-bg, #222);
          border-right-color: var(--dark-border-color, #444);
        }
        
        :host-context(body.dark-mode) .tab-item {
          color: var(--dark-text-color-secondary, #adb5bd);
        }
        
        :host-context(body.dark-mode) .tab-item:hover {
          background-color: var(--dark-hover-bg, rgba(255, 255, 255, 0.05));
          color: var(--dark-text-color, #f8f9fa);
        }
        
        :host-context(body.dark-mode) .tab-item.active {
          background-color: var(--dark-active-bg, rgba(74, 108, 247, 0.2));
        }
        
        :host-context(body.dark-mode) .form-group label {
          color: var(--dark-text-color, #f8f9fa);
        }
        
        :host-context(body.dark-mode) .form-group input,
        :host-context(body.dark-mode) .form-group select,
        :host-context(body.dark-mode) .form-group textarea {
          background-color: var(--dark-input-bg, #343a40);
          color: var(--dark-text-color, #f8f9fa);
          border-color: var(--dark-border-color, #495057);
        }
        
        :host-context(body.dark-mode) .form-group .hint {
          color: var(--dark-text-color-secondary, #adb5bd);
        }
        
        :host-context(body.dark-mode) .section-title {
          border-bottom-color: var(--dark-border-color, #444);
          color: var(--dark-text-color, #f8f9fa);
        }
        
        :host-context(body.dark-mode) .modal-footer {
          border-top-color: var(--dark-border-color, #444);
        }
      </style>
      
      <div class="modal">
        <div class="modal-header">
          <h2>Settings</h2>
          <button class="close-btn" id="closeBtn">&times;</button>
        </div>
        
        <div id="successMessage" class="success-message"></div>
        <div id="errorMessage" class="error-message"></div>
        
        <div class="modal-body">
          <div class="tabs">
            <div class="tab-item active" data-tab="general">General</div>
            <div class="tab-item" data-tab="api-keys">API Keys</div>
            <div class="tab-item" data-tab="platforms">Platforms</div>
            <div class="tab-item" data-tab="appearance">Appearance</div>
            <div class="tab-item" data-tab="advanced">Advanced</div>
          </div>
          
          <div class="tab-content">
            <!-- General Settings -->
            <div class="tab-pane active" data-tab="general">
              <h3 class="section-title">General Settings</h3>
              
              <div class="form-group">
                <label for="username">Username</label>
                <input type="text" id="username" disabled>
                <div class="hint">Your username cannot be changed</div>
              </div>
              
              <div class="form-group">
                <label for="logLevel">Log Level</label>
                <select id="logLevel">
                  <option value="error">Error</option>
                  <option value="warn">Warning</option>
                  <option value="info">Info</option>
                  <option value="debug">Debug</option>
                </select>
                <div class="hint">Controls the verbosity of application logs</div>
              </div>
              
              <div class="form-group">
                <label for="dataDir">Data Directory</label>
                <input type="text" id="dataDir" value="data">
                <div class="hint">Directory where application data is stored</div>
              </div>
            </div>
            
            <!-- API Keys -->
            <div class="tab-pane" data-tab="api-keys">
              <h3 class="section-title">API Keys</h3>
              
              <div class="form-group">
                <label for="openaiApiKey">OpenAI API Key</label>
                <input type="password" id="openaiApiKey" placeholder="sk-...">
                <div class="hint">Used for generating bot responses with GPT models</div>
              </div>
              
              <div class="form-group">
                <label for="twoCaptchaApiKey">2Captcha API Key</label>
                <input type="password" id="twoCaptchaApiKey" placeholder="Your 2Captcha API key">
                <div class="hint">Used for solving CAPTCHAs during automated platform authentication</div>
              </div>
            </div>
            
            <!-- Platforms -->
            <div class="tab-pane" data-tab="platforms">
              <h3 class="section-title">TikTok</h3>
              
              <div class="form-group">
                <label for="tiktokUsername">TikTok Username</label>
                <input type="text" id="tiktokUsername" placeholder="Your TikTok username">
              </div>
              
              <div class="form-group">
                <label for="tiktokPassword">TikTok Password</label>
                <input type="password" id="tiktokPassword" placeholder="Your TikTok password">
              </div>
              
              <div class="form-group">
                <label for="tiktokStreamKey">TikTok Stream Key</label>
                <input type="password" id="tiktokStreamKey" placeholder="Your TikTok stream key">
                <div class="hint">Found in your TikTok creator dashboard</div>
              </div>
              
              <h3 class="section-title">YouTube</h3>
              
              <div class="form-group">
                <label for="youtubeUsername">YouTube Username</label>
                <input type="text" id="youtubeUsername" placeholder="Your YouTube username">
              </div>
              
              <div class="form-group">
                <label for="youtubePassword">YouTube Password</label>
                <input type="password" id="youtubePassword" placeholder="Your YouTube password">
              </div>
              
              <div class="form-group">
                <label for="youtubeStreamKey">YouTube Stream Key</label>
                <input type="password" id="youtubeStreamKey" placeholder="Your YouTube stream key">
                <div class="hint">Found in your YouTube Studio dashboard</div>
              </div>
              
              <h3 class="section-title">X.com (Twitter)</h3>
              
              <div class="form-group">
                <label for="xcomUsername">X.com Username</label>
                <input type="text" id="xcomUsername" placeholder="Your X.com username">
              </div>
              
              <div class="form-group">
                <label for="xcomPassword">X.com Password</label>
                <input type="password" id="xcomPassword" placeholder="Your X.com password">
              </div>
              
              <div class="form-group">
                <label for="xcomStreamKey">X.com Stream Key</label>
                <input type="password" id="xcomStreamKey" placeholder="Your X.com stream key">
                <div class="hint">Found in your X.com creator dashboard</div>
              </div>
            </div>
            
            <!-- Appearance -->
            <div class="tab-pane" data-tab="appearance">
              <h3 class="section-title">Theme</h3>
              
              <div class="form-group">
                <label for="darkMode">Dark Mode</label>
                <select id="darkMode">
                  <option value="true">Enabled</option>
                  <option value="false">Disabled</option>
                  <option value="system">Use System Preference</option>
                </select>
                <div class="hint">Controls the application theme</div>
              </div>
              
              <div class="form-group">
                <label for="fontSize">Font Size</label>
                <select id="fontSize">
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
                <div class="hint">Controls the text size throughout the application</div>
              </div>
            </div>
            
            <!-- Advanced -->
            <div class="tab-pane" data-tab="advanced">
              <h3 class="section-title">Database</h3>
              
              <div class="form-group">
                <label for="databaseEngine">Database Engine</label>
                <select id="databaseEngine">
                  <option value="sqlite3">sqlite3</option>
                  <option value="better-sqlite3">better-sqlite3</option>
                </select>
                <div class="hint">The SQLite engine to use (requires restart)</div>
              </div>
              
              <h3 class="section-title">FFmpeg</h3>
              
              <div class="form-group">
                <label for="ffmpegPath">FFmpeg Path</label>
                <input type="text" id="ffmpegPath" placeholder="/usr/bin/ffmpeg">
                <div class="hint">Path to the FFmpeg executable</div>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label for="videoCodec">Video Codec</label>
                  <select id="videoCodec">
                    <option value="libx264">H.264 (libx264)</option>
                    <option value="libx265">H.265 (libx265)</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label for="audioCodec">Audio Codec</label>
                  <select id="audioCodec">
                    <option value="aac">AAC</option>
                    <option value="libmp3lame">MP3</option>
                  </select>
                </div>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label for="videoBitrate">Video Bitrate</label>
                  <select id="videoBitrate">
                    <option value="500k">500 kbps</option>
                    <option value="1000k">1000 kbps</option>
                    <option value="2000k">2000 kbps</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label for="audioBitrate">Audio Bitrate</label>
                  <select id="audioBitrate">
                    <option value="64k">64 kbps</option>
                    <option value="128k">128 kbps</option>
                    <option value="192k">192 kbps</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button id="cancelBtn" class="btn btn-secondary">Cancel</button>
          <button id="saveBtn" class="btn btn-primary">Save Settings</button>
        </div>
      </div>
    `;
  }

  addEventListeners() {
    const closeBtn = this.shadowRoot.getElementById('closeBtn');
    const cancelBtn = this.shadowRoot.getElementById('cancelBtn');
    const saveBtn = this.shadowRoot.getElementById('saveBtn');
    const tabItems = this.shadowRoot.querySelectorAll('.tab-item');
    
    closeBtn.addEventListener('click', () => this.close());
    cancelBtn.addEventListener('click', () => this.close());
    saveBtn.addEventListener('click', () => this.saveSettings());
    
    tabItems.forEach(item => {
      item.addEventListener('click', () => {
        const tabName = item.dataset.tab;
        this.setActiveTab(tabName);
      });
    });
  }

  open() {
    this.isOpen = true;
    this.classList.add('open');
    this.loadSettings();
  }

  close() {
    this.isOpen = false;
    this.classList.remove('open');
  }

  setActiveTab(tabName) {
    this.activeTab = tabName;
    
    // Update tab items
    const tabItems = this.shadowRoot.querySelectorAll('.tab-item');
    tabItems.forEach(item => {
      if (item.dataset.tab === tabName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
    
    // Update tab panes
    const tabPanes = this.shadowRoot.querySelectorAll('.tab-pane');
    tabPanes.forEach(pane => {
      if (pane.dataset.tab === tabName) {
        pane.classList.add('active');
      } else {
        pane.classList.remove('active');
      }
    });
  }

  async loadSettings() {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) return;
      
      // Get user settings
      this.settings = await getUserSettings(userId);
      
      // Set username
      const usernameInput = this.shadowRoot.getElementById('username');
      usernameInput.value = localStorage.getItem('username') || '';
      
      // Set general settings
      const logLevelSelect = this.shadowRoot.getElementById('logLevel');
      logLevelSelect.value = this.settings.LOG_LEVEL || 'info';
      
      const dataDirInput = this.shadowRoot.getElementById('dataDir');
      dataDirInput.value = this.settings.DATA_DIR || 'data';
      
      // Set API keys
      const openaiApiKeyInput = this.shadowRoot.getElementById('openaiApiKey');
      openaiApiKeyInput.value = this.settings.OPENAI_API_KEY || '';
      
      const twoCaptchaApiKeyInput = this.shadowRoot.getElementById('twoCaptchaApiKey');
      twoCaptchaApiKeyInput.value = this.settings.TWO_CAPTCHA_API_KEY || '';
      
      // Set platform credentials
      const tiktokUsernameInput = this.shadowRoot.getElementById('tiktokUsername');
      tiktokUsernameInput.value = this.settings.TIKTOK_USERNAME || '';
      
      const tiktokPasswordInput = this.shadowRoot.getElementById('tiktokPassword');
      tiktokPasswordInput.value = this.settings.TIKTOK_PASSWORD || '';
      
      const tiktokStreamKeyInput = this.shadowRoot.getElementById('tiktokStreamKey');
      tiktokStreamKeyInput.value = this.settings.TIKTOK_STREAM_KEY || '';
      
      const youtubeUsernameInput = this.shadowRoot.getElementById('youtubeUsername');
      youtubeUsernameInput.value = this.settings.YOUTUBE_USERNAME || '';
      
      const youtubePasswordInput = this.shadowRoot.getElementById('youtubePassword');
      youtubePasswordInput.value = this.settings.YOUTUBE_PASSWORD || '';
      
      const youtubeStreamKeyInput = this.shadowRoot.getElementById('youtubeStreamKey');
      youtubeStreamKeyInput.value = this.settings.YOUTUBE_STREAM_KEY || '';
      
      const xcomUsernameInput = this.shadowRoot.getElementById('xcomUsername');
      xcomUsernameInput.value = this.settings.XCOM_USERNAME || '';
      
      const xcomPasswordInput = this.shadowRoot.getElementById('xcomPassword');
      xcomPasswordInput.value = this.settings.XCOM_PASSWORD || '';
      
      const xcomStreamKeyInput = this.shadowRoot.getElementById('xcomStreamKey');
      xcomStreamKeyInput.value = this.settings.XCOM_STREAM_KEY || '';
      
      // Set appearance settings
      const darkModeSelect = this.shadowRoot.getElementById('darkMode');
      darkModeSelect.value = this.settings.DARK_MODE || 'true';
      
      const fontSizeSelect = this.shadowRoot.getElementById('fontSize');
      fontSizeSelect.value = this.settings.FONT_SIZE || 'medium';
      
      // Set advanced settings
      const databaseEngineSelect = this.shadowRoot.getElementById('databaseEngine');
      databaseEngineSelect.value = this.settings.DATABASE_ENGINE || 'better-sqlite3';
      
      const ffmpegPathInput = this.shadowRoot.getElementById('ffmpegPath');
      ffmpegPathInput.value = this.settings.FFMPEG_PATH || '/usr/bin/ffmpeg';
      
      const videoCodecSelect = this.shadowRoot.getElementById('videoCodec');
      videoCodecSelect.value = this.settings.VIDEO_CODEC || 'libx264';
      
      const audioCodecSelect = this.shadowRoot.getElementById('audioCodec');
      audioCodecSelect.value = this.settings.AUDIO_CODEC || 'aac';
      
      const videoBitrateSelect = this.shadowRoot.getElementById('videoBitrate');
      videoBitrateSelect.value = this.settings.VIDEO_BITRATE || '500k';
      
      const audioBitrateSelect = this.shadowRoot.getElementById('audioBitrate');
      audioBitrateSelect.value = this.settings.AUDIO_BITRATE || '128k';
    } catch (error) {
      console.error('Failed to load settings:', error);
      this.showError('Failed to load settings');
    }
  }

  async saveSettings() {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        this.showError('User ID not found. Please log in again.');
        return;
      }
      
      // Collect settings from form
      const settings = {
        // General settings
        LOG_LEVEL: this.shadowRoot.getElementById('logLevel').value,
        DATA_DIR: this.shadowRoot.getElementById('dataDir').value,
        
        // API keys
        OPENAI_API_KEY: this.shadowRoot.getElementById('openaiApiKey').value,
        TWO_CAPTCHA_API_KEY: this.shadowRoot.getElementById('twoCaptchaApiKey').value,
        
        // Platform credentials
        TIKTOK_USERNAME: this.shadowRoot.getElementById('tiktokUsername').value,
        TIKTOK_PASSWORD: this.shadowRoot.getElementById('tiktokPassword').value,
        TIKTOK_STREAM_KEY: this.shadowRoot.getElementById('tiktokStreamKey').value,
        
        YOUTUBE_USERNAME: this.shadowRoot.getElementById('youtubeUsername').value,
        YOUTUBE_PASSWORD: this.shadowRoot.getElementById('youtubePassword').value,
        YOUTUBE_STREAM_KEY: this.shadowRoot.getElementById('youtubeStreamKey').value,
        
        XCOM_USERNAME: this.shadowRoot.getElementById('xcomUsername').value,
        XCOM_PASSWORD: this.shadowRoot.getElementById('xcomPassword').value,
        XCOM_STREAM_KEY: this.shadowRoot.getElementById('xcomStreamKey').value,
        
        // Appearance settings
        DARK_MODE: this.shadowRoot.getElementById('darkMode').value,
        FONT_SIZE: this.shadowRoot.getElementById('fontSize').value,
        
        // Advanced settings
        DATABASE_ENGINE: this.shadowRoot.getElementById('databaseEngine').value,
        FFMPEG_PATH: this.shadowRoot.getElementById('ffmpegPath').value,
        VIDEO_CODEC: this.shadowRoot.getElementById('videoCodec').value,
        AUDIO_CODEC: this.shadowRoot.getElementById('audioCodec').value,
        VIDEO_BITRATE: this.shadowRoot.getElementById('videoBitrate').value,
        AUDIO_BITRATE: this.shadowRoot.getElementById('audioBitrate').value
      };
      
      // Save settings
      const success = await saveUserSettings(userId, settings);
      
      if (success) {
        this.showSuccess('Settings saved successfully');
        
        // Update local settings
        this.settings = { ...this.settings, ...settings };
        
        // Apply dark mode if changed
        if (settings.DARK_MODE === 'true') {
          document.body.classList.add('dark-mode');
        } else if (settings.DARK_MODE === 'false') {
          document.body.classList.remove('dark-mode');
        }
        
        // Close modal after a delay
        setTimeout(() => this.close(), 1500);
      } else {
        this.showError('Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      this.showError(`Failed to save settings: ${error.message}`);
    }
  }

  showSuccess(message) {
    const successMessage = this.shadowRoot.getElementById('successMessage');
    const errorMessage = this.shadowRoot.getElementById('errorMessage');
    
    successMessage.textContent = message;
    successMessage.classList.add('show');
    errorMessage.classList.remove('show');
    
    setTimeout(() => {
      successMessage.classList.remove('show');
    }, 3000);
  }

  showError(message) {
    const successMessage = this.shadowRoot.getElementById('successMessage');
    const errorMessage = this.shadowRoot.getElementById('errorMessage');
    
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    successMessage.classList.remove('show');
  }
}

customElements.define('settings-modal-component', SettingsModalComponent);