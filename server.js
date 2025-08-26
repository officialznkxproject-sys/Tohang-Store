const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');
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

// Custom logger
const logger = {
    trace: (...args) => console.log('[TRACE]', ...args),
    debug: (...args) => console.log('[DEBUG]', ...args),
    info: (...args) => console.log('[INFO]', ...args),
    warn: (...args) => console.log('[WARN]', ...args),
    error: (...args) => console.log('[ERROR]', ...args),
    fatal: (...args) => console.log('[FATAL]', ...args),
    child: () => logger
};

// Global variables
let currentQR = null;
let isConnected = false;
let qrTimeout = null;

// Initialize WhatsApp client
async function connectToWhatsApp() {
    try {
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
                console.log('QR code received, generating for web...');
                try {
                    // Generate QR code as SVG
                    currentQR = await QRCode.toString(qr, { 
                        type: 'svg',
                        margin: 2,
                        width: 300,
                        color: {
                            dark: '#000000',
                            light: '#FFFFFF'
                        }
                    });
                    console.log('QR code generated successfully for web display');
                    isConnected = false;
                    
                    // Clear previous timeout
                    if (qrTimeout) {
                        clearTimeout(qrTimeout);
                    }
                    
                    // Set timeout to refresh QR code after 60 seconds
                    qrTimeout = setTimeout(() => {
                        console.log('QR code expired, generating new one...');
                        currentQR = null;
                    }, 60000);
                } catch (error) {
                    console.error('Error generating QR code:', error);
                }
            }
            
            if (connection === 'close') {
                const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
                console.log('Connection closed, reconnecting:', shouldReconnect);
                if (shouldReconnect) {
                    setTimeout(connectToWhatsApp, 3000);
                }
            } else if (connection === 'open') {
                console.log('WhatsApp bot connected successfully!');
                currentQR = null;
                isConnected = true;
                if (qrTimeout) {
                    clearTimeout(qrTimeout);
                    qrTimeout = null;
                }
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
    } catch (error) {
        console.error('Error connecting to WhatsApp:', error);
        setTimeout(connectToWhatsApp, 5000); // Retry after 5 seconds
    }
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/qr', (req, res) => {
    res.set('Content-Type', 'image/svg+xml');
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    if (currentQR) {
        res.send(currentQR);
    } else if (isConnected) {
        res.send(`
            <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
                <rect width="100%" height="100%" fill="#4CAF50"/>
                <text x="150" y="150" text-anchor="middle" dy="0.3em" fill="white" font-family="Arial" font-size="24" font-weight="bold">
                    Connected ✓
                </text>
            </svg>
        `);
    } else {
        res.send(`
            <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
                <rect width="100%" height="100%" fill="#FF9800"/>
                <text x="150" y="140" text-anchor="middle" fill="white" font-family="Arial" font-size="18" font-weight="bold">
                    Generating QR...
                </text>
                <text x="150" y="170" text-anchor="middle" fill="white" font-family="Arial" font-size="12">
                    Please wait
                </text>
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

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Tohang Store Bot is running',
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Tohang Store Bot running on port ${PORT}`);
    console.log(`Website: http://localhost:${PORT}`);
    connectToWhatsApp().catch(console.error);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down Tohang Store Bot...');
    process.exit(0);
});
