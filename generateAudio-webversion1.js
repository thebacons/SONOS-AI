const axios = require('axios');
const fs = require('fs');
const { Sonos } = require('sonos');
const ftp = require('basic-ftp');

const API_KEY = 'your openai api key';
const SONOS_IP = 'your sonos SIP Address';
const FTP_CONFIG = {
    host: 'Webserver IP address',
    port: 21,
    user: 'WebServer username',
    password: 'WebServer password',
    secure: false
};

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

async function playSonosAudio(deviceIp, audioFilePath) {
    const device = new Sonos(deviceIp);
    try {
        const state = await device.getCurrentState();
        const currentTrack = await device.currentTrack();
        const currentVolume = await device.getVolume();
        
        // Estimate duration based on file size (128kbps MP3)
        const stats = fs.statSync('output.mp3');
        // Size to duration conversion: (size in bytes * 8 bits) / (bitrate in kbps * 1000) * 1000
        const durationMs = (stats.size * 8) / 128000 * 1000; // Size to duration conversion
        // Add 3 seconds buffer for loading and playback
        const timeoutMs = durationMs + 10000;
        
        await device.setVolume(40);
        await device.play(audioFilePath);
        
        console.log(`Playing audio, estimated duration: ${durationMs/1000} seconds`);
        
        setTimeout(async () => {
            await device.setVolume(currentVolume);
            if (state === 'playing' && currentTrack.uri) {
                await device.play(currentTrack.uri);
            }
            console.log('Restored previous playback');
        }, timeoutMs);
    } catch (error) {
        console.error('Error:', error);
    }
}
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
        const fileSize = fs.statSync(fileName).size;
        console.log(`Audio file saved as ${fileName}, size: ${fileSize} bytes`);

        await uploadToNAS(fileName);
        const audioUrl = 'Path to your WebServer file storage location/output.mp3';
        await playSonosAudio(SONOS_IP, audioUrl);
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

generateAudioAndPlay();