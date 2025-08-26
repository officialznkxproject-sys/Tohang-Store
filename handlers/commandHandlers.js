const config = require('../config/config');

// Handle menu command
async function handleMenu(sock, sender) {
    const menuText = `
*${config.storeName}* - ${config.storeTagline}

📋 *DAFTAR LAYANAN:*

🛒 *Produk Digital*
• .pulsa - Beli Pulsa & Paket Data
• .listrik - Bayar Listrik/Token
• .air - Bayar Tagihan Air
• .game - Voucher Game

🏥 *Kesehatan & Asuransi*
• .bpjs - Bayar BPJS Kesehatan
• .asuransi - Bayar Asuransi
• .bpjstk - BPJS Ketenagakerjaan

💳 *Dompet Digital*
• .ewallet - Isi Saldo E-Wallet

🎁 *Promo & Lainnya*
• .promo - Lihat Promo Terbaru
• .bantuan - Info Bantuan

Ketik perintah sesuai layanan yang diinginkan.
    `.trim();
    
    await sock.sendMessage(sender, { text: menuText });
}

// Handle pulsa command
async function handlePulsa(sock, sender, command) {
    if (command === '.pulsa') {
        const pulsaMenu = `
🛒 *Pulsa & Paket Data*

Pilih jenis pembelian:
1. Pulsa Reguler
2. Paket Internet

Ketik:
.pulsa1 untuk Pulsa
.pulsa2 untuk Paket Data
        `.trim();
        
        await sock.sendMessage(sender, { text: pulsaMenu });
    } 
    else if (command === '.pulsa1') {
        let pulsaOptions = "📱 *PILIH NOMINAL PULSA:*\n\n";
        config.prices.pulsa.forEach((item, index) => {
            pulsaOptions += `${index + 1}. ${item.name} - ${config.currency} ${item.price.toLocaleString('id-ID')}\n`;
        });
        pulsaOptions += "\nKetik .pulsa [nomor] [nomor tujuan]\nContoh: .pulsa 1 081234567890";
        
        await sock.sendMessage(sender, { text: pulsaOptions });
    }
    else if (command === '.pulsa2') {
        let dataOptions = "📶 *PILIH PAKET DATA:*\n\n";
        config.prices.data.forEach((item, index) => {
            dataOptions += `${index + 1}. ${item.name} - ${config.currency} ${item.price.toLocaleString('id-ID')}\n`;
        });
        dataOptions += "\nKetik .pulsa2 [nomor] [nomor tujuan]\nContoh: .pulsa2 1 081234567890";
        
        await sock.sendMessage(sender, { text: dataOptions });
    }
    else if (command.startsWith('.pulsa1 ') || command.startsWith('.pulsa2 ')) {
        // Handle pulsa purchase logic here
        const parts = command.split(' ');
        if (parts.length < 3) {
            await sock.sendMessage(sender, { 
                text: "Format salah. Gunakan: .pulsa1 [nomor] [nomor tujuan]\nContoh: .pulsa1 1 081234567890" 
            });
            return;
        }
        
        const selection = parseInt(parts[1]);
        const phoneNumber = parts[2];
        const isPulsa = command.startsWith('.pulsa1');
        const items = isPulsa ? config.prices.pulsa : config.prices.data;
        
        if (selection < 1 || selection > items.length) {
            await sock.sendMessage(sender, { 
                text: "Pilihan tidak valid. Silakan pilih nomor yang tersedia." 
            });
            return;
        }
        
        const selectedItem = items[selection - 1];
        const totalPrice = selectedItem.price;
        
        const confirmationText = `
✅ *KONFIRMASI PEMBELIAN*

Jenis: ${isPulsa ? 'Pulsa' : 'Paket Data'}
Produk: ${selectedItem.name}
Nomor Tujuan: ${phoneNumber}
Harga: ${config.currency} ${totalPrice.toLocaleString('id-ID')}

Untuk melanjutkan, silakan transfer pembayaran ke salah satu rekening berikut:

• BCA: 1234567890 (A/N Tohang Store)
• BRI: 0987654321 (A/N Tohang Store)
• DANA: 081234567890 (A/N Tohang Store)

Setelah transfer, kirim bukti transfer ke admin untuk proses lebih lanjut.
        `.trim();
        
        await sock.sendMessage(sender, { text: confirmationText });
    }
}

