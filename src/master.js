// master.js - Master process managing multiple AI bots for multi-platform lives (YouTube, X.com, TikTok) with auto-platform setup, credential handling, automated account creation, and CLI-based director commands

import { spawn } from 'child_process';
import puppeteer from 'puppeteer-core';
import fetch from 'node-fetch';
import readline from 'readline';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import winston from 'winston';
import dotenv from 'dotenv';
import { app } from 'electron';
import electronLog from 'electron-log';

// Load environment variables
dotenv.config();

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Configuration loader - loads config from file or uses defaults
 * @param {Object} providedConfig - Configuration object provided by the caller
 * @returns {Promise<Object>} Configuration object
 */
async function loadConfig(providedConfig = null) {
  if (providedConfig) {
    return providedConfig;
  }

  const configPath = path.join(app.getPath('userData'), 'config.json');
  try {
    const configFile = await fs.readFile(configPath, 'utf8');
    return JSON.parse(configFile);
  } catch (error) {
    // If config file doesn't exist, create it with default values
    const defaultConfig = {
      DATABASE_PATH: path.join(app.getPath('userData'), 'bots.sqlite'),
      DATABASE_ENGINE: 'better-sqlite3',
      STATIC_BACKGROUND_PATH: path.join(app.getPath('userData'), 'static_background.png'),
      LOG_LEVEL: 'info',
      PLATFORMS: [
        {
          name: 'tiktok',
          rtmpTemplate: 'rtmp://live.tiktok.com/live/',
          accountCreationUrl: 'https://www.tiktok.com/signup'
        },
        {
          name: 'youtube',
          rtmpTemplate: 'rtmp://a.rtmp.youtube.com/live2/',
          accountCreationUrl: 'https://accounts.google.com/signup/v2/webcreateaccount'
        },
        {
          name: 'xcom',
          rtmpTemplate: 'rtmp://live.x.com/live/',
          accountCreationUrl: 'https://x.com/i/flow/signup'
        }
      ],
      FFMPEG_OPTIONS: {
        videoInput: '-re -loop 1 -i',
        audioInput: '-f s16le -ar 44100 -ac 2 -i pipe:0',
        videoCodec: '-c:v libx264 -preset veryfast -tune stillimage -b:v 500k',
        audioCodec: '-c:a aac -b:a 128k -ar 44100',
        outputFormat: '-pix_fmt yuv420p -f flv'
      },
      INTERACTION_DELAY_MS: 3000
    };
    
    try {
      await fs.writeFile(configPath, JSON.stringify(defaultConfig, null, 2));
      electronLog.info(`Created default config at ${configPath}`);
    } catch (writeError) {
      electronLog.error('Failed to create default config file:', writeError);
    }
    
    return defaultConfig;
  }
}

// Setup logger
const createLogger = (config) => {
  return winston.createLogger({
    level: config?.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.printf(({ level, message, timestamp }) => {
        return `${timestamp} ${level.toUpperCase()}: ${message}`;
      })
    ),
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({ 
        filename: path.join(app.getPath('userData'), 'bots.log')
      })
    ]
  });
};

/**
 * Solves CAPTCHA using 2Captcha service
 * @param {string} siteKey - The CAPTCHA site key
 * @param {string} url - The URL where CAPTCHA is located
 * @param {Object} logger - Winston logger instance
 * @returns {Promise<string>} CAPTCHA solution
 */
async function solveCaptcha(siteKey, url, logger) {
  try {
    // Get API key from environment variable
    const apiKey = process.env.TWO_CAPTCHA_API_KEY;
    
    if (!apiKey) {
      throw new Error('TWO_CAPTCHA_API_KEY environment variable is not set');
    }
    
    const requestUrl = `http://2captcha.com/in.php?key=${apiKey}&method=userrecaptcha&googlekey=${siteKey}&pageurl=${url}`;
    const response = await fetch(requestUrl);
    const result = await response.text();
    
    if (!result.startsWith('OK|')) {
      throw new Error(`Failed to submit CAPTCHA: ${result}`);
    }
    
    const captchaId = result.split('|')[1];
    logger.info(`CAPTCHA submitted, ID: ${captchaId}`);
    
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes max (30 * 10 seconds)
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Check every 10 seconds
      const res = await fetch(`http://2captcha.com/res.php?key=${apiKey}&action=get&id=${captchaId}`);
      const text = await res.text();
      
      if (text.includes('OK|')) {
        logger.info('CAPTCHA solved successfully');
        return text.split('|')[1];
      } else if (text !== 'CAPCHA_NOT_READY') {
        throw new Error(`CAPTCHA solving error: ${text}`);
      }
      
      attempts++;
    }
    
    throw new Error('CAPTCHA solving timeout');
  } catch (error) {
    logger.error(`CAPTCHA solving error: ${error.message}`);
    throw error;
  }
}

