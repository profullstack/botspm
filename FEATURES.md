# bots.pm Features

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

bots.pm is a desktop application for managing multiple AI bots across streaming platforms. This document outlines the key features and capabilities of the application.

## 🤖 Bot Management

### Multi-Platform Support
- **TikTok Integration**: Create and manage bots for TikTok live streams
- **YouTube Integration**: Create and manage bots for YouTube live streams
- **X.com (Twitter) Integration**: Create and manage bots for X.com live streams
- **Unified Dashboard**: Manage all bots across platforms from a single interface

### Bot Personalities
- **Customizable Personas**: Create unique personalities for each bot
- **Voice Gender Selection**: Choose between male, female, or random voice gender
- **Personality Editor**: User-friendly interface for editing bot personalities
- **Persona Database**: Store and manage multiple personas for reuse

### Automated Account Management
- **Account Creation**: Automated setup of platform accounts
- **Credential Storage**: Secure storage of platform credentials
- **CAPTCHA Solving**: Integrated CAPTCHA solving capabilities for account creation

## 🎬 Live Streaming

### Stream Management
- **RTMP Streaming**: Support for RTMP protocol for all platforms
- **Stream Key Management**: Secure storage and management of stream keys
- **Multi-Stream Support**: Run multiple bots on different platforms simultaneously

### Media Processing
- **FFmpeg Integration**: High-quality audio/video processing
- **Static Background**: Configurable static background for streams
- **Audio Generation**: Text-to-speech conversion for bot responses

## 🧠 AI Integration

### Language Models
- **GPT Integration**: Generate human-like responses using GPT models
- **Persona-based Responses**: Responses tailored to each bot's personality
- **Context Awareness**: Maintain conversation context for natural interactions

### Speech Processing
- **Speech-to-Text**: Transcribe audience questions and comments
- **Text-to-Speech**: Convert bot responses to natural-sounding speech
- **Voice Customization**: Adjust voice characteristics based on bot gender and persona

## 🎭 Director Mode

### Live Direction
- **Director Commands**: Send real-time instructions to all active bots
- **Command History**: View and reuse previous director commands
- **Bot Monitoring**: Monitor all bot interactions in real-time

### Interaction Logging
- **Conversation History**: Store all bot interactions for review
- **Analytics**: Track engagement metrics across platforms
- **Export Capabilities**: Export logs for external analysis

## 👤 User Management

### Authentication
- **User Accounts**: Create and manage user accounts
- **Secure Authentication**: Password hashing and secure session management
- **Role-based Access**: Different permission levels for users

### User Settings
- **Personalized Settings**: User-specific configuration options
- **API Key Management**: Secure storage of API keys per user
- **Platform Credentials**: Store platform-specific credentials per user

## 🔧 System Configuration

### Application Settings
- **Dark Mode**: Toggle between light and dark themes
- **Font Size**: Adjust text size for better readability
- **Database Configuration**: Choose between sqlite3 and better-sqlite3 engines

### Environment Configuration
- **System Variables**: Configure system-level environment variables
- **Log Levels**: Adjust logging verbosity
- **Path Configuration**: Customize data and log storage locations

## 💻 User Interface

### Modern Design
- **Responsive Layout**: Adapts to different window sizes
- **Component-based Architecture**: Modular UI components
- **Custom Web Components**: Reusable UI elements across the application

### Navigation
- **Sidebar Navigation**: Easy access to all application sections
- **Collapsible Menu**: Toggle sidebar to maximize workspace
- **Context-sensitive Controls**: Controls adapt based on current state

### Dashboard
- **Bot Cards**: Visual representation of each bot with status indicators
- **Control Panel**: Start, stop, and manage all bots from a central location
- **Logs Panel**: Real-time log display with filtering options

## 🔒 Security

### Data Protection
- **Encrypted Storage**: Sensitive information stored with encryption
- **Secure API Communication**: Secure communication with external APIs
- **Password Hashing**: Secure storage of user passwords

### Privacy
- **Local Processing**: Process sensitive data locally when possible
- **Minimal Data Collection**: Only collect necessary data for operation
- **Data Isolation**: Separate user data for multi-user environments

## 🛠️ Developer Features

### Extensibility
- **Plugin Architecture**: Support for extending functionality
- **API Access**: Programmatic access to application features
- **Custom Integrations**: Add support for additional platforms

### Debugging
- **Developer Tools**: Built-in developer tools for debugging
- **Logging System**: Comprehensive logging for troubleshooting
- **Error Handling**: Robust error handling and reporting

## 🖥️ Desktop Integration

### System Tray
- **Tray Icon**: Quick access from system tray
- **Status Indicator**: Visual indication of bot status
- **Quick Actions**: Common actions available from tray menu

### Window Management
- **Window Size Persistence**: Remember window size between sessions
- **Minimize to Tray**: Continue running in background
- **Multi-monitor Support**: Work across multiple displays

## 📱 Platform-specific Features

### TikTok
- **Live Comment Monitoring**: Track and respond to live comments
- **Gift Acknowledgment**: Recognize and thank viewers for gifts
- **Follower Alerts**: Acknowledge new followers during streams

### YouTube
- **Super Chat Integration**: Prioritize responses to Super Chat messages
- **Subscriber Recognition**: Acknowledge subscribers during streams
- **Comment Filtering**: Filter and prioritize comments based on criteria

### X.com
- **Tweet Integration**: Respond to tweets during live sessions
- **Follower Interaction**: Engage with followers in real-time
- **Hashtag Monitoring**: Track and respond to specific hashtags

## 🔄 Updates and Maintenance

### Application Updates
- **Version Management**: Track and display application version
- **Update Notifications**: Notify users of available updates
- **Changelog Access**: Easy access to version change information

### Data Management
- **Backup and Restore**: Tools for backing up and restoring application data
- **Database Maintenance**: Utilities for maintaining database health
- **Log Rotation**: Automatic management of log files to prevent excessive disk usage

---

This document provides an overview of the main features of bots.pm. The application is continuously evolving, with new features and improvements being added regularly.