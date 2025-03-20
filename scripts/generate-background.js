#!/usr/bin/env node

/**
 * This script generates a static background image for streaming.
 * It creates a simple gradient background with text.
 * 
 * Usage: node scripts/generate-background.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createCanvas, registerFont } from 'canvas';

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.join(__dirname, '..', 'static_background.png');

// Create a canvas
const width = 1280;
const height = 720;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// Create a gradient background
const gradient = ctx.createLinearGradient(0, 0, width, height);
gradient.addColorStop(0, '#2c3e50');
gradient.addColorStop(1, '#4ca1af');
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, width, height);

// Add text
ctx.font = 'bold 48px Arial';
ctx.fillStyle = 'white';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('AI Bot Streaming', width / 2, height / 2 - 50);

// Add subtitle
ctx.font = '32px Arial';
ctx.fillText('Multi-Platform Live Session', width / 2, height / 2 + 20);

// Add timestamp
const now = new Date();
ctx.font = '24px Arial';
ctx.fillText(`Generated: ${now.toLocaleString()}`, width / 2, height - 50);

// Save the image
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync(outputPath, buffer);

console.log(`Background image created at: ${outputPath}`);