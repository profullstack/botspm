#!/usr/bin/env node

/**
 * This script creates a placeholder background image for streaming.
 * Instead of generating an actual image, it downloads a placeholder from a public API.
 * 
 * Usage: node scripts/generate-background.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import fetch from 'node-fetch';

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.join(__dirname, '..', 'static_background.png');

/**
 * Downloads an image from a URL and saves it to the specified path
 * @param {string} url - The URL of the image to download
 * @param {string} outputPath - The path where the image will be saved
 */
async function downloadImage(url, outputPath) {
  console.log(`Downloading image from ${url}...`);
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }
    
    const fileStream = createWriteStream(outputPath);
    await pipeline(response.body, fileStream);
    
    console.log(`Background image saved to: ${outputPath}`);
  } catch (error) {
    console.error('Error downloading image:', error);
    createFallbackImage(outputPath);
  }
}

/**
 * Creates a simple fallback image if download fails
 * @param {string} outputPath - The path where the image will be saved
 */
function createFallbackImage(outputPath) {
  console.log('Creating fallback image...');
  
  // Create a simple 1x1 pixel PNG (minimal valid PNG)
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
    0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
    0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xDD, 0x8D, 0xB0, 0x00, 0x00, 0x00,
    0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
  ]);
  
  try {
    fs.writeFileSync(outputPath, pngHeader);
    console.log(`Fallback image created at: ${outputPath}`);
  } catch (error) {
    console.error('Error creating fallback image:', error);
  }
}

// Main function
async function main() {
  // Use a placeholder image service
  const width = 1280;
  const height = 720;
  const imageUrl = `https://picsum.photos/${width}/${height}?random=${Date.now()}`;
  
  await downloadImage(imageUrl, outputPath);
}

main().catch(console.error);