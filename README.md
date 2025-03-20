# Multi-Platform AI Bots

An Electron desktop application for managing multiple AI bots across streaming platforms like YouTube, TikTok, and X.com (formerly Twitter).

## 🌟 Features

- **Multi-Platform Support**: Run bots simultaneously on YouTube, TikTok, and X.com
- **Bot Profile Management**: Create and customize bot profiles with different personas
- **Live Session Management**: Host sessions with one bot and have others join
- **Director Commands**: Send instructions to all bots in a session
- **AI-Generated Content**: Generate avatars and streaming backgrounds
- **Platform Authentication**: Automated authentication with streaming platforms
- **User Management**: Multi-user support with individual settings and bots
- **Environment Configuration**: User-friendly setup for API keys and platform credentials
- **Modern UI**: Component-based architecture with dark mode support

## 🚀 Getting Started

### Prerequisites

- Node.js 16.x or higher
- npm or pnpm
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/multi-platform-ai-bots.git
   cd multi-platform-ai-bots
   ```

2. Install dependencies:
   ```bash
   npm install
   # or with pnpm
   pnpm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   # or with pnpm
   pnpm dev
   ```

## 👤 User Authentication

The application supports multiple users, each with their own settings and bots:

1. **Registration**: Create a new account with username and password
2. **Login**: Securely authenticate with your credentials
3. **Settings**: Configure your environment variables and API keys
4. **Bot Management**: Create and manage bots associated with your account

## 🛠️ Development

### Project Structure

```
multi-platform-ai-bots/
├── assets/                # Application assets (icons, images)
├── public/                # Public assets and styles
│   └── styles/            # CSS files
│       ├── components/    # Component-specific styles
│       └── ...            # Global styles
├── scripts/               # Utility scripts
├── src/                   # Source code
│   ├── ui/                # UI components and logic
│   │   ├── components/    # Web components
│   │   └── app.js         # Main UI logic
│   ├── main.js            # Electron main process
│   ├── preload.js         # Electron preload script
│   └── master.js          # Bot management logic
└── ...                    # Configuration files
```

### Database Schema

The application uses SQLite for data storage with the following schema:

- **users**: User accounts with authentication information
- **user_settings**: User-specific environment variables and settings
- **bot_accounts**: Bot profiles associated with specific users
- **bot_logs**: Interaction logs for each bot
- **director_commands**: Commands sent to bots during sessions

### Building

To build the application for production:

```bash
npm run build
# or for a specific platform
npm run build:mac
npm run build:win
npm run build:linux
```

## 🤖 Bot Configuration

Bots can be configured with different personalities, platforms, and appearance settings. The application supports:

- **Personalities**: Define how bots respond to interactions
- **Platforms**: Configure which streaming platforms to use
- **Appearance**: Customize avatars and streaming backgrounds
- **Authentication**: Manage platform credentials

## 🎮 Director Mode

The director mode allows you to control all bots in a session:

1. Start a session with one bot as the host
2. Have other bots join the session
3. Send director commands to all bots
4. Control the conversation flow and topics

## ⚙️ Environment Setup

The application requires several environment variables to function properly:

- **API Keys**: OpenAI API key, 2Captcha API key
- **Platform Credentials**: Login information for various platforms
- **Database Configuration**: Path for the SQLite database
- **Logging Settings**: Log level and file path

These can be configured through the setup interface after logging in.

## 🔧 Troubleshooting

If you encounter build issues with native modules:

```bash
npm run rebuild
```

This will rebuild the native modules for your Electron version.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- [Electron](https://www.electronjs.org/) - Desktop application framework
- [Puppeteer](https://pptr.dev/) - Headless browser automation
- [Better-SQLite3](https://github.com/JoshuaWise/better-sqlite3) - SQLite database interface
- [bcryptjs](https://github.com/dcodeIO/bcrypt.js) - Password hashing library

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

See the [CONTRIBUTING.md](CONTRIBUTING.md) file for detailed guidelines.

## 📋 Roadmap

Check out our [TODO.md](TODO.md) file for upcoming features and improvements.