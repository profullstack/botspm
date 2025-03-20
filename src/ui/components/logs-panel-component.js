// logs-panel-component.js - Logs panel web component

import { clearLogs, AppEvents } from '../app.js';

class LogsPanelComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.logs = [];
    this.maxLogs = 100; // Maximum number of logs to keep
  }

  connectedCallback() {
    this.render();
    this.addEventListeners();
    
    // Listen for log events
    window.addEventListener(AppEvents.LOG_ADDED, this.handleLogAdded.bind(this));
    window.addEventListener(AppEvents.LOGS_CLEARED, this.handleLogsCleared.bind(this));
  }

  disconnectedCallback() {
    window.removeEventListener(AppEvents.LOG_ADDED, this.handleLogAdded.bind(this));
    window.removeEventListener(AppEvents.LOGS_CLEARED, this.handleLogsCleared.bind(this));
  }

  handleLogAdded(event) {
    const log = event.detail.log;
    this.addLog(log);
  }

  handleLogsCleared() {
    this.clearLogs();
  }

  addLog(log) {
    this.logs.push(log);
    
    // Trim logs if exceeding max
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
    
    this.renderLogs();
  }

  clearLogs() {
    this.logs = [];
    this.renderLogs();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        
        .logs-panel {
          background-color: var(--card-background, #ffffff);
          border-radius: 0.5rem;
          padding: 1rem;
          box-shadow: 0 2px 4px var(--shadow-color, rgba(0, 0, 0, 0.1));
          margin-top: 1rem;
          height: 100%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        
        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        
        h2 {
          margin: 0;
          color: var(--text-color, #212529);
        }
        
        .logs-content {
          font-family: monospace;
          background-color: var(--input-bg, #ffffff);
          border: 1px solid var(--border-color, #dee2e6);
          border-radius: 0.25rem;
          padding: 0.5rem;
          overflow-y: auto;
          flex: 1;
          white-space: pre-wrap;
          font-size: 0.9rem;
        }
        
        .log-entry {
          margin-bottom: 0.25rem;
          line-height: 1.4;
        }
        
        .log-debug {
          color: var(--info-color, #17a2b8);
        }
        
        .log-info {
          color: inherit;
        }
        
        .log-warn {
          color: var(--warning-color, #ffc107);
        }
        
        .log-error {
          color: var(--danger-color, #dc3545);
        }
        
        .icon-button {
          background-color: transparent;
          color: var(--text-color, #212529);
          padding: 0.25rem;
          border: none;
          border-radius: 0.25rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .icon-button:hover {
          background-color: var(--border-color, #dee2e6);
        }
      </style>
      
      <div class="logs-panel">
        <div class="panel-header">
          <h2>Activity Logs</h2>
          <button id="clearLogsBtn" class="icon-button" title="Clear Logs">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
        <div id="logsContent" class="logs-content"></div>
      </div>
    `;
    
    this.renderLogs();
  }

  renderLogs() {
    const logsContent = this.shadowRoot.getElementById('logsContent');
    if (!logsContent) return;
    
    // Keep existing content if we're just adding a log
    if (this.logs.length === 0) {
      logsContent.innerHTML = '';
      return;
    }
    
    // Only add the newest log if we're not clearing
    const lastLog = this.logs[this.logs.length - 1];
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry log-${lastLog.level}`;
    logEntry.textContent = `[${lastLog.timestamp}] [${lastLog.level.toUpperCase()}] ${lastLog.message}`;
    
    logsContent.appendChild(logEntry);
    
    // Scroll to bottom
    logsContent.scrollTop = logsContent.scrollHeight;
  }

  addEventListeners() {
    const clearLogsBtn = this.shadowRoot.getElementById('clearLogsBtn');
    clearLogsBtn.addEventListener('click', () => {
      clearLogs();
    });
  }
}

customElements.define('logs-panel-component', LogsPanelComponent);