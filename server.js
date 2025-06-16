const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

// WebSocket server setup
const wss = new WebSocket.Server({ port: 8080 });

console.log('WebSocket server started on ws://localhost:8080');

wss.on('connection', (ws) => {
    console.log('Client connected');
    
    let audioChunks = [];
    let recordingStartTime = Date.now();
    
    ws.on('message', (data) => {
        // Receive PCM 16-bit audio data from client
        if (data instanceof ArrayBuffer || Buffer.isBuffer(data)) {
            const pcmData = Buffer.from(data);
            audioChunks.push(pcmData);
            
            console.log(`Received ${pcmData.length} bytes of audio data`);
        }
    });
    
    ws.on('close', () => {
        console.log('Client disconnected');
        
        if (audioChunks.length > 0) {
            // Combine all audio chunks
            const totalBuffer = Buffer.concat(audioChunks);
            
            // Create WAV file with proper headers
            const wavBuffer = createWAVBuffer(totalBuffer, 16000, 1, 16);
            
            // Save to file
            const filename = `recording_${recordingStartTime}.wav`;
            const filepath = path.join(__dirname, 'recordings', filename);
            
            // Ensure recordings directory exists
            if (!fs.existsSync(path.join(__dirname, 'recordings'))) {
                fs.mkdirSync(path.join(__dirname, 'recordings'));
            }
            
            fs.writeFileSync(filepath, wavBuffer);
            console.log(`Audio saved to: ${filepath}`);
            console.log(`Total duration: ${(Date.now() - recordingStartTime) / 1000}s`);
            console.log(`File size: ${wavBuffer.length} bytes`);
        }
        
        // Reset for next recording
        audioChunks = [];
    });
    
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

// Function to create WAV file buffer with proper headers
function createWAVBuffer(pcmData, sampleRate, channels, bitsPerSample) {
    const byteRate = sampleRate * channels * (bitsPerSample / 8);
    const blockAlign = channels * (bitsPerSample / 8);
    const dataSize = pcmData.length;
    const fileSize = 36 + dataSize;
    
    const buffer = Buffer.alloc(44 + dataSize);
    let offset = 0;
    
    // RIFF header
    buffer.write('RIFF', offset); offset += 4;
    buffer.writeUInt32LE(fileSize, offset); offset += 4;
    buffer.write('WAVE', offset); offset += 4;
    
    // fmt chunk
    buffer.write('fmt ', offset); offset += 4;
    buffer.writeUInt32LE(16, offset); offset += 4; // chunk size
    buffer.writeUInt16LE(1, offset); offset += 2; // audio format (PCM)
    buffer.writeUInt16LE(channels, offset); offset += 2;
    buffer.writeUInt32LE(sampleRate, offset); offset += 4;
    buffer.writeUInt32LE(byteRate, offset); offset += 4;
    buffer.writeUInt16LE(blockAlign, offset); offset += 2;
    buffer.writeUInt16LE(bitsPerSample, offset); offset += 2;
    
    // data chunk
    buffer.write('data', offset); offset += 4;
    buffer.writeUInt32LE(dataSize, offset); offset += 4;
    pcmData.copy(buffer, offset);
    
    return buffer;
}

process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    wss.close();
    process.exit(0);
}); 