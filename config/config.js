module.exports = {
    storeName: "Tohang Store",
    storeTagline: "Agen DANA Terpercaya",
    adminNumber: "6283131871328", // GANTI dengan nomor admin Anda
    ownerNumbers: ["6283131871328", "6282181668718"], // Nomor owner dalam format international
    currency: "Rp",
    paymentTimeout: 30, // dalam menit
    prices: require('../data/prices.json'),
    providers: require('../data/providers.json'),
    welcomeMessage: `Selamat datang di *{{storeName}}*! 🛍️\n\nKami menyediakan berbagai layanan pembayaran dan pembelian melalui DANA. Gunakan perintah dengan tanda titik (.) untuk mengakses layanan kami.\n\nKetik *.menu* untuk melihat daftar layanan.`,
    helpMessage: `Butuh bantuan? Silahkan hubungi admin kami di *{{adminNumber}}* atau kunjungi toko kami.\n\nJam Operasional:\nSenin - Minggu: 08.00 - 22.00 WIB`,
    ownerWelcomeMessage: `Halo Owner! 👑\n\nSelamat datang di panel admin *Tohang Store*. Fitur khusus yang tersedia untuk Anda:\n\n• .promosi - Kirim promosi ke semua grup\n• .status - Status bot lengkap\n• .broadcast [pesan] - Broadcast ke semua kontak (soon)\n• .stats - Statistik bot (soon)`
};
