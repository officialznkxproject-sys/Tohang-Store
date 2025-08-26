item.name// Tambahkan function handlePromosi
async function handlePromosi(sock, sender) {
    try {
        // Kirim konfirmasi dulu
        await sock.sendMessage(sender, { 
            text: '⏳ Memulai promosi ke semua grup...' 
        });
        
        // Import function broadcast
        const { broadcastPromosiToGroups } = require('./mainHandler');
        
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

// Jangan lupa export handlePromosi
module.exports = {
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
    handlePromosi // Tambahkan ini
};
