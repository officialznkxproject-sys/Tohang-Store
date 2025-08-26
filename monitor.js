const axios = require('axios');
const fs = require('fs');

const HEALTH_CHECK_URL = process.env.HEALTH_CHECK_URL || 'http://localhost:3000/health';
const RECONNECT_URL = process.env.RECONNECT_URL || 'http://localhost:3000/reconnect';
const CHECK_INTERVAL = 300000; // 5 menit

async function checkBotHealth() {
    try {
        const response = await axios.get(HEALTH_CHECK_URL, { timeout: 10000 });
        console.log(`✅ Bot sehat - ${new Date().toLocaleString('id-ID')}`);
        console.log('Status:', response.data);
    } catch (error) {
        console.error(`❌ Bot tidak merespon - ${new Date().toLocaleString('id-ID')}`);
        console.error('Error:', error.message);
        
        // Coba reconnect otomatis
        try {
            const reconnectResponse = await axios.post(RECONNECT_URL, {}, { timeout: 15000 });
            console.log('🔁 Memulai ulang koneksi...', reconnectResponse.data);
        } catch (reconnectError) {
            console.error('Gagal memulai ulang:', reconnectError.message);
        }
    }
}

// Jalankan monitor
console.log('🔄 Starting Tohang Store Bot Monitor...');
setInterval(checkBotHealth, CHECK_INTERVAL);
checkBotHealth(); // Check pertama kali
