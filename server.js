const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode');
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Import handlers and config
const config = require('./config/config');
const { handleIncomingMessage } = require('./handlers/mainHandler');

// Middleware
app.use(express.json());
app.use(express.static('public')); // Serve static files

// Custom logger to fix the error
const logger = {
    trace: (...args) => console.log('[TRACE]', ...args),
    debug: (...args) => console.log('[DEBUG]', ...args),
    info: (...args) => console.log('[INFO]', ...args),
    warn: (...args) => console.log('[WARN]', ...args),
    error: (...args) => console.log('[ERROR]', ...args),
    fatal: (...args) => console.log('[FATAL]', ...args),
    child: () => logger // Fix for the child method error
};

// Global variable to store QR code
let currentQR = null;
let isConnected = false;

// Initialize WhatsApp client
async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    
    const sock = makeWASocket({
        auth: state,
        browser: Browsers.macOS('Chrome'),
        logger: logger,
        printQRInTerminal: false
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            // Generate QR code as SVG
            currentQR = await qrcode.toString(qr, { type: 'svg' });
            console.log('QR code generated for web display');
            isConnected = false;
        }
        
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect);
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('WhatsApp bot connected successfully!');
            currentQR = null;
            isConnected = true;
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (m) => {
        const message = m.messages[0];
        if (!message.key.fromMe && m.type === 'notify') {
            await handleIncomingMessage(sock, message);
        }
    });

    return sock;
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/qr', (req, res) => {
    if (currentQR) {
        res.set('Content-Type', 'image/svg+xml');
        res.send(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                <rect width="100%" height="100%" fill="white"/>
                ${currentQR.replace('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">', '').replace('</svg>', '')}
            </svg>
        `);
    } else if (isConnected) {
        res.set('Content-Type', 'image/svg+xml');
        res.send(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                <rect width="100%" height="100%" fill="#4CAF50"/>
                <text x="50" y="50" text-anchor="middle" dy="0.3em" fill="white" font-family="Arial" font-size="5">Connected ✓</text>
            </svg>
        `);
    } else {
        res.set('Content-Type', 'image/svg+xml');
        res.send(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                <rect width="100%" height="100%" fill="#FF9800"/>
                <text x="50" y="50" text-anchor="middle" dy="0.3em" fill="white" font-family="Arial" font-size="5">Generating QR...</text>
            </svg>
        `);
    }
});

app.get('/status', (req, res) => {
    res.json({ 
        connected: isConnected,
        hasQR: !!currentQR,
        storeName: config.storeName
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Tohang Store Bot running on port ${PORT}`);
    console.log(`Website: http://localhost:${PORT}`);
    console.log(`QR Code: http://localhost:${PORT}/qr`);
    connectToWhatsApp().catch(console.error);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down Tohang Store Bot...');
    process.exit(0);
});
