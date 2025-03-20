// web-server.js - Simple Express server for the bots.pm web application

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import serveStatic from 'serve-static';
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

// Initialize Express app
const app = express();
const PORT = process.env.WEB_PORT || 8080;

// Serve static files from the web directory
app.use(serveStatic(path.join(__dirname, 'web')));

// Serve static files from the public directory
app.use(serveStatic(path.join(__dirname, '../public')));

// Serve static files from the assets directory
app.use('/assets', serveStatic(path.join(__dirname, '../assets')));

// API proxy
app.use('/api', (req, res) => {
  const apiUrl = process.env.API_URL || 'http://localhost:3000/api';
  const targetUrl = `${apiUrl}${req.url}`;
  
  // Forward the request to the API server
  fetch(targetUrl, {
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      ...req.headers
    },
    body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined
  })
  .then(response => response.json())
  .then(data => res.json(data))
  .catch(error => {
    logger.error('API proxy error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  });
});

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'web/index.html'));
});

// Start the server
app.listen(PORT, () => {
  logger.info(`Web server running on port ${PORT}`);
});