/**
 * Creates a platform account for a bot
 * @param {Object} bot - Bot configuration
 * @param {Object} logger - Winston logger instance
 * @returns {Promise<void>}
 */
async function createAccount(bot, logger) {
  let browser = null;
  
  try {
    // Find installed Chrome/Chromium
    const executablePath = await findChromePath();
    
    browser = await puppeteer.launch({ 
      headless: false,
      executablePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    logger.info(`Creating account for ${bot.name} on ${bot.platform}`);
    await page.goto(bot.signupUrl, { waitUntil: 'networkidle2' });
    
    // Platform-specific account creation logic
    switch (bot.platform) {
      case 'tiktok':
        // TikTok-specific signup flow
        logger.info('Implementing TikTok signup flow');
        // TODO: Implement TikTok signup flow
        break;
        
      case 'youtube':
        // YouTube/Google-specific signup flow
        logger.info('Implementing YouTube signup flow');
        // TODO: Implement YouTube signup flow
        break;
        
      case 'xcom':
        // X.com-specific signup flow
        logger.info('Implementing X.com signup flow');
        // TODO: Implement X.com signup flow
        break;
        
      default:
        logger.warn(`Unknown platform: ${bot.platform}`);
    }
    
    // Check for CAPTCHA and solve if needed
    const captchaElement = await page.$('[data-sitekey]');
    if (captchaElement) {
      const siteKey = await page.evaluate(el => el.getAttribute('data-sitekey'), captchaElement);
      const solution = await solveCaptcha(siteKey, bot.signupUrl, logger);
      
      // Insert CAPTCHA solution
      await page.evaluate(token => {
        window.grecaptcha.getResponse = () => token;
        const event = new Event('captcha-solved');
        document.dispatchEvent(event);
      }, solution);
    }
    
    logger.info(`Account creation process for ${bot.name} on ${bot.platform} completed`);
    
    // Wait for manual review if needed
    await new Promise(resolve => setTimeout(resolve, 5000));
    
  } catch (error) {
    logger.error(`Account creation error for ${bot.name}: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Find installed Chrome or Chromium executable path
 * @returns {Promise<string>} Path to Chrome executable
 */
async function findChromePath() {
  // Common Chrome/Chromium paths by platform
  const chromePaths = {
    win32: [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
    ],
    darwin: [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'
    ],
    linux: [
      '/usr/bin/google-chrome',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      '/snap/bin/chromium'
    ]
  };
  
  const paths = chromePaths[process.platform] || [];
  
  for (const browserPath of paths) {
    try {
      await fs.access(browserPath);
      return browserPath;
    } catch (error) {
      // Path doesn't exist or isn't accessible
    }
  }
  
  throw new Error('Could not find Chrome or Chromium installation. Please install Chrome or specify the path manually.');
}

/**
 * Spawns FFmpeg process for streaming
 * @param {string} streamKey - RTMP stream key
 * @param {Object} ffmpegOptions - FFmpeg command options
 * @param {string} backgroundPath - Path to static background image
 * @param {Object} logger - Winston logger instance
 * @returns {Object} FFmpeg child process
 */
function spawnFfmpeg(streamKey, ffmpegOptions, backgroundPath, logger) {
  try {
    const ffmpegArgs = [
      ...ffmpegOptions.videoInput.split(' '), backgroundPath,
      ...ffmpegOptions.audioInput.split(' '),
      ...ffmpegOptions.videoCodec.split(' '),
      ...ffmpegOptions.audioCodec.split(' '),
      ...ffmpegOptions.outputFormat.split(' '),
      streamKey
    ].filter(arg => arg !== '');
    
    logger.info(`Starting FFmpeg with stream key: ${streamKey}`);
    logger.debug(`FFmpeg command: ffmpeg ${ffmpegArgs.join(' ')}`);
    
    return spawn('ffmpeg', ffmpegArgs, { stdio: ['pipe', 'inherit', 'inherit'] });
  } catch (error) {
    logger.error(`FFmpeg spawn error: ${error.message}`);
    throw error;
  }
}

/**
 * Sets up the SQLite database
 * @param {string} dbPath - Path to the database file
 * @param {Array} botsConfig - Bot configurations
 * @param {Object} logger - Winston logger instance
 * @param {string} dbEngine - Database engine to use ('sqlite3' or 'better-sqlite3')
 * @returns {Promise<Object>} Database connection
 */
async function setupDatabase(dbPath, botsConfig, logger, dbEngine = 'better-sqlite3') {
  try {
    logger.info(`Setting up database at ${dbPath} using ${dbEngine} engine`);
    
    // Ensure directory exists
    const dbDir = path.dirname(dbPath);
    await fs.mkdir(dbDir, { recursive: true });
    
    let db;
    
    // Open database based on configured engine
    if (dbEngine === 'sqlite3') {
      try {
        // Import sqlite3 with dynamic import
        const { default: sqlite3 } = await import('sqlite3');
        const { open } = await import('sqlite');
        
        db = await open({
          filename: dbPath,
          driver: sqlite3.Database
        });
        
        // Create tables if they don't exist
        await db.exec(`
          CREATE TABLE IF NOT EXISTS bot_logs (
            id INTEGER PRIMARY KEY, 
            bot_name TEXT, 
            gender TEXT, 
            platform TEXT, 
            input TEXT, 
            response TEXT, 
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
        
        await db.exec(`
          CREATE TABLE IF NOT EXISTS bot_accounts (
            id INTEGER PRIMARY KEY, 
            bot_name TEXT, 
            platform TEXT, 
            username TEXT, 
            password TEXT, 
            signup_url TEXT,
            stream_key TEXT,
            persona TEXT,
            gender TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(bot_name, platform)
          )
        `);
        
        await db.exec(`
          CREATE TABLE IF NOT EXISTS director_commands (
            id INTEGER PRIMARY KEY,
            command TEXT,
            applied BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
        
        // Insert or update bot accounts
        for (const bot of botsConfig) {
          await db.run(`
            INSERT OR REPLACE INTO bot_accounts 
            (bot_name, platform, username, password, signup_url, stream_key, persona, gender) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `,
            bot.name, 
            bot.platform, 
            bot.username, 
            bot.password, 
            bot.signupUrl, 
            bot.streamKey,
            bot.persona,
            bot.gender
          );
        }
      } catch (error) {
        logger.error('Failed to initialize sqlite3:', error);
        throw new Error(`Failed to initialize sqlite3: ${error.message}`);
      }
    } else {
      try {
        // Import better-sqlite3 with dynamic import
        const { default: BetterSQLite3 } = await import('better-sqlite3');
        
        db = new BetterSQLite3(dbPath, { verbose: logger.debug });
        
        // Create tables if they don't exist
        db.exec(`
          CREATE TABLE IF NOT EXISTS bot_logs (
            id INTEGER PRIMARY KEY, 
            bot_name TEXT, 
            gender TEXT, 
            platform TEXT, 
            input TEXT, 
            response TEXT, 
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
        
        db.exec(`
          CREATE TABLE IF NOT EXISTS bot_accounts (
            id INTEGER PRIMARY KEY, 
            bot_name TEXT, 
            platform TEXT, 
            username TEXT, 
            password TEXT, 
            signup_url TEXT,
            stream_key TEXT,
            persona TEXT,
            gender TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(bot_name, platform)
          )
        `);
        
        db.exec(`
          CREATE TABLE IF NOT EXISTS director_commands (
            id INTEGER PRIMARY KEY,
            command TEXT,
            applied BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
        
        // Insert or update bot accounts
        const stmt = db.prepare(`
          INSERT OR REPLACE INTO bot_accounts 
          (bot_name, platform, username, password, signup_url, stream_key, persona, gender) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        for (const bot of botsConfig) {
          stmt.run(
            bot.name, 
            bot.platform, 
            bot.username, 
            bot.password, 
            bot.signupUrl, 
            bot.streamKey,
            bot.persona,
            bot.gender
          );
        }
      } catch (error) {
        logger.error('Failed to initialize better-sqlite3:', error);
        throw new Error(`Failed to initialize better-sqlite3: ${error.message}`);
      }
    }
    
    logger.info('Database setup completed');
    return db;
  } catch (error) {
    logger.error(`Database setup error: ${error.message}`);
    throw error;
  }
}

/**
 * Get all bots from the database
 * @param {Object} db - Database connection
 * @param {Object} logger - Winston logger instance
 * @param {string} dbEngine - Database engine being used
 * @returns {Promise<Array>} Array of bot objects
 */
async function getAllBots(db, logger, dbEngine = 'better-sqlite3') {
  try {
    let bots;
    
    if (dbEngine === 'sqlite3') {
      bots = await db.all(`
        SELECT id, bot_name, platform, username, password, signup_url, stream_key, persona, gender
        FROM bot_accounts
      `);
    } else {
      bots = db.prepare(`
        SELECT id, bot_name, platform, username, password, signup_url, stream_key, persona, gender
        FROM bot_accounts
      `).all();
    }
    
    // Format bot objects
    return bots.map(bot => ({
      id: bot.id,
      name: bot.bot_name,
      platform: bot.platform,
      username: bot.username,
      password: bot.password,
      signupUrl: bot.signup_url,
      streamKey: bot.stream_key,
      persona: bot.persona || 'Default persona',
      gender: bot.gender || 'M'
    }));
  } catch (error) {
    logger.error(`Failed to get bots: ${error.message}`);
    return [];
  }
}

/**
 * Stores bot interaction in the database
 * @param {Object} db - Database connection
 * @param {string} botName - Bot name
 * @param {string} gender - Bot gender
 * @param {string} platform - Platform name
 * @param {string} input - User input
 * @param {string} response - Bot response
 * @param {Object} logger - Winston logger instance
 * @param {string} dbEngine - Database engine being used
 * @returns {Promise<void>}
 */
async function storeBotInteraction(db, botName, gender, platform, input, response, logger, dbEngine = 'better-sqlite3') {
  try {
    if (dbEngine === 'sqlite3') {
      await db.run(`
        INSERT INTO bot_logs (bot_name, gender, platform, input, response) 
        VALUES (?, ?, ?, ?, ?)
      `, botName, gender, platform, input, response);
    } else {
      const stmt = db.prepare(`
        INSERT INTO bot_logs (bot_name, gender, platform, input, response) 
        VALUES (?, ?, ?, ?, ?)
      `);
      
      stmt.run(botName, gender, platform, input, response);
    }
    
    logger.debug(`Stored interaction for ${botName}`);
  } catch (error) {
    logger.error(`Failed to store bot interaction: ${error.message}`);
  }
}

/**
 * Transcribes audio to text (placeholder)
 * @param {string} botName - Bot name
 * @param {Object} logger - Winston logger instance
 * @returns {Promise<string>} Transcribed text
 */
async function transcribeAudio(botName, logger) {
  try {
    // This is a placeholder. In a real implementation, this would:
    // 1. Capture audio from a source
    // 2. Use a speech-to-text service to transcribe it
    // 3. Return the transcribed text
    
    logger.debug(`Transcribing audio for ${botName}`);
    
    // Simulated transcription for development
    const simulatedQuestions = [
      `What is your opinion on consciousness, ${botName}?`,
      `How do you feel about artificial intelligence, ${botName}?`,
      `Can you explain your perspective on free will, ${botName}?`,
      `What are your thoughts on the meaning of life, ${botName}?`
    ];
    
    return simulatedQuestions[Math.floor(Math.random() * simulatedQuestions.length)];
  } catch (error) {
    logger.error(`Audio transcription error: ${error.message}`);
    return null;
  }
}

/**
 * Generates a response using GPT (placeholder)
 * @param {string} input - User input
 * @param {string} persona - Bot persona
 * @param {string} gender - Bot gender
 * @param {Array} directorCommands - Director commands
 * @param {Object} logger - Winston logger instance
 * @returns {Promise<string>} Generated response
 */
async function generateGPTResponse(input, persona, gender, directorCommands, logger) {
  try {
    // This is a placeholder. In a real implementation, this would:
    // 1. Call an LLM API (like OpenAI's GPT)
    // 2. Format the prompt with persona, gender, and director commands
    // 3. Return the generated response
    
    logger.debug(`Generating response for input: "${input}" with persona: ${persona}`);
    
    // Use OpenAI API key from environment variable if available
    const apiKey = process.env.OPENAI_API_KEY;
    
    const actualGender = gender === 'random' ? (Math.random() > 0.5 ? 'M' : 'F') : gender;
    const voiceStyle = actualGender === 'F' ? 'with warmth and empathy' : 'with authority and logic';
    
    // Include the most recent director command if available
    const directorNote = directorCommands.length > 0 
      ? ` (Director note: ${directorCommands[directorCommands.length - 1]})` 
      : '';
    
    // If we have an API key, we could use the actual OpenAI API here
    if (apiKey) {
      // TODO: Implement actual OpenAI API call
      logger.debug('Using OpenAI API for response generation');
    }
    
    return `${persona} responds ${voiceStyle}: I think ${input} is a profound topic that requires careful consideration. Let me share my perspective...${directorNote}`;
  } catch (error) {
    logger.error(`GPT response generation error: ${error.message}`);
    return `I apologize, but I'm having trouble formulating a response right now.`;
  }
}

/**
 * Generates text-to-speech audio (placeholder)
 * @param {string} text - Text to convert to speech
 * @param {Object} logger - Winston logger instance
 * @returns {Promise<Buffer>} Audio buffer
 */
async function generateTTS(text, logger) {
  try {
    // This is a placeholder. In a real implementation, this would:
    // 1. Call a TTS API (like Amazon Polly, Google TTS, etc.)
    // 2. Convert the text to speech
    // 3. Return the audio buffer
    
    logger.debug(`Generating TTS for text: "${text.substring(0, 50)}..."`);
    
    // For now, return a buffer with silence
    // In a real implementation, this would be actual audio data
    return Buffer.alloc(44100 * 2 * 2); // 2 seconds of silence (16-bit stereo at 44.1kHz)
  } catch (error) {
    logger.error(`TTS generation error: ${error.message}`);
    return Buffer.alloc(44100 * 2 * 2); // Return silence on error
  }
}

/**
 * Pipes audio buffer to FFmpeg process
 * @param {Object} ffmpegStdin - FFmpeg stdin stream
 * @param {Buffer} buffer - Audio buffer
 * @param {Object} logger - Winston logger instance
 * @returns {Promise<void>}
 */
async function pipeAudioBufferToFfmpeg(ffmpegStdin, buffer, logger) {
  try {
    if (!ffmpegStdin.write(buffer)) {
      // Handle backpressure
      await new Promise(resolve => ffmpegStdin.once('drain', resolve));
    }
    logger.debug(`Piped ${buffer.length} bytes to FFmpeg`);
  } catch (error) {
    logger.error(`Error piping audio to FFmpeg: ${error.message}`);
  }
}

/**
 * Starts the CLI interface for director commands
 * @param {Object} db - Database connection
 * @param {Array} directorCommands - Director commands array
 * @param {Object} logger - Winston logger instance
 * @param {string} dbEngine - Database engine being used
 * @returns {Object} Readline interface
 */
function startDirectorCLI(db, directorCommands, logger, dbEngine = 'better-sqlite3') {
  const rl = readline.createInterface({ 
    input: process.stdin, 
    output: process.stdout,
    prompt: 'Director> '
  });
  
  rl.prompt();
  
  rl.on('line', async (line) => {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('--notify ')) {
      const message = trimmedLine.replace('--notify ', '');
      directorCommands.push(message);
      
      try {
        if (dbEngine === 'sqlite3') {
          await db.run('INSERT INTO director_commands (command) VALUES (?)', message);
        } else {
          const stmt = db.prepare('INSERT INTO director_commands (command) VALUES (?)');
          stmt.run(message);
        }
        logger.info(`Director instruction added: ${message}`);
      } catch (error) {
        logger.error(`Failed to store director command: ${error.message}`);
      }
      
      console.log(`Director instruction added: ${message}`);
    } else if (trimmedLine === '--help') {
      console.log(`
Available commands:
  --notify <message>  : Send a direction to all bots
  --list              : List all active bots
  --history <bot>     : Show recent interactions for a bot
  --help              : Show this help message
  --exit              : Exit the program
      `);
    } else if (trimmedLine === '--list') {
      try {
        let bots;
        if (dbEngine === 'sqlite3') {
          bots = await db.all('SELECT bot_name, platform, persona, gender FROM bot_accounts');
        } else {
          bots = db.prepare('SELECT bot_name, platform, persona, gender FROM bot_accounts').all();
        }
        
        console.log('\nActive bots:');
        bots.forEach(bot => {
          console.log(`- ${bot.bot_name} on ${bot.platform} (${bot.persona || 'Default persona'}, ${bot.gender || 'M'})`);
        });
        console.log('');
      } catch (error) {
        logger.error(`Failed to list bots: ${error.message}`);
      }
    } else if (trimmedLine.startsWith('--history ')) {
      const botName = trimmedLine.replace('--history ', '');
      try {
        let logs;
        if (dbEngine === 'sqlite3') {
          logs = await db.all(
            'SELECT input, response, created_at FROM bot_logs WHERE bot_name = ? ORDER BY created_at DESC LIMIT 5',
            botName
          );
        } else {
          logs = db.prepare(
            'SELECT input, response, created_at FROM bot_logs WHERE bot_name = ? ORDER BY created_at DESC LIMIT 5'
          ).all(botName);
        }
        
        if (logs.length === 0) {
          console.log(`No history found for bot ${botName}`);
        } else {
          console.log(`\nRecent interactions for ${botName}:`);
          logs.forEach(log => {
            console.log(`[${log.created_at}]`);
            console.log(`Input: ${log.input}`);
            console.log(`Response: ${log.response}`);
            console.log('');
          });
        }
      } catch (error) {
        logger.error(`Failed to get bot history: ${error.message}`);
      }
    } else if (trimmedLine === '--exit') {
      console.log('Shutting down...');
      rl.close();
      process.exit(0);
    } else if (trimmedLine !== '') {
      console.log('Unknown command. Type --help for available commands.');
    }
    
    rl.prompt();
  });
  
  return rl;
}

/**
 * Main loop for bot operations
 * @param {Object} providedConfig - Configuration object provided by the caller
 * @returns {Promise<Object>} Master process object
 */
export async function masterProcess(providedConfig = null) {
  try {
    // Load configuration
    const config = await loadConfig(providedConfig);
    const logger = createLogger(config);
    logger.level = config.LOG_LEVEL || 'info';
    
    // Get database engine from config
    const dbEngine = config.DATABASE_ENGINE || 'better-sqlite3';
    logger.info(`Using ${dbEngine} database engine`);
    
    // Setup database
    const db = await setupDatabase(config.DATABASE_PATH, [], logger, dbEngine);
    
    // Get bots from database instead of config
    const botsFromDb = await getAllBots(db, logger, dbEngine);
    
    // If no bots in database, create default bots from platforms in config
    let botsConfig = botsFromDb;
    
    if (botsConfig.length === 0) {
      logger.info('No bots found in database. Creating default bots from config.');
      
      // Create default bots from platforms in config
      const defaultPersonalities = [
        { persona: 'Logical Atheist persona', gender: 'M' },
        { persona: 'Cheerful Spiritual persona', gender: 'F' },
        { persona: 'Skeptical Philosopher persona', gender: 'random' },
        { persona: 'Empathetic Listener persona', gender: 'random' }
      ];
      
      botsConfig = defaultPersonalities.map((personality, index) => {
        const assignedPlatform = config.PLATFORMS[index % config.PLATFORMS.length];
        return {
          name: `Bot${index + 1}`,
          persona: personality.persona,
          gender: personality.gender,
          platform: assignedPlatform.name,
          streamKey: `${assignedPlatform.rtmpTemplate}BOT_${index + 1}_KEY`,
          username: `bot${index + 1}_${assignedPlatform.name}`,
          password: `securePassword${index + 1}`,
          signupUrl: assignedPlatform.accountCreationUrl
        };
      });
      
      // Save default bots to database
      for (const bot of botsConfig) {
        if (dbEngine === 'sqlite3') {
          await db.run(`
            INSERT INTO bot_accounts (bot_name, platform, username, password, signup_url, stream_key, persona, gender)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `,
            bot.name,
            bot.platform,
            bot.username,
            bot.password,
            bot.signupUrl,
            bot.streamKey,
            bot.persona,
            bot.gender
          );
        } else {
          const stmt = db.prepare(`
            INSERT INTO bot_accounts (bot_name, platform, username, password, signup_url, stream_key, persona, gender)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `);
          
          stmt.run(
            bot.name,
            bot.platform,
            bot.username,
            bot.password,
            bot.signupUrl,
            bot.streamKey,
            bot.persona,
            bot.gender
          );
        }
      }
    }
    
    // Initialize bots with FFmpeg processes
    const bots = botsConfig.map(bot => ({
      ...bot,
      ffmpegProcess: spawnFfmpeg(
        bot.streamKey, 
        config.FFMPEG_OPTIONS, 
        config.STATIC_BACKGROUND_PATH,
        logger
      )
    }));
    
    // Create accounts for bots (if needed)
    for (const bot of bots) {
      await createAccount(bot, logger);
    }
    
    logger.info('Bots initialized across multiple platforms:');
    bots.forEach(bot => {
      logger.info(`- ${bot.name} on ${bot.platform} (${bot.persona}, ${bot.gender})`);
    });
    
    // Start director CLI
    const directorCommands = [];
    const cli = startDirectorCLI(db, directorCommands, logger, dbEngine);
    
    // Create a master process object that can be controlled externally
    const masterObj = {
      bots,
      directorCommands,
      db,
      logger,
      cli,
      dbEngine,
      
      // Method to add a director command
      addDirectorCommand: async (command) => {
        directorCommands.push(command);
        try {
          if (dbEngine === 'sqlite3') {
            await db.run('INSERT INTO director_commands (command) VALUES (?)', command);
          } else {
            const stmt = db.prepare('INSERT INTO director_commands (command) VALUES (?)');
            stmt.run(command);
          }
          logger.info(`Director instruction added: ${command}`);
          return true;
        } catch (error) {
          logger.error(`Failed to store director command: ${error.message}`);
          return false;
        }
      },
      
      // Method to stop all bots
      stop: () => {
        bots.forEach(bot => {
          if (bot.ffmpegProcess && !bot.ffmpegProcess.killed) {
            bot.ffmpegProcess.kill();
          }
        });
        
        if (cli) {
          cli.close();
        }
        
        // Close database
        if (db) {
          if (dbEngine === 'sqlite3') {
            db.close();
          } else if (typeof db.close === 'function') {
            db.close();
          }
        }
        
        logger.info('Master process stopped');
      },
      
      // Method to get bot status
      getStatus: async () => {
        try {
          const botStatus = bots.map(bot => ({
            name: bot.name,
            platform: bot.platform,
            running: bot.ffmpegProcess && !bot.ffmpegProcess.killed,
            persona: bot.persona,
            gender: bot.gender
          }));
          
          let recentCommands;
          if (dbEngine === 'sqlite3') {
            recentCommands = await db.all(
              'SELECT command, created_at FROM director_commands ORDER BY created_at DESC LIMIT 10'
            );
          } else {
            recentCommands = db.prepare(
              'SELECT command, created_at FROM director_commands ORDER BY created_at DESC LIMIT 10'
            ).all();
          }
          
          return {
            bots: botStatus,
            recentCommands
          };
        } catch (error) {
          logger.error(`Failed to get status: ${error.message}`);
          return { error: error.message };
        }
      }
    };
    
    // Start the interaction loop in a separate process
    (async () => {
      while (true) {
        for (const bot of bots) {
          try {
            // Get audio input (transcribed from speech)
            const audioInput = await transcribeAudio(bot.name, logger);
            
            if (audioInput) {
              // Generate response using GPT
              const gptReply = await generateGPTResponse(
                audioInput, 
                bot.persona, 
                bot.gender, 
                directorCommands,
                logger
              );
              
              // Convert response to speech
              const audioBuffer = await generateTTS(gptReply, logger);
              
              // Stream audio to platform
              await pipeAudioBufferToFfmpeg(bot.ffmpegProcess.stdin, audioBuffer, logger);
              
              // Store interaction in database
              await storeBotInteraction(
                db, 
                bot.name, 
                bot.gender, 
                bot.platform, 
                audioInput, 
                gptReply,
                logger,
                dbEngine
              );
            }
          } catch (error) {
            logger.error(`Error in bot ${bot.name} interaction cycle: ${error.message}`);
          }
        }
        
        // Wait before next cycle
        await new Promise(resolve => setTimeout(resolve, config.INTERACTION_DELAY_MS));
      }
    })();
    
    return masterObj;
  } catch (error) {
    electronLog.error(`Master process error: ${error.message}`);
    throw error;
  }
}

// If this file is run directly (not imported), start the master process
if (import.meta.url === `file://${process.argv[1]}`) {
  masterProcess().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