// Handle listrik command
async function handleListrik(sock, sender, command) {
    if (command === '.listrik') {
        const listrikMenu = `
⚡ *Layanan Listrik*

Pilih jenis pembayaran:
1. Token Listrik
2. Bayar Tagihan

Ketik:
.listrik1 untuk Token Listrik
.listrik2 untuk Bayar Tagihan
        `.trim();
        
        await sock.sendMessage(sender, { text: listrikMenu });
    }
    else if (command === '.listrik1') {
        let tokenOptions = "🔌 *PILIH NOMINAL TOKEN LISTRIK:*\n\n";
        const tokenPrices = config.prices.electricity.token;
        
        Object.keys(tokenPrices).forEach((key, index) => {
            const value = parseInt(key);
            tokenOptions += `${index + 1}. Token ${config.currency} ${value.toLocaleString('id-ID')}\n`;
        });
        
        tokenOptions += "\nKetik .listrik1 [nomor] [ID Meter]\nContoh: .listrik1 1 12345678901";
        
        await sock.sendMessage(sender, { text: tokenOptions });
    }
    else if (command === '.listrik2') {
        await sock.sendMessage(sender, { 
            text: "Untuk bayar tagihan listrik, silakan ketik:\n.listrik2 [nomor ID pelanggan]\nContoh: .listrik2 1234567890" 
        });
    }
    else if (command.startsWith('.listrik1 ')) {
        const parts = command.split(' ');
        if (parts.length < 3) {
            await sock.sendMessage(sender, { 
                text: "Format salah. Gunakan: .listrik1 [nomor] [ID Meter]\nContoh: .listrik1 1 12345678901" 
            });
            return;
        }
        
        const selection = parseInt(parts[1]);
        const meterId = parts[2];
        const tokenValues = Object.keys(config.prices.electricity.token);
        
        if (selection < 1 || selection > tokenValues.length) {
            await sock.sendMessage(sender, { 
                text: "Pilihan tidak valid. Silakan pilih nomor yang tersedia." 
            });
            return;
        }
        
        const selectedValue = parseInt(tokenValues[selection - 1]);
        const totalPrice = selectedValue; // For token, price equals value
        
        const confirmationText = `
✅ *KONFIRMASI PEMBELIAN TOKEN LISTRIK*

Jenis: Token Listrik
Nominal: ${config.currency} ${selectedValue.toLocaleString('id-ID')}
ID Meter: ${meterId}
Total Bayar: ${config.currency} ${totalPrice.toLocaleString('id-ID')}

Untuk melanjutkan, silakan transfer pembayaran ke salah satu rekening berikut:

• BCA: 1234567890 (A/N Tohang Store)
• BRI: 0987654321 (A/N Tohang Store)
• DANA: 081234567890 (A/N Tohang Store)

Setelah transfer, kirim bukti transfer ke admin untuk proses lebih lanjut.
        `.trim();
        
        await sock.sendMessage(sender, { text: confirmationText });
    }
    else if (command.startsWith('.listrik2 ')) {
        const parts = command.split(' ');
        if (parts.length < 2) {
            await sock.sendMessage(sender, { 
                text: "Format salah. Gunakan: .listrik2 [nomor ID pelanggan]\nContoh: .listrik2 1234567890" 
            });
            return;
        }
        
        const customerId = parts[1];
        
        await sock.sendMessage(sender, { 
            text: `Untuk pembayaran tagihan listrik dengan ID ${customerId}, silakan hubungi admin di ${config.adminNumber} untuk informasi jumlah tagihan yang harus dibayar.` 
        });
    }
}

