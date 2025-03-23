// navigation-component.js - Component for app navigation

class NavigationComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.activeItem = 'dashboard';
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
          display: block;
          width: 100%;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        }
        
        .nav-container {
          background-color: var(--sidebar-bg, #f8f9fa);
          border-right: 1px solid var(--border-color, #e9ecef);
          height: 100%;
          width: 220px;
          position: fixed;
          top: 0;
          left: 0;
          overflow-x: hidden;
          padding-top: 20px;
          transition: all 0.3s ease;
        }
        
        .nav-header {
          padding: 0 20px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .logo-container {
          display: flex;
          align-items: center;
        }
        
        .logo {
          height: 40px;
          margin-right: 10px;
        }
        
        .app-name {
          font-size: 1.2rem;
          font-weight: 600;
          color: var(--text-color, #333);
        }
        
        .nav-toggle {
          background: none;
          border: none;
          color: var(--text-color, #333);
          cursor: pointer;
          font-size: 1.2rem;
          padding: 5px;
        }
        
        .nav-items {
          list-style-type: none;
          padding: 0;
          margin: 0;
        }
        
        .nav-item {
          padding: 12px 20px;
          display: flex;
          align-items: center;
          color: var(--text-color-secondary, #6c757d);
          cursor: pointer;
          transition: all 0.2s ease;
          border-left: 3px solid transparent;
        }
        
        .nav-item:hover {
          background-color: var(--hover-bg, rgba(0, 0, 0, 0.05));
          color: var(--text-color, #333);
        }
        
        .nav-item.active {
          background-color: var(--active-bg, rgba(74, 108, 247, 0.1));
          color: var(--primary-color, #4A6CF7);
          border-left-color: var(--primary-color, #4A6CF7);
          font-weight: 500;
        }
        
        .nav-icon {
          margin-right: 10px;
          width: 20px;
          height: 20px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        
        .nav-text {
          font-size: 0.95rem;
        }
        
        .nav-footer {
          position: absolute;
          bottom: 0;
          width: 100%;
          padding: 15px 20px;
          border-top: 1px solid var(--border-color, #e9ecef);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .user-info {
          display: flex;
          align-items: center;
        }
        
        .user-avatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background-color: var(--primary-color, #4A6CF7);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          margin-right: 10px;
        }
        
        .user-name {
          font-size: 0.9rem;
          color: var(--text-color, #333);
          max-width: 120px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .logout-btn {
          background: none;
          border: none;
          color: var(--danger-color, #dc3545);
          cursor: pointer;
          font-size: 0.9rem;
          padding: 5px;
        }
        
        .collapsed .nav-text,
        .collapsed .app-name,
        .collapsed .user-name {
          display: none;
        }
        
        .collapsed {
          width: 60px;
        }
        
        .collapsed .nav-item {
          justify-content: center;
          padding: 12px 0;
        }
        
        .collapsed .nav-icon {
          margin-right: 0;
        }
        
        .collapsed .user-avatar {
          margin-right: 0;
        }
        
        .collapsed .logout-btn {
          font-size: 1.2rem;
        }
        
        .collapsed .nav-footer {
          justify-content: center;
          padding: 15px 0;
        }
        
        /* Dark mode styles */
        :host-context(body.dark-mode) .nav-container {
          background-color: var(--dark-sidebar-bg, #2a2a2a);
          border-right-color: var(--dark-border-color, #444);
        }
        
        :host-context(body.dark-mode) .nav-item {
          color: var(--dark-text-color-secondary, #adb5bd);
        }
        
        :host-context(body.dark-mode) .nav-item:hover {
          background-color: var(--dark-hover-bg, rgba(255, 255, 255, 0.05));
          color: var(--dark-text-color, #f8f9fa);
        }
        
        :host-context(body.dark-mode) .nav-item.active {
          background-color: var(--dark-active-bg, rgba(74, 108, 247, 0.2));
        }
        
        :host-context(body.dark-mode) .app-name,
        :host-context(body.dark-mode) .user-name {
          color: var(--dark-text-color, #f8f9fa);
        }
        
        :host-context(body.dark-mode) .nav-footer {
          border-top-color: var(--dark-border-color, #444);
        }
      </style>
      
      <nav class="nav-container">
        <div class="nav-header">
          <div class="logo-container">
            <img src="../public/images/logo.svg" alt="bots.pm Logo" class="logo">
            <span class="app-name">bots.pm</span>
          </div>
          <button class="nav-toggle" id="navToggle">≡</button>
        </div>
        
        <ul class="nav-items">
          <li class="nav-item active" data-page="dashboard">
            <span class="nav-icon">📊</span>
            <span class="nav-text">Dashboard</span>
          </li>
          <li class="nav-item" data-page="bots">
            <span class="nav-icon">🤖</span>
            <span class="nav-text">Bots</span>
          </li>
          <li class="nav-item" data-page="sessions">
            <span class="nav-icon">🎬</span>
            <span class="nav-text">Sessions</span>
          </li>
          <li class="nav-item" data-page="director">
            <span class="nav-icon">🎭</span>
            <span class="nav-text">Director</span>
          </li>
          <li class="nav-item" data-page="logs">
            <span class="nav-icon">📝</span>
            <span class="nav-text">Logs</span>
          </li>
          <li class="nav-item" data-page="settings">
            <span class="nav-icon">⚙️</span>
            <span class="nav-text">Settings</span>
          </li>
        </ul>
        
        <div class="nav-footer">
          <div class="user-info">
            <div class="user-avatar" id="userAvatar">U</div>
            <span class="user-name" id="userName">User</span>
          </div>
          <button class="logout-btn" id="logoutBtn">⏏️</button>
        </div>
      </nav>
    `;
  }

  addEventListeners() {
    // Toggle navigation collapse
    const navToggle = this.shadowRoot.getElementById('navToggle');
    const navContainer = this.shadowRoot.querySelector('.nav-container');
    
    navToggle.addEventListener('click', () => {
      navContainer.classList.toggle('collapsed');
      this.dispatchEvent(new CustomEvent('nav-toggled', {
        bubbles: true,
        composed: true,
        detail: { collapsed: navContainer.classList.contains('collapsed') }
      }));
    });
    
    // Navigation item click
    const navItems = this.shadowRoot.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        // Remove active class from all items
        navItems.forEach(i => i.classList.remove('active'));
        
        // Add active class to clicked item
        item.classList.add('active');
        
        // Update active item
        this.activeItem = item.dataset.page;
        
        // Dispatch navigation event
        this.dispatchEvent(new CustomEvent('nav-changed', {
          bubbles: true,
          composed: true,
          detail: { page: this.activeItem }
        }));
      });
    });
    
    // Logout button click
    const logoutBtn = this.shadowRoot.getElementById('logoutBtn');
    logoutBtn.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('user-logout', {
        bubbles: true,
        composed: true
      }));
    });
  }

  // Update user information
  updateUser(user) {
    if (!user) return;
    
    const userAvatar = this.shadowRoot.getElementById('userAvatar');
    const userName = this.shadowRoot.getElementById('userName');
    
    if (user.username) {
      userName.textContent = user.username;
      userAvatar.textContent = user.username.charAt(0).toUpperCase();
    }
  }

  // Set active navigation item
  setActivePage(page) {
    if (!page) return;
    
    const navItems = this.shadowRoot.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      if (item.dataset.page === page) {
        item.classList.add('active');
        this.activeItem = page;
      } else {
        item.classList.remove('active');
      }
    });
  }
}

customElements.define('navigation-component', NavigationComponent);
