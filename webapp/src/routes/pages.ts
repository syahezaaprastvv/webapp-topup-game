import { Hono } from 'hono'
import { layout, getSiteConfig } from '../lib/layout'
import type { Bindings } from '../lib/types'

const pages = new Hono<{ Bindings: Bindings }>()

// Help / Bantuan Page
pages.get('/bantuan', async (c) => {
  const db = c.env.DB
  const config = await getSiteConfig(db)

  const faqs = [
    {
      q: 'Berapa lama proses top up setelah pembayaran?',
      a: 'Proses top up dilakukan secara manual oleh admin. Biasanya selesai dalam 1-15 menit setelah bukti pembayaran diterima. Pastikan Anda mengirimkan bukti transfer ke WhatsApp admin.'
    },
    {
      q: 'Apakah transaksi aman di sini?',
      a: 'Ya, semua transaksi ditangani langsung oleh admin kami. Kami sudah melayani ribuan pelanggan dan terpercaya. Jika ada masalah, hubungi admin langsung melalui WhatsApp.'
    },
    {
      q: 'Bagaimana cara melakukan top up?',
      a: 'Pilih game yang ingin di-top up, pilih nominal, isi form dengan ID Game dan Nickname, pilih metode pembayaran, lalu klik tombol Beli Sekarang untuk langsung chat ke WhatsApp admin kami.'
    },
    {
      q: 'Metode pembayaran apa yang tersedia?',
      a: 'Kami menerima pembayaran via transfer bank (BCA, BRI, Mandiri), dompet digital (Dana, OVO, GoPay), dan pembayaran tunai di Alfamart/Indomaret.'
    },
    {
      q: 'Apakah ada biaya tambahan?',
      a: 'Tidak ada biaya tambahan. Harga yang tertera sudah final. Namun jika ada biaya transfer dari bank/e-wallet Anda, itu di luar tanggung jawab kami.'
    },
    {
      q: 'Bagaimana jika top up tidak masuk?',
      a: 'Jika dalam 30 menit top up belum masuk setelah bukti pembayaran dikirim, segera hubungi admin WhatsApp kami. Simpan bukti pembayaran Anda sebagai referensi.'
    },
    {
      q: 'Apakah bisa refund jika ID salah input?',
      a: 'Kami tidak bisa melakukan refund jika kesalahan terjadi karena kesalahan input data oleh pembeli. Pastikan ID Game dan Nickname yang dimasukkan sudah benar sebelum melakukan pembayaran.'
    },
    {
      q: 'Kapan admin aktif melayani?',
      a: 'Admin kami aktif dari jam 08:00 - 22:00 WIB setiap hari. Di luar jam tersebut, pesanan akan diproses pada jam aktif berikutnya.'
    },
  ]

  const faqHtml = faqs.map(faq => `
    <div class="faq-item">
      <button class="faq-question">
        ${faq.q}
        <i class="fas fa-plus"></i>
      </button>
      <div class="faq-answer">
        <p>${faq.a}</p>
      </div>
    </div>`).join('')

  const content = `
    <div class="help-page">
      <div class="container">
        <!-- Hero -->
        <div class="help-hero">
          <h1><i class="fas fa-headset" style="color:var(--primary)"></i> Pusat Bantuan</h1>
          <p>Ada pertanyaan? Kami siap membantu Anda!</p>
        </div>

        <!-- How to Order -->
        <div class="admin-card" style="margin-bottom:32px">
          <div class="admin-card-header">
            <div class="admin-card-title"><i class="fas fa-list-ol" style="color:var(--primary)"></i> Cara Pemesanan</div>
          </div>
          <div style="padding:24px">
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:20px">
              <div style="text-align:center;padding:20px">
                <div style="width:56px;height:56px;background:var(--primary);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px;color:white;margin:0 auto 12px">1</div>
                <h4 style="font-size:14px;font-weight:700;margin-bottom:6px">Pilih Game</h4>
                <p style="font-size:13px;color:var(--text-muted)">Pilih game yang ingin di-top up dari halaman utama</p>
              </div>
              <div style="text-align:center;padding:20px">
                <div style="width:56px;height:56px;background:var(--primary);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px;color:white;margin:0 auto 12px">2</div>
                <h4 style="font-size:14px;font-weight:700;margin-bottom:6px">Pilih Nominal</h4>
                <p style="font-size:13px;color:var(--text-muted)">Pilih nominal top up sesuai kebutuhan</p>
              </div>
              <div style="text-align:center;padding:20px">
                <div style="width:56px;height:56px;background:var(--primary);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px;color:white;margin:0 auto 12px">3</div>
                <h4 style="font-size:14px;font-weight:700;margin-bottom:6px">Isi Form</h4>
                <p style="font-size:13px;color:var(--text-muted)">Isi ID Game, Nickname, dan metode pembayaran</p>
              </div>
              <div style="text-align:center;padding:20px">
                <div style="width:56px;height:56px;background:var(--primary);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px;color:white;margin:0 auto 12px">4</div>
                <h4 style="font-size:14px;font-weight:700;margin-bottom:6px">Kirim WA</h4>
                <p style="font-size:13px;color:var(--text-muted)">Klik Beli Sekarang, otomatis terhubung ke admin WhatsApp</p>
              </div>
              <div style="text-align:center;padding:20px">
                <div style="width:56px;height:56px;background:var(--success);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px;color:white;margin:0 auto 12px">5</div>
                <h4 style="font-size:14px;font-weight:700;margin-bottom:6px">Bayar & Selesai</h4>
                <p style="font-size:13px;color:var(--text-muted)">Lakukan pembayaran & kirim bukti transfer ke admin</p>
              </div>
            </div>
          </div>
        </div>

        <!-- FAQ -->
        <div class="section-header" style="margin-bottom:20px">
          <h2 class="section-title">Pertanyaan Umum (FAQ)</h2>
        </div>
        <div class="faq-grid">${faqHtml}</div>

        <!-- Contact -->
        <div class="section-header" style="margin-bottom:20px;margin-top:40px">
          <h2 class="section-title">Hubungi Kami</h2>
        </div>
        <div class="contact-cards">
          <a href="https://wa.me/${config.whatsapp_number}" target="_blank" class="contact-card">
            <div class="contact-card-icon wa"><i class="fab fa-whatsapp"></i></div>
            <h4>WhatsApp</h4>
            <p>Chat langsung dengan admin</p>
          </a>
          <a href="#" class="contact-card">
            <div class="contact-card-icon ig"><i class="fab fa-instagram"></i></div>
            <h4>Instagram</h4>
            <p>Follow akun Instagram kami</p>
          </a>
          <a href="#" class="contact-card">
            <div class="contact-card-icon fb"><i class="fab fa-facebook"></i></div>
            <h4>Facebook</h4>
            <p>Like halaman Facebook kami</p>
          </a>
        </div>

        <!-- WA Float -->
        <a href="https://wa.me/${config.whatsapp_number}" target="_blank" class="wa-float">
          <i class="fab fa-whatsapp"></i>
        </a>
      </div>
    </div>
  `

  return c.html(layout(content, config, 'Bantuan'))
})

