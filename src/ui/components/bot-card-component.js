// bot-card-component.js - Bot card web component

import { addLogEntry } from '../app.js';

class BotCardComponent extends HTMLElement {
  static get observedAttributes() {
    return [
      'bot-id', 
      'bot-name', 
      'bot-persona', 
      'bot-platform', 
      'bot-gender',
      'bot-avatar',
      'bot-location',
      'bot-status'
    ];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.active = false;
    this.isHost = false;
    this.sessionId = null;
  }

  connectedCallback() {
    this.render();
    this.addEventListeners();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (this.shadowRoot.innerHTML !== '') {
      this.render();
    }
  }

  get botId() {
    return this.getAttribute('bot-id');
  }

  get botName() {
    return this.getAttribute('bot-name');
  }

  get botPersona() {
    return this.getAttribute('bot-persona');
  }

  get botPlatform() {
    return this.getAttribute('bot-platform');
  }

  get botGender() {
    return this.getAttribute('bot-gender');
  }

  get botAvatar() {
    return this.getAttribute('bot-avatar');
  }

  get botLocation() {
    return this.getAttribute('bot-location') || 'Unknown Location';
  }

  get botStatus() {
    return this.getAttribute('bot-status') || 'offline';
  }

  setActive(active) {
    this.active = active;
    this.updateStatus();
  }

  setStatus(status) {
    this.setAttribute('bot-status', status);
    this.updateStatus();
  }

  setSessionHost(sessionId) {
    this.isHost = true;
    this.sessionId = sessionId;
    this.setStatus('hosting');
    this.updateActions();
  }

  setSessionParticipant(sessionId) {
    this.isHost = false;
    this.sessionId = sessionId;
    this.setStatus('joined');
    this.updateActions();
  }

  leaveSession() {
    this.isHost = false;
    this.sessionId = null;
    this.setStatus('online');
    this.updateActions();
  }

  updateStatus() {
    const statusIndicator = this.shadowRoot.querySelector('.status-indicator');
    const statusText = this.shadowRoot.querySelector('.status-text');
    const startBtn = this.shadowRoot.querySelector('.bot-action-start');
    const stopBtn = this.shadowRoot.querySelector('.bot-action-stop');
    
    if (!statusIndicator || !statusText || !startBtn || !stopBtn) return;
    
    // Update status indicator and text based on bot status
    statusIndicator.className = 'status-indicator';
    
    switch (this.botStatus) {
      case 'online':
        statusIndicator.classList.add('status-online');
        statusText.textContent = 'Online';
        startBtn.disabled = true;
        stopBtn.disabled = false;
        break;
      case 'offline':
        statusIndicator.classList.add('status-offline');
        statusText.textContent = 'Offline';
        startBtn.disabled = false;
        stopBtn.disabled = true;
        break;
      case 'hosting':
        statusIndicator.classList.add('status-hosting');
        statusText.textContent = 'Hosting';
        startBtn.disabled = true;
        stopBtn.disabled = false;
        break;
      case 'joined':
        statusIndicator.classList.add('status-joined');
        statusText.textContent = 'In Session';
        startBtn.disabled = true;
        stopBtn.disabled = false;
        break;
      default:
        statusIndicator.classList.add('status-offline');
        statusText.textContent = this.botStatus;
        startBtn.disabled = false;
        stopBtn.disabled = true;
    }
    
    this.updateActions();
  }

