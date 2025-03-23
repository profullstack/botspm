// setup-component.js - Component for initial application setup

import { saveUserSettings } from '../app.js';

class SetupComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.currentStep = 1;
    this.totalSteps = 3;
    this.settings = {};
  }

  connectedCallback() {
    this.render();
    this.addEventListeners();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        @font-face {
          font-family: 'Inter';
          font-style: normal;
          font-weight: 400;
          font-display: swap;
          src: url('/public/fonts/inter/inter-regular.woff2') format('woff2');
        }
        
        @font-face {
          font-family: 'Inter';
          font-style: normal;
          font-weight: 500;
          font-display: swap;
          src: url('/public/fonts/inter/inter-medium.woff2') format('woff2');
        }
        
        @font-face {
          font-family: 'Inter';
          font-style: normal;
          font-weight: 700;
          font-display: swap;
          src: url('/public/fonts/inter/inter-bold.woff2') format('woff2');
        }
        
        :host {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          height: 100vh;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          background-color: var(--background-color, #f8f9fa);
          padding: 20px;
          box-sizing: border-box;
        }
        
        .setup-container {
          width: 100%;
          max-width: 800px;
          padding: 2rem;
          background-color: var(--card-background, #ffffff);
          border-radius: var(--border-radius-lg, 0.5rem);
          box-shadow: 0 4px 6px var(--shadow-color, rgba(0, 0, 0, 0.1));
        }
        
        .setup-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        
        .setup-header h1 {
          font-size: 2rem;
          color: var(--primary-color, #4A6CF7);
          margin-bottom: 0.5rem;
        }
        
        .setup-header p {
          color: var(--text-color-secondary, #6c757d);
          font-size: 1rem;
        }
        
        .setup-progress {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2rem;
          position: relative;
        }
        
        .setup-progress::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 2px;
          background-color: var(--border-color, #e9ecef);
          transform: translateY(-50%);
          z-index: 1;
        }
        
        .progress-step {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background-color: var(--border-color, #e9ecef);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          color: var(--text-color, #333);
          position: relative;
          z-index: 2;
        }
        
        .progress-step.active {
          background-color: var(--primary-color, #4A6CF7);
          color: white;
        }
        
        .progress-step.completed {
          background-color: var(--success-color, #28a745);
          color: white;
        }
        
        .setup-content {
          margin-bottom: 2rem;
        }
        
        .setup-step {
          display: none;
        }
        
        .setup-step.active {
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
          box-sizing: border-box;
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
        
        .setup-actions {
          display: flex;
          justify-content: space-between;
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
        
        .btn-success {
          background-color: var(--success-color, #28a745);
          color: white;
        }
        
        .btn-success:hover {
          background-color: var(--success-color-hover, #218838);
        }
        
        .btn-link {
          background: none;
          color: var(--primary-color, #4A6CF7);
          text-decoration: underline;
          padding: 0.75rem 0;
        }
        
        .btn-link:hover {
          color: var(--primary-color-hover, #3a5ce5);
        }
        
        .logo {
          width: 120px;
          height: auto;
          margin-bottom: 1rem;
        }
        
        /* Dark mode styles */
        :host-context(body.dark-mode) .setup-container {
          background-color: var(--dark-card-background, #2a2a2a);
        }
        
        :host-context(body.dark-mode) .setup-header h1 {
          color: var(--primary-color, #4A6CF7);
        }
        
        :host-context(body.dark-mode) .setup-header p,
        :host-context(body.dark-mode) .form-group .hint {
          color: var(--dark-text-color-secondary, #adb5bd);
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
      </style>
      
      <div class="setup-container">
        <div class="setup-header">
          <img src="../public/images/logo.svg" alt="bots.pm Logo" class="logo">
          <h1>Welcome to bots.pm</h1>
          <p>Let's set up your environment to get started</p>
        </div>
        
        <div class="setup-progress">
          <div class="progress-step active" data-step="1">1</div>
          <div class="progress-step" data-step="2">2</div>
          <div class="progress-step" data-step="3">3</div>
        </div>
        
        <div class="setup-content">
          <!-- Step 1: Welcome -->
          <div class="setup-step active" data-step="1">
            <h2>Welcome to bots.pm</h2>
            <p>bots.pm is a desktop application for managing multiple AI bots across streaming platforms like YouTube, TikTok, and X.com.</p>
            <p>This setup wizard will help you configure the basic settings needed to get started. You can always change these settings later.</p>
            <p>Let's begin by setting up your API keys for the AI services.</p>
          </div>
          
          <!-- Step 2: API Keys -->
          <div class="setup-step" data-step="2">
            <h2>API Keys</h2>
            <p>bots.pm uses various AI services to power the bots. Please enter your API keys below:</p>
            
            <div class="form-group">
              <label for="openaiApiKey">OpenAI API Key</label>
              <input type="password" id="openaiApiKey" placeholder="sk-...">
              <div class="hint">Used for generating bot responses with GPT models</div>
            </div>
            
            <div class="form-group">
              <label for="twoCaptchaApiKey">2Captcha API Key (Optional)</label>
              <input type="password" id="twoCaptchaApiKey" placeholder="Your 2Captcha API key">
              <div class="hint">Used for solving CAPTCHAs during automated platform authentication</div>
            </div>
          </div>
          
          <!-- Step 3: Completion -->
          <div class="setup-step" data-step="3">
            <h2>Setup Complete!</h2>
            <p>Congratulations! You've completed the basic setup for bots.pm.</p>
            <p>You can now start creating and managing your AI bots across multiple streaming platforms.</p>
            <p>Additional settings can be configured in the Settings panel after you enter the dashboard.</p>
          </div>
        </div>
        
        <div class="setup-actions">
          <button id="prevBtn" class="btn btn-secondary" style="display: none;">Previous</button>
          <div>
            <button id="skipBtn" class="btn btn-link">Skip Setup</button>
            <button id="nextBtn" class="btn btn-primary">Next</button>
          </div>
        </div>
      </div>
    `;
  }

  addEventListeners() {
    const nextBtn = this.shadowRoot.getElementById('nextBtn');
    const prevBtn = this.shadowRoot.getElementById('prevBtn');
    const skipBtn = this.shadowRoot.getElementById('skipBtn');
    
    nextBtn.addEventListener('click', () => this.nextStep());
    prevBtn.addEventListener('click', () => this.prevStep());
    skipBtn.addEventListener('click', () => this.skipSetup());
  }

  nextStep() {
    // Save current step data
    this.saveStepData();
    
    // If on last step, complete setup
    if (this.currentStep === this.totalSteps) {
      this.completeSetup();
      return;
    }
    
    // Update progress
    const currentStepEl = this.shadowRoot.querySelector(`.progress-step[data-step="${this.currentStep}"]`);
    currentStepEl.classList.remove('active');
    currentStepEl.classList.add('completed');
    
    // Hide current step
    const currentContentEl = this.shadowRoot.querySelector(`.setup-step[data-step="${this.currentStep}"]`);
    currentContentEl.classList.remove('active');
    
    // Increment step
    this.currentStep++;
    
    // Show next step
    const nextStepEl = this.shadowRoot.querySelector(`.progress-step[data-step="${this.currentStep}"]`);
    nextStepEl.classList.add('active');
    
    const nextContentEl = this.shadowRoot.querySelector(`.setup-step[data-step="${this.currentStep}"]`);
    nextContentEl.classList.add('active');
    
    // Update buttons
    const prevBtn = this.shadowRoot.getElementById('prevBtn');
    const nextBtn = this.shadowRoot.getElementById('nextBtn');
    const skipBtn = this.shadowRoot.getElementById('skipBtn');
    
    prevBtn.style.display = 'block';
    
    if (this.currentStep === this.totalSteps) {
      nextBtn.textContent = 'Complete Setup';
      nextBtn.classList.remove('btn-primary');
      nextBtn.classList.add('btn-success');
      skipBtn.style.display = 'none';
    }
  }

  prevStep() {
    // Update progress
    const currentStepEl = this.shadowRoot.querySelector(`.progress-step[data-step="${this.currentStep}"]`);
    currentStepEl.classList.remove('active');
    
    // Hide current step
    const currentContentEl = this.shadowRoot.querySelector(`.setup-step[data-step="${this.currentStep}"]`);
    currentContentEl.classList.remove('active');
    
    // Decrement step
    this.currentStep--;
    
    // Show previous step
    const prevStepEl = this.shadowRoot.querySelector(`.progress-step[data-step="${this.currentStep}"]`);
    prevStepEl.classList.remove('completed');
    prevStepEl.classList.add('active');
    
    const prevContentEl = this.shadowRoot.querySelector(`.setup-step[data-step="${this.currentStep}"]`);
    prevContentEl.classList.add('active');
    
    // Update buttons
    const prevBtn = this.shadowRoot.getElementById('prevBtn');
    const nextBtn = this.shadowRoot.getElementById('nextBtn');
    const skipBtn = this.shadowRoot.getElementById('skipBtn');
    
    if (this.currentStep === 1) {
      prevBtn.style.display = 'none';
    }
    
    if (this.currentStep < this.totalSteps) {
      nextBtn.textContent = 'Next';
      nextBtn.classList.add('btn-primary');
      nextBtn.classList.remove('btn-success');
      skipBtn.style.display = 'block';
    }
  }

  saveStepData() {
    switch (this.currentStep) {
      case 1:
        // No data to save in step 1
        break;
      case 2:
        // Save API keys
        const openaiApiKey = this.shadowRoot.getElementById('openaiApiKey').value;
        const twoCaptchaApiKey = this.shadowRoot.getElementById('twoCaptchaApiKey').value;
        
        if (openaiApiKey) {
          this.settings.OPENAI_API_KEY = openaiApiKey;
        }
        
        if (twoCaptchaApiKey) {
          this.settings.TWO_CAPTCHA_API_KEY = twoCaptchaApiKey;
        }
        break;
      case 3:
        // No data to save in step 3
        break;
    }
  }

  async completeSetup() {
    // Save all settings to user settings
    try {
      const userId = localStorage.getItem('userId');
      if (userId) {
        await saveUserSettings(userId, this.settings);
      }
      
      // Dispatch setup complete event
      this.dispatchEvent(new CustomEvent('setup-complete', {
        bubbles: true,
        composed: true
      }));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  skipSetup() {
    // Dispatch setup skipped event
    this.dispatchEvent(new CustomEvent('setup-skipped', {
      bubbles: true,
      composed: true
    }));
  }
}

customElements.define('setup-component', SetupComponent);