// Terms & Conditions
pages.get('/syarat-ketentuan', async (c) => {
  const db = c.env.DB
  const config = await getSiteConfig(db)

  const content = `
    <div class="terms-page">
      <div class="container">
        <div class="terms-content">
          <h1>Syarat & Ketentuan</h1>
          <p class="last-updated">Terakhir diperbarui: ${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <p>Selamat datang di <strong>${config.site_title}</strong>. Dengan menggunakan layanan kami, Anda dianggap telah membaca, memahami, dan menyetujui semua syarat dan ketentuan yang berlaku.</p>

          <h2>1. Ketentuan Umum</h2>
          <p>${config.site_title} adalah platform top up game digital yang beroperasi secara manual. Semua transaksi diproses langsung oleh admin kami melalui WhatsApp.</p>
          <ul>
            <li>Layanan ini tidak menggunakan sistem otomatis/provider.</li>
            <li>Transaksi dilakukan secara manual oleh admin.</li>
            <li>Tidak diperlukan akun untuk melakukan pembelian.</li>
            <li>Admin aktif setiap hari pukul 08:00 - 22:00 WIB.</li>
          </ul>

          <h2>2. Proses Pembelian</h2>
          <p>Proses pembelian dilakukan dengan cara:</p>
          <ul>
            <li>Pilih game dan nominal yang diinginkan.</li>
            <li>Isi form dengan data yang benar (ID Game, Nickname, dll).</li>
            <li>Klik tombol "Beli Sekarang" untuk diarahkan ke WhatsApp admin.</li>
            <li>Lakukan pembayaran sesuai nominal yang dipilih.</li>
            <li>Kirimkan bukti pembayaran ke admin.</li>
            <li>Tunggu konfirmasi dan proses dari admin.</li>
          </ul>

          <h2>3. Pembayaran</h2>
          <p>Metode pembayaran yang tersedia:</p>
          <ul>
            <li>Transfer Bank (BCA, BRI, Mandiri)</li>
            <li>Dompet Digital (Dana, OVO, GoPay)</li>
            <li>Pembayaran Tunai (Alfamart, Indomaret)</li>
          </ul>
          <p>Pembayaran harus dilakukan sesuai dengan nominal yang tertera. Kelebihan pembayaran tidak akan dikembalikan.</p>

          <h2>4. Ketentuan Refund</h2>
          <p>Refund atau pengembalian dana TIDAK dapat dilakukan jika:</p>
          <ul>
            <li>Terjadi kesalahan input data (ID, Nickname, Server) oleh pembeli.</li>
            <li>Pembeli memberikan informasi yang tidak lengkap atau salah.</li>
            <li>Produk sudah diproses dan masuk ke akun pembeli.</li>
          </ul>
          <p>Refund dapat dilakukan jika:</p>
          <ul>
            <li>Terjadi kesalahan dari pihak kami (admin).</li>
            <li>Produk tidak berhasil masuk ke akun dalam waktu 24 jam setelah pembayaran dikonfirmasi.</li>
          </ul>

          <h2>5. Jaminan Keamanan</h2>
          <p>Kami berkomitmen untuk:</p>
          <ul>
            <li>Menjaga kerahasiaan data pribadi Anda.</li>
            <li>Tidak menyalahgunakan informasi yang Anda berikan.</li>
            <li>Memproses pesanan dengan cepat dan akurat.</li>
          </ul>
          <p>Namun kami tidak bertanggung jawab atas masalah yang timbul akibat:</p>
          <ul>
            <li>Kesalahan data yang diinput oleh pembeli.</li>
            <li>Gangguan server dari pihak developer game.</li>
            <li>Keterlambatan pembayaran yang menyebabkan harga berubah.</li>
          </ul>

          <h2>6. Harga dan Ketersediaan</h2>
          <p>Harga yang tertera dapat berubah sewaktu-waktu tanpa pemberitahuan terlebih dahulu. Ketersediaan produk bergantung pada stok yang tersedia. Kami berhak menolak pesanan jika stok habis atau terjadi perubahan harga mendadak.</p>

          <h2>7. Larangan</h2>
          <p>Pengguna dilarang:</p>
          <ul>
            <li>Menggunakan layanan ini untuk aktivitas ilegal.</li>
            <li>Memberikan data yang tidak valid atau palsu.</li>
            <li>Melakukan chargeback atau pembatalan pembayaran sepihak setelah produk diproses.</li>
            <li>Menyalahgunakan layanan untuk kepentingan yang merugikan pihak lain.</li>
          </ul>

          <h2>8. Perubahan Layanan</h2>
          <p>${config.site_title} berhak mengubah, menangguhkan, atau menghentikan layanan sewaktu-waktu tanpa pemberitahuan sebelumnya. Kami juga berhak memperbarui syarat dan ketentuan ini kapan saja.</p>

          <h2>9. Hubungi Kami</h2>
          <p>Jika Anda memiliki pertanyaan atau keluhan terkait layanan kami, silakan hubungi kami melalui:</p>
          <ul>
            <li>WhatsApp: <a href="https://wa.me/${config.whatsapp_number}" style="color:var(--primary)">${config.whatsapp_number}</a></li>
          </ul>

          <p style="margin-top:24px;padding:16px;background:rgba(99,102,241,0.08);border-radius:8px;border-left:4px solid var(--primary)">
            Dengan melakukan transaksi di ${config.site_title}, Anda dianggap telah membaca dan menyetujui seluruh syarat dan ketentuan di atas.
          </p>
        </div>
      </div>
    </div>
  `

  return c.html(layout(content, config, 'Syarat & Ketentuan'))
})

