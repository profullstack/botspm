# bots.pm

![bots.pm Logo](assets/logo.svg)

[![Electron](https://img.shields.io/badge/Electron-47848F?logo=electron&logoColor=fff&style=for-the-badge)](https://www.electronjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=fff&style=for-the-badge)](https://nodejs.org/)
[![Web Components](https://img.shields.io/badge/Web%20Components-29ABE2?logo=webcomponents.org&logoColor=fff&style=for-the-badge)](https://www.webcomponents.org/)
[![Puppeteer](https://img.shields.io/badge/Puppeteer-40B5A4?logo=puppeteer&logoColor=fff&style=for-the-badge)](https://pptr.dev/)
[![SQLite](https://img.shields.io/badge/SQLite-003B57?logo=sqlite&logoColor=fff&style=for-the-badge)](https://www.sqlite.org/)
[![pnpm](https://img.shields.io/badge/pnpm-F69220?logo=pnpm&logoColor=fff&style=for-the-badge)](https://pnpm.io/)
[![FFmpeg](https://img.shields.io/badge/FFmpeg-007808?logo=ffmpeg&logoColor=fff&style=for-the-badge)](https://ffmpeg.org/)
[![Winston](https://img.shields.io/badge/Winston-231F20?logo=winston&logoColor=fff&style=for-the-badge)](https://github.com/winstonjs/winston)
[![dotenv](https://img.shields.io/badge/dotenv-ECD53F?logo=dotenv&logoColor=000&style=for-the-badge)](https://github.com/motdotla/dotenv)
[![CryptoJS](https://img.shields.io/badge/CryptoJS-000000?logo=crypto&logoColor=fff&style=for-the-badge)](https://github.com/brix/crypto-js)

A desktop application for managing multiple AI bots across streaming platforms like YouTube, TikTok, and X.com.

## Overview

bots.pm allows content creators to run multiple AI-powered bots across different streaming platforms simultaneously. Each bot can have its own unique personality, voice, and behavior, creating engaging and interactive experiences for viewers.

The application provides a unified dashboard for managing all bots, with real-time control and monitoring capabilities. It integrates with popular streaming platforms and uses advanced AI models to generate human-like responses to viewer interactions.

## Features

bots.pm offers a wide range of features, including:

- **Multi-Platform Support**: Run bots on TikTok, YouTube, and X.com simultaneously
- **Customizable Bot Personalities**: Create unique personas for each bot
- **Director Mode**: Send real-time instructions to all active bots
- **AI-Powered Responses**: Generate natural, contextually appropriate responses
- **Text-to-Speech**: Convert bot responses to natural-sounding speech
- **Stream Management**: Manage RTMP streams across platforms
- **User-Friendly Interface**: Intuitive dashboard for bot management
- **System Tray Integration**: Quick access and background operation

For a complete list of features, see [FEATURES.md](FEATURES.md).

## Installation

### Prerequisites

- Node.js (v16.0.0 or higher)
- pnpm (v8.0.0 or higher)
- FFmpeg (for audio/video processing)

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/bots.pm.git
   cd bots.pm
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Create a `.env` file based on the provided `.env.sample`:
   ```bash
   cp .env.sample .env
   ```

4. Run the setup script:
   ```bash
   pnpm setup
   ```

5. Start the application:
   ```bash
   pnpm dev
   ```

## Usage

### First-Time Setup

1. Launch the application
2. Create a user account or log in
3. Complete the initial setup wizard
4. Configure your API keys in the Settings panel

### Creating a Bot

1. Navigate to the Bots section
2. Click "Create New Bot"
3. Enter bot details (name, platform, personality)
4. Configure platform-specific settings
5. Save the bot configuration

### Running Bots

1. Select the bots you want to run
2. Click "Start Selected Bots" or "Start All Bots"
3. Monitor bot activity in the dashboard
4. Use Director Mode to send instructions to bots in real-time

## Development

### Project Structure

```
bots.pm/
├── assets/            # Application assets (icons, images)
├── bin/               # Binary scripts
├── data/              # Application data storage
├── public/            # Public static files
├── scripts/           # Utility scripts
├── src/               # Source code
│   ├── ui/            # UI components and frontend logic
│   │   ├── components/  # Web components
│   │   └── app.js       # Main application logic
│   ├── main.js        # Electron main process
│   ├── master.js      # Bot management logic
│   └── preload.js     # Electron preload script
└── config.json        # Application configuration
```

### Building

To build the application for production:

```bash
pnpm build
```

This will create platform-specific builds in the `dist` directory.

### Releasing

To create a new release with binaries for all platforms:

1. Update the version in `package.json`
2. Ensure your `.env` file contains GitHub credentials:
   ```
   GITHUB_TOKEN=your_github_personal_access_token
   REPO_OWNER=yourusername
   REPO_NAME=bots.pm
   ```
3. Run the release script:
   ```bash
   pnpm release
   ```

This will:
- Build the application for Windows, macOS, and Linux
- Create a GitHub release with the current version
- Upload all binaries to the release

### Testing

To run tests:

```bash
pnpm test
```

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Electron](https://www.electronjs.org/) - Desktop application framework
- [OpenAI](https://openai.com/) - AI language models
- [FFmpeg](https://ffmpeg.org/) - Audio/video processing
- [Puppeteer](https://pptr.dev/) - Browser automation