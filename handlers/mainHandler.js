const config = require('../config/config');

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
    handleHelp,
    handlePromosi // Tambah handler promosi
} = require('./commandHandlers');

// Daftar nomor owner yang bisa akses fitur promosi
const OWNER_NUMBERS = ['6283131871328', '6282181668718']; // Format international

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

// Function untuk cek apakah nomor adalah owner
function isOwnerNumber(jid) {
    const number = jid.replace('@s.whatsapp.net', '').replace(/[^0-9]/g, '');
    return OWNER_NUMBERS.includes(number);
}

// Function untuk kirim promosi ke semua grup
async function broadcastPromosiToGroups(sock, message) {
    try {
        const groups = await sock.groupFetchAllParticipating();
        const groupIds = Object.keys(groups);
        
        let successCount = 0;
        let failCount = 0;
        
        for (const groupId of groupIds) {
            try {
                await sock.sendMessage(groupId, { 
                    text: generatePromosiMessage() 
                });
                successCount++;
                console.log('Promosi terkirim ke grup:', groupId);
                
                // Delay antar pengiriman untuk hindari spam detection
                await new Promise(resolve => setTimeout(resolve, 2000));
                
            } catch (error) {
                console.error('Gagal kirim promosi ke grup:', groupId, error);
                failCount++;
            }
        }
        
        return { successCount, failCount, total: groupIds.length };
        
    } catch (error) {
        console.error('Error fetching groups:', error);
        throw error;
    }
}

// Generate message promosi
function generatePromosiMessage() {
    return `🌟 *PROMOSI SPESIAL TOHANG STORE* 🌟

🔥 *Tawaran Terbatas Bulan Ini:*

🎯 *DISKON EKSKLUSIF:*
• 🤑 Diskon 7% untuk pembelian pulsa di atas 100rb
• ⚡ Gratis biaya admin untuk pembelian token listrik 200rb
• 📶 Cashback 3% untuk pembelian paket data 15GB
• 💳 Cashback 2.5% untuk top up e-wallet DANA/OVO/GoPay

🎁 *BONUS KHUSUS:*
• ✅ Beli 5x pulsa dapat voucher 15rb
• ✅ Transaksi 10x dapat merchandise eksklusif Tohang Store
• ✅ Setiap transaksi dapat poin yang bisa ditukar hadiah

🏆 *KEUNGGULAN KAMI:*
• ⚡ Proses cepat & otomatis 24/7
• 🔒 Terjamin aman dan terpercaya
• 📞 Customer service siap membantu
• 💰 Harga kompetitif dan terjangkau

🛒 *LAYANAN YANG TERSEDIA:*
• 📱 Pulsa & Paket Data semua operator
• ⚡ Token Listrik PLN
• 💧 Pembayaran tagihan air PDAM
• 🏥 BPJS Kesehatan & Ketenagakerjaan
• 🛡️ Pembayaran asuransi
• 💳 Top up e-wallet (DANA, OVO, GoPay, LinkAja)
• 🎮 Voucher game (Mobile Legends, Free Fire, PUBG, dll)

⏰ *PERIODE PROMO:*
Promo berlaku sampai akhir bulan ini saja! Jangan sampai kehabisan!

📞 *HUBUNGI KAMI:*
• WhatsApp: 083131871328 / 082181668718
• Instagram: @tohangstore
• Toko: Jl. Contoh No. 123, Kota Anda

💬 *CARA ORDER:*
1. Ketik *.menu* untuk melihat layanan
2. Pilih layanan yang diinginkan
3. Ikuti instruksi yang diberikan bot
4. Transfer pembayaran
5. Kirim bukti transfer ke admin
6. Pesanan diproses secara instan!

🔒 *GARANSI:*
• 100% uang kembali jika terjadi gangguan sistem
• Transaksi tidak jadi? Dana kembali 100%
• Pelayanan ramah dan profesional

Jangan lewatkan kesempatan emas ini! Buruan order sebelum promo berakhir! 🚀

*TOHANG STORE - AGEN DANA TERPERCAYA* 💙
`;
}

async function handleIncomingMessage(sock, message) {
    const sender = message.key.remoteJid;
    
    // JANGAN proses pesan dari grup, kecuali perintah promosi dari owner
    if (isGroupMessage(sender)) {
        // Cek jika ini perintah promosi dari owner
        const messageText = message.message.conversation || 
                           (message.message.extendedTextMessage && message.message.extendedTextMessage.text) || '';
        
        if (messageText.trim() === '.promosi' && isOwnerNumber(message.key.participant || sender)) {
            console.log('Owner memerintah promosi dari grup');
            try {
                // Kirim konfirmasi ke owner dulu
                await sock.sendMessage(sender, { 
                    text: '⏳ Memulai promosi ke semua grup...' 
                });
                
                // Jalankan promosi
                const result = await broadcastPromosiToGroups(sock, message);
                
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
    
    // Log semua pesan yang masuk (opsional, untuk debugging)
    console.log('Pesan pribadi dari:', sender, 'Isi:', command);
    
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
                text: `❌ Perintah *${command}* tidak dikenali.\n\nKetik *.menu* untuk melihat daftar perintah yang tersedia.\n\nAtau ketik *.bantuan* untuk informasi lebih lanjut.` 
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

module.exports = { 
    handleIncomingMessage,
    broadcastPromosiToGroups,
    generatePromosiMessage
};
