#!/bin/bash

# setup.sh - Setup script for Multi-Platform AI Bots

# Make script exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Setting up Multi-Platform AI Bots...${NC}"

# Check Node.js version
NODE_VERSION=$(node -v)
REQUIRED_VERSION="v20"

if [[ $NODE_VERSION != $REQUIRED_VERSION* ]]; then
  echo -e "${YELLOW}Warning: You are using Node.js $NODE_VERSION, but this project requires Node.js $REQUIRED_VERSION.x${NC}"
  
  if command -v nvm &> /dev/null; then
    echo -e "${GREEN}NVM detected. Attempting to switch to Node.js v20...${NC}"
    nvm use 20 || nvm install 20
  else
    echo -e "${RED}Please install Node.js v20 before continuing.${NC}"
    echo "Visit https://nodejs.org/ or use a version manager like nvm."
    exit 1
  fi
fi

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
  echo -e "${YELLOW}pnpm is not installed. Installing pnpm...${NC}"
  npm install -g pnpm
fi

# Clean installation
echo -e "${GREEN}Cleaning previous installation...${NC}"
rm -rf node_modules
rm -rf .pnpm-store
rm -f package-lock.json
rm -f pnpm-lock.yaml

# Install dependencies with pnpm
echo -e "${GREEN}Installing dependencies with pnpm...${NC}"

# First install prebuild-install globally to ensure it's available
echo -e "${GREEN}Installing prebuild-install globally...${NC}"
pnpm add -g prebuild-install

# Install dependencies with --shamefully-hoist to make binaries available
echo -e "${GREEN}Installing project dependencies...${NC}"
ELECTRON_SKIP_BINARY_DOWNLOAD=1 pnpm install --shamefully-hoist --no-frozen-lockfile

# Install electron separately to avoid issues
echo -e "${GREEN}Installing Electron...${NC}"
pnpm add electron@28.0.0 --save-dev -w

# Install sqlite3 with specific flags to avoid native build issues
echo -e "${GREEN}Installing sqlite3...${NC}"
pnpm add sqlite3 --build-from-source -w

# Fix Electron installation if needed
if [ ! -f "node_modules/.pnpm/electron@28.0.0*/node_modules/electron/dist/electron" ] && [ ! -f "node_modules/electron/dist/electron" ]; then
  echo -e "${YELLOW}Electron binary not found. Attempting to fix...${NC}"
  
  # Try to install electron globally with pnpm and link it
  pnpm add -g electron@28.0.0
  pnpm link --global electron
  
  # If that doesn't work, try to download the electron binary directly
  if [ ! -f "node_modules/.pnpm/electron@28.0.0*/node_modules/electron/dist/electron" ] && [ ! -f "node_modules/electron/dist/electron" ]; then
    echo -e "${YELLOW}Downloading Electron binary directly...${NC}"
    
    # Determine platform
    PLATFORM=""
    case "$(uname -s)" in
      Linux*)     PLATFORM=linux;;
      Darwin*)    PLATFORM=darwin;;
      CYGWIN*)    PLATFORM=win32;;
      MINGW*)     PLATFORM=win32;;
      *)          PLATFORM="unknown"
    esac
    
    # Determine architecture
    ARCH=""
    case "$(uname -m)" in
      x86_64*)    ARCH=x64;;
      arm64*)     ARCH=arm64;;
      *)          ARCH="unknown"
    esac
    
    if [ "$PLATFORM" != "unknown" ] && [ "$ARCH" != "unknown" ]; then
      ELECTRON_VERSION="28.0.0"
      
      # Create directories for both possible locations
      mkdir -p node_modules/.pnpm/electron@${ELECTRON_VERSION}/node_modules/electron/dist
      mkdir -p node_modules/electron/dist
      
      # Download electron binary
      if [ "$PLATFORM" == "win32" ]; then
        curl -L "https://github.com/electron/electron/releases/download/v$ELECTRON_VERSION/electron-v$ELECTRON_VERSION-$PLATFORM-$ARCH.zip" -o electron.zip
        unzip electron.zip -d node_modules/.pnpm/electron@${ELECTRON_VERSION}/node_modules/electron/dist
        cp -r node_modules/.pnpm/electron@${ELECTRON_VERSION}/node_modules/electron/dist/* node_modules/electron/dist/
        rm electron.zip
      else
        curl -L "https://github.com/electron/electron/releases/download/v$ELECTRON_VERSION/electron-v$ELECTRON_VERSION-$PLATFORM-$ARCH.zip" -o electron.zip
        unzip electron.zip -d node_modules/.pnpm/electron@${ELECTRON_VERSION}/node_modules/electron/dist
        cp -r node_modules/.pnpm/electron@${ELECTRON_VERSION}/node_modules/electron/dist/* node_modules/electron/dist/
        rm electron.zip
      fi
    else
      echo -e "${RED}Could not determine platform or architecture.${NC}"
      echo "Please install Electron manually: pnpm add electron@28.0.0 -w"
    fi
  fi
fi

# Create necessary directories
echo -e "${GREEN}Creating necessary directories...${NC}"
mkdir -p assets/icons/png
mkdir -p assets/icons/mac
mkdir -p assets/icons/win
mkdir -p public/styles/components

# Generate placeholder icons and background
echo -e "${GREEN}Generating placeholder assets...${NC}"
node scripts/generate-icons.js || echo "Skipping icon generation"
node scripts/generate-background.js || echo "Skipping background generation"

echo -e "${GREEN}Setup complete!${NC}"
echo -e "You can now run the application with: ${YELLOW}pnpm dev${NC}"