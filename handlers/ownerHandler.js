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

// Function untuk handle pesan khusus owner
async function handleOwnerMessage(sock, sender, command) {
    if (command === '.promosi') {
        // Import function promosi
        const { handlePromosi } = require('./promosiHandler');
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

module.exports = {
    normalizePhoneNumber,
    isRegisteredOwner,
    isVerifiedOwner,
    verifyOwner,
    handleOwnerMessage
};
