# Multi-Platform AI Bots

A desktop application for managing multiple AI bots across different streaming platforms (YouTube, X.com, TikTok) with automated account creation, CLI-based director commands, and real-time interaction capabilities.

## Features

- **Multi-Platform Support**: Run bots simultaneously on YouTube, X.com, and TikTok
- **Automated Account Creation**: Streamlined account setup with CAPTCHA solving
- **Director Interface**: Issue real-time instructions to all bots
- **Persona Management**: Configure different personalities and genders for each bot
- **Database Logging**: Store all bot interactions for analysis
- **FFmpeg Integration**: Stream audio and video to multiple platforms
- **Cross-Platform Desktop App**: Built with Electron for Windows, macOS, and Linux
- **Dark Mode Support**: Toggle between light and dark themes
- **Secure Configuration**: Environment variables for sensitive data

## Prerequisites

- Node.js (v16 or higher)
- FFmpeg installed and available in PATH
- 2Captcha API key (for automated account creation)
- OpenAI API key (for GPT responses)

## Installation

### Development Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/multi-platform-ai-bots.git
   cd multi-platform-ai-bots
   ```

2. Install dependencies and generate assets:
   ```
   npm run setup
   ```

3. Configure environment variables:
   ```
   cp .env.example .env
   ```
   Edit the `.env` file with your API keys and configuration.

4. Start the development version:
   ```
   npm run dev
   ```

### Building the Desktop App

#### For All Platforms
```
npm run build
```

#### For Specific Platforms
- **macOS**: `npm run build:mac`
- **Windows**: `npm run build:win`
- **Linux**: `npm run build:linux`

The built applications will be available in the `dist` directory.

## Usage

### Starting the Application

Launch the application by running the executable for your platform:
- **Windows**: `Multi-Platform AI Bots.exe`
- **macOS**: `Multi-Platform AI Bots.app`
- **Linux**: `multi-platform-ai-bots` or `Multi-Platform AI Bots.AppImage`

### Main Interface

The application has three main sections:

1. **Control Panel**: Start/stop all bots and send director commands
2. **Bots Panel**: View and manage individual bots
3. **Logs Panel**: View application logs and bot interactions

### Director Commands

Enter director commands in the input field and click "Send" to broadcast instructions to all active bots. These commands will influence the bots' responses.

Example:
```
Now start using more emotional language
```

### Settings

Access settings by clicking the gear icon in the top-right corner. Here you can configure:

- Dark/Light mode
- Log level
- API keys
- Bot personalities
- Streaming platforms

## Configuration

### Environment Variables

Sensitive configuration is stored in the `.env` file:

- `TWO_CAPTCHA_API_KEY`: Your 2Captcha API key
- `OPENAI_API_KEY`: Your OpenAI API key
- `DATABASE_PATH`: Path to SQLite database
- `LOG_LEVEL`: Logging verbosity (debug, info, warn, error)

### Application Configuration

General configuration is stored in `config.json`:

- `PLATFORMS`: Array of platform configurations
- `BOT_PERSONALITIES`: Array of bot persona definitions
- `FFMPEG_OPTIONS`: FFmpeg streaming parameters
- `INTERACTION_DELAY_MS`: Delay between interaction cycles

## Project Structure

```
multi-platform-ai-bots/
├── src/                  # Main process code
│   ├── main.js           # Electron main process
│   ├── master.js         # Bot management logic
│   └── preload.js        # Electron preload script
├── renderer/             # Renderer process code
│   ├── index.html        # Main UI
│   ├── styles.css        # UI styling
│   └── renderer.js       # UI logic
├── scripts/              # Utility scripts
│   ├── generate-background.js  # Background image generator
│   └── generate-icons.js       # Icon generator
├── assets/               # Application assets
│   └── icons/            # Application icons
├── config.json           # Application configuration
├── .env.example          # Example environment variables
├── package.json          # Node.js dependencies and scripts
├── Dockerfile            # Docker configuration
└── docker-compose.yml    # Docker Compose configuration
```

## Extending

### Adding New Platforms

1. Open the Settings modal
2. Click "Add Platform"
3. Enter the platform details:
   - Name
   - RTMP template
   - Account creation URL

### Adding New Bot Personalities

1. Open the Settings modal
2. Click "Add Personality"
3. Enter the personality details:
   - Persona name
   - Gender (M, F, or random)

### Implementing Real AI Integration

The current implementation uses placeholder functions for:
- `transcribeAudio`: Replace with a real speech-to-text service
- `generateGPTResponse`: Replace with a real LLM API
- `generateTTS`: Replace with a real text-to-speech service

## Docker Support

While the application is primarily designed as a desktop app, Docker support is included for server deployments:

```
docker-compose up -d
```

## Troubleshooting

### FFmpeg Issues

If you encounter FFmpeg streaming issues:
1. Verify FFmpeg is installed: `ffmpeg -version`
2. Check your stream keys are valid
3. Ensure the static background image exists

### Account Creation Issues

If automated account creation fails:
1. Verify your 2Captcha API key is valid
2. Check if the platform has changed its signup flow
3. Try manual account creation and update the credentials in the database

### Electron App Build Issues

If you encounter issues building the Electron app:
1. Make sure you have the necessary build tools installed for your platform
2. For macOS builds on non-macOS platforms, see Electron-builder documentation
3. Try running `npm run postinstall` to ensure app dependencies are correctly installed

## License

MIT