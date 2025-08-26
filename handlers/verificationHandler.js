// handlers/verificationHandler.js
const config = require('../config/config');
const passwordConfig = require('../config/passwords');
const crypto = require('crypto');
const { normalizePhoneNumber } = require('./ownerHandler');

// Generate token verifikasi
function generateVerificationToken(number) {
    const token = crypto.randomBytes(20).toString('hex');
    const expires = Date.now() + 15 * 60 * 1000; // 15 menit
    
    passwordConfig.verificationTokens[token] = {
        number: normalizePhoneNumber(number),
        expires: expires
    };
    
    return token;
}

// Verify token
function verifyToken(token, password) {
    const tokenData = passwordConfig.verificationTokens[token];
    if (!tokenData) return false;
    
    // Cek expired
    if (Date.now() > tokenData.expires) {
        delete passwordConfig.verificationTokens[token];
        return false;
    }
    
    // Cek password
    const normalizedNumber = tokenData.number;
    const correctPassword = passwordConfig.ownerPasswords[normalizedNumber];
    
    if (password === correctPassword) {
        // Verifikasi berhasil
        delete passwordConfig.verificationTokens[token];
        return normalizedNumber;
    }
    
    return false;
}

// Clean expired tokens
function cleanExpiredTokens() {
    const now = Date.now();
    Object.keys(passwordConfig.verificationTokens).forEach(token => {
        if (passwordConfig.verificationTokens[token].expires < now) {
            delete passwordConfig.verificationTokens[token];
        }
    });
}

// Handle perintah .zin
async function handleZinCommand(sock, sender, command) {
    const parts = command.split(' ');
    
    if (parts.length < 2) {
        await sock.sendMessage(sender, { 
            text: `🔐 *SISTEM VERIFIKASI OWNER*\n\nFormat: .zin [nomor]\nContoh: .zin 083131871328\n\nNomor owner terdaftar:\n• 083131871328\n• 082181668718\n\nSetelah itu, Anda akan mendapat link untuk memasukkan password.` 
        });
        return;
    }
    
    const inputNumber = parts[1].trim();
    const normalizedInput = normalizePhoneNumber(inputNumber);
    
    // Cek jika nomor terdaftar
    if (!passwordConfig.ownerPasswords[normalizedInput]) {
        await sock.sendMessage(sender, { 
            text: `❌ VERIFIKASI GAGAL!\n\nNomor *${inputNumber}* tidak terdaftar sebagai owner.\n\nNomor owner terdaftar:\n• 083131871328\n• 082181668718` 
        });
        return;
    }
    
    // Generate token dan link
    const token = generateVerificationToken(inputNumber);
    const verificationLink = `https://tohang.zeabur.app/verify?token=${token}&number=${normalizedInput}`;
    
    await sock.sendMessage(sender, { 
        text: `🔐 *LINK VERIFIKASI OWNER*\n\nNomor: ${inputNumber}\n\nKlik link berikut untuk verifikasi:\n${verificationLink}\n\n*Password:*\n• 083131871328: akusayangsusanti\n• 082181668718: akusayangtohang\n\nLink berlaku 15 menit.` 
    });
}

module.exports = {
    generateVerificationToken,
    verifyToken,
    cleanExpiredTokens,
    handleZinCommand
};
