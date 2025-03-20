// login-component.js - Login web component

import api from '../api-client.js';

class LoginComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.isRegistering = false;
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
          height: 100%;
          background-color: var(--background-color, #f8f9fa);
        }
        
        .login-container {
          max-width: 400px;
          margin: 0 auto;
          padding: 2rem;
          background-color: var(--card-background, #ffffff);
          border-radius: var(--border-radius-md, 0.5rem);
          box-shadow: 0 4px 6px var(--shadow-color, rgba(0, 0, 0, 0.1));
          position: relative;
          top: 50%;
          transform: translateY(-50%);
        }
        
        .app-logo {
          text-align: center;
          margin-bottom: 2rem;
        }
        
        .app-logo img {
          width: 120px;
          height: auto;
          margin-bottom: 1rem;
        }
        
        .app-logo h1 {
          font-size: 1.8rem;
          color: var(--primary-color, #4a6cf7);
          margin: 0;
        }
        
        .app-logo p {
          color: var(--text-muted, #6c757d);
          margin: 0.5rem 0 0 0;
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
        
        .form-actions {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .primary-button {
          background-color: var(--primary-color, #4a6cf7);
          color: white;
          border: none;
          border-radius: var(--border-radius-sm, 0.25rem);
          padding: 0.75rem 1rem;
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
          background-color: transparent;
          color: var(--primary-color, #4a6cf7);
          border: none;
          padding: 0.5rem;
          font-size: 0.9rem;
          cursor: pointer;
          text-align: center;
        }
        
        .secondary-button:hover {
          text-decoration: underline;
        }
        
        .error-message {
          color: var(--danger-color, #dc3545);
          font-size: 0.9rem;
          margin-top: 0.5rem;
          display: none;
        }
        
        .error-message.show {
          display: block;
        }
        
        .form-title {
          text-align: center;
          margin-bottom: 1.5rem;
          font-size: 1.5rem;
          color: var(--text-color, #212529);
        }
      </style>
      
      <div class="login-container">
        <div class="app-logo">
          <img src="../../assets/logo.svg" alt="bots.pm Logo">
          <h1>bots.pm</h1>
          <p>Manage your AI bots across multiple platforms</p>
        </div>
        
        <h2 class="form-title">${this.isRegistering ? 'Create Account' : 'Login'}</h2>
        
        <div id="loginForm" style="${this.isRegistering ? 'display: none;' : ''}">
          <div class="form-group">
            <label for="username">Username</label>
            <input type="text" id="username" placeholder="Enter your username">
          </div>
          
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" placeholder="Enter your password">
            <div id="loginError" class="error-message">Invalid username or password</div>
          </div>
          
          <div class="form-actions">
            <button id="loginBtn" class="primary-button">Login</button>
            <button id="showRegisterBtn" class="secondary-button">Don't have an account? Register</button>
          </div>
        </div>
        
        <div id="registerForm" style="${this.isRegistering ? '' : 'display: none;'}">
          <div class="form-group">
            <label for="newUsername">Username</label>
            <input type="text" id="newUsername" placeholder="Choose a username">
          </div>
          
          <div class="form-group">
            <label for="newPassword">Password</label>
            <input type="password" id="newPassword" placeholder="Choose a password">
          </div>
          
          <div class="form-group">
            <label for="confirmPassword">Confirm Password</label>
            <input type="password" id="confirmPassword" placeholder="Confirm your password">
            <div id="registerError" class="error-message">Passwords do not match</div>
          </div>
          
          <div class="form-actions">
            <button id="registerBtn" class="primary-button">Register</button>
            <button id="showLoginBtn" class="secondary-button">Already have an account? Login</button>
          </div>
        </div>
      </div>
    `;
  }

  addEventListeners() {
    const loginBtn = this.shadowRoot.getElementById('loginBtn');
    const showRegisterBtn = this.shadowRoot.getElementById('showRegisterBtn');
    const registerBtn = this.shadowRoot.getElementById('registerBtn');
    const showLoginBtn = this.shadowRoot.getElementById('showLoginBtn');
    
    loginBtn.addEventListener('click', () => this.login());
    showRegisterBtn.addEventListener('click', () => this.toggleForm(true));
    registerBtn.addEventListener('click', () => this.register());
    showLoginBtn.addEventListener('click', () => this.toggleForm(false));
    
    // Add enter key support
    const usernameInput = this.shadowRoot.getElementById('username');
    const passwordInput = this.shadowRoot.getElementById('password');
    const newUsernameInput = this.shadowRoot.getElementById('newUsername');
    const newPasswordInput = this.shadowRoot.getElementById('newPassword');
    const confirmPasswordInput = this.shadowRoot.getElementById('confirmPassword');
    
    passwordInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.login();
      }
    });
    
    confirmPasswordInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.register();
      }
    });
  }

  toggleForm(isRegistering) {
    this.isRegistering = isRegistering;
    
    const loginForm = this.shadowRoot.getElementById('loginForm');
    const registerForm = this.shadowRoot.getElementById('registerForm');
    const formTitle = this.shadowRoot.querySelector('.form-title');
    
    if (isRegistering) {
      loginForm.style.display = 'none';
      registerForm.style.display = 'block';
      formTitle.textContent = 'Create Account';
    } else {
      loginForm.style.display = 'block';
      registerForm.style.display = 'none';
      formTitle.textContent = 'Login';
    }
    
    // Clear error messages
    this.shadowRoot.getElementById('loginError').classList.remove('show');
    this.shadowRoot.getElementById('registerError').classList.remove('show');
  }

  async login() {
    const username = this.shadowRoot.getElementById('username').value.trim();
    const password = this.shadowRoot.getElementById('password').value;
    const loginError = this.shadowRoot.getElementById('loginError');
    
    if (!username || !password) {
      loginError.textContent = 'Please enter both username and password';
      loginError.classList.add('show');
      return;
    }
    
    try {
      const result = await api.auth.login(username, password);
      
      if (result.success) {
        // Dispatch event to notify app that user is authenticated
        this.dispatchEvent(new CustomEvent('user-authenticated', {
          bubbles: true,
          composed: true,
          detail: { 
            username: result.username,
            userId: result.userId
          }
        }));
      } else {
        loginError.textContent = 'Invalid username or password';
        loginError.classList.add('show');
      }
    } catch (error) {
      loginError.textContent = `Login error: ${error.message}`;
      loginError.classList.add('show');
    }
  }

  async register() {
    const username = this.shadowRoot.getElementById('newUsername').value.trim();
    const password = this.shadowRoot.getElementById('newPassword').value;
    const confirmPassword = this.shadowRoot.getElementById('confirmPassword').value;
    const registerError = this.shadowRoot.getElementById('registerError');
    
    if (!username || !password || !confirmPassword) {
      registerError.textContent = 'Please fill in all fields';
      registerError.classList.add('show');
      return;
    }
    
    if (password !== confirmPassword) {
      registerError.textContent = 'Passwords do not match';
      registerError.classList.add('show');
      return;
    }
    
    try {
      const result = await api.auth.register(username, password);
      
      if (result.success) {
        // Show login form with success message
        this.toggleForm(false);
        const loginError = this.shadowRoot.getElementById('loginError');
        loginError.textContent = 'Registration successful! You can now login.';
        loginError.style.color = 'var(--success-color, #28a745)';
        loginError.classList.add('show');
      } else {
        registerError.textContent = result.message || 'Username already exists';
        registerError.classList.add('show');
      }
    } catch (error) {
      registerError.textContent = `Registration error: ${error.message}`;
      registerError.classList.add('show');
    }
  }
}

customElements.define('login-component', LoginComponent);