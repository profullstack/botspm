// bot-personality-component.js - Component for configuring bot personalities

import { createBot, updateBotPersonality } from '../app.js';

class BotPersonalityComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.bot = null;
  }

  connectedCallback() {
    this.render();
    this.addEventListeners();
  }

  set botData(data) {
    this.bot = data;
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          font-family: Arial, sans-serif;
        }
        
        .personality-container {
          background-color: var(--card-background, #ffffff);
          border-radius: var(--border-radius-md, 0.5rem);
          box-shadow: 0 2px 4px var(--shadow-color, rgba(0, 0, 0, 0.1));
          padding: 1.5rem;
          margin-bottom: 1rem;
        }
        
        .personality-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        
        .personality-header h3 {
          margin: 0;
          color: var(--text-color, #333);
          font-size: 1.2rem;
        }
        
        .form-group {
          margin-bottom: 1rem;
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
        
        .form-group select {
          appearance: none;
          background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23333' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 0.75rem center;
          background-size: 16px;
          padding-right: 2.5rem;
        }
        
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          margin-top: 1.5rem;
        }
        
        .btn {
          padding: 0.75rem 1.25rem;
          border: none;
          border-radius: var(--border-radius-sm, 0.25rem);
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s, transform 0.1s;
        }
        
        .btn:active {
          transform: translateY(1px);
        }
        
        .btn-primary {
          background-color: var(--primary-color, #4a6cf7);
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
      </style>
      
      <div class="personality-container">
        <div class="personality-header">
          <h3>${this.bot ? `Edit ${this.bot.name}'s Personality` : 'Create New Bot'}</h3>
        </div>
        
        <div id="successMessage" class="success-message"></div>
        <div id="errorMessage" class="error-message"></div>
        
        <div class="form-group">
          <label for="botName">Bot Name</label>
          <input type="text" id="botName" value="${this.bot ? this.bot.name : ''}" ${this.bot ? 'readonly' : ''} placeholder="Enter bot name">
        </div>
        
        <div class="form-group">
          <label for="platform">Platform</label>
          <select id="platform" ${this.bot ? 'disabled' : ''}>
            <option value="tiktok" ${this.bot && this.bot.platform === 'tiktok' ? 'selected' : ''}>TikTok</option>
            <option value="youtube" ${this.bot && this.bot.platform === 'youtube' ? 'selected' : ''}>YouTube</option>
            <option value="xcom" ${this.bot && this.bot.platform === 'xcom' ? 'selected' : ''}>X.com</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="persona">Persona</label>
          <textarea id="persona" placeholder="Describe the bot's persona in detail">${this.bot && this.bot.persona ? this.bot.persona : ''}</textarea>
        </div>
        
        <div class="form-group">
          <label for="gender">Voice Gender</label>
          <select id="gender">
            <option value="M" ${this.bot && this.bot.gender === 'M' ? 'selected' : ''}>Male</option>
            <option value="F" ${this.bot && this.bot.gender === 'F' ? 'selected' : ''}>Female</option>
            <option value="random" ${this.bot && this.bot.gender === 'random' ? 'selected' : ''}>Random</option>
          </select>
        </div>
        
        <div class="form-actions">
          ${this.bot ? `
            <button id="updateBtn" class="btn btn-primary">Update Personality</button>
          ` : `
            <button id="createBtn" class="btn btn-primary">Create Bot</button>
          `}
          <button id="cancelBtn" class="btn btn-secondary">Cancel</button>
        </div>
      </div>
    `;
  }

  addEventListeners() {
    const createBtn = this.shadowRoot.getElementById('createBtn');
    const updateBtn = this.shadowRoot.getElementById('updateBtn');
    const cancelBtn = this.shadowRoot.getElementById('cancelBtn');
    
    if (createBtn) {
      createBtn.addEventListener('click', () => this.createNewBot());
    }
    
    if (updateBtn) {
      updateBtn.addEventListener('click', () => this.updateBot());
    }
    
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.cancel());
    }
  }

  async createNewBot() {
    const botName = this.shadowRoot.getElementById('botName').value.trim();
    const platform = this.shadowRoot.getElementById('platform').value;
    const persona = this.shadowRoot.getElementById('persona').value.trim();
    const gender = this.shadowRoot.getElementById('gender').value;
    
    if (!botName) {
      this.showError('Bot name is required');
      return;
    }
    
    if (!persona) {
      this.showError('Persona description is required');
      return;
    }
    
    try {
      const botData = {
        name: botName,
        platform,
        persona,
        gender,
        username: `${botName.toLowerCase().replace(/\s+/g, '_')}_${platform}`,
        password: `password_${Date.now()}`, // This would be more secure in a real app
        signupUrl: '',
        streamKey: ''
      };
      
      const success = await createBot(botData);
      
      if (success) {
        this.showSuccess(`Bot "${botName}" created successfully`);
        
        // Dispatch event to notify parent components
        this.dispatchEvent(new CustomEvent('bot-created', {
          bubbles: true,
          composed: true,
          detail: { botName }
        }));
        
        // Clear form
        setTimeout(() => {
          this.shadowRoot.getElementById('botName').value = '';
          this.shadowRoot.getElementById('persona').value = '';
          this.shadowRoot.getElementById('gender').value = 'M';
        }, 1000);
      } else {
        this.showError('Failed to create bot');
      }
    } catch (error) {
      this.showError(`Error creating bot: ${error.message}`);
    }
  }

  async updateBot() {
    if (!this.bot) {
      this.showError('No bot selected for update');
      return;
    }
    
    const persona = this.shadowRoot.getElementById('persona').value.trim();
    const gender = this.shadowRoot.getElementById('gender').value;
    
    if (!persona) {
      this.showError('Persona description is required');
      return;
    }
    
    try {
      const success = await updateBotPersonality(this.bot.id, {
        persona,
        gender
      });
      
      if (success) {
        this.showSuccess(`Bot "${this.bot.name}" updated successfully`);
        
        // Dispatch event to notify parent components
        this.dispatchEvent(new CustomEvent('bot-updated', {
          bubbles: true,
          composed: true,
          detail: { 
            botId: this.bot.id,
            botName: this.bot.name,
            persona,
            gender
          }
        }));
      } else {
        this.showError('Failed to update bot');
      }
    } catch (error) {
      this.showError(`Error updating bot: ${error.message}`);
    }
  }

  cancel() {
    // Dispatch cancel event
    this.dispatchEvent(new CustomEvent('personality-edit-cancelled', {
      bubbles: true,
      composed: true
    }));
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

customElements.define('bot-personality-component', BotPersonalityComponent);