const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers, delay } = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Import handlers and config
const config = require('./config/config');
const { handleIncomingMessage } = require('./handlers/mainHandler');

// Middleware
app.use(express.json());
app.use(express.static('public'));

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
let sock = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

// Function to block calls automatically
function setupCallBlocking(sock) {
    sock.ev.on('call', async (call) => {
        const callData = call[0];
        if (callData && callData.id) {
            console.log('Panggilan diterima dari:', callData.from);
            
            // Otomatis tolak panggilan
            try {
                await sock.rejectCall(callData.id, callData.from);
                console.log('Panggilan otomatis ditolak:', callData.from);
                
                // Blokir nomor yang menelpon
                await sock.updateBlockStatus(callData.from, 'block');
                console.log('Nomor diblokir:', callData.from);
                
            } catch (error) {
                console.error('Error menolak panggilan:', error);
            }
        }
    });
}

// Initialize WhatsApp client dengan auto-reconnect
async function connectToWhatsApp() {
    try {
        console.log('🔄 Menghubungkan ke WhatsApp...');
        
        const { state, saveCreds } = await useMultiFileAuthState('auth_info');
        
        sock = makeWASocket({
            auth: state,
            browser: Browsers.macOS('Chrome'),
            logger: logger,
            printQRInTerminal: false,
            markOnlineOnConnect: true,
            syncFullHistory: false,
            generateHighQualityLinkPreview: true,
            shouldIgnoreJid: jid => jid.endsWith('@broadcast'),
            getMessage: async () => undefined
        });

        // Setup call blocking
        setupCallBlocking(sock);

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            if (qr) {
                console.log('QR code received, generating for web...');
                try {
                    currentQR = await QRCode.toString(qr, { 
                        type: 'svg',
                        margin: 2,
                        width: 300,
                        color: {
                            dark: '#000000',
                            light: '#FFFFFF'
                        }
                    });
                    console.log('QR code generated successfully');
                    isConnected = false;
                    reconnectAttempts = 0; // Reset reconnect attempts ketika QR baru dihasilkan
                    
                    if (qrTimeout) clearTimeout(qrTimeout);
                    
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
                
                console.log('❌ Connection closed:', lastDisconnect.error);
                console.log('Should reconnect:', shouldReconnect);
                
                if (shouldReconnect) {
                    reconnectAttempts++;
                    const delayTime = Math.min(1000 * reconnectAttempts, 30000); // Exponential backoff max 30 detik
                    
                    console.log(`⏳ Attempting reconnect in ${delayTime/1000} seconds (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
                    
                    if (reconnectAttempts <= MAX_RECONNECT_ATTEMPTS) {
                        setTimeout(connectToWhatsApp, delayTime);
                    } else {
                        console.log('❌ Max reconnect attempts reached. Please check your internet connection.');
                    }
                } else {
                    console.log('❌ Logged out, please scan QR code again');
                    currentQR = null;
                    isConnected = false;
                }
            } 
            else if (connection === 'open') {
                console.log('✅ WhatsApp bot connected successfully!');
                currentQR = null;
                isConnected = true;
                reconnectAttempts = 0; // Reset reconnect attempts ketika berhasil connect
                
                if (qrTimeout) {
                    clearTimeout(qrTimeout);
                    qrTimeout = null;
                }
                
                // Simpan info connection
                saveConnectionInfo();
            }
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('messages.upsert', async (m) => {
            const message = m.messages[0];
            if (message && !message.key.fromMe && m.type === 'notify') {
                await handleIncomingMessage(sock, message);
            }
        });

        // Handle errors
        sock.ev.on('error', (error) => {
            console.error('WhatsApp error:', error);
        });

        return sock;
    } catch (error) {
        console.error('Error connecting to WhatsApp:', error);
        
        reconnectAttempts++;
        const delayTime = Math.min(1000 * reconnectAttempts, 30000);
        
        if (reconnectAttempts <= MAX_RECONNECT_ATTEMPTS) {
            setTimeout(connectToWhatsApp, delayTime);
        }
    }
}

// Simpan info koneksi untuk monitoring
function saveConnectionInfo() {
    const connectionInfo = {
        lastConnected: new Date().toISOString(),
        reconnectAttempts: reconnectAttempts,
        status: 'connected'
    };
    
    fs.writeFileSync('connection.json', JSON.stringify(connectionInfo, null, 2));
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
                    Reconnecting...
                </text>
                <text x="150" y="170" text-anchor="middle" fill="white" font-family="Arial" font-size="12">
                    Attempt ${reconnectAttempts}
                </text>
            </svg>
        `);
    }
});

app.get('/status', (req, res) => {
    res.json({ 
        connected: isConnected,
        hasQR: !!currentQR,
        storeName: config.storeName,
        reconnectAttempts: reconnectAttempts,
        lastUpdate: new Date().toISOString()
    });
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Tohang Store Bot is running',
        connected: isConnected,
        timestamp: new Date().toISOString()
    });
});

// Endpoint untuk memaksa reconnect
app.post('/reconnect', (req, res) => {
    if (sock) {
        console.log('Manual reconnect triggered');
        reconnectAttempts = 0;
        connectToWhatsApp();
        res.json({ status: 'reconnecting' });
    } else {
        res.status(400).json({ error: 'Socket not initialized' });
    }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Tohang Store Bot running on port ${PORT}`);
    console.log(`🌐 Website: http://localhost:${PORT}`);
    console.log(`⚡ Health check: http://localhost:${PORT}/health`);
    
    // Load connection info jika ada
    try {
        if (fs.existsSync('connection.json')) {
            const connectionInfo = JSON.parse(fs.readFileSync('connection.json', 'utf8'));
            console.log('📊 Last connection:', connectionInfo.lastConnected);
        }
    } catch (error) {
        console.log('No previous connection info found');
    }
    
    connectToWhatsApp().catch(console.error);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('🛑 Shutting down Tohang Store Bot...');
    
    if (sock) {
        try {
            await sock.end();
            console.log('WhatsApp connection closed properly');
        } catch (error) {
            console.error('Error closing connection:', error);
        }
    }
    
    process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
