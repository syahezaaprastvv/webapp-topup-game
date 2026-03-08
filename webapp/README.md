# 🎮 TopUp Store

Website top up game manual berbasis WhatsApp — tanpa payment gateway & tanpa sistem provider.

## 🌐 URL
- **Website**: https://3000-i2oxg2aamun9vah3sfe6r-2b54fc91.sandbox.novita.ai
- **Admin Panel**: https://3000-i2oxg2aamun9vah3sfe6r-2b54fc91.sandbox.novita.ai/admin
- **Login**: Username `admin` / Password `admin123`

## ✅ Fitur Tersedia

### User Side
- 🏠 Halaman utama dengan banner slider, tab kategori, grid game
- 🔍 Pencarian game real-time
- ⚡ Flash sale dengan countdown timer
- 🎮 Halaman detail game: pilih nominal, isi form, redirect ke WhatsApp
- 📱 Pesan WhatsApp otomatis dengan format lengkap
- 🌙 Dark/Light theme toggle
- 📋 Daftar game + status (tabel)
- ❓ Halaman bantuan + FAQ
- 📜 Halaman Syarat & Ketentuan
- 🔍 Halaman Cek Transaksi

### Admin Panel
- 📊 Dashboard statistik
- 🎮 Kelola Game (tambah, edit, hapus, status labels)
- 📦 Kelola Produk / Nominal (tambah, edit, hapus, flash sale)
- 🖼️ Kelola Banner Slider
- 💳 Kelola Metode Pembayaran
- ⚙️ Konfigurasi Website (judul, logo, WA, tema, SEO)
- 📞 Edit Kontak & Footer
- 👥 Kelola Admin (tambah, edit, hapus)

## 📁 Struktur Halaman

| URL | Deskripsi |
|---|---|
| `/` | Halaman utama |
| `/game/:slug` | Detail game + form pembelian |
| `/bantuan` | Pusat bantuan + FAQ |
| `/syarat-ketentuan` | Syarat & Ketentuan |
| `/cek-transaksi` | Cek status transaksi |
| `/admin` | Dashboard admin |
| `/admin/login` | Login admin |
| `/admin/games` | Kelola game |
| `/admin/products` | Kelola produk |
| `/admin/banners` | Kelola banner |
| `/admin/payment-methods` | Kelola pembayaran |
| `/admin/config` | Konfigurasi website |
| `/admin/contacts` | Kontak & footer |
| `/admin/admins` | Kelola admin |

## 📊 Data Architecture

### Tabel Database (Cloudflare D1)
- `site_config` - Konfigurasi website (judul, logo, WA, tema, dll)
- `admins` - Data admin
- `categories` - Kategori produk (Top Up, Voucher, Pulsa)
- `games` - Daftar game/produk
- `game_status_labels` - Label status game
- `products` - Nominal top up per game
- `payment_methods` - Metode pembayaran
- `banners` - Banner slider
- `contacts` - Kontak & footer

## 💡 Cara Penggunaan

### User (Pembeli)
1. Buka website → pilih game
2. Pilih nominal top up
3. Isi form: Nickname, ID Game, (Server opsional), (Voucher opsional)
4. Pilih metode pembayaran
5. Klik **Beli Sekarang** → auto redirect ke WhatsApp admin
6. Lakukan pembayaran & kirim bukti ke admin

### Format Pesan WhatsApp
```
Halo admin, saya mau topup *Mobile Legends*.

Detail Pesanan :

Player ID : 123456789
Nickname : PlayerName
Server : (jika diisi)
Kode Voucher : (jika diisi)
Jumlah Pembelian : 86 Diamonds

==========================

Total Pembayaran : Rp 19.000
Bayar dengan : Dana

Silahkan Lakukan Pembayaran, dan Kirimkan Bukti Transfer ke Admin Agar Pesanan Kami Proses

via : https://
```

## 🚀 Deployment

### Development (Local)
```bash
# Setup database
npx wrangler d1 execute webapp-production --local --file=./migrations/0001_initial.sql

# Build
npm run build

# Start dengan PM2
pm2 start ecosystem.config.cjs
```

### Production (Cloudflare Pages)
```bash
# Buat D1 database production
npx wrangler d1 create webapp-production

# Update wrangler.jsonc dengan database_id yang didapat

# Apply migrasi ke production
npx wrangler d1 execute webapp-production --file=./migrations/0001_initial.sql

# Deploy
npm run build && npx wrangler pages deploy dist --project-name webapp
```

## 🛠️ Tech Stack
- **Backend**: Hono Framework (TypeScript)
- **Runtime**: Cloudflare Pages/Workers
- **Database**: Cloudflare D1 (SQLite)
- **Frontend**: HTML/CSS/JavaScript (Vanilla)
- **Icons**: Font Awesome 6
- **Fonts**: Inter (Google Fonts)
- **Build Tool**: Vite

## 🔐 Default Credentials
- Username: `admin`
- Password: `admin123`
> ⚠️ **Ganti password setelah login pertama!**
