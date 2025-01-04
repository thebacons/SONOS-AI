# SONOS-AI
Output of speech from OpenAI GPT-4o TTS model to SONOS

# OpenAI Audio Joke Player for Sonos

## Overview
This Node.js application creates an entertaining audio experience by generating and playing AI-created jokes through Sonos speakers. It combines OpenAI's text-to-speech capabilities with local network audio playback, creating a seamless audio entertainment system.

The application follows these main steps:
1. Sends a request to OpenAI to generate a joke with a Scottish accent
2. Converts the joke to audio using OpenAI's text-to-speech
3. Saves the audio locally as an MP3 file
4. Uploads the file to a NAS (Network Attached Storage) via FTP
5. Plays the audio through a specified Sonos speaker
6. Restores the previous playback state after completion

## Dependencies
The application requires the following npm packages:
- `axios`: For making HTTP requests to OpenAI API
- `fs`: Node.js built-in file system module
- `sonos`: For controlling Sonos speakers
- `basic-ftp`: For uploading files to NAS

## Configuration
The application uses several configuration constants:

```javascript
const API_KEY = 'sk-...';  // OpenAI API key
const SONOS_IP = '192.168.178.88';  // Sonos speaker IP address
const FTP_CONFIG = {
    host: '192.168.178.107',
    port: 21,
    user: '...',
    password: '...',
    secure: false
};
```

## Key Components

### 1. OpenAI Integration
The application sends a request to OpenAI with specific parameters:
- Model: gpt-4o-audio-preview
- Modalities: text and audio
- Voice: alloy
- Format: MP3
- Content: A prompt requesting a Scottish joke

### 2. File Management
The application handles files in multiple stages:
- Creates a local MP3 file from OpenAI's response
- Uploads the file to a NAS server via FTP
- Makes the file available via HTTP for Sonos playback

### 3. Sonos Integration
The Sonos playback system:
- Stores the current playback state
- Adjusts volume for joke playback
- Plays the audio file
- Restores previous playback state after completion

## Implementation Details

### Error Handling
The application includes error handling for:
- API communication failures
- File system operations
- FTP upload issues
- Sonos playback problems

### State Management
The application maintains state awareness by:
- Saving current Sonos volume
- Tracking current playback status
- Estimating audio duration
- Managing playback restoration

### Performance Considerations
- Uses async/await for non-blocking operations
- Implements proper resource cleanup
- Includes timeout buffers for reliable playback
- Manages connection closures properly

## Security Considerations
- API keys should be stored securely
- FTP credentials should be protected
- Network access should be restricted to local network
- Secure file handling practices are implemented

## Future Improvements
Potential enhancements could include:
- Configuration file support
- Multiple speaker support
- Error retry mechanisms
- Logging system
- Queue management for multiple jokes
