// main.js - Electron main process for bots.pm desktop application

import { app, BrowserWindow, ipcMain, dialog, Menu, Tray } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { spawn } from 'child_process';
import electronLog from 'electron-log';
import Store from 'electron-store';
import dotenv from 'dotenv';
import { masterProcess } from './master.js';
import CryptoJS from 'crypto-js';

// Load environment variables
dotenv.config();

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configure electron-log
electronLog.transports.file.resolvePathFn = () => path.join(app.getPath('userData'), 'logs/main.log');
electronLog.catchErrors({
  showDialog: false,
  onError(error) {
    dialog.showErrorBox('Error', `An error occurred: ${error.message}`);
  }
});

// Initialize store for app settings
const store = new Store({
  name: 'settings',
  defaults: {
    windowBounds: { width: 1200, height: 800 },
    darkMode: true
  }
});

// Global reference to mainWindow to prevent garbage collection
let mainWindow;
let tray = null;
let botProcesses = [];
let db;

/**
 * Initialize the database
 */
async function initDatabase() {
  try {
    const configPath = path.join(app.getPath('userData'), 'config.json');
    let config;
    
    try {
      const configFile = await fs.readFile(configPath, 'utf8');
      config = JSON.parse(configFile);
    } catch (error) {
      electronLog.error('Failed to load config:', error);
      config = { DATABASE_ENGINE: 'sqlite3' }; // Default to sqlite3 if config can't be loaded
    }
    
    const dbEngine = config.DATABASE_ENGINE || 'sqlite3';
    const dbPath = path.join(__dirname, '../data/bots.sqlite');
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(dbPath), { recursive: true });
    
    // Open database based on configured engine
    if (dbEngine === 'sqlite3') {
      electronLog.info('Using sqlite3 database engine');
      try {
        // Import sqlite3 with dynamic import
        const { default: sqlite3 } = await import('sqlite3');
        const { open } = await import('sqlite');
        
        db = await open({
          filename: dbPath,
          driver: sqlite3.Database
        });
        
        // Create tables if they don't exist
        await db.exec(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
        
        await db.exec(`
          CREATE TABLE IF NOT EXISTS user_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            key TEXT NOT NULL,
            value TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            UNIQUE(user_id, key)
          )
        `);
        
        await db.exec(`
          CREATE TABLE IF NOT EXISTS bot_accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            bot_name TEXT NOT NULL,
            platform TEXT NOT NULL,
            username TEXT,
            password TEXT,
            signup_url TEXT,
            stream_key TEXT,
            persona TEXT,
            gender TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            UNIQUE(user_id, bot_name, platform)
          )
        `);
        
        await db.exec(`
          CREATE TABLE IF NOT EXISTS bot_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bot_id INTEGER NOT NULL,
            input TEXT,
            response TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (bot_id) REFERENCES bot_accounts(id)
          )
        `);
        
        await db.exec(`
          CREATE TABLE IF NOT EXISTS director_commands (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            command TEXT NOT NULL,
            applied BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
          )
        `);
      } catch (error) {
        electronLog.error('Failed to initialize sqlite3:', error);
        throw new Error(`Failed to initialize sqlite3: ${error.message}`);
      }
    } else {
      electronLog.info('Using better-sqlite3 database engine');
      try {
        // Import better-sqlite3 with dynamic import
        const { default: BetterSQLite3 } = await import('better-sqlite3');
        
        db = new BetterSQLite3(dbPath, { verbose: electronLog.info });
        
        // Create tables if they don't exist
        db.exec(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
        
        db.exec(`
          CREATE TABLE IF NOT EXISTS user_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            key TEXT NOT NULL,
            value TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            UNIQUE(user_id, key)
          )
        `);
        
        db.exec(`
          CREATE TABLE IF NOT EXISTS bot_accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            bot_name TEXT NOT NULL,
            platform TEXT NOT NULL,
            username TEXT,
            password TEXT,
            signup_url TEXT,
            stream_key TEXT,
            persona TEXT,
            gender TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            UNIQUE(user_id, bot_name, platform)
          )
        `);
        
        db.exec(`
          CREATE TABLE IF NOT EXISTS bot_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bot_id INTEGER NOT NULL,
            input TEXT,
            response TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (bot_id) REFERENCES bot_accounts(id)
          )
        `);
        
        db.exec(`
          CREATE TABLE IF NOT EXISTS director_commands (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            command TEXT NOT NULL,
            applied BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
          )
        `);
      } catch (error) {
        electronLog.error('Failed to initialize better-sqlite3:', error);
        throw new Error(`Failed to initialize better-sqlite3: ${error.message}`);
      }
    }
    
    electronLog.info('Database initialized successfully');
  } catch (error) {
    electronLog.error('Database initialization error:', error);
    dialog.showErrorBox('Database Error', `Failed to initialize database: ${error.message}`);
  }
}

/**
 * Creates the main application window
 */
function createWindow() {
  const { width, height } = store.get('windowBounds');
  
  mainWindow = new BrowserWindow({
    width,
    height,
    minWidth: 800,
    minHeight: 600,
    title: 'bots.pm',
    icon: path.join(__dirname, '../assets/favicon.svg'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load the index.html file
  mainWindow.loadFile(path.join(__dirname, 'ui/index.html'));

  // Open DevTools in development mode
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Save window size when resized
  mainWindow.on('resize', () => {
    const { width, height } = mainWindow.getBounds();
    store.set('windowBounds', { width, height });
  });

  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null;
    stopAllBots();
  });

  // Create application menu
  createMenu();
  
  // Create system tray
  createTray();
}

/**
 * Creates the application menu
 */
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Settings',
          click: () => mainWindow.webContents.send('open-settings')
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Command+Q' : 'Ctrl+Q',
          click: () => app.quit()
        }
      ]
    },
    {
      label: 'Bots',
      submenu: [
        {
          label: 'Start All Bots',
          click: startAllBots
        },
        {
          label: 'Stop All Bots',
          click: stopAllBots
        },
        { type: 'separator' },
        {
          label: 'Create New Bot',
          click: () => mainWindow.webContents.send('create-bot')
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Dark Mode',
          click: () => {
            const darkMode = !store.get('darkMode');
            store.set('darkMode', darkMode);
            mainWindow.webContents.send('toggle-dark-mode', darkMode);
          }
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          click: () => mainWindow.webContents.send('open-documentation')
        },
        {
          label: 'About',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              title: 'About bots.pm',
              message: 'bots.pm',
              detail: `Version: ${app.getVersion()}\nElectron: ${process.versions.electron}\nChrome: ${process.versions.chrome}\nNode.js: ${process.versions.node}\nV8: ${process.versions.v8}`,
              buttons: ['OK'],
              icon: path.join(__dirname, '../assets/favicon.svg')
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

/**
 * Creates the system tray icon
 */
function createTray() {
  const iconPath = path.join(__dirname, '../assets/favicon.svg');
  tray = new Tray(iconPath);
  
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Open bots.pm', 
      click: () => {
        if (mainWindow === null) {
          createWindow();
        } else {
          mainWindow.show();
        }
      }
    },
    { 
      label: 'Start All Bots', 
      click: startAllBots 
    },
    { 
      label: 'Stop All Bots', 
      click: stopAllBots 
    },
    { type: 'separator' },
    { 
      label: 'Quit', 
      click: () => {
        app.quit();
      }
    }
  ]);
  
  tray.setToolTip('bots.pm');
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    if (mainWindow === null) {
      createWindow();
    } else {
      if (mainWindow.isVisible()) {
        mainWindow.focus();
      } else {
        mainWindow.show();
      }
    }
  });
}

