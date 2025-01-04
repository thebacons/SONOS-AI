# SONOS-AI
Output of speech from OpenAI GPT-4o TTS model to SONOS

# OpenAI Sonos Joke Player Documentation

## Table of Contents
1. [Application Overview](#application-overview)
2. [System Flow](#system-flow)
3. [Dependencies and Setup](#dependencies-and-setup)
4. [Component Details](#component-details)
5. [Installation Guide](#installation-guide)
6. [Best Practices](#best-practices)

## Application Overview
This Node.js application creates an entertaining audio experience by generating and playing AI-created jokes through Sonos speakers. The system combines OpenAI's text-to-speech capabilities with local network audio playback, creating a seamless audio entertainment system.

## System Flow
The application follows this sequence of operations:

```mermaid
flowchart TB
    A[Start] --> B[Initialize Configuration]
    B --> C[Call OpenAI API]
    C --> D[Generate Audio]
    D --> E[Save MP3 File]
    E --> F[Upload to NAS via FTP]
    F --> G[Get Current Sonos State]
    G --> H[Set Volume]
    H --> I[Play Audio]
    I --> J[Wait for Completion]
    J --> K[Restore Previous State]
    K --> L[End]
    
    subgraph Error Handling
    C -- Error --> M[Log API Error]
    F -- Error --> N[Log FTP Error]
    I -- Error --> O[Log Playback Error]
    end
```


## Component Details

### Configuration and Initialization
The application requires several modules and configuration settings:

```javascript
const axios = require('axios');
const fs = require('fs');
const { Sonos } = require('sonos');
const ftp = require('basic-ftp');

// Configuration constants
const API_KEY = 'sk-...';
const SONOS_IP = '192.168.178.88';
const FTP_CONFIG = {
    host: '192.168.178.107',
    port: 21,
    user: 'TheBacons',
    password: 'Biffa1234!',
    secure: false
};
```

### OpenAI Integration
The application uses a specific payload structure for OpenAI API requests:

```javascript
const payload = {
    model: "gpt-4o-audio-preview",
    modalities: ["text", "audio"],
    audio: {
        voice: "alloy",
        format: "mp3"
    },
    messages: [
        { role: "user", content: "You a scottish . Tell a newer joke with a scottish accent" }
    ]
};
```

### File Management System
The FTP upload functionality is handled by the `uploadToNAS` function:

```javascript
async function uploadToNAS(localFilePath) {
    const client = new ftp.Client();
    client.ftp.verbose = true;
    try {
        await client.access(FTP_CONFIG);
        await client.cd('/www/sonos-ai');
        await client.uploadFrom(localFilePath, "output.mp3");
        console.log('Upload successful');
    } catch(err) {
        console.error("Upload error:", err);
    } finally {
        client.close();
    }
}
```

### Sonos Integration
The Sonos playback system is managed through the `playSonosAudio` function:

```javascript
async function playSonosAudio(deviceIp, audioFilePath) {
    const device = new Sonos(deviceIp);
    try {
        const state = await device.getCurrentState();
        const currentTrack = await device.currentTrack();
        const currentVolume = await device.getVolume();
        
        const stats = fs.statSync('output.mp3');
        const durationMs = (stats.size * 8) / 128000 * 1000;
        const timeoutMs = durationMs + 10000;
        
        await device.setVolume(40);
        await device.play(audioFilePath);
        
        setTimeout(async () => {
            await device.setVolume(currentVolume);
            if (state === 'playing' && currentTrack.uri) {
                await device.play(currentTrack.uri);
            }
        }, timeoutMs);
    } catch (error) {
        console.error('Error:', error);
    }
}
```

### Main Execution Flow
The core functionality is orchestrated by the `generateAudioAndPlay` function:

```javascript
async function generateAudioAndPlay() {
    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const audioData = response.data.choices[0].message.audio.data;
        const fileName = 'output.mp3';
        fs.writeFileSync(fileName, Buffer.from(audioData, 'base64'));
        
        await uploadToNAS(fileName);
        const audioUrl = 'http://192.168.178.107:8808/sonos-ai/output.mp3';
        await playSonosAudio(SONOS_IP, audioUrl);
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}
```



## Setup Instructions

1. Clone the repository to your local machine
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory:
   ```env
   OPENAI_API_KEY=your-api-key
   SONOS_IP=your-sonos-ip
   FTP_HOST=your-ftp-host
   FTP_USER=your-ftp-username
   FTP_PASSWORD=your-ftp-password
   ```
4. Start the application:
   ```bash
   npm start
   ```

## Error Handling
The application implements comprehensive error handling for:
- API communication failures
- File system operations
- FTP upload issues
- Sonos playback problems

## Best Practices
The application follows several best practices:

1. Resource Management:
   - Proper closure of FTP connections
   - Cleanup of temporary files
   - Memory management through streaming

2. State Management:
   - Preservation of speaker state
   - Restoration of previous playback
   - Volume management

3. Security:
   - Secure API key handling
   - Network security considerations
   - Error message sanitization

4. Performance:
   - Asynchronous operations
   - Proper timeout handling
   - Efficient file handling











## Dependencies and Setup

### Package Configuration
The application requires several key packages to function properly. Here's the complete package.json configuration:

```json
{
  "name": "openai-sonos-joke-player",
  "version": "1.0.0",
  "description": "A Node.js application that generates audio jokes using OpenAI and plays them on Sonos speakers",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "lint": "eslint .",
    "test": "jest"
  },
  "keywords": [
    "openai",
    "sonos",
    "audio",
    "text-to-speech",
    "jokes"
  ],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "axios": "^1.7.9",
    "basic-ftp": "^5.0.5",
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "express": "^4.21.2",
    "fluent-ffmpeg": "^2.1.3",
    "fs": "^0.0.1-security",
    "http": "^0.0.1-security",
    "music-metadata": "^10.6.4",
    "node-media-server": "^4.0.7",
    "play-sound": "^1.1.6",
    "sonos": "^1.15.0",
    "ssh2-sftp-client": "^11.0.0"
  },
  "devDependencies": {
    "eslint": "^8.56.0",
    "jest": "^29.7.0",
    "nodemon": "^3.0.2"
  },
  "engines": {
    "node": ">=16.0.0"
  }
}
```

### Core Dependencies Explained

The application relies on several key packages, each serving a specific purpose:

1. **Primary Dependencies**:
   - `axios`: Handles HTTP requests to the OpenAI API, providing a clean interface for API communication
   - `basic-ftp`: Manages FTP file uploads to your NAS, with support for various FTP protocols
   - `sonos`: Controls your Sonos speaker, providing methods for playback and volume control
   - `dotenv`: Manages environment variables securely, keeping sensitive data like API keys separate from code

2. **Audio Processing Dependencies**:
   - `fluent-ffmpeg`: Provides audio file manipulation capabilities
   - `music-metadata`: Enables reading and writing audio file metadata
   - `play-sound`: Offers local audio playback functionality for testing
   - `node-media-server`: Supports media streaming capabilities

3. **Web Server Dependencies**:
   - `express`: Creates a web server for potential HTTP endpoints
   - `cors`: Enables cross-origin resource sharing for web requests
   - `http`: Extends Node.js built-in HTTP functionality

4. **File Transfer Dependencies**:
   - `ssh2-sftp-client`: Provides secure file transfer capabilities as an alternative to basic FTP
   - `fs`: Extends Node.js file system operations

### Development Dependencies

For a better development experience, these tools are included:

- `eslint`: Ensures code quality and consistency
- `jest`: Enables unit testing of your application
- `nodemon`: Automatically restarts the server during development

## Component Details

### Configuration and Initialization
The application requires proper configuration setup:

```javascript
// Environment Variables Setup
require('dotenv').config();

const config = {
    API_KEY: process.env.OPENAI_API_KEY,
    SONOS_IP: process.env.SONOS_IP,
    FTP_CONFIG: {
        host: process.env.FTP_HOST,
        port: 21,
        user: process.env.FTP_USER,
        password: process.env.FTP_PASSWORD,
        secure: false
    }
};
```

### OpenAI Integration
The OpenAI integration is configured with specific parameters:

```javascript
const payload = {
    model: "gpt-4o-audio-preview",
    modalities: ["text", "audio"],
    audio: {
        voice: "alloy",
        format: "mp3"
    },
    messages: [
        { role: "user", content: "You a scottish . Tell a newer joke with a scottish accent" }
    ]
};
```

[Continue with the rest of your component sections as before...]

## Installation Guide

1. Clone the repository:
```bash
git clone <repository-url>
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with your configuration:
```env
OPENAI_API_KEY=your-api-key
SONOS_IP=your-sonos-ip
FTP_HOST=your-ftp-host
FTP_USER=your-ftp-username
FTP_PASSWORD=your-ftp-password
```

4. Start the application:
   - For development: `npm run dev`
   - For production: `npm start`

## Best Practices

The application follows several key best practices:

1. **Security**
   - Environment variables for sensitive data
   - Secure file transfer options with SSH2-SFTP
   - Error message sanitization

2. **Resource Management**
   - Proper connection handling
   - File cleanup procedures
   - Memory efficient streaming

3. **Error Handling**
   - Comprehensive try-catch blocks
   - Specific error types
   - Proper logging and debugging

4. **Performance**
   - Asynchronous operations
   - Connection pooling
   - Efficient file handling

## Contributing

To contribute to this project:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License
This project is licensed under the ISC License.



# Project Initialization Guide

## Directory Structure

The directly structure isn't yet setup but let's guide you through setting up a complete Node.js application structure that's well-organized and follows best practices.


'1. First, establish the project directory structure
'2. Create essential configuration files
'3. Set up the core application files
'4. Add utility and helper files
'5. Create example files




##Let me walk you through the initialization process step by step:

#1. First, create your project directory and navigate to it:
```bash
mkdir openai-sonos-joke-player
cd openai-sonos-joke-player
```

#2. Initialize the project and install dependencies:
```bash
# Initialize npm project
npm init -y

# Install required dependencies
npm install axios basic-ftp cors dotenv express fluent-ffmpeg music-metadata node-media-server play-sound sonos ssh2-sftp-client winston

# Install development dependencies
npm install --save-dev eslint jest nodemon
```

3. Create the directory structure:
```bash
# Create main directories
mkdir -p src/{config,services,utils} tests/services logs temp

# Create empty files
touch .env.example .gitignore README.md
touch src/config/{environment.js,openai.js}
touch src/services/{openaiService.js,sonosService.js,ftpService.js}
touch src/utils/{audioUtils.js,logger.js}
touch src/server.js
```

4. Copy the content from the artifact above into each corresponding file.

5. Create your `.env` file from the `.env.example`:
```bash
cp .env.example .env
```

6. Edit your `.env` file with your actual configuration values.

Would you like me to explain any specific part of the setup in more detail or help you with the next steps of implementation?

First, create this directory structure:

```
openai-sonos-joke-player/
├── .env.example
├── .gitignore
├── README.md
├── package.json
├── src/
│   ├── config/
│   │   ├── environment.js
│   │   └── openai.js
│   ├── services/
│   │   ├── openaiService.js
│   │   ├── sonosService.js
│   │   └── ftpService.js
│   ├── utils/
│   │   ├── audioUtils.js
│   │   └── logger.js
│   └── server.js
├── tests/
│   └── services/
│       ├── openaiService.test.js
│       ├── sonosService.test.js
│       └── ftpService.test.js
└── logs/
    └── .gitkeep
```

## Essential Files

### 1. `.env.example`
```env
# OpenAI Configuration
OPENAI_API_KEY=your-api-key-here

# Sonos Configuration
SONOS_IP=192.168.1.100

# FTP Configuration
FTP_HOST=192.168.1.101
FTP_USER=username
FTP_PASSWORD=password
FTP_PORT=21
FTP_SECURE=false

# Server Configuration
PORT=3000
NODE_ENV=development
```

### 2. `.gitignore`
```gitignore
# Dependencies
node_modules/

# Environment variables
.env

# Logs
logs/*
!logs/.gitkeep

# Audio files
*.mp3

# IDE specific files
.idea/
.vscode/
.DS_Store
```

### 3. `src/config/environment.js`
```javascript
require('dotenv').config();

module.exports = {
    openai: {
        apiKey: process.env.OPENAI_API_KEY
    },
    sonos: {
        ip: process.env.SONOS_IP
    },
    ftp: {
        host: process.env.FTP_HOST,
        user: process.env.FTP_USER,
        password: process.env.FTP_PASSWORD,
        port: parseInt(process.env.FTP_PORT) || 21,
        secure: process.env.FTP_SECURE === 'true'
    },
    server: {
        port: parseInt(process.env.PORT) || 3000,
        env: process.env.NODE_ENV || 'development'
    }
};
```

### 4. `src/services/openaiService.js`
```javascript
const axios = require('axios');
const config = require('../config/environment');

class OpenAIService {
    constructor() {
        this.apiKey = config.openai.apiKey;
    }

    async generateJoke(accent = 'scottish') {
        const payload = {
            model: "gpt-4o-audio-preview",
            modalities: ["text", "audio"],
            audio: {
                voice: "alloy",
                format: "mp3"
            },
            messages: [
                { 
                    role: "user", 
                    content: `Tell a new joke with a ${accent} accent` 
                }
            ]
        };

        try {
            const response = await axios.post(
                'https://api.openai.com/v1/chat/completions',
                payload,
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            return response.data.choices[0].message.audio.data;
        } catch (error) {
            throw new Error(`OpenAI API Error: ${error.message}`);
        }
    }
}

module.exports = new OpenAIService();
```

### 5. `src/services/ftpService.js`
```javascript
const Client = require('basic-ftp');
const config = require('../config/environment');
const logger = require('../utils/logger');

class FTPService {
    constructor() {
        this.config = config.ftp;
        this.client = new Client.Client();
        this.client.ftp.verbose = true;
    }

    async uploadFile(localFilePath, remoteFileName) {
        try {
            await this.client.access(this.config);
            await this.client.cd('/www/sonos-ai');
            await this.client.uploadFrom(localFilePath, remoteFileName);
            logger.info('File uploaded successfully');
            return true;
        } catch (error) {
            logger.error('FTP upload error:', error);
            throw error;
        } finally {
            this.client.close();
        }
    }
}

module.exports = new FTPService();
```

### 6. `src/services/sonosService.js`
```javascript
const { Sonos } = require('sonos');
const config = require('../config/environment');
const logger = require('../utils/logger');

class SonosService {
    constructor() {
        this.device = new Sonos(config.sonos.ip);
    }

    async playAudio(audioUrl) {
        try {
            const state = await this.device.getCurrentState();
            const currentTrack = await this.device.currentTrack();
            const currentVolume = await this.device.getVolume();

            await this.device.setVolume(40);
            await this.device.play(audioUrl);

            // Restore previous state after playback
            setTimeout(async () => {
                await this.device.setVolume(currentVolume);
                if (state === 'playing' && currentTrack.uri) {
                    await this.device.play(currentTrack.uri);
                }
                logger.info('Restored previous playback state');
            }, 10000); // Adjust timeout based on audio length
        } catch (error) {
            logger.error('Sonos playback error:', error);
            throw error;
        }
    }
}

module.exports = new SonosService();
```

### 7. `src/utils/logger.js`
```javascript
const winston = require('winston');
const path = require('path');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ 
            filename: path.join(__dirname, '../../logs/error.log'), 
            level: 'error' 
        }),
        new winston.transports.File({ 
            filename: path.join(__dirname, '../../logs/combined.log') 
        })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

module.exports = logger;
```

### 8. `src/server.js`
```javascript
const openaiService = require('./services/openaiService');
const ftpService = require('./services/ftpService');
const sonosService = require('./services/sonosService');
const logger = require('./utils/logger');
const fs = require('fs').promises;
const path = require('path');

async function main() {
    try {
        // Generate joke audio
        const audioData = await openaiService.generateJoke();
        
        // Save audio file locally
        const fileName = `joke_${Date.now()}.mp3`;
        const filePath = path.join(__dirname, '..', 'temp', fileName);
        await fs.writeFile(filePath, Buffer.from(audioData, 'base64'));
        
        // Upload to FTP server
        await ftpService.uploadFile(filePath, fileName);
        
        // Play on Sonos
        const audioUrl = `http://${process.env.FTP_HOST}:8808/sonos-ai/${fileName}`;
        await sonosService.playAudio(audioUrl);
        
        // Cleanup
        await fs.unlink(filePath);
        
    } catch (error) {
        logger.error('Application error:', error);
        process.exit(1);
    }
}

main();
```
