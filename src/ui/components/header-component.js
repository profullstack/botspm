// header-component.js - Header web component

class HeaderComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.addEventListeners();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
        }
        
        .app-header {
          background-color: var(--header-bg, #ffffff);
          padding: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border-color, #dee2e6);
          box-shadow: 0 2px 4px var(--shadow-color, rgba(0, 0, 0, 0.1));
        }
        
        h1 {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0;
          color: var(--text-color, #212529);
        }
        
        .header-controls {
          display: flex;
          gap: 0.5rem;
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
      
      <div class="app-header">
        <h1>Multi-Platform AI Bots</h1>
        <div class="header-controls">
          <button id="settingsBtn" class="icon-button" title="Settings">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  addEventListeners() {
    const settingsBtn = this.shadowRoot.getElementById('settingsBtn');
    settingsBtn.addEventListener('click', () => {
      const settingsModal = document.querySelector('settings-modal-component');
      if (settingsModal) {
        settingsModal.open();
      }
    });
  }
}

customElements.define('header-component', HeaderComponent);