/**
 * Starts all configured bots
 */
async function startAllBots() {
  try {
    // Load configuration
    const configPath = path.join(app.getPath('userData'), 'config.json');
    let config;
    
    try {
      const configFile = await fs.readFile(configPath, 'utf8');
      config = JSON.parse(configFile);
    } catch (error) {
      electronLog.error('Failed to load config:', error);
      dialog.showErrorBox('Configuration Error', 'Failed to load configuration. Please check settings.');
      return;
    }
    
    // Start the master process
    const masterInstance = await masterProcess(config);
    botProcesses.push(masterInstance);
    
    if (mainWindow) {
      mainWindow.webContents.send('bots-started');
    }
    
    // Update tray icon tooltip
    if (tray) {
      tray.setToolTip('bots.pm - Bots Running');
    }
    
    electronLog.info('All bots started successfully');
  } catch (error) {
    electronLog.error('Failed to start bots:', error);
    dialog.showErrorBox('Error', `Failed to start bots: ${error.message}`);
  }
}

/**
 * Stops all running bot processes
 */
function stopAllBots() {
  botProcesses.forEach(process => {
    if (process && !process.killed) {
      process.kill();
    }
  });
  
  botProcesses = [];
  electronLog.info('All bots stopped');
  
  // Update tray icon tooltip
  if (tray) {
    tray.setToolTip('bots.pm');
  }
  
  if (mainWindow) {
    mainWindow.webContents.send('bots-stopped');
  }
}

