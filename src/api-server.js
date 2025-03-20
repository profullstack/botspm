// api-server.js - Hono API server for bots.pm

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger as honoLogger } from 'hono/logger';
import { jwt } from 'hono/jwt';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import CryptoJS from 'crypto-js';
import dotenv from 'dotenv';
import winston from 'winston';

// Load environment variables
dotenv.config();

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ 
      filename: path.join(__dirname, '../logs/api-server.log') 
    })
  ]
});

// Initialize Hono app
const app = new Hono();
const PORT = process.env.API_PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // In production, use a secure secret

// Database connection
let db;

/**
 * Initialize the database
 */
async function initDatabase() {
  try {
    const dbPath = path.join(__dirname, '../data/bots.sqlite');
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(dbPath), { recursive: true });
    
    // Open database
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
    
    logger.info('Database initialized successfully');
  } catch (error) {
    logger.error('Database initialization error:', error);
    throw error;
  }
}

// Middleware
app.use('*', cors());
app.use('*', honoLogger());

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', version: '1.0.0' });
});

// Auth routes
app.post('/auth/login', async (c) => {
  try {
    const { username, password } = await c.req.json();
    
    if (!username || !password) {
      return c.json({ 
        success: false, 
        message: 'Username and password are required' 
      }, 400);
    }
    
    const user = await db.get('SELECT id, username, password FROM users WHERE username = ?', username);
    
    if (!user) {
      return c.json({ 
        success: false, 
        message: 'User not found' 
      }, 401);
    }
    
    // Verify password
    const hashedPassword = CryptoJS.SHA256(password).toString();
    const passwordMatch = hashedPassword === user.password;
    
    if (!passwordMatch) {
      return c.json({ 
        success: false, 
        message: 'Invalid password' 
      }, 401);
    }
    
    // Generate JWT token
    const payload = {
      userId: user.id,
      username: user.username
    };
    
    const token = await generateJWT(payload);
    
    return c.json({ 
      success: true, 
      userId: user.id, 
      username: user.username,
      token
    });
  } catch (error) {
    logger.error('Authentication error:', error);
    return c.json({ 
      success: false, 
      message: error.message 
    }, 500);
  }
});

app.post('/auth/register', async (c) => {
  try {
    const { username, password } = await c.req.json();
    
    if (!username || !password) {
      return c.json({ 
        success: false, 
        message: 'Username and password are required' 
      }, 400);
    }
    
    // Check if username exists (case-insensitive)
    const row = await db.get('SELECT COUNT(*) as count FROM users WHERE LOWER(username) = LOWER(?)', username);
    const existingUser = row && row.count > 0;
    
    if (existingUser) {
      return c.json({ 
        success: false, 
        message: 'Username already exists' 
      }, 409);
    }
    
    // Hash password
    const hashedPassword = CryptoJS.SHA256(password).toString();
    
    // Insert new user
    const result = await db.run(
      'INSERT INTO users (username, password) VALUES (?, ?)', 
      username, 
      hashedPassword
    );
    
    return c.json({ 
      success: true, 
      userId: result.lastID 
    }, 201);
  } catch (error) {
    logger.error('Registration error:', error);
    return c.json({ 
      success: false, 
      message: error.message 
    }, 500);
  }
});

// Protected routes middleware
const auth = jwt({
  secret: JWT_SECRET
});

// User settings routes
app.get('/users/:userId/settings', auth, async (c) => {
  try {
    const { userId } = c.req.param();
    
    // Verify user has access to these settings
    if (c.get('jwtPayload').userId !== parseInt(userId)) {
      return c.json({ success: false, message: 'Unauthorized' }, 403);
    }
    
    const rows = await db.all('SELECT key, value FROM user_settings WHERE user_id = ?', userId);
    
    const settings = {};
    rows.forEach(row => {
      settings[row.key] = row.value;
    });
    
    return c.json(settings);
  } catch (error) {
    logger.error('Get settings error:', error);
    return c.json({ 
      success: false, 
      message: error.message 
    }, 500);
  }
});

app.post('/users/:userId/settings', auth, async (c) => {
  try {
    const { userId } = c.req.param();
    const settings = await c.req.json();
    
    // Verify user has access
    if (c.get('jwtPayload').userId !== parseInt(userId)) {
      return c.json({ success: false, message: 'Unauthorized' }, 403);
    }
    
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
    
    return c.json({ success: true });
  } catch (error) {
    // Rollback transaction on error
    await db.run('ROLLBACK');
    
    logger.error('Save settings error:', error);
    return c.json({ 
      success: false, 
      message: error.message 
    }, 500);
  }
});

