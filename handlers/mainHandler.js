const config = require('../config/config');

// Import semua handler function dari commandHandlers
const commandHandlers = require('./commandHandlers');

// Import function promosi dari promosiHandler
const { 
    isOwnerNumber, 
    handlePromosi,
    broadcastPromosiToGroups
} = require('./promosiHandler');

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

// Function untuk cek apakah pesan dari grup
function isGroupMessage(jid) {
    return jid.endsWith('@g.us');
}

// Function untuk handle pesan khusus owner
async function handleOwnerMessage(sock, sender, command) {
    if (command === '.promosi') {
        await handlePromosi(sock, sender);
    }
    else if (command === '.status') {
        const statusText = `👑 *STATUS BOT - OWNER PANEL*\n\n` +
                         `✅ Bot Online & Connected\n` +
                         `🕐 Last Update: ${new Date().toLocaleString('id-ID')}\n` +
                         `🏪 Store: ${config.storeName}\n` +
                         `📞 Owner: ${config.ownerNumbers.join(', ')}\n\n` +
                         `Fitur Owner:\n` +
                         `• .promosi - Kirim promosi ke semua grup\n` +
                         `• .status - Status bot lengkap\n` +
                         `• .broadcast [pesan] - Broadcast ke semua kontak (soon)\n` +
                         `• .stats - Statistik bot (soon)`;
        
        await sock.sendMessage(sender, { text: statusText });
    }
    else if (command === '.helpowner') {
        await sock.sendMessage(sender, { text: config.ownerWelcomeMessage });
    }
    else {
        await sock.sendMessage(sender, { 
            text: `❌ Perintah owner *${command}* tidak dikenali.\n\nKetik *.helpowner* untuk melihat fitur owner.` 
        });
    }
}

async function handleIncomingMessage(sock, message) {
    const sender = message.key.remoteJid;
    
    // JANGAN proses pesan dari grup, kecuali perintah promosi dari owner
    if (isGroupMessage(sender)) {
        // Cek jika ini perintah promosi dari owner
        const messageText = message.message.conversation || 
                           (message.message.extendedTextMessage && message.message.extendedTextMessage.text) || '';
        
        const participant = message.key.participant || sender;
        if (messageText.trim() === '.promosi' && isOwnerNumber(participant)) {
            console.log('Owner memerintah promosi dari grup');
            try {
                // Kirim konfirmasi ke owner dulu
                await sock.sendMessage(sender, { 
                    text: '⏳ Memulai promosi ke semua grup...' 
                });
                
                // Jalankan promosi
                const result = await broadcastPromosiToGroups(sock);
                
                await sock.sendMessage(sender, { 
                    text: `✅ Promosi selesai!\n\nBerhasil: ${result.successCount}\nGagal: ${result.failCount}\nTotal: ${result.total} grup` 
                });
                
            } catch (error) {
                console.error('Error promosi:', error);
                await sock.sendMessage(sender, { 
                    text: '❌ Gagal menjalankan promosi: ' + error.message 
                });
            }
        }
        return; // Stop processing untuk semua pesan grup lainnya
    }
    
    // Handle panggilan dan blocking terlebih dahulu
    if (await handleCallsAndBlocking(sock, message)) {
        return;
    }
    
    const messageText = message.message.conversation || 
                       (message.message.extendedTextMessage && message.message.extendedTextMessage.text) || 
                       (message.message.buttonsResponseMessage && message.message.buttonsResponseMessage.selectedButtonId) ||
                       '';
    
    const command = messageText.trim().toLowerCase();
    
    // Log semua pesan yang masuk
    console.log('Pesan dari:', sender, 'Isi:', command);
    console.log('Is owner?', isOwnerNumber(sender));
    
    try {
        // Cek jika pengirim adalah owner
        if (isOwnerNumber(sender)) {
            // Sambutan khusus untuk owner
            if (command === '.hi' || command === '.halo' || command === '.hello' || command === '.hallo' || command === '') {
                await sock.sendMessage(sender, { 
                    text: config.ownerWelcomeMessage 
                });
                return;
            }
            
            // Handle perintah owner
            if (command.startsWith('.promosi') || command.startsWith('.status') || command.startsWith('.helpowner')) {
                await handleOwnerMessage(sock, sender, command);
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
            // Hanya owner yang bisa jalankan promosi
            if (isOwnerNumber(sender)) {
                await handlePromosi(sock, sender);
            } else {
                await sock.sendMessage(sender, { 
                    text: '❌ Maaf, fitur ini hanya untuk owner toko.' 
                });
            }
        }
        else if (command === '.bantuan') {
            await commandHandlers.handleHelp(sock, sender);
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
                text: `❌ Perintah *${command}* tidak dikenali.\n\nKetik *.menu* untuk melihat daftar perintah yang tersedia.\n\nAtau ketik *.bantuan* untuk informasi lebih lanjut.` 
            });
        }
        // Auto-response untuk pesan pertama
        else if (!command && message.message && Object.keys(message.message).length === 1 && message.message.protocolMessage) {
            // Ignore protocol messages
        }
        else if (messageText.length > 0 && !message.key.fromMe) {
            // Response default untuk pesan biasa
            let responseText = `👋 Halo! Selamat datang di *Tohang Store*!\n\nSaya adalah bot WhatsApp yang siap membantu Anda dengan berbagai layanan.`;
            
            // Jika ini owner, tambahkan pesan khusus
            if (isOwnerNumber(sender)) {
                responseText += `\n\n👑 *Mode Owner Terdeteksi*\nGunakan *.helpowner* untuk fitur khusus owner.`;
            } else {
                responseText += `\n\nKetik *.menu* untuk melihat daftar lengkap layanan yang tersedia.`;
            }
            
            await sock.sendMessage(sender, { text: responseText });
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

module.exports = { 
    handleIncomingMessage
};
