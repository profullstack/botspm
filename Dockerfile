FROM node:18-slim

# Install dependencies for Puppeteer and FFmpeg
RUN apt-get update && apt-get install -y \
    ffmpeg \
    chromium \
    fonts-freefont-ttf \
    libfreetype6 \
    libfreetype6-dev \
    libpng-dev \
    libjpeg-dev \
    libcairo2-dev \
    libgif-dev \
    build-essential \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables for Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Create app directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy app source
COPY . .

# Generate background image
RUN npm run generate-background

# Expose port if needed (e.g., for a web interface)
# EXPOSE 3000

# Run the application
CMD ["npm", "start"]