// Check Transaction (Cek Transaksi)
pages.get('/cek-transaksi', async (c) => {
  const db = c.env.DB
  const config = await getSiteConfig(db)

  const content = `
    <div class="help-page">
      <div class="container">
        <div class="help-hero">
          <h1><i class="fas fa-search" style="color:var(--primary)"></i> Cek Transaksi</h1>
          <p>Hubungi admin untuk mengecek status transaksi Anda</p>
        </div>

        <div style="max-width:500px;margin:0 auto;text-align:center">
          <div class="admin-card" style="padding:40px">
            <i class="fab fa-whatsapp" style="font-size:64px;color:#25d366;margin-bottom:20px;display:block"></i>
            <h3 style="font-size:20px;font-weight:700;margin-bottom:12px">Cek via WhatsApp</h3>
            <p style="font-size:14px;color:var(--text-muted);margin-bottom:24px">
              Untuk mengecek status transaksi Anda, silakan hubungi admin kami melalui WhatsApp dengan menyertakan:
            </p>
            <ul style="text-align:left;font-size:14px;color:var(--text-muted);margin-bottom:24px;padding-left:20px">
              <li style="margin-bottom:8px">Nama game yang di-top up</li>
              <li style="margin-bottom:8px">ID Game Anda</li>
              <li style="margin-bottom:8px">Nominal yang dibeli</li>
              <li style="margin-bottom:8px">Bukti pembayaran</li>
            </ul>
            <a href="https://wa.me/${config.whatsapp_number}?text=Halo%20admin%2C%20saya%20ingin%20mengecek%20status%20transaksi%20saya"
              target="_blank" class="btn-buy" style="display:inline-flex;width:auto;padding:14px 28px">
              <i class="fab fa-whatsapp"></i> Chat Admin Sekarang
            </a>
          </div>
        </div>
      </div>
    </div>
  `

  return c.html(layout(content, config, 'Cek Transaksi'))
})

export default pages
