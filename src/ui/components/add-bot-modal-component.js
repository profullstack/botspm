// add-bot-modal-component.js - Add bot modal web component

import { getConfig, createBot, addLogEntry, AppEvents } from '../app.js';

class AddBotModalComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.isOpen = false;
    this.config = null;
    this.avatarUrl = null;
  }

  connectedCallback() {
    this.render();
    this.addEventListeners();
    
    // Listen for config loaded event
    window.addEventListener(AppEvents.CONFIG_LOADED, this.handleConfigLoaded.bind(this));
  }

  disconnectedCallback() {
    window.removeEventListener(AppEvents.CONFIG_LOADED, this.handleConfigLoaded.bind(this));
  }

  handleConfigLoaded(event) {
    this.config = event.detail.config;
    this.updateDropdowns();
  }

  open() {
    this.isOpen = true;
    this.config = getConfig();
    this.updateDropdowns();
    this.clearForm();
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

  clearForm() {
    const botName = this.shadowRoot.getElementById('botName');
    const botGender = this.shadowRoot.getElementById('botGender');
    const botEmail = this.shadowRoot.getElementById('botEmail');
    const botLocation = this.shadowRoot.getElementById('botLocation');
    const botAge = this.shadowRoot.getElementById('botAge');
    const botBio = this.shadowRoot.getElementById('botBio');
    
    if (botName) botName.value = '';
    if (botGender) botGender.value = 'M';
    if (botEmail) botEmail.value = '';
    if (botLocation) botLocation.value = '';
    if (botAge) botAge.value = '25';
    if (botBio) botBio.value = '';
    
    // Reset avatar
    this.avatarUrl = null;
    const avatarPreview = this.shadowRoot.getElementById('avatarPreview');
    if (avatarPreview) {
      avatarPreview.style.backgroundImage = 'none';
      avatarPreview.textContent = 'No Avatar';
    }
  }

  updateDropdowns() {
    if (!this.config) return;
    
    const botPersona = this.shadowRoot.getElementById('botPersona');
    const botPlatform = this.shadowRoot.getElementById('botPlatform');
    
    if (!botPersona || !botPlatform) return;
    
    // Clear existing options
    botPersona.innerHTML = '';
    botPlatform.innerHTML = '';
    
    // Add personality options
    if (this.config.BOT_PERSONALITIES && this.config.BOT_PERSONALITIES.length > 0) {
      this.config.BOT_PERSONALITIES.forEach((personality, index) => {
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
    if (this.config.PLATFORMS && this.config.PLATFORMS.length > 0) {
      this.config.PLATFORMS.forEach((platform, index) => {
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
          max-width: 600px;
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
        
        h2 {
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
        
        .form-group {
          margin-bottom: 1rem;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          color: var(--text-color, #212529);
        }
        
        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 0.5rem;
          border-radius: 0.25rem;
          border: 1px solid var(--input-border, #ced4da);
          background-color: var(--input-bg, #ffffff);
          color: var(--text-color, #212529);
        }
        
        .form-group textarea {
          min-height: 80px;
          resize: vertical;
        }
        
        .form-row {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        
        .form-col {
          flex: 1;
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
        
        .avatar-section {
          display: flex;
          gap: 1rem;
          align-items: center;
          margin-bottom: 1rem;
        }
        
        .avatar-preview {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background-color: var(--border-color, #dee2e6);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted, #6c757d);
          font-size: 0.8rem;
          background-size: cover;
          background-position: center;
        }
        
        .avatar-actions {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .tabs {
          display: flex;
          border-bottom: 1px solid var(--border-color, #dee2e6);
          margin-bottom: 1rem;
        }
        
        .tab {
          padding: 0.5rem 1rem;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          color: var(--text-muted, #6c757d);
        }
        
        .tab.active {
          border-bottom-color: var(--primary-color, #4a6cf7);
          color: var(--text-color, #212529);
          font-weight: 500;
        }
        
        .tab-content {
          display: none;
        }
        
        .tab-content.active {
          display: block;
        }
        
        .platform-auth {
          padding: 1rem;
          background-color: var(--background-color, #f8f9fa);
          border-radius: 0.5rem;
          margin-top: 1rem;
        }
        
        .platform-auth-title {
          font-weight: 500;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .platform-auth-status {
          font-size: 0.8rem;
          padding: 0.25rem 0.5rem;
          border-radius: 1rem;
          background-color: var(--danger-color, #dc3545);
          color: white;
        }
        
        .platform-auth-status.authenticated {
          background-color: var(--success-color, #28a745);
        }
      </style>
      
      <div class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Add New Bot</h2>
            <button id="closeAddBotBtn" class="close-button">&times;</button>
          </div>
          <div class="modal-body">
            <div class="tabs">
              <div class="tab active" data-tab="profile">Profile</div>
              <div class="tab" data-tab="platform">Platform</div>
              <div class="tab" data-tab="appearance">Appearance</div>
            </div>
            
            <div class="tab-content active" data-tab="profile">
              <div class="form-row">
                <div class="form-col">
                  <div class="form-group">
                    <label for="botName">Bot Name</label>
                    <input type="text" id="botName" placeholder="Enter bot name">
                  </div>
                </div>
                <div class="form-col">
                  <div class="form-group">
                    <label for="botGender">Gender</label>
                    <select id="botGender">
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                      <option value="NB">Non-Binary</option>
                      <option value="random">Random</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div class="form-row">
                <div class="form-col">
                  <div class="form-group">
                    <label for="botAge">Age</label>
                    <input type="number" id="botAge" min="18" max="80" value="25">
                  </div>
                </div>
                <div class="form-col">
                  <div class="form-group">
                    <label for="botLocation">Location</label>
                    <input type="text" id="botLocation" placeholder="City, Country">
                  </div>
                </div>
              </div>
              
              <div class="form-group">
                <label for="botEmail">Email</label>
                <input type="email" id="botEmail" placeholder="email@example.com">
              </div>
              
              <div class="form-group">
                <label for="botPersona">Persona</label>
                <select id="botPersona"></select>
              </div>
              
              <div class="form-group">
                <label for="botBio">Bio</label>
                <textarea id="botBio" placeholder="Enter a short bio for this bot..."></textarea>
              </div>
            </div>
            
            <div class="tab-content" data-tab="platform">
              <div class="form-group">
                <label for="botPlatform">Platform</label>
                <select id="botPlatform"></select>
              </div>
              
              <div id="platformAuthSection" class="platform-auth">
                <div class="platform-auth-title">
                  Platform Authentication
                  <span class="platform-auth-status" id="authStatus">Not Authenticated</span>
                </div>
                <p>You'll need to authenticate this bot with the selected platform.</p>
                <button id="authenticateBtn" class="primary-button">Authenticate with Platform</button>
              </div>
            </div>
            
            <div class="tab-content" data-tab="appearance">
              <div class="avatar-section">
                <div id="avatarPreview" class="avatar-preview">No Avatar</div>
                <div class="avatar-actions">
                  <button id="generateAvatarBtn" class="secondary-button">Generate AI Avatar</button>
                  <button id="uploadAvatarBtn" class="secondary-button">Upload Image</button>
                </div>
              </div>
              
              <div class="form-group">
                <label for="avatarPrompt">Avatar Generation Prompt</label>
                <input type="text" id="avatarPrompt" placeholder="E.g., Professional headshot, smiling, business attire">
              </div>
              
              <button id="generateBackgroundBtn" class="secondary-button">Generate Stream Background</button>
              <p class="mt-sm text-sm text-muted">A unique streaming background will be generated for this bot.</p>
            </div>
          </div>
          <div class="modal-footer">
            <button id="createBotBtn" class="primary-button">Create Bot</button>
            <button id="cancelAddBotBtn" class="secondary-button">Cancel</button>
          </div>
        </div>
      </div>
    `;
  }

  addEventListeners() {
    const closeAddBotBtn = this.shadowRoot.getElementById('closeAddBotBtn');
    const createBotBtn = this.shadowRoot.getElementById('createBotBtn');
    const cancelAddBotBtn = this.shadowRoot.getElementById('cancelAddBotBtn');
    const generateAvatarBtn = this.shadowRoot.getElementById('generateAvatarBtn');
    const uploadAvatarBtn = this.shadowRoot.getElementById('uploadAvatarBtn');
    const generateBackgroundBtn = this.shadowRoot.getElementById('generateBackgroundBtn');
    const authenticateBtn = this.shadowRoot.getElementById('authenticateBtn');
    const tabs = this.shadowRoot.querySelectorAll('.tab');
    
    closeAddBotBtn.addEventListener('click', () => this.close());
    cancelAddBotBtn.addEventListener('click', () => this.close());
    createBotBtn.addEventListener('click', () => this.createBot());
    
    generateAvatarBtn.addEventListener('click', () => this.generateAvatar());
    uploadAvatarBtn.addEventListener('click', () => this.uploadAvatar());
    generateBackgroundBtn.addEventListener('click', () => this.generateBackground());
    authenticateBtn.addEventListener('click', () => this.authenticateWithPlatform());
    
    // Tab switching
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabName = e.currentTarget.getAttribute('data-tab');
        this.switchTab(tabName);
      });
    });
    
    // Platform change
    const botPlatform = this.shadowRoot.getElementById('botPlatform');
    botPlatform.addEventListener('change', () => this.updatePlatformAuth());
  }

  switchTab(tabName) {
    // Update tab active state
    const tabs = this.shadowRoot.querySelectorAll('.tab');
    tabs.forEach(tab => {
      if (tab.getAttribute('data-tab') === tabName) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
    
    // Update content visibility
    const contents = this.shadowRoot.querySelectorAll('.tab-content');
    contents.forEach(content => {
      if (content.getAttribute('data-tab') === tabName) {
        content.classList.add('active');
      } else {
        content.classList.remove('active');
      }
    });
  }

  updatePlatformAuth() {
    const botPlatform = this.shadowRoot.getElementById('botPlatform');
    const authStatus = this.shadowRoot.getElementById('authStatus');
    const platformAuthSection = this.shadowRoot.getElementById('platformAuthSection');
    
    if (!botPlatform || !authStatus || !platformAuthSection) return;
    
    const platformIndex = parseInt(botPlatform.value);
    if (isNaN(platformIndex) || !this.config || !this.config.PLATFORMS || platformIndex >= this.config.PLATFORMS.length) {
      platformAuthSection.style.display = 'none';
      return;
    }
    
    const platform = this.config.PLATFORMS[platformIndex];
    platformAuthSection.style.display = 'block';
    
    // In a real app, you would check if the user is already authenticated with this platform
    // For now, we'll just simulate that they're not authenticated
    authStatus.textContent = 'Not Authenticated';
    authStatus.classList.remove('authenticated');
  }

  async generateAvatar() {
    const avatarPrompt = this.shadowRoot.getElementById('avatarPrompt');
    const avatarPreview = this.shadowRoot.getElementById('avatarPreview');
    
    if (!avatarPrompt || !avatarPreview) return;
    
    const prompt = avatarPrompt.value.trim() || 'Professional headshot, smiling, business attire';
    
    // In a real app, this would call an AI image generation API
    // For now, we'll just simulate it with a placeholder
    addLogEntry('Generating avatar with AI...', 'info');
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Use a placeholder image
    this.avatarUrl = `https://picsum.photos/seed/${Date.now()}/200`;
    avatarPreview.style.backgroundImage = `url(${this.avatarUrl})`;
    avatarPreview.textContent = '';
    
    addLogEntry('Avatar generated successfully', 'info');
  }

  uploadAvatar() {
    // In a real app, this would open a file picker
    // For now, we'll just simulate it
    addLogEntry('File picker would open here', 'info');
    
    // Simulate a successful upload
    const avatarPreview = this.shadowRoot.getElementById('avatarPreview');
    if (avatarPreview) {
      this.avatarUrl = `https://picsum.photos/seed/${Date.now() + 100}/200`;
      avatarPreview.style.backgroundImage = `url(${this.avatarUrl})`;
      avatarPreview.textContent = '';
    }
  }

  async generateBackground() {
    // In a real app, this would call an AI image generation API
    // For now, we'll just simulate it
    addLogEntry('Generating stream background with AI...', 'info');
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    addLogEntry('Stream background generated successfully', 'success');
  }

  async authenticateWithPlatform() {
    const botPlatform = this.shadowRoot.getElementById('botPlatform');
    const authStatus = this.shadowRoot.getElementById('authStatus');
    
    if (!botPlatform || !authStatus) return;
    
    const platformIndex = parseInt(botPlatform.value);
    if (isNaN(platformIndex) || !this.config || !this.config.PLATFORMS || platformIndex >= this.config.PLATFORMS.length) {
      return;
    }
    
    const platform = this.config.PLATFORMS[platformIndex];
    
    // In a real app, this would open a browser window for OAuth or use Puppeteer
    // For now, we'll just simulate it
    addLogEntry(`Authenticating with ${platform.name}...`, 'info');
    
    // Simulate authentication process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Update UI to show authenticated
    authStatus.textContent = 'Authenticated';
    authStatus.classList.add('authenticated');
    
    addLogEntry(`Successfully authenticated with ${platform.name}`, 'success');
  }

  createBot() {
    if (!this.config) return;
    
    // Get all form values
    const botName = this.shadowRoot.getElementById('botName');
    const botPersona = this.shadowRoot.getElementById('botPersona');
    const botPlatform = this.shadowRoot.getElementById('botPlatform');
    const botGender = this.shadowRoot.getElementById('botGender');
    const botEmail = this.shadowRoot.getElementById('botEmail');
    const botLocation = this.shadowRoot.getElementById('botLocation');
    const botAge = this.shadowRoot.getElementById('botAge');
    const botBio = this.shadowRoot.getElementById('botBio');
    const authStatus = this.shadowRoot.getElementById('authStatus');
    
    // Validate required fields
    const name = botName.value.trim();
    if (!name) {
      addLogEntry('Bot name is required', 'error');
      this.switchTab('profile');
      return;
    }
    
    const personaIndex = parseInt(botPersona.value);
    if (isNaN(personaIndex) || personaIndex < 0 || personaIndex >= this.config.BOT_PERSONALITIES.length) {
      addLogEntry('Invalid persona selected', 'error');
      this.switchTab('profile');
      return;
    }
    
    const platformIndex = parseInt(botPlatform.value);
    if (isNaN(platformIndex) || platformIndex < 0 || platformIndex >= this.config.PLATFORMS.length) {
      addLogEntry('Invalid platform selected', 'error');
      this.switchTab('platform');
      return;
    }
    
    // Check if authenticated with platform
    if (!authStatus.classList.contains('authenticated')) {
      addLogEntry('You must authenticate with the platform first', 'error');
      this.switchTab('platform');
      return;
    }
    
    // Create bot data object
    const botData = {
      id: `bot-${Date.now()}`,
      name,
      persona: this.config.BOT_PERSONALITIES[personaIndex].persona,
      gender: botGender.value,
      platform: this.config.PLATFORMS[platformIndex].name,
      email: botEmail.value.trim(),
      location: botLocation.value.trim(),
      age: parseInt(botAge.value) || 25,
      bio: botBio.value.trim(),
      avatarUrl: this.avatarUrl,
      createdAt: new Date().toISOString(),
      status: 'offline' // initial status
    };
    
    // Create the bot
    const success = createBot(botData);
    
    if (success) {
      // Add the bot to the bots panel
      const botsPanel = document.querySelector('bots-panel-component');
      if (botsPanel) {
        botsPanel.addBot(botData);
      }
      
      this.close();
    }
  }
}

customElements.define('add-bot-modal-component', AddBotModalComponent);