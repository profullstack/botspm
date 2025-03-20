#!/usr/bin/env node

/**
 * This script creates placeholder icon files for the Electron app.
 * Instead of generating actual icons, it downloads placeholders from a public API.
 * 
 * Usage: node scripts/generate-icons.js
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import fetch from 'node-fetch';

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// Create directories
async function createDirectories() {
  const directories = [
    path.join(rootDir, 'assets'),
    path.join(rootDir, 'assets/icons'),
    path.join(rootDir, 'assets/icons/png'),
    path.join(rootDir, 'assets/icons/mac'),
    path.join(rootDir, 'assets/icons/win')
  ];

  for (const dir of directories) {
    try {
      await fs.mkdir(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    } catch (error) {
      if (error.code !== 'EEXIST') {
        console.error(`Error creating directory ${dir}:`, error);
      }
    }
  }
}

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
    
    console.log(`Image saved to: ${outputPath}`);
    return true;
  } catch (error) {
    console.error(`Error downloading image to ${outputPath}:`, error);
    return false;
  }
}

/**
 * Creates a simple placeholder file with text content
 * @param {string} filePath - The path where the file will be saved
 * @param {string} content - The content to write to the file
 */
async function createPlaceholderFile(filePath, content) {
  try {
    await fs.writeFile(filePath, content);
    console.log(`Created placeholder file: ${filePath}`);
  } catch (error) {
    console.error(`Error creating file ${filePath}:`, error);
  }
}

// Main function
async function main() {
  try {
    console.log('Generating icon placeholders...');
    await createDirectories();
    
    // Create placeholder files for non-PNG formats
    await createPlaceholderFile(
      path.join(rootDir, 'assets/icons/mac/icon.icns'),
      '# This is a placeholder for the macOS icon file (.icns)\n# In a real application, this would be a binary file'
    );
    
    await createPlaceholderFile(
      path.join(rootDir, 'assets/icons/win/icon.ico'),
      '# This is a placeholder for the Windows icon file (.ico)\n# In a real application, this would be a binary file'
    );
    
    // Download PNG icons of different sizes
    const sizes = [16, 32, 48, 64, 128, 256, 512];
    const downloadPromises = sizes.map(size => {
      const outputPath = path.join(rootDir, `assets/icons/png/${size}x${size}.png`);
      const imageUrl = `https://picsum.photos/${size}/${size}?random=${Date.now() + size}`;
      return downloadImage(imageUrl, outputPath);
    });
    
    await Promise.all(downloadPromises);
    
    console.log('Icon placeholders generated successfully!');
    console.log('Note: Replace these placeholders with actual icons before building the application.');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

main();