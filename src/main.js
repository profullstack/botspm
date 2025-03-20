// main.js - Electron main process for Multi-Platform AI Bots desktop application

import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { spawn } from 'child_process';
import electronLog from 'electron-log';
import Store from 'electron-store';
import dotenv from 'dotenv';
import { masterProcess } from './master.js';

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
let botProcesses = [];

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
    title: 'Multi-Platform AI Bots',
    icon: path.join(__dirname, '../assets/icons/png/64x64.png'),
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
              title: 'About Multi-Platform AI Bots',
              message: 'Multi-Platform AI Bots',
              detail: `Version: ${app.getVersion()}\nElectron: ${process.versions.electron}\nChrome: ${process.versions.chrome}\nNode.js: ${process.versions.node}\nV8: ${process.versions.v8}`,
              buttons: ['OK'],
              icon: path.join(__dirname, '../assets/icons/png/64x64.png')
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
    
    mainWindow.webContents.send('bots-started');
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
  
  if (mainWindow) {
    mainWindow.webContents.send('bots-stopped');
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

// App lifecycle events
app.on('ready', () => {
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
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  electronLog.error('Uncaught exception:', error);
  dialog.showErrorBox('Error', `An unexpected error occurred: ${error.message}`);
});