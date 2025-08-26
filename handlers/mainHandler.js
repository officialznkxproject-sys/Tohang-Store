const config = require('../config/config');

// Import semua handler function
const commandHandlers = require('./commandHandlers');
const { 
    isVerifiedOwner,
    handleZinCommand,
    handleOwnerMessage,
    normalizePhoneNumber
} = require('./ownerHandler');

// Import function promosi
const { broadcastPromosiToGroups } = require('./promosiHandler');

// Function untuk handle panggilan dan blocking
async function handleCallsAndBlocking(sock, message) {
    if (message.message && message.message.call) {
        console.log('Panggilan diterima dari:', message.key.remoteJid);
        try {
            await sock.updateBlockStatus(message.key.remoteJid, 'block');
            console.log('Nomor diblokir karena menelepon:', message.key.remoteJid);
        } catch (error) {
            console.error('Error blocking number:', error);
        }
        return true;
    }
    return false;
}

function isGroupMessage(jid) {
    return jid.endsWith('@g.us');
}

async function handleIncomingMessage(sock, message) {
    const sender = message.key.remoteJid;
    
    if (isGroupMessage(sender)) {
        const messageText = message.message.conversation || 
                           (message.message.extendedTextMessage && message.message.extendedTextMessage.text) || '';
        
        const participant = message.key.participant || sender;
        if (messageText.trim() === '.promosi' && isVerifiedOwner(participant)) {
            console.log('Owner memerintah promosi dari grup');
            try {
                await sock.sendMessage(sender, { text: '⏳ Memulai promosi ke semua grup...' });
                const result = await broadcastPromosiToGroups(sock);
                await sock.sendMessage(sender, { 
                    text: `✅ Promosi selesai!\nBerhasil: ${result.successCount}\nGagal: ${result.failCount}\nTotal: ${result.total} grup` 
                });
            } catch (error) {
                console.error('Error promosi:', error);
                await sock.sendMessage(sender, { text: '❌ Gagal menjalankan promosi: ' + error.message });
            }
        }
        return;
    }
    
    if (await handleCallsAndBlocking(sock, message)) {
        return;
    }
    
    const messageText = message.message.conversation || 
                       (message.message.extendedTextMessage && message.message.extendedTextMessage.text) || '';
    
    const command = messageText.trim().toLowerCase();
    
    console.log('Pesan dari:', sender, 'Command:', command);
    console.log('Verified owner?', isVerifiedOwner(sender));
    
    try {
        // Handle perintah .zin (untuk semua orang)
        if (command.startsWith('.zin')) {
            await handleZinCommand(sock, sender, command);
            return;
        }
        
        // Cek jika pengirim adalah verified owner
        const isOwner = isVerifiedOwner(sender);
        
        if (isOwner) {
            // Handle perintah owner
            if (command === '.promosi' || command === '.status' || command === '.helpowner') {
                await handleOwnerMessage(sock, sender, command);
                return;
            }
            
            // Sambutan khusus untuk owner
            if (command === '.hi' || command === '.halo' || command === '.hello' || command === '.hallo' || command === '') {
                await sock.sendMessage(sender, { text: config.ownerWelcomeMessage });
                return;
            }
        }
        
        // Handle perintah umum untuk semua pengguna
        if (command === '.menu') {
            await commandHandlers.handleMenu(sock, sender);
        } 
        else if (command.startsWith('.pulsa')) {
            await commandHandlers.handlePulsa(sock, sender, command);
        }
        else if (command.startsWith('.listrik')) {
            await commandHandlers.handleListrik(sock, sender, command);
        }
        else if (command.startsWith('.asuransi')) {
            await commandHandlers.handleAsuransi(sock, sender, command);
        }
        else if (command.startsWith('.air')) {
            await commandHandlers.handleAir(sock, sender, command);
        }
        else if (command.startsWith('.bpjs')) {
            await commandHandlers.handleBPJS(sock, sender, command);
        }
        else if (command.startsWith('.bpjstk')) {
            await commandHandlers.handleBPJSTK(sock, sender, command);
        }
        else if (command.startsWith('.ewallet')) {
            await commandHandlers.handleEWallet(sock, sender, command);
        }
        else if (command.startsWith('.game')) {
            await commandHandlers.handleGames(sock, sender, command);
        }
        else if (command === '.promo') {
            await commandHandlers.handlePromo(sock, sender);
        }
        else if (command === '.promosi') {
            if (isOwner) {
                await handleOwnerMessage(sock, sender, command);
            } else {
                await sock.sendMessage(sender, { 
                    text: '❌ Maaf, fitur ini hanya untuk owner toko.\n\nGunakan *.zin [nomor]* untuk verifikasi.' 
                });
            }
        }
        else if (command === '.bantuan') {
            await commandHandlers.handleHelp(sock, sender);
        }
        else if (command === '.status') {
            if (isOwner) {
                await handleOwnerMessage(sock, sender, command);
            } else {
                await sock.sendMessage(sender, { 
                    text: `✅ *Status Bot Tohang Store*\n\nBot sedang online dan siap melayani!\n\nTerhubung: ${new Date().toLocaleString('id-ID')}\n\nKetik *.menu* untuk melihat layanan.` 
                });
            }
        }
        else if (command === '.hi' || command === '.halo' || command === '.hello' || command === '.hallo') {
            await sock.sendMessage(sender, { 
                text: config.welcomeMessage.replace('{{storeName}}', config.storeName) 
            });
        }
        else if (command.startsWith('.')) {
            await sock.sendMessage(sender, { 
                text: `❌ Perintah *${command}* tidak dikenali.\n\nKetik *.menu* untuk melihat daftar perintah.` 
            });
        }
        else if (messageText.length > 0 && !message.key.fromMe) {
            let responseText = `👋 Halo! Selamat datang di *Tohang Store*!\n\nSaya adalah bot WhatsApp yang siap membantu Anda.`;
            
            if (isOwner) {
                responseText += `\n\n👑 *Mode Owner Terdeteksi*\nGunakan *.helpowner* untuk fitur khusus owner.`;
            } else {
                responseText += `\n\nKetik *.menu* untuk melihat layanan yang tersedia.`;
            }
            
            await sock.sendMessage(sender, { text: responseText });
        }
    } catch (error) {
        console.error('Error handling message:', error);
        try {
            await sock.sendMessage(sender, { 
                text: '⚠️ Terjadi kesalahan sistem. Silakan coba lagi nanti.' 
            });
        } catch (sendError) {
            console.error('Error sending error message:', sendError);
        }
    }
}

module.exports = { 
    handleIncomingMessage
};
