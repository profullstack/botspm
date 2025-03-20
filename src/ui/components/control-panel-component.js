// control-panel-component.js - Control panel web component

import { startBots, stopBots, sendDirectorCommand, getCommandHistory, AppEvents } from '../app.js';

class ControlPanelComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.commandHistory = [];
  }

  connectedCallback() {
    this.render();
    this.addEventListeners();
    this.updateCommandHistory();
    
    // Listen for command sent events
    window.addEventListener(AppEvents.COMMAND_SENT, this.handleCommandSent.bind(this));
  }

  disconnectedCallback() {
    window.removeEventListener(AppEvents.COMMAND_SENT, this.handleCommandSent.bind(this));
  }

  handleCommandSent(event) {
    this.updateCommandHistory();
    this.clearCommandInput();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        
        .control-panel {
          background-color: var(--card-background, #ffffff);
          border-radius: 0.5rem;
          padding: 1rem;
          box-shadow: 0 2px 4px var(--shadow-color, rgba(0, 0, 0, 0.1));
          display: flex;
          flex-direction: column;
          gap: 1rem;
          height: 100%;
          overflow-y: auto;
        }
        
        h2, h3, h4 {
          margin: 0;
          color: var(--text-color, #212529);
        }
        
        .control-buttons {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .director-panel {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .command-input {
          display: flex;
          gap: 0.5rem;
        }
        
        .command-input input {
          flex: 1;
          padding: 0.5rem;
          border-radius: 0.25rem;
          border: 1px solid var(--input-border, #ced4da);
          background-color: var(--input-bg, #ffffff);
          color: var(--text-color, #212529);
        }
        
        .command-history {
          margin-top: 0.5rem;
        }
        
        .command-history ul {
          list-style: none;
          margin: 0.5rem 0 0 0;
          padding: 0;
          max-height: 150px;
          overflow-y: auto;
        }
        
        .command-history li {
          padding: 0.5rem;
          border-bottom: 1px solid var(--border-color, #dee2e6);
          font-size: 0.9rem;
          color: var(--text-color, #212529);
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
      </style>
      
      <div class="control-panel">
        <h2>Control Panel</h2>
        <div class="control-buttons">
          <button id="startBotsBtn" class="primary-button">Start All Bots</button>
          <button id="stopBotsBtn" class="secondary-button">Stop All Bots</button>
        </div>
        
        <div class="director-panel">
          <h3>Director Commands</h3>
          <div class="command-input">
            <input type="text" id="directorCommandInput" placeholder="Enter director command...">
            <button id="sendCommandBtn" class="primary-button">Send</button>
          </div>
          <div class="command-history">
            <h4>Recent Commands</h4>
            <ul id="commandHistoryList"></ul>
          </div>
        </div>
      </div>
    `;
  }

  addEventListeners() {
    const startBotsBtn = this.shadowRoot.getElementById('startBotsBtn');
    const stopBotsBtn = this.shadowRoot.getElementById('stopBotsBtn');
    const directorCommandInput = this.shadowRoot.getElementById('directorCommandInput');
    const sendCommandBtn = this.shadowRoot.getElementById('sendCommandBtn');

    startBotsBtn.addEventListener('click', () => {
      startBots();
    });

    stopBotsBtn.addEventListener('click', () => {
      stopBots();
    });

    sendCommandBtn.addEventListener('click', () => {
      this.sendCommand();
    });

    directorCommandInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.sendCommand();
      }
    });
  }

  async sendCommand() {
    const directorCommandInput = this.shadowRoot.getElementById('directorCommandInput');
    const command = directorCommandInput.value.trim();
    
    if (command) {
      const success = await sendDirectorCommand(command);
      if (success) {
        this.clearCommandInput();
      }
    }
  }

  clearCommandInput() {
    const directorCommandInput = this.shadowRoot.getElementById('directorCommandInput');
    directorCommandInput.value = '';
  }

  updateCommandHistory() {
    this.commandHistory = getCommandHistory();
    const commandHistoryList = this.shadowRoot.getElementById('commandHistoryList');
    
    if (commandHistoryList) {
      commandHistoryList.innerHTML = '';
      
      this.commandHistory.forEach(command => {
        const li = document.createElement('li');
        li.textContent = command;
        commandHistoryList.appendChild(li);
      });
    }
  }
}

customElements.define('control-panel-component', ControlPanelComponent);