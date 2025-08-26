const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Import handlers and config
const config = require('./config/config');
const { handleIncomingMessage } = require('./handlers/mainHandler');

// Middleware
app.use(express.json());

// Initialize WhatsApp client
async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        browser: Browsers.macOS('Chrome'),
        logger: console
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            console.log('Scan QR code below:');
            qrcode.generate(qr, { small: true });
        }
        
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect);
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('WhatsApp bot connected successfully!');
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

// Start server
app.listen(PORT, () => {
    console.log(`Tohang Store Bot running on port ${PORT}`);
    connectToWhatsApp();
});

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ status: 'OK', message: 'Tohang Store Bot is running' });
});
