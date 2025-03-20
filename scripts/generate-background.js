// generate-background.js - Generate a placeholder background image for streaming

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Define background image path
const backgroundPath = path.join(__dirname, '../static_background.png');

/**
 * Generate a simple SVG background
 * @param {number} width - Background width in pixels
 * @param {number} height - Background height in pixels
 * @returns {string} - SVG content
 */
function generateSvgBackground(width = 1920, height = 1080) {
  const primaryColor = '#4a6cf7';
  const secondaryColor = '#6c757d';
  
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${primaryColor};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${secondaryColor};stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#grad1)" />
  <text x="${width / 2}" y="${height / 2}" font-family="Arial" font-size="72" fill="white" text-anchor="middle" dominant-baseline="middle">Multi-Platform AI Bots</text>
  <text x="${width / 2}" y="${height / 2 + 100}" font-family="Arial" font-size="36" fill="white" text-anchor="middle" dominant-baseline="middle">Streaming Background</text>
</svg>`;
}

/**
 * Save a placeholder background image
 * This is a placeholder. In a real app, you would use a proper SVG to PNG converter.
 * @param {string} svgContent - SVG content
 * @param {string} outputPath - Output path for the PNG file
 */
async function savePlaceholderBackground(svgContent, outputPath) {
  try {
    // Create a simple text file with the SVG content
    // In a real app, this would be a proper PNG file
    await fs.writeFile(outputPath, svgContent);
    console.log(`Generated placeholder background: ${outputPath}`);
  } catch (error) {
    console.error(`Error generating background:`, error);
  }
}

/**
 * Main function to generate the background
 */
async function generateBackground() {
  try {
    const svgContent = generateSvgBackground();
    await savePlaceholderBackground(svgContent, backgroundPath);
    console.log('Background generated successfully');
  } catch (error) {
    console.error('Error generating background:', error);
  }
}

// Run the background generation
generateBackground();