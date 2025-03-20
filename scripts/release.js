#!/usr/bin/env node

/**
 * release.js - Script to build and release bots.pm for all platforms
 * 
 * This script:
 * 1. Builds the application for Windows, macOS, and Linux
 * 2. Creates a GitHub release
 * 3. Uploads the built binaries to the release
 * 
 * Requirements:
 * - GitHub CLI (gh) installed and authenticated
 * - @octokit/rest package installed
 * - Appropriate signing certificates for macOS builds
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Octokit } from '@octokit/rest';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));

// GitHub repository information
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = process.env.REPO_OWNER || 'yourusername';
const REPO_NAME = process.env.REPO_NAME || 'botspm';

// Version information
const version = packageJson.version;
const releaseTag = `v${version}`;

// Check if GitHub token is available
if (!GITHUB_TOKEN) {
  console.error('Error: GITHUB_TOKEN environment variable is not set.');
  console.error('Please set it in your .env file or as an environment variable.');
  process.exit(1);
}

// Initialize Octokit
const octokit = new Octokit({
  auth: GITHUB_TOKEN
});

/**
 * Executes a shell command and returns the output
 * @param {string} command - Command to execute
 * @param {Object} options - Options for child_process.execSync
 * @returns {string} Command output
 */
function exec(command, options = {}) {
  console.log(`Executing: ${command}`);
  try {
    return execSync(command, {
      cwd: rootDir,
      stdio: 'inherit',
      ...options
    });
  } catch (error) {
    console.error(`Command failed: ${command}`);
    console.error(error);
    process.exit(1);
  }
}

/**
 * Builds the application for all platforms
 */
async function buildAll() {
  console.log('Building application for all platforms...');
  
  // Clean dist directory
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  
  // Build for all platforms
  exec('pnpm run build:all');
  
  console.log('Build completed successfully.');
}

/**
 * Creates a GitHub release
 * @returns {Object} Release data
 */
async function createRelease() {
  console.log(`Creating GitHub release ${releaseTag}...`);
  
  try {
    // Check if release already exists
    try {
      const { data: release } = await octokit.repos.getReleaseByTag({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        tag: releaseTag
      });
      
      console.log(`Release ${releaseTag} already exists. Deleting it...`);
      
      await octokit.repos.deleteRelease({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        release_id: release.id
      });
      
      // Also delete the tag
      try {
        await octokit.git.deleteRef({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          ref: `tags/${releaseTag}`
        });
      } catch (error) {
        console.log('Tag might not exist, continuing...');
      }
    } catch (error) {
      // Release doesn't exist, which is fine
    }
    
    // Create a new release
    const { data: release } = await octokit.repos.createRelease({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      tag_name: releaseTag,
      name: `bots.pm ${version}`,
      body: `Release of bots.pm version ${version}.\n\nSee CHANGELOG.md for details.`,
      draft: false,
      prerelease: false
    });
    
    console.log(`Release created: ${release.html_url}`);
    return release;
  } catch (error) {
    console.error('Failed to create release:', error);
    process.exit(1);
  }
}

/**
 * Uploads assets to the GitHub release
 * @param {Object} release - Release data
 */
async function uploadAssets(release) {
  console.log('Uploading assets to GitHub release...');
  
  // Find all assets in the dist directory
  const assets = [];
  
  // Windows assets
  const winAssets = fs.readdirSync(distDir)
    .filter(file => file.endsWith('.exe') || file.endsWith('.msi') || file.endsWith('.appx'))
    .map(file => path.join(distDir, file));
  
  // macOS assets
  const macAssets = fs.readdirSync(distDir)
    .filter(file => file.endsWith('.dmg') || file.endsWith('.pkg') || (file.endsWith('.zip') && file.includes('mac')))
    .map(file => path.join(distDir, file));
  
  // Linux assets
  const linuxAssets = fs.readdirSync(distDir)
    .filter(file => file.endsWith('.AppImage') || file.endsWith('.deb') || file.endsWith('.rpm') || file.endsWith('.snap'))
    .map(file => path.join(distDir, file));
  
  assets.push(...winAssets, ...macAssets, ...linuxAssets);
  
  if (assets.length === 0) {
    console.error('No assets found in the dist directory.');
    process.exit(1);
  }
  
  // Upload each asset
  for (const asset of assets) {
    const fileName = path.basename(asset);
    console.log(`Uploading ${fileName}...`);
    
    try {
      const fileSize = fs.statSync(asset).size;
      const fileData = fs.readFileSync(asset);
      
      await octokit.repos.uploadReleaseAsset({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        release_id: release.id,
        name: fileName,
        data: fileData,
        headers: {
          'content-type': 'application/octet-stream',
          'content-length': fileSize
        }
      });
      
      console.log(`Uploaded ${fileName} successfully.`);
    } catch (error) {
      console.error(`Failed to upload ${fileName}:`, error);
    }
  }
}

/**
 * Main function
 */
async function main() {
  console.log(`Starting release process for bots.pm ${version}...`);
  
  try {
    // Build the application
    await buildAll();
    
    // Create GitHub release
    const release = await createRelease();
    
    // Upload assets
    await uploadAssets(release);
    
    console.log(`Release ${releaseTag} completed successfully!`);
    console.log(`Release URL: ${release.html_url}`);
  } catch (error) {
    console.error('Release process failed:', error);
    process.exit(1);
  }
}

// Run the main function
main();