// Bot management routes
app.get('/users/:userId/bots', auth, async (c) => {
  try {
    const { userId } = c.req.param();
    
    // Verify user has access
    if (c.get('jwtPayload').userId !== parseInt(userId)) {
      return c.json({ success: false, message: 'Unauthorized' }, 403);
    }
    
    const bots = await db.all(`
      SELECT id, bot_name, platform, username, stream_key, persona, gender 
      FROM bot_accounts 
      WHERE user_id = ?
    `, userId);
    
    return c.json(bots);
  } catch (error) {
    logger.error('Get bots error:', error);
    return c.json({ 
      success: false, 
      message: error.message 
    }, 500);
  }
});

app.get('/bots/:botId', auth, async (c) => {
  try {
    const { botId } = c.req.param();
    
    const bot = await db.get(`
      SELECT id, user_id, bot_name, platform, username, password, signup_url, stream_key, persona, gender 
      FROM bot_accounts 
      WHERE id = ?
    `, botId);
    
    if (!bot) {
      return c.json({ 
        success: false, 
        message: 'Bot not found' 
      }, 404);
    }
    
    // Verify user has access to this bot
    if (c.get('jwtPayload').userId !== bot.user_id) {
      return c.json({ success: false, message: 'Unauthorized' }, 403);
    }
    
    return c.json(bot);
  } catch (error) {
    logger.error('Get bot error:', error);
    return c.json({ 
      success: false, 
      message: error.message 
    }, 500);
  }
});

app.post('/users/:userId/bots', auth, async (c) => {
  try {
    const { userId } = c.req.param();
    const botData = await c.req.json();
    
    // Verify user has access
    if (c.get('jwtPayload').userId !== parseInt(userId)) {
      return c.json({ success: false, message: 'Unauthorized' }, 403);
    }
    
    const result = await db.run(`
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
    
    return c.json({ 
      success: true, 
      botId: result.lastID 
    }, 201);
  } catch (error) {
    logger.error('Create bot error:', error);
    return c.json({ 
      success: false, 
      message: error.message 
    }, 500);
  }
});

app.put('/bots/:botId/personality', auth, async (c) => {
  try {
    const { botId } = c.req.param();
    const personalityData = await c.req.json();
    
    // Get bot to verify ownership
    const bot = await db.get('SELECT user_id FROM bot_accounts WHERE id = ?', botId);
    
    if (!bot) {
      return c.json({ success: false, message: 'Bot not found' }, 404);
    }
    
    // Verify user has access to this bot
    if (c.get('jwtPayload').userId !== bot.user_id) {
      return c.json({ success: false, message: 'Unauthorized' }, 403);
    }
    
    await db.run(`
      UPDATE bot_accounts 
      SET persona = ?, gender = ? 
      WHERE id = ?
    `,
      personalityData.persona,
      personalityData.gender,
      botId
    );
    
    return c.json({ success: true });
  } catch (error) {
    logger.error('Update bot personality error:', error);
    return c.json({ 
      success: false, 
      message: error.message 
    }, 500);
  }
});

// Director commands
app.post('/director/commands', auth, async (c) => {
  try {
    const { command } = await c.req.json();
    const userId = c.get('jwtPayload').userId;
    
    if (!command || typeof command !== 'string' || !command.trim()) {
      return c.json({ 
        success: false, 
        message: 'Command is required' 
      }, 400);
    }
    
    await db.run(
      'INSERT INTO director_commands (user_id, command) VALUES (?, ?)',
      userId,
      command
    );
    
    return c.json({ success: true });
  } catch (error) {
    logger.error('Director command error:', error);
    return c.json({ 
      success: false, 
      message: error.message 
    }, 500);
  }
});

// Helper function to generate JWT
async function generateJWT(payload) {
  // In a real app, use a proper JWT library
  // This is a simplified version for demonstration
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  
  const signature = CryptoJS.HmacSHA256(`${encodedHeader}.${encodedPayload}`, JWT_SECRET).toString(CryptoJS.enc.Base64url);
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// Start the server
async function startServer() {
  try {
    await initDatabase();
    
    serve({
      fetch: app.fetch,
      port: PORT
    });
    
    logger.info(`API server running on port ${PORT}`);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down API server...');
  
  if (db) {
    await db.close();
    logger.info('Database connection closed');
  }
  
  process.exit(0);
});

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}

export { app, startServer };