// User authentication functions
async function authenticateUser(username, password) {
  try {
    let user;
    
    // Check if we're using sqlite3 or better-sqlite3
    if (db.prepare) {
      // better-sqlite3
      user = db.prepare('SELECT id, username, password FROM users WHERE username = ?').get(username);
    } else {
      // sqlite3
      user = await db.get('SELECT id, username, password FROM users WHERE username = ?', username);
    }
    
    if (!user) {
      return { success: false, message: 'User not found' };
    }
    
    // Use CryptoJS to verify password
    const hashedPassword = CryptoJS.SHA256(password).toString();
    const passwordMatch = hashedPassword === user.password;
    
    if (!passwordMatch) {
      return { success: false, message: 'Invalid password' };
    }
    
    return { success: true, userId: user.id, username: user.username };
  } catch (error) {
    electronLog.error('Authentication error:', error);
    return { success: false, message: error.message };
  }
}

async function registerUser(username, password) {
  try {
    let existingUser;
    
    // Check if we're using sqlite3 or better-sqlite3
    if (db.prepare) {
      // better-sqlite3
      existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    } else {
      // sqlite3
      existingUser = await db.get('SELECT id FROM users WHERE username = ?', username);
    }
    
    if (existingUser) {
      return { success: false, message: 'Username already exists' };
    }
    
    // Hash password with CryptoJS
    const hashedPassword = CryptoJS.SHA256(password).toString();
    
    let result;
    
    // Insert new user
    if (db.prepare) {
      // better-sqlite3
      result = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run(username, hashedPassword);
      return { success: true, userId: result.lastInsertRowid };
    } else {
      // sqlite3
      result = await db.run('INSERT INTO users (username, password) VALUES (?, ?)', username, hashedPassword);
      return { success: true, userId: result.lastID };
    }
  } catch (error) {
    electronLog.error('Registration error:', error);
    return { success: false, message: error.message };
  }
}

async function saveUserSettings(userId, settings) {
  try {
    // Check if we're using sqlite3 or better-sqlite3
    if (db.prepare) {
      // better-sqlite3
      db.prepare('BEGIN TRANSACTION').run();
      
      const stmt = db.prepare('INSERT OR REPLACE INTO user_settings (user_id, key, value, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)');
      
      for (const [key, value] of Object.entries(settings)) {
        if (value !== undefined && value !== null) {
          stmt.run(userId, key, value);
        }
      }
      
      db.prepare('COMMIT').run();
    } else {
      // sqlite3
      await db.run('BEGIN TRANSACTION');
      
      for (const [key, value] of Object.entries(settings)) {
        if (value !== undefined && value !== null) {
          await db.run(
            'INSERT OR REPLACE INTO user_settings (user_id, key, value, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
            userId,
            key,
            value
          );
        }
      }
      
      await db.run('COMMIT');
    }
    
    return { success: true };
  } catch (error) {
    // Rollback transaction on error
    if (db.prepare) {
      // better-sqlite3
      db.prepare('ROLLBACK').run();
    } else {
      // sqlite3
      await db.run('ROLLBACK');
    }
    
    electronLog.error('Save settings error:', error);
    return { success: false, message: error.message };
  }
}

async function getUserSettings(userId) {
  try {
    let rows;
    
    // Check if we're using sqlite3 or better-sqlite3
    if (db.prepare) {
      // better-sqlite3
      rows = db.prepare('SELECT key, value FROM user_settings WHERE user_id = ?').all(userId);
    } else {
      // sqlite3
      rows = await db.all('SELECT key, value FROM user_settings WHERE user_id = ?', userId);
    }
    
    const settings = {};
    rows.forEach(row => {
      settings[row.key] = row.value;
    });
    
    return settings;
  } catch (error) {
    electronLog.error('Get settings error:', error);
    throw error;
  }
}

async function getBotsByUser(userId) {
  try {
    let bots;
    
    // Check if we're using sqlite3 or better-sqlite3
    if (db.prepare) {
      // better-sqlite3
      bots = db.prepare(`
        SELECT id, bot_name, platform, username, stream_key, persona, gender 
        FROM bot_accounts 
        WHERE user_id = ?
      `).all(userId);
    } else {
      // sqlite3
      bots = await db.all(`
        SELECT id, bot_name, platform, username, stream_key, persona, gender 
        FROM bot_accounts 
        WHERE user_id = ?
      `, userId);
    }
    
    return bots;
  } catch (error) {
    electronLog.error('Get bots error:', error);
    throw error;
  }
}

async function getBotById(botId) {
  try {
    let bot;
    
    // Check if we're using sqlite3 or better-sqlite3
    if (db.prepare) {
      // better-sqlite3
      bot = db.prepare(`
        SELECT id, user_id, bot_name, platform, username, password, signup_url, stream_key, persona, gender 
        FROM bot_accounts 
        WHERE id = ?
      `).get(botId);
    } else {
      // sqlite3
      bot = await db.get(`
        SELECT id, user_id, bot_name, platform, username, password, signup_url, stream_key, persona, gender 
        FROM bot_accounts 
        WHERE id = ?
      `, botId);
    }
    
    return bot;
  } catch (error) {
    electronLog.error('Get bot error:', error);
    throw error;
  }
}

