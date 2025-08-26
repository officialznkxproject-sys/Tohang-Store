// handlers/ownerHandler.js
const config = require('../config/config');
const fs = require('fs');
const path = require('path');

const OWNERS_FILE = path.join(__dirname, '../data/owners.json');

// Function untuk normalisasi nomor WhatsApp
function normalizePhoneNumber(jid) {
    if (!jid) return null;
    
    // Extract number from JID
    let number = jid.replace('@s.whatsapp.net', '').replace(/[^0-9]/g, '');
    
    // Remove leading zeros and + sign if any
    number = number.replace(/^0+/, '').replace(/^\+/, '');
    
    // Convert to standard international format (62)
    if (number.startsWith('62')) {
        return number;
    } else if (number.startsWith('0')) {
        return '62' + number.substring(1);
    } else if (number.startsWith('8')) {
        return '62' + number;
    } else {
        return number;
    }
}

// Load owners data
function loadOwnersData() {
    try {
        if (fs.existsSync(OWNERS_FILE)) {
            return JSON.parse(fs.readFileSync(OWNERS_FILE, 'utf8'));
        }
    } catch (error) {
        console.error('Error loading owners data:', error);
    }
    
    // Return default structure if file doesn't exist
    return {
        registeredOwners: [...config.ownerNumbers],
        verifiedSessions: {}
    };
}

// Save owners data
function saveOwnersData(data) {
    try {
        fs.writeFileSync(OWNERS_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving owners data:', error);
        return false;
    }
}

// Function untuk cek apakah nomor terdaftar sebagai owner
function isRegisteredOwner(number) {
    const normalizedNumber = normalizePhoneNumber(number);
    const ownersData = loadOwnersData();
    return ownersData.registeredOwners.includes(normalizedNumber);
}

// Function untuk cek apakah session sudah terverifikasi
function isVerifiedOwner(jid) {
    const normalizedNumber = normalizePhoneNumber(jid);
    const ownersData = loadOwnersData();
    return ownersData.verifiedSessions[normalizedNumber] === true;
}

// Function untuk verifikasi owner
function verifyOwner(jid) {
    const normalizedNumber = normalizePhoneNumber(jid);
    const ownersData = loadOwnersData();
    
    if (ownersData.registeredOwners.includes(normalizedNumber)) {
        ownersData.verifiedSessions[normalizedNumber] = true;
        return saveOwnersData(ownersData);
    }
    return false;
}

// Function untuk handle perintah .zin
async function handleZinCommand(sock, sender, command) {
    const parts = command.split(' ');
    
    if (parts.length < 2) {
        await sock.sendMessage(sender, { 
            text: `❌ Format salah!\n\nGunakan: .zin [nomor]\nContoh: .zin 083131871328\n\nNomor owner terdaftar: ${config.ownerNumbers.join(', ')}` 
        });
        return;
    }
    
    const inputNumber = parts[1].trim();
    const normalizedInput = normalizePhoneNumber(inputNumber);
    const senderNumber = normalizePhoneNumber(sender);
    
    console.log('Zin verification attempt:', {
        inputNumber,
        normalizedInput,
        senderNumber,
        isRegistered: isRegisteredOwner(normalizedInput),
        isSenderMatch: normalizedInput === senderNumber
    });
    
    // Cek jika nomor yang diinput terdaftar
    if (!isRegisteredOwner(normalizedInput)) {
        await sock.sendMessage(sender, { 
            text: `❌ VERIFIKASI GAGAL!\n\nNomor *${inputNumber}* tidak terdaftar sebagai owner.\n\nNomor owner terdaftar: ${config.ownerNumbers.join(', ')}` 
        });
        return;
    }
    
    // Cek jika nomor yang diinput sama dengan nomor pengirim
    if (normalizedInput !== senderNumber) {
        await sock.sendMessage(sender, { 
            text: `❌ VERIFIKASI GAGAL!\n\nNomor *${inputNumber}* tidak match dengan nomor WhatsApp Anda.\n\nPastikan Anda memasukkan nomor WhatsApp Anda sendiri.` 
        });
        return;
    }
    
    // Verifikasi berhasil
    const verificationSuccess = verifyOwner(sender);
    
    if (verificationSuccess) {
        await sock.sendMessage(sender, { 
            text: `✅ *VERIFIKASI BERHASIL!*\n\nSelamat datang Owner *Tohang Store*! 🎉\n\nNomor *${inputNumber}* telah terverifikasi.\n\nSekarang Anda dapat menggunakan fitur khusus owner:\n• .promosi - Kirim promosi ke grup\n• .status - Status bot lengkap\n• .helpowner - Bantuan fitur owner` 
        });
    } else {
        await sock.sendMessage(sender, { 
            text: `❌ Terjadi kesalahan sistem saat verifikasi. Silakan coba lagi.` 
        });
    }
}

// Function untuk handle pesan khusus owner
async function handleOwnerMessage(sock, sender, command) {
    if (command === '.promosi') {
        await handlePromosi(sock, sender);
    }
    else if (command === '.status') {
        const ownersData = loadOwnersData();
        const statusText = `👑 *STATUS BOT - OWNER PANEL*\n\n` +
                         `✅ Bot Online & Connected\n` +
                         `🕐 Last Update: ${new Date().toLocaleString('id-ID')}\n` +
                         `🏪 Store: ${config.storeName}\n` +
                         `📞 Owner Terdaftar: ${ownersData.registeredOwners.join(', ')}\n` +
                         `👤 Verified Sessions: ${Object.keys(ownersData.verifiedSessions).length}\n\n` +
                         `Fitur Owner:\n` +
                         `• .promosi - Kirim promosi ke semua grup\n` +
                         `• .status - Status bot lengkap\n` +
                         `• .helpowner - Bantuan fitur owner`;
        
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

// Import dan export handlePromosi
async function handlePromosi(sock, sender) {
    try {
        // Kirim konfirmasi dulu
        await sock.sendMessage(sender, { 
            text: '⏳ Memulai promosi ke semua grup...' 
        });
        
        // Jalankan promosi (function akan di-import dari mainHandler)
        const { broadcastPromosiToGroups } = require('./promosiHandler');
        const result = await broadcastPromosiToGroups(sock);
        
        // Kirim laporan hasil
        await sock.sendMessage(sender, { 
            text: `✅ *PROMOSI SELESAI!*\n\n📊 Hasil:\n• Berhasil: ${result.successCount} grup\n• Gagal: ${result.failCount} grup\n• Total: ${result.total} grup` 
        });
        
    } catch (error) {
        console.error('Error in handlePromosi:', error);
        await sock.sendMessage(sender, { 
            text: `❌ Gagal menjalankan promosi:\n${error.message}` 
        });
    }
}

module.exports = {
    normalizePhoneNumber,
    isRegisteredOwner,
    isVerifiedOwner,
    verifyOwner,
    handleZinCommand,
    handleOwnerMessage,
    handlePromosi
};