// Handle asuransi command
async function handleAsuransi(sock, sender, command) {
    if (command === '.asuransi') {
        let asuransiOptions = "🏥 *PILIH PENYEDIA ASURANSI:*\n\n";
        
        config.providers.insurance.forEach((provider, index) => {
            asuransiOptions += `${index + 1}. ${provider.name}\n`;
        });
        
        asuransiOptions += "\nKetik .asuransi [nomor] [nomor polis]\nContoh: .asuransi 1 1234567890";
        
        await sock.sendMessage(sender, { text: asuransiOptions });
    }
    else if (command.startsWith('.asuransi ')) {
        const parts = command.split(' ');
        if (parts.length < 3) {
            await sock.sendMessage(sender, { 
                text: "Format salah. Gunakan: .asuransi [nomor] [nomor polis]\nContoh: .asuransi 1 1234567890" 
            });
            return;
        }
        
        const selection = parseInt(parts[1]);
        const policyNumber = parts[2];
        
        if (selection < 1 || selection > config.providers.insurance.length) {
            await sock.sendMessage(sender, { 
                text: "Pilihan tidak valid. Silakan pilih nomor yang tersedia." 
            });
            return;
        }
        
        const selectedProvider = config.providers.insurance[selection - 1];
        const feePercentage = config.prices.insurance.fee_percentage;
        
        await sock.sendMessage(sender, { 
            text: `Untuk pembayaran asuransi ${selectedProvider.name} dengan nomor polis ${policyNumber}, silakan hubungi admin di ${config.adminNumber} untuk informasi jumlah premi yang harus dibayar termasuk biaya administrasi ${feePercentage}%.` 
        });
    }
}

// Implement other handlers similarly...
async function handleAir(sock, sender, command) {
    // Implementation for water bill payment
    await sock.sendMessage(sender, { 
        text: "Layanan pembayaran air sedang dalam pengembangan. Silakan hubungi admin untuk informasi lebih lanjut." 
    });
}

async function handleBPJS(sock, sender, command) {
    // Implementation for BPJS Health payment
    await sock.sendMessage(sender, { 
        text: "Layanan pembayaran BPJS Kesehatan sedang dalam pengembangan. Silakan hubungi admin untuk informasi lebih lanjut." 
    });
}

async function handleBPJSTK(sock, sender, command) {
    // Implementation for BPJS Employment payment
    await sock.sendMessage(sender, { 
        text: "Layanan pembayaran BPJS Ketenagakerjaan sedang dalam pengembangan. Silakan hubungi admin untuk informasi lebih lanjut." 
    });
}

async function handleEWallet(sock, sender, command) {
    // Implementation for e-wallet topup
    await sock.sendMessage(sender, { 
        text: "Layanan isi saldo dompet digital sedang dalam pengembangan. Silakan hubungi admin untuk informasi lebih lanjut." 
    });
}

async function handleGames(sock, sender, command) {
    // Implementation for game vouchers
    await sock.sendMessage(sender, { 
        text: "Layanan voucher game sedang dalam pengembangan. Silakan hubungi admin untuk informasi lebih lanjut." 
    });
}

async function handlePromo(sock, sender) {
    const promoText = `
🎁 *PROMO SPESIAL TOHANG STORE* 🎁

🔥 *Promo Bulan Ini:*
• Diskon 5% untuk pembelian pulsa di atas 50rb
• Gratis biaya admin untuk pembelian token listrik 100rb
• Cashback 2% untuk pembelian paket data 10GB

📣 *Promo Quest:*
• Beli 5x pulsa dapat voucher 10rb
• Transaksi 10x dapat merchandise eksklusif

🔄 *Syarat & Ketentuan:*
• Promo berlaku sampai akhir bulan
• Tidak dapat digabung dengan promo lainnya
• Keputusan admin bersifat mutlak

Jangan lewatkan promo menarik lainnya! Follow Instagram kami @tohangstore untuk info terbaru.
    `.trim();
    
    await sock.sendMessage(sender, { text: promoText });
}

async function handleHelp(sock, sender) {
    await sock.sendMessage(sender, { 
        text: config.helpMessage.replace('{{adminNumber}}', config.adminNumber)
    });
}

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
    handleHelp
};
