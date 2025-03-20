// bots-panel-component.js - Bots panel web component

import { AppEvents } from '../app.js';

class BotsPanelComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.bots = [];
    this.activeSession = null;
  }

  connectedCallback() {
    this.render();
    this.addEventListeners();
    
    // Listen for config loaded event to populate bots
    window.addEventListener(AppEvents.CONFIG_LOADED, this.handleConfigLoaded.bind(this));
    
    // Listen for bot status changes
    window.addEventListener(AppEvents.BOTS_STARTED, this.handleBotsStarted.bind(this));
    window.addEventListener(AppEvents.BOTS_STOPPED, this.handleBotsStopped.bind(this));
    
    // Listen for session events
    this.addEventListener('session-created', this.handleSessionCreated.bind(this));
    this.addEventListener('session-ended', this.handleSessionEnded.bind(this));
  }

  disconnectedCallback() {
    window.removeEventListener(AppEvents.CONFIG_LOADED, this.handleConfigLoaded.bind(this));
    window.removeEventListener(AppEvents.BOTS_STARTED, this.handleBotsStarted.bind(this));
    window.removeEventListener(AppEvents.BOTS_STOPPED, this.handleBotsStopped.bind(this));
    
    this.removeEventListener('session-created', this.handleSessionCreated.bind(this));
    this.removeEventListener('session-ended', this.handleSessionEnded.bind(this));
  }

  handleConfigLoaded(event) {
    const config = event.detail.config;
    this.updateBotsFromConfig(config);
  }

  handleBotsStarted() {
    this.updateBotsStatus(true);
  }

  handleBotsStopped() {
    this.updateBotsStatus(false);
  }

  handleSessionCreated(event) {
    const { sessionId, hostId, hostName, platform } = event.detail;
    
    // Store active session info
    this.activeSession = {
      id: sessionId,
      hostId,
      hostName,
      platform,
      participants: []
    };
    
    // Show session notification
    this.showSessionNotification(hostName, platform);
    
    // Update UI to reflect active session
    this.updateSessionUI();
  }

  handleSessionEnded(event) {
    const { sessionId } = event.detail;
    
    // Clear active session if it matches
    if (this.activeSession && this.activeSession.id === sessionId) {
      this.activeSession = null;
      
      // Update UI to reflect no active session
      this.updateSessionUI();
    }
  }

  showSessionNotification(hostName, platform) {
    const notification = document.createElement('div');
    notification.className = 'session-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <h4>${hostName} started a session on ${platform}</h4>
        <p>Would you like other bots to join this session?</p>
        <div class="notification-actions">
          <button id="joinSessionBtn" class="primary-button">Join with Available Bots</button>
          <button id="dismissNotificationBtn" class="secondary-button">Dismiss</button>
        </div>
      </div>
    `;
    
    // Add notification to shadow DOM
    const container = this.shadowRoot.querySelector('.bots-panel');
    container.appendChild(notification);
    
    // Add event listeners
    const joinBtn = notification.querySelector('#joinSessionBtn');
    const dismissBtn = notification.querySelector('#dismissNotificationBtn');
    
    joinBtn.addEventListener('click', () => {
      this.joinSessionWithAvailableBots();
      container.removeChild(notification);
    });
    
    dismissBtn.addEventListener('click', () => {
      container.removeChild(notification);
    });
    
    // Auto-dismiss after 10 seconds
    setTimeout(() => {
      if (notification.parentNode === container) {
        container.removeChild(notification);
      }
    }, 10000);
  }

  joinSessionWithAvailableBots() {
    if (!this.activeSession) return;
    
    // Find all online bots that aren't the host
    const availableBots = Array.from(this.shadowRoot.querySelectorAll('bot-card-component'))
      .filter(bot => {
        const status = bot.getAttribute('bot-status');
        const id = bot.getAttribute('bot-id');
        return status === 'online' && id !== this.activeSession.hostId;
      });
    
    // Have them join the session
    availableBots.forEach(bot => {
      bot.joinSession(this.activeSession.id, this.activeSession.hostName);
      
      // Add to participants list
      this.activeSession.participants.push({
        id: bot.getAttribute('bot-id'),
        name: bot.getAttribute('bot-name')
      });
    });
  }

  updateSessionUI() {
    const sessionBanner = this.shadowRoot.querySelector('.session-banner');
    
    // Remove existing banner if it exists
    if (sessionBanner) {
      sessionBanner.parentNode.removeChild(sessionBanner);
    }
    
    // If there's an active session, show the banner
    if (this.activeSession) {
      const banner = document.createElement('div');
      banner.className = 'session-banner';
      
      const participantCount = this.activeSession.participants.length;
      
      banner.innerHTML = `
        <div class="session-info">
          <h3>Active Session</h3>
          <p>Host: ${this.activeSession.hostName} on ${this.activeSession.platform}</p>
          <p>Participants: ${participantCount} bot${participantCount !== 1 ? 's' : ''}</p>
        </div>
        <div class="session-actions">
          <button id="notifyAllBtn" class="primary-button">Send Director Command</button>
        </div>
      `;
      
      // Add banner to shadow DOM
      const container = this.shadowRoot.querySelector('.bots-panel');
      container.insertBefore(banner, container.firstChild);
      
      // Add event listener for notify button
      const notifyBtn = banner.querySelector('#notifyAllBtn');
      notifyBtn.addEventListener('click', () => this.openDirectorCommandDialog());
    }
  }

  openDirectorCommandDialog() {
    // Create a dialog for entering director command
    const dialog = document.createElement('div');
    dialog.className = 'director-dialog';
    dialog.innerHTML = `
      <div class="dialog-content">
        <h4>Send Director Command</h4>
        <p>Enter a command to send to all bots in the session:</p>
        <input type="text" id="directorCommandInput" placeholder="e.g., Switch topic to climate change">
        <div class="dialog-actions">
          <button id="sendCommandBtn" class="primary-button">Send</button>
          <button id="cancelCommandBtn" class="secondary-button">Cancel</button>
        </div>
      </div>
    `;
    
    // Add dialog to shadow DOM
    const container = this.shadowRoot.querySelector('.bots-panel');
    container.appendChild(dialog);
    
    // Focus the input
    setTimeout(() => {
      const input = dialog.querySelector('#directorCommandInput');
      input.focus();
    }, 100);
    
    // Add event listeners
    const sendBtn = dialog.querySelector('#sendCommandBtn');
    const cancelBtn = dialog.querySelector('#cancelCommandBtn');
    const input = dialog.querySelector('#directorCommandInput');
    
    sendBtn.addEventListener('click', () => {
      const command = input.value.trim();
      if (command) {
        this.sendDirectorCommand(command);
      }
      container.removeChild(dialog);
    });
    
    cancelBtn.addEventListener('click', () => {
      container.removeChild(dialog);
    });
    
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const command = input.value.trim();
        if (command) {
          this.sendDirectorCommand(command);
        }
        container.removeChild(dialog);
      }
    });
  }

  sendDirectorCommand(command) {
    if (!this.activeSession) return;
    
    // Dispatch a custom event that will be handled by the app
    this.dispatchEvent(new CustomEvent('director-command', {
      bubbles: true,
      composed: true,
      detail: {
        command,
        sessionId: this.activeSession.id
      }
    }));
    
    // Show a notification that the command was sent
    const notification = document.createElement('div');
    notification.className = 'command-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <p>Director command sent: "${command}"</p>
      </div>
    `;
    
    // Add notification to shadow DOM
    const container = this.shadowRoot.querySelector('.bots-panel');
    container.appendChild(notification);
    
    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      if (notification.parentNode === container) {
        container.removeChild(notification);
      }
    }, 3000);
  }

  updateBotsStatus(active) {
    const botCards = this.shadowRoot.querySelectorAll('bot-card-component');
    botCards.forEach(card => {
      card.setActive(active);
    });
  }

  updateBotsFromConfig(config) {
    if (!config || !config.BOT_PERSONALITIES || !config.PLATFORMS) return;
    
    // Create sample bots based on config
    this.bots = config.BOT_PERSONALITIES.map((personality, index) => {
      const platform = config.PLATFORMS[index % config.PLATFORMS.length];
      return {
        id: `bot-${index + 1}`,
        name: `Bot ${index + 1}`,
        persona: personality.persona,
        gender: personality.gender,
        platform: platform.name,
        status: 'offline',
        location: `City ${index + 1}, Country`,
        avatar: `https://picsum.photos/seed/${index + 100}/200`
      };
    });
    
    this.renderBots();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        
        .bots-panel {
          background-color: var(--card-background);
          border-radius: var(--border-radius-md);
          padding: var(--spacing-md);
          box-shadow: 0 2px 4px var(--shadow-color);
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
          position: relative;
        }
        
        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-md);
        }
        
        .panel-header h2 {
          margin: 0;
          font-size: var(--font-size-lg);
          color: var(--text-color);
        }
        
        .bots-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: var(--spacing-md);
          overflow-y: auto;
          flex: 1;
          padding-right: var(--spacing-xs); /* Space for scrollbar */
        }
        
        .bots-list p {
          grid-column: 1 / -1;
          text-align: center;
          color: var(--text-muted);
          margin: var(--spacing-xl) 0;
          font-style: italic;
        }
        
        .bots-list::-webkit-scrollbar {
          width: 8px;
        }
        
        .bots-list::-webkit-scrollbar-track {
          background: var(--background-color);
          border-radius: var(--border-radius-full);
        }
        
        .bots-list::-webkit-scrollbar-thumb {
          background-color: var(--border-color);
          border-radius: var(--border-radius-full);
        }
        
        .bots-list::-webkit-scrollbar-thumb:hover {
          background-color: var(--secondary-color);
        }
        
        .icon-button {
          background-color: transparent;
          color: var(--text-color);
          padding: var(--spacing-xs);
          border: none;
          border-radius: var(--border-radius-sm);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .icon-button:hover {
          background-color: var(--border-color);
        }
        
        .session-banner {
          background-color: var(--primary-color);
          color: white;
          padding: var(--spacing-md);
          border-radius: var(--border-radius-sm);
          margin-bottom: var(--spacing-md);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .session-banner h3 {
          margin: 0;
          font-size: var(--font-size-md);
        }
        
        .session-banner p {
          margin: var(--spacing-xs) 0 0 0;
          font-size: var(--font-size-sm);
          opacity: 0.9;
        }
        
        .session-actions {
          display: flex;
          gap: var(--spacing-sm);
        }
        
        .primary-button {
          background-color: white;
          color: var(--primary-color);
          border: none;
          border-radius: var(--border-radius-sm);
          padding: var(--spacing-xs) var(--spacing-sm);
          font-weight: var(--font-weight-medium);
          cursor: pointer;
        }
        
        .primary-button:hover {
          background-color: rgba(255, 255, 255, 0.9);
        }
        
        .secondary-button {
          background-color: rgba(255, 255, 255, 0.2);
          color: white;
          border: none;
          border-radius: var(--border-radius-sm);
          padding: var(--spacing-xs) var(--spacing-sm);
          font-weight: var(--font-weight-medium);
          cursor: pointer;
        }
        
        .secondary-button:hover {
          background-color: rgba(255, 255, 255, 0.3);
        }
        
        .session-notification {
          position: absolute;
          top: var(--spacing-md);
          right: var(--spacing-md);
          width: 300px;
          background-color: var(--card-background);
          border-radius: var(--border-radius-sm);
          box-shadow: 0 4px 12px var(--shadow-color);
          z-index: 100;
          overflow: hidden;
          animation: slideIn 0.3s ease-out;
        }
        
        .notification-content {
          padding: var(--spacing-md);
        }
        
        .notification-content h4 {
          margin: 0 0 var(--spacing-xs) 0;
          color: var(--text-color);
        }
        
        .notification-content p {
          margin: 0 0 var(--spacing-md) 0;
          color: var(--text-muted);
          font-size: var(--font-size-sm);
        }
        
        .notification-actions {
          display: flex;
          gap: var(--spacing-sm);
        }
        
        .notification-actions .primary-button {
          background-color: var(--primary-color);
          color: white;
        }
        
        .notification-actions .secondary-button {
          background-color: var(--secondary-color);
          color: white;
        }
        
        .command-notification {
          position: absolute;
          bottom: var(--spacing-md);
          right: var(--spacing-md);
          background-color: var(--success-color);
          color: white;
          padding: var(--spacing-sm) var(--spacing-md);
          border-radius: var(--border-radius-sm);
          box-shadow: 0 2px 8px var(--shadow-color);
          animation: fadeIn 0.3s ease-out;
        }
        
        .director-dialog {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        
        .dialog-content {
          background-color: var(--card-background);
          border-radius: var(--border-radius-md);
          padding: var(--spacing-md);
          width: 90%;
          max-width: 500px;
          box-shadow: 0 4px 12px var(--shadow-color);
        }
        
        .dialog-content h4 {
          margin: 0 0 var(--spacing-sm) 0;
          color: var(--text-color);
        }
        
        .dialog-content p {
          margin: 0 0 var(--spacing-md) 0;
          color: var(--text-muted);
        }
        
        .dialog-content input {
          width: 100%;
          padding: var(--spacing-sm);
          border-radius: var(--border-radius-sm);
          border: 1px solid var(--border-color);
          margin-bottom: var(--spacing-md);
          font-size: var(--font-size-md);
        }
        
        .dialog-actions {
          display: flex;
          justify-content: flex-end;
          gap: var(--spacing-sm);
        }
        
        .dialog-actions .primary-button {
          background-color: var(--primary-color);
          color: white;
        }
        
        .dialog-actions .secondary-button {
          background-color: var(--secondary-color);
          color: white;
        }
        
        /* Animations */
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Empty state */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: var(--text-muted);
          text-align: center;
          padding: var(--spacing-xl);
        }
        
        .empty-state svg {
          width: 64px;
          height: 64px;
          margin-bottom: var(--spacing-md);
          opacity: 0.5;
        }
        
        .empty-state p {
          margin-bottom: var(--spacing-md);
        }
        
        /* Responsive adjustments */
        @media (max-width: 992px) {
          .bots-list {
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          }
        }
        
        @media (max-width: 768px) {
          .bots-panel {
            padding: var(--spacing-sm);
          }
          
          .panel-header {
            margin-bottom: var(--spacing-sm);
          }
          
          .bots-list {
            gap: var(--spacing-sm);
          }
          
          .session-banner {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .session-actions {
            margin-top: var(--spacing-sm);
          }
          
          .session-notification {
            width: calc(100% - var(--spacing-md) * 2);
            right: 0;
            left: 0;
            margin: 0 var(--spacing-md);
          }
        }
        
        @media (max-width: 480px) {
          .bots-list {
            grid-template-columns: 1fr;
          }
        }
      </style>
      
      <div class="bots-panel">
        <div class="panel-header">
          <h2>Active Bots</h2>
          <button id="addBotBtn" class="icon-button" title="Add Bot">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>
        <div id="botsList" class="bots-list"></div>
      </div>
    `;
  }

  renderBots() {
    const botsList = this.shadowRoot.getElementById('botsList');
    if (!botsList) return;
    
    botsList.innerHTML = '';
    
    if (this.bots.length === 0) {
      const emptyMessage = document.createElement('p');
      emptyMessage.textContent = 'No bots configured. Click the + button to add a bot.';
      emptyMessage.style.gridColumn = '1 / -1';
      emptyMessage.style.textAlign = 'center';
      emptyMessage.style.color = 'var(--text-muted, #6c757d)';
      botsList.appendChild(emptyMessage);
      return;
    }
    
    this.bots.forEach(bot => {
      const botCard = document.createElement('bot-card-component');
      botCard.setAttribute('bot-id', bot.id);
      botCard.setAttribute('bot-name', bot.name);
      botCard.setAttribute('bot-persona', bot.persona);
      botCard.setAttribute('bot-platform', bot.platform);
      botCard.setAttribute('bot-gender', bot.gender);
      botCard.setAttribute('bot-status', bot.status);
      
      if (bot.location) {
        botCard.setAttribute('bot-location', bot.location);
      }
      
      if (bot.avatar) {
        botCard.setAttribute('bot-avatar', bot.avatar);
      }
      
      botsList.appendChild(botCard);
    });
  }

  addEventListeners() {
    const addBotBtn = this.shadowRoot.getElementById('addBotBtn');
    addBotBtn.addEventListener('click', () => {
      const addBotModal = document.querySelector('add-bot-modal-component');
      if (addBotModal) {
        addBotModal.open();
      }
    });
  }

  // Public method to add a new bot
  addBot(botData) {
    this.bots.push(botData);
    this.renderBots();
  }
}

customElements.define('bots-panel-component', BotsPanelComponent);