// handlers/promosiHandler.js
const config = require('../config/config');

// Function untuk normalisasi nomor WhatsApp
function normalizePhoneNumber(jid) {
    if (!jid) return null;
    
    // Extract number from JID
    let number = jid.replace('@s.whatsapp.net', '').replace(/[^0-9]/g, '');
    
    // Remove leading zeros and + sign if any
    number = number.replace(/^0+/, '').replace(/^\+/, '');
    
    // Convert to standard international format (62)
    if (number.startsWith('62')) {
        // Already in correct format
        return number;
    } else if (number.startsWith('0')) {
        // Convert from 08xxx to 628xxx
        return '62' + number.substring(1);
    } else if (number.startsWith('8')) {
        // Convert from 8xxx to 628xxx
        return '62' + number;
    } else {
        // Return as is (should already be international format)
        return number;
    }
}

// Function untuk cek apakah nomor adalah owner
function isOwnerNumber(jid) {
    if (!jid) return false;
    
    // Normalisasi nomor pengirim
    const senderNumber = normalizePhoneNumber(jid);
    if (!senderNumber) return false;
    
    // Normalisasi semua nomor owner untuk comparison
    const normalizedOwnerNumbers = config.ownerNumbers.map(ownerNumber => {
        return normalizePhoneNumber(ownerNumber);
    });
    
    console.log('Checking owner:', senderNumber, 'against:', normalizedOwnerNumbers);
    return normalizedOwnerNumbers.includes(senderNumber);
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

// Function untuk kirim promosi ke semua grup
async function broadcastPromosiToGroups(sock) {
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

// Handle promosi command
async function handlePromosi(sock, sender) {
    try {
        // Kirim konfirmasi dulu
        await sock.sendMessage(sender, { 
            text: '⏳ Memulai promosi ke semua grup...' 
        });
        
        // Jalankan promosi
        const result = await broadcastPromosiToGroups(sock);
        
        // Kirim laporan hasil
        await sock.sendMessage(sender, { 
            text: `✅ *PROMOSI SELESAI!*\n\n📊 Hasil:\n• Berhasil: ${result.successCount} grup\n• Gagal: ${result.failCount} grup\n• Total: ${result.total} grup\n\nPromosi telah dikirim ke semua grup dimana bot menjadi member.` 
        });
        
    } catch (error) {
        console.error('Error in handlePromosi:', error);
        await sock.sendMessage(sender, { 
            text: `❌ Gagal menjalankan promosi:\n${error.message}` 
        });
    }
}

module.exports = {
    isOwnerNumber,
    normalizePhoneNumber,
    generatePromosiMessage,
    broadcastPromosiToGroups,
    handlePromosi
};
