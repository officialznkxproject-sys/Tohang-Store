# Tohang Store WhatsApp Bot

Bot WhatsApp untuk layanan Agen DANA Tohang Store.

## Fitur

- Pembelian pulsa dan paket data
- Pembelian token listrik
- Pembayaran tagihan listrik
- Pembayaran asuransi
- Dan layanan Agen DANA lainnya

## Instalasi

1. Clone repository ini
2. Install dependencies: `npm install`
3. Konfigurasi file di folder `config/` dan `data/` sesuai kebutuhan
4. Jalankan bot: `npm start`
5. Scan QR code yang muncul dengan WhatsApp

## Deployment ke Zeabur

1. Buat akun Zeabur dan hubungkan dengan GitHub
2. Buat project baru di Zeabur
3. Pilih repository ini untuk deployment
4. Set environment variables jika diperlukan
5. Deploy aplikasi

## Konfigurasi

### Mengubah Harga Produk

Edit file `data/prices.json`:
- Ubah harga pulsa di array `pulsa`
- Ubah harga paket data di array `data`
- Ubah nominal token listrik di object `electricity.token`

### Mengubah Provider Asuransi

Edit file `data/providers.json`:
- Tambah/hapus provider asuransi di array `insurance`

### Mengubah Info Kontak

Edit file `config/config.js`:
- Ubah `adminNumber` dengan nomor admin yang benar
- Ubah `storeName` dan `storeTagline` sesuai kebutuhan

## Perintah yang Tersedia

- `.menu` - Menampilkan menu utama
- `.pulsa` - Pembelian pulsa dan paket data
- `.listrik` - Pembelian token/listrik
- `.asuransi` - Pembayaran asuransi
- `.promo` - Melihat promo terbaru
- `.bantuan` - Menampilkan informasi bantuan

## Catatan

- Pastikan WhatsApp yang digunakan untuk bot sudah terdaftar dengan nomor yang valid
- Simpan informasi auth yang terbentuk di folder `auth_info` dengan aman
- Selalu backup data sebelum melakukan update
