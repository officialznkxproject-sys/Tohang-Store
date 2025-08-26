const config = require('../config/config');
const { 
    handleMenu, 
    handlePulsa, 
    handleListrik, 
    handleHelp,
    handlePromo,
    handleAsuransi,
    handleAir,
    handleBPJS,
    handleBPJSTK,
    handleEWallet,
    handleGames
} = require('./commandHandlers');

async function handleIncomingMessage(sock, message) {
    const messageText = message.message.conversation || 
                       (message.message.extendedTextMessage && message.message.extendedTextMessage.text) || 
                       '';
    
    const sender = message.key.remoteJid;
    const command = messageText.trim().toLowerCase();
    
    try {
        // Handle different commands
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
        else if (command === '.hi' || command === '.halo' || command === '.hello') {
            await sock.sendMessage(sender, { 
                text: config.welcomeMessage.replace('{{storeName}}', config.storeName) 
            });
        }
        else if (command.startsWith('.')) {
            await sock.sendMessage(sender, { 
                text: `Perintah *${command}* tidak dikenali. Ketik *.menu* untuk melihat daftar perintah yang tersedia.` 
            });
        }
    } catch (error) {
        console.error('Error handling message:', error);
        await sock.sendMessage(sender, { 
            text: 'Terjadi kesalahan sistem. Silakan coba lagi nanti atau hubungi admin.' 
        });
    }
}

module.exports = { handleIncomingMessage };
