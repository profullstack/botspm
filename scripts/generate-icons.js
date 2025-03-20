// generate-icons.js - Generate placeholder icons for the application

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Define icon sizes
const pngSizes = [16, 32, 48, 64, 128, 256, 512];
const macIconPath = path.join(__dirname, '../assets/icons/mac/icon.icns');
const winIconPath = path.join(__dirname, '../assets/icons/win/icon.ico');

/**
 * Generate a simple SVG icon with the given size and color
 * @param {number} size - Icon size in pixels
 * @param {string} color - Icon color in hex format
 * @returns {string} - SVG content
 */
function generateSvgIcon(size, color = '#4a6cf7') {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${size / 5}" fill="${color}" />
  <text x="${size / 2}" y="${size / 2 + size / 10}" font-family="Arial" font-size="${size / 2}" fill="white" text-anchor="middle" dominant-baseline="middle">AI</text>
</svg>`;
}

/**
 * Convert SVG to PNG using a simple data URL approach
 * This is a placeholder. In a real app, you would use a proper SVG to PNG converter.
 * @param {string} svgContent - SVG content
 * @param {string} outputPath - Output path for the PNG file
 */
async function savePlaceholderPng(svgContent, outputPath) {
  try {
    // Create a simple text file with the SVG content
    // In a real app, this would be a proper PNG file
    await fs.writeFile(outputPath, svgContent);
    console.log(`Generated placeholder icon: ${outputPath}`);
  } catch (error) {
    console.error(`Error generating icon ${outputPath}:`, error);
  }
}

/**
 * Create a placeholder .icns file (Mac icon)
 * In a real app, this would be a proper .icns file
 * @param {string} outputPath - Output path for the .icns file
 */
async function savePlaceholderIcns(outputPath) {
  try {
    // Create a simple text file as a placeholder
    await fs.writeFile(outputPath, 'Placeholder for Mac icon (.icns)');
    console.log(`Generated placeholder Mac icon: ${outputPath}`);
  } catch (error) {
    console.error(`Error generating Mac icon:`, error);
  }
}

/**
 * Create a placeholder .ico file (Windows icon)
 * In a real app, this would be a proper .ico file
 * @param {string} outputPath - Output path for the .ico file
 */
async function savePlaceholderIco(outputPath) {
  try {
    // Create a simple text file as a placeholder
    await fs.writeFile(outputPath, 'Placeholder for Windows icon (.ico)');
    console.log(`Generated placeholder Windows icon: ${outputPath}`);
  } catch (error) {
    console.error(`Error generating Windows icon:`, error);
  }
}

/**
 * Main function to generate all icons
 */
async function generateIcons() {
  try {
    // Create directories if they don't exist
    await fs.mkdir(path.join(__dirname, '../assets/icons/png'), { recursive: true });
    await fs.mkdir(path.join(__dirname, '../assets/icons/mac'), { recursive: true });
    await fs.mkdir(path.join(__dirname, '../assets/icons/win'), { recursive: true });
    
    // Generate PNG icons of different sizes
    for (const size of pngSizes) {
      const svgContent = generateSvgIcon(size);
      const outputPath = path.join(__dirname, `../assets/icons/png/${size}x${size}.png`);
      await savePlaceholderPng(svgContent, outputPath);
    }
    
    // Generate Mac icon
    await savePlaceholderIcns(macIconPath);
    
    // Generate Windows icon
    await savePlaceholderIco(winIconPath);
    
    console.log('All icons generated successfully');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

// Run the icon generation
generateIcons();