6283131871328const config = require('../config/config');

// Import semua handler function
const { 
    handleMenu, 
    handlePulsa, 
    handleListrik, 
    handleAsuransi,
    handleAir,
    handleBPJS,
    handleBPJSTK,
    handleEWallet,
    handleGames,
    handlePromo,
    handleHelp
} = require('./commandHandlers');

// Function untuk handle panggilan dan blocking
async function handleCallsAndBlocking(sock, message) {
    // Otomatis tolak semua panggilan
    if (message.message && message.message.call) {
        console.log('Panggilan diterima dari:', message.key.remoteJid);
        
        try {
            // Update block status
            await sock.updateBlockStatus(message.key.remoteJid, 'block');
            console.log('Nomor diblokir karena menelepon:', message.key.remoteJid);
        } catch (error) {
            console.error('Error blocking number:', error);
        }
        return true; // Skip processing lainnya
    }
    return false;
}

async function handleIncomingMessage(sock, message) {
    // Handle panggilan dan blocking terlebih dahulu
    if (await handleCallsAndBlocking(sock, message)) {
        return;
    }
    
    const messageText = message.message.conversation || 
                       (message.message.extendedTextMessage && message.message.extendedTextMessage.text) || 
                       (message.message.buttonsResponseMessage && message.message.buttonsResponseMessage.selectedButtonId) ||
                       '';
    
    const sender = message.key.remoteJid;
    const command = messageText.trim().toLowerCase();
    
    // Log semua pesan yang masuk (opsional, untuk debugging)
    console.log('Pesan dari:', sender, 'Isi:', command);
    
    try {
        if (command === '.menu') {
            await handleMenu(sock, sender);
        } 
        else if (command.startsWith('.pulsa')) {
            await handlePulsa(sock, sender, command);
        }
        else if (command.startsWith('.listrik')) {
            await handleListrik(sock, sender, command);
        }
        else if (command.startsWith('.asuransi')) {
            await handleAsuransi(sock, sender, command);
        }
        else if (command.startsWith('.air')) {
            await handleAir(sock, sender, command);
        }
        else if (command.startsWith('.bpjs')) {
            await handleBPJS(sock, sender, command);
        }
        else if (command.startsWith('.bpjstk')) {
            await handleBPJSTK(sock, sender, command);
        }
        else if (command.startsWith('.ewallet')) {
            await handleEWallet(sock, sender, command);
        }
        else if (command.startsWith('.game')) {
            await handleGames(sock, sender, command);
        }
        else if (command === '.promo') {
            await handlePromo(sock, sender);
        }
        else if (command === '.bantuan') {
            await handleHelp(sock, sender);
        }
        else if (command === '.status') {
            await sock.sendMessage(sender, { 
                text: `✅ *Status Bot Tohang Store*\n\nBot sedang online dan siap melayani!\n\nTerhubung: ${new Date().toLocaleString('id-ID')}\n\nKetik *.menu* untuk melihat layanan yang tersedia.` 
            });
        }
        else if (command === '.hi' || command === '.halo' || command === '.hello' || command === '.hallo') {
            await sock.sendMessage(sender, { 
                text: config.welcomeMessage.replace('{{storeName}}', config.storeName) 
            });
        }
        else if (command.startsWith('.')) {
            await sock.sendMessage(sender, { 
                text: `❌ Perintah *${command}* tidak dikenali.\n\nKetik *.menu* untuk melihat daftar perintah yang tersedia.\n\nAtau ketip *.bantuan* untuk informasi lebih lanjut.` 
            });
        }
        // Auto-response untuk pesan pertama
        else if (!command && message.message && Object.keys(message.message).length === 1 && message.message.protocolMessage) {
            // Ignore protocol messages
        }
        else if (messageText.length > 0 && !message.key.fromMe) {
            // Response default untuk pesan biasa
            await sock.sendMessage(sender, { 
                text: `👋 Halo! Selamat datang di *Tohang Store*!\n\nSaya adalah bot WhatsApp yang siap membantu Anda dengan berbagai layanan:\n\n• Pembelian pulsa & paket data\n• Token listrik\n• Pembayaran tagihan\n• Dan layanan lainnya\n\nKetik *.menu* untuk melihat daftar lengkap layanan yang tersedia.` 
            });
        }
    } catch (error) {
        console.error('Error handling message:', error);
        try {
            await sock.sendMessage(sender, { 
                text: '⚠️ Terjadi kesalahan sistem. Silakan coba lagi nanti atau hubungi admin.' 
            });
        } catch (sendError) {
            console.error('Error sending error message:', sendError);
        }
    }
}

module.exports = { handleIncomingMessage };