  updateActions() {
    const actionsContainer = this.shadowRoot.querySelector('.bot-actions');
    if (!actionsContainer) return;
    
    // Clear existing action buttons
    actionsContainer.innerHTML = '';
    
    // Add appropriate action buttons based on status
    if (this.botStatus === 'offline') {
      // Offline bot can be started
      const startBtn = document.createElement('button');
      startBtn.className = 'secondary-button bot-action-start';
      startBtn.textContent = 'Start';
      startBtn.addEventListener('click', () => this.startBot());
      actionsContainer.appendChild(startBtn);
      
      const stopBtn = document.createElement('button');
      stopBtn.className = 'secondary-button bot-action-stop';
      stopBtn.textContent = 'Stop';
      stopBtn.disabled = true;
      actionsContainer.appendChild(stopBtn);
    } 
    else if (this.botStatus === 'online') {
      // Online bot can host a session or be stopped
      const hostBtn = document.createElement('button');
      hostBtn.className = 'primary-button bot-action-host';
      hostBtn.textContent = 'Host Session';
      hostBtn.addEventListener('click', () => this.hostSession());
      actionsContainer.appendChild(hostBtn);
      
      const stopBtn = document.createElement('button');
      stopBtn.className = 'secondary-button bot-action-stop';
      stopBtn.textContent = 'Stop';
      stopBtn.addEventListener('click', () => this.stopBot());
      actionsContainer.appendChild(stopBtn);
    }
    else if (this.botStatus === 'hosting') {
      // Hosting bot can end session
      const endSessionBtn = document.createElement('button');
      endSessionBtn.className = 'danger-button bot-action-end-session';
      endSessionBtn.textContent = 'End Session';
      endSessionBtn.addEventListener('click', () => this.endSession());
      actionsContainer.appendChild(endSessionBtn);
      
      // Show session ID
      const sessionIdSpan = document.createElement('span');
      sessionIdSpan.className = 'session-id';
      sessionIdSpan.textContent = `ID: ${this.sessionId.substring(0, 6)}`;
      actionsContainer.appendChild(sessionIdSpan);
    }
    else if (this.botStatus === 'joined') {
      // Joined bot can leave session
      const leaveBtn = document.createElement('button');
      leaveBtn.className = 'warning-button bot-action-leave';
      leaveBtn.textContent = 'Leave Session';
      leaveBtn.addEventListener('click', () => this.leaveSession());
      actionsContainer.appendChild(leaveBtn);
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        
        .bot-card {
          background-color: var(--card-background, #ffffff);
          border: 1px solid var(--border-color, #dee2e6);
          border-radius: var(--border-radius-md);
          padding: var(--spacing-md);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
          transition: transform var(--transition-normal), box-shadow var(--transition-normal);
        }
        
        .bot-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px var(--shadow-color);
        }
        
        .bot-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .bot-header h3 {
          margin: 0;
          color: var(--text-color, #212529);
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-semibold);
        }
        
        .bot-status {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          font-size: var(--font-size-xs);
          color: var(--text-muted, #6c757d);
        }
        
        .status-indicator {
          width: 10px;
          height: 10px;
          border-radius: var(--border-radius-full);
          transition: background-color var(--transition-normal);
        }
        
        .status-online {
          background-color: var(--success-color, #28a745);
        }
        
        .status-offline {
          background-color: var(--danger-color, #dc3545);
        }
        
        .status-hosting {
          background-color: var(--primary-color, #4a6cf7);
        }
        
        .status-joined {
          background-color: var(--warning-color, #ffc107);
        }
        
        .bot-content {
          display: flex;
          gap: var(--spacing-md);
        }
        
        .bot-avatar {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background-color: var(--border-color, #dee2e6);
          background-size: cover;
          background-position: center;
          flex-shrink: 0;
        }
        
        .bot-details {
          font-size: var(--font-size-sm);
          color: var(--text-color, #212529);
          flex-grow: 1;
        }
        
        .bot-details p {
          margin: 0 0 var(--spacing-xs) 0;
          display: flex;
          justify-content: space-between;
        }
        
        .bot-details strong {
          font-weight: var(--font-weight-medium);
          color: var(--text-muted, #6c757d);
        }
        
        .bot-actions {
          display: flex;
          justify-content: flex-end;
          gap: var(--spacing-sm);
          margin-top: var(--spacing-sm);
          align-items: center;
        }
        
        .bot-actions button {
          padding: var(--spacing-xs) var(--spacing-sm);
          font-size: var(--font-size-xs);
        }
        
        .bot-actions button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .primary-button {
          background-color: var(--primary-color, #4a6cf7);
          color: white;
        }
        
        .primary-button:hover:not(:disabled) {
          filter: brightness(1.1);
        }
        
        .secondary-button {
          background-color: var(--secondary-color, #6c757d);
          color: white;
        }
        
        .secondary-button:hover:not(:disabled) {
          filter: brightness(1.1);
        }
        
        .danger-button {
          background-color: var(--danger-color, #dc3545);
          color: white;
        }
        
        .danger-button:hover:not(:disabled) {
          filter: brightness(1.1);
        }
        
        .warning-button {
          background-color: var(--warning-color, #ffc107);
          color: black;
        }
        
        .warning-button:hover:not(:disabled) {
          filter: brightness(1.1);
        }
        
        .session-id {
          font-size: var(--font-size-xs);
          color: var(--text-muted, #6c757d);
          background-color: var(--background-color, #f8f9fa);
          padding: var(--spacing-xs) var(--spacing-sm);
          border-radius: var(--border-radius-sm);
        }
        
        /* Bot card animations */
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(40, 167, 69, 0.4);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(40, 167, 69, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(40, 167, 69, 0);
          }
        }
        
        .status-hosting {
          animation: pulse 2s infinite;
        }
        
        /* Bot card variations */
        .bot-card.youtube {
          border-left: 3px solid #ff0000;
        }
        
        .bot-card.tiktok {
          border-left: 3px solid #000000;
        }
        
        .bot-card.xcom {
          border-left: 3px solid #1da1f2;
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .bot-card {
            padding: var(--spacing-sm);
          }
          
          .bot-content {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }
          
          .bot-avatar {
            margin-bottom: var(--spacing-sm);
          }
          
          .bot-details p {
            flex-direction: column;
            gap: var(--spacing-xs);
          }
        }
      </style>
      
      <div class="bot-card ${this.botPlatform.toLowerCase()}">
        <div class="bot-header">
          <h3>${this.botName}</h3>
          <div class="bot-status">
            <div class="status-indicator status-${this.botStatus}"></div>
            <span class="status-text">${this.botStatus.charAt(0).toUpperCase() + this.botStatus.slice(1)}</span>
          </div>
        </div>
        <div class="bot-content">
          <div class="bot-avatar" style="${this.botAvatar ? `background-image: url(${this.botAvatar})` : ''}"></div>
          <div class="bot-details">
            <p><strong>Persona:</strong> ${this.botPersona}</p>
            <p><strong>Platform:</strong> ${this.botPlatform}</p>
            <p><strong>Location:</strong> ${this.botLocation}</p>
          </div>
        </div>
        <div class="bot-actions">
          <!-- Action buttons will be added dynamically -->
        </div>
      </div>
    `;
    
    this.updateStatus();
  }

  addEventListeners() {
    // Event listeners are added dynamically in updateActions()
  }

  startBot() {
    // In a real app, this would start the specific bot
    addLogEntry(`Starting bot ${this.botName}...`, 'info');
    
    // Simulate starting the bot
    setTimeout(() => {
      this.setStatus('online');
      addLogEntry(`Bot ${this.botName} is now online`, 'success');
    }, 1000);
  }
  
  stopBot() {
    // In a real app, this would stop the specific bot
    addLogEntry(`Stopping bot ${this.botName}...`, 'info');
    
    // Simulate stopping the bot
    setTimeout(() => {
      this.setStatus('offline');
      addLogEntry(`Bot ${this.botName} is now offline`, 'info');
    }, 1000);
  }
  
  hostSession() {
    // In a real app, this would start a live session on the platform
    addLogEntry(`${this.botName} is starting a live session on ${this.botPlatform}...`, 'info');
    
    // Simulate starting a session
    setTimeout(() => {
      const sessionId = `session-${Date.now()}`;
      this.setSessionHost(sessionId);
      
      // Notify other bots that a session is available to join
      this.dispatchEvent(new CustomEvent('session-created', {
        bubbles: true,
        composed: true,
        detail: {
          sessionId,
          hostId: this.botId,
          hostName: this.botName,
          platform: this.botPlatform
        }
      }));
      
      addLogEntry(`${this.botName} is now hosting a live session`, 'success');
    }, 2000);
  }
  
  joinSession(sessionId, hostName) {
    // In a real app, this would join the bot to an existing session
    addLogEntry(`${this.botName} is joining ${hostName}'s session...`, 'info');
    
    // Simulate joining a session
    setTimeout(() => {
      this.setSessionParticipant(sessionId);
      addLogEntry(`${this.botName} has joined the session`, 'success');
    }, 1500);
  }
  
  endSession() {
    // In a real app, this would end the hosted session
    addLogEntry(`${this.botName} is ending the live session...`, 'info');
    
    // Simulate ending a session
    setTimeout(() => {
      // Notify other bots that the session has ended
      this.dispatchEvent(new CustomEvent('session-ended', {
        bubbles: true,
        composed: true,
        detail: {
          sessionId: this.sessionId,
          hostId: this.botId
        }
      }));
      
      this.leaveSession();
      addLogEntry(`${this.botName} has ended the live session`, 'info');
    }, 1500);
  }
}

customElements.define('bot-card-component', BotCardComponent);