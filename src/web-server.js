// web-server.js - Hono server for the bots.pm web application

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { serveStatic } from 'hono/serve-static';
import { logger as honoLogger } from 'hono/logger';
import { fileURLToPath } from 'url';
import path from 'path';
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
      filename: path.join(__dirname, '../logs/web-server.log') 
    })
  ]
});

// Initialize Hono app
const app = new Hono();
const PORT = process.env.WEB_PORT || 8080;

// Middleware
app.use('*', honoLogger());

// Serve static files from the web directory
app.use('/*', serveStatic({ root: path.join(__dirname, 'web') }));

// Serve static files from the public directory
app.use('/*', serveStatic({ root: path.join(__dirname, '../public') }));

// Serve static files from the assets directory
app.use('/assets/*', serveStatic({ root: path.join(__dirname, '../assets') }));

// API proxy
app.all('/api/*', async (c) => {
  try {
    const apiUrl = process.env.API_URL || 'http://localhost:3000/api';
    const targetUrl = `${apiUrl}${c.req.path.replace('/api', '')}`;
    
    // Forward the request to the API server
    const response = await fetch(targetUrl, {
      method: c.req.method,
      headers: {
        'Content-Type': 'application/json',
        ...Object.fromEntries(c.req.headers)
      },
      body: c.req.method !== 'GET' && c.req.method !== 'HEAD' ? await c.req.json() : undefined
    });
    
    const data = await response.json();
    return c.json(data);
  } catch (error) {
    logger.error('API proxy error:', error);
    return c.json({ 
      success: false, 
      message: error.message 
    }, 500);
  }
});

// Serve index.html for all other routes (SPA support)
app.get('*', (c) => {
  return c.html(path.join(__dirname, 'web/index.html'));
});

// Start the server
async function startServer() {
  try {
    serve({
      fetch: app.fetch,
      port: PORT
    });
    
    logger.info(`Web server running on port ${PORT}`);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down web server...');
  process.exit(0);
});

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}

export { app, startServer };