async function createBot(userId, botData) {
  try {
    let result;
    
    // Check if we're using sqlite3 or better-sqlite3
    if (db.prepare) {
      // better-sqlite3
      result = db.prepare(`
        INSERT INTO bot_accounts (user_id, bot_name, platform, username, password, signup_url, stream_key, persona, gender)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userId,
        botData.name,
        botData.platform,
        botData.username,
        botData.password,
        botData.signupUrl,
        botData.streamKey,
        botData.persona,
        botData.gender
      );
      
      return { success: true, botId: result.lastInsertRowid };
    } else {
      // sqlite3
      result = await db.run(`
        INSERT INTO bot_accounts (user_id, bot_name, platform, username, password, signup_url, stream_key, persona, gender)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        userId,
        botData.name,
        botData.platform,
        botData.username,
        botData.password,
        botData.signupUrl,
        botData.streamKey,
        botData.persona,
        botData.gender
      );
      
      return { success: true, botId: result.lastID };
    }
  } catch (error) {
    electronLog.error('Create bot error:', error);
    return { success: false, message: error.message };
  }
}

async function updateBotPersonality(botId, personalityData) {
  try {
    // Check if we're using sqlite3 or better-sqlite3
    if (db.prepare) {
      // better-sqlite3
      db.prepare(`
        UPDATE bot_accounts 
        SET persona = ?, gender = ? 
        WHERE id = ?
      `).run(
        personalityData.persona,
        personalityData.gender,
        botId
      );
    } else {
      // sqlite3
      await db.run(`
        UPDATE bot_accounts 
        SET persona = ?, gender = ? 
        WHERE id = ?
      `,
        personalityData.persona,
        personalityData.gender,
        botId
      );
    }
    
    return { success: true };
  } catch (error) {
    electronLog.error('Update bot personality error:', error);
    return { success: false, message: error.message };
  }
}

// IPC handlers for renderer process communication
ipcMain.on('start-bots', startAllBots);
ipcMain.on('stop-bots', stopAllBots);

ipcMain.handle('get-config', async () => {
  try {
    const configPath = path.join(app.getPath('userData'), 'config.json');
    const configFile = await fs.readFile(configPath, 'utf8');
    return JSON.parse(configFile);
  } catch (error) {
    electronLog.error('Failed to read config:', error);
    return null;
  }
});

ipcMain.handle('save-config', async (event, config) => {
  try {
    const configPath = path.join(app.getPath('userData'), 'config.json');
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    return { success: true };
  } catch (error) {
    electronLog.error('Failed to save config:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('send-director-command', async (event, command) => {
  try {
    // Implementation depends on how the master process handles commands
    mainWindow.webContents.send('director-command-sent', command);
    return { success: true };
  } catch (error) {
    electronLog.error('Failed to send director command:', error);
    return { success: false, error: error.message };
  }
});

// User authentication handlers
ipcMain.handle('authenticate-user', async (event, { username, password }) => {
  return await authenticateUser(username, password);
});

ipcMain.handle('register-user', async (event, { username, password }) => {
  return await registerUser(username, password);
});

ipcMain.handle('save-user-settings', async (event, { userId, settings }) => {
  return await saveUserSettings(userId, settings);
});

ipcMain.handle('get-user-settings', async (event, { userId }) => {
  return await getUserSettings(userId);
});

ipcMain.handle('get-user-bots', async (event, { userId }) => {
  return await getBotsByUser(userId);
});

ipcMain.handle('get-bot', async (event, { botId }) => {
  return await getBotById(botId);
});

ipcMain.handle('create-bot', async (event, { userId, botData }) => {
  return await createBot(userId, botData);
});

ipcMain.handle('update-bot-personality', async (event, { botId, personalityData }) => {
  return await updateBotPersonality(botId, personalityData);
});

// App lifecycle events
app.on('ready', async () => {
  await initDatabase();
  createWindow();
  
  // Copy default config to user data directory if it doesn't exist
  const userConfigPath = path.join(app.getPath('userData'), 'config.json');
  const defaultConfigPath = path.join(__dirname, '../config.json');
  
  fs.access(userConfigPath)
    .catch(async () => {
      try {
        const defaultConfig = await fs.readFile(defaultConfigPath, 'utf8');
        await fs.writeFile(userConfigPath, defaultConfig);
        electronLog.info('Created default config in user data directory');
      } catch (error) {
        electronLog.error('Failed to create default config:', error);
      }
    });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('quit', () => {
  stopAllBots();
  
  // Close database connection
  if (db) {
    if (typeof db.close === 'function') {
      db.close();
    }
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  electronLog.error('Uncaught exception:', error);
  dialog.showErrorBox('Error', `An unexpected error occurred: ${error.message}`);
});