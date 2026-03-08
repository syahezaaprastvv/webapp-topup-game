import type { SiteConfig } from './types'

export function layout(content: string, config: SiteConfig, title?: string, extraHead?: string): string {
  const pageTitle = title ? `${title} - ${config.site_title}` : config.site_title
  const isDark = config.theme === 'dark'
  
  return `<!DOCTYPE html>
<html lang="id" data-theme="${config.theme || 'dark'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle}</title>
  <meta name="description" content="${config.site_description}">
  <meta name="keywords" content="${config.site_keywords}">
  <meta name="author" content="${config.site_author}">
  <meta property="og:title" content="${pageTitle}">
  <meta property="og:description" content="${config.site_description}">
  ${config.site_icon ? `<link rel="icon" href="${config.site_icon}">` : '<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🎮</text></svg>">'}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
  <link rel="stylesheet" href="/static/styles.css">
  ${extraHead || ''}
</head>
<body class="${isDark ? 'dark-theme' : 'light-theme'}">
  <!-- Theme Toggle -->
  <button class="theme-toggle" id="themeToggle" title="Toggle Theme">
    <i class="fas ${isDark ? 'fa-sun' : 'fa-moon'}"></i>
  </button>

  <!-- Navbar -->
  <nav class="navbar" id="navbar">
    <div class="container">
      <a href="/" class="navbar-brand">
        ${config.site_logo ? `<img src="${config.site_logo}" alt="${config.site_title}" class="logo-img">` : `<i class="fas fa-gamepad"></i>`}
        <span>${config.site_title}</span>
      </a>
      <div class="navbar-menu" id="navbarMenu">
        <a href="/" class="nav-link">Beranda</a>
        <a href="/bantuan" class="nav-link">Bantuan</a>
        <a href="/syarat-ketentuan" class="nav-link">S&K</a>
        <a href="/cek-transaksi" class="nav-link">Cek Transaksi</a>
      </div>
      <div class="navbar-actions">
        <a href="/bantuan" class="btn-help"><i class="fas fa-headset"></i></a>
        <button class="hamburger" id="hamburger">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>
  </nav>

  <!-- Mobile Menu -->
  <div class="mobile-menu" id="mobileMenu">
    <div class="mobile-menu-header">
      <span class="mobile-menu-title">Menu</span>
      <button class="mobile-menu-close" id="mobileMenuClose"><i class="fas fa-times"></i></button>
    </div>
    <nav class="mobile-nav">
      <a href="/" class="mobile-nav-link"><i class="fas fa-home"></i> Beranda</a>
      <a href="/bantuan" class="mobile-nav-link"><i class="fas fa-headset"></i> Bantuan</a>
      <a href="/syarat-ketentuan" class="mobile-nav-link"><i class="fas fa-file-contract"></i> Syarat & Ketentuan</a>
      <a href="/cek-transaksi" class="mobile-nav-link"><i class="fas fa-search"></i> Cek Transaksi</a>
    </nav>
  </div>
  <div class="overlay" id="overlay"></div>

  <!-- Main Content -->
  <main>
    ${content}
  </main>

  <!-- Footer -->
  <footer class="footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <div class="footer-logo">
            ${config.site_logo ? `<img src="${config.site_logo}" alt="${config.site_title}">` : `<i class="fas fa-gamepad"></i>`}
            <span>${config.site_title}</span>
          </div>
          <p>${config.site_description}</p>
          <div class="footer-social">
            <a href="#" class="social-btn"><i class="fab fa-whatsapp"></i></a>
            <a href="#" class="social-btn"><i class="fab fa-instagram"></i></a>
            <a href="#" class="social-btn"><i class="fab fa-facebook"></i></a>
          </div>
        </div>
        <div class="footer-links">
          <h4>Navigasi</h4>
          <ul>
            <li><a href="/">Beranda</a></li>
            <li><a href="/bantuan">Bantuan</a></li>
            <li><a href="/syarat-ketentuan">Syarat & Ketentuan</a></li>
            <li><a href="/cek-transaksi">Cek Transaksi</a></li>
          </ul>
        </div>
        <div class="footer-links">
          <h4>Kategori</h4>
          <ul>
            <li><a href="/?category=topup-game">Top Up Game</a></li>
            <li><a href="/?category=voucher-aplikasi">Voucher & Aplikasi</a></li>
            <li><a href="/?category=pulsa-data">Pulsa & Paket Data</a></li>
          </ul>
        </div>
        <div class="footer-contact">
          <h4>Hubungi Kami</h4>
          <div class="contact-list">
            <div class="contact-item">
              <i class="fab fa-whatsapp"></i>
              <span>WhatsApp</span>
            </div>
            <div class="contact-item">
              <i class="fab fa-instagram"></i>
              <span>Instagram</span>
            </div>
            <div class="contact-item">
              <i class="fas fa-envelope"></i>
              <span>Email</span>
            </div>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; ${new Date().getFullYear()} ${config.site_title}. All rights reserved.</p>
        <p>Dibuat dengan <i class="fas fa-heart text-red"></i> untuk para gamer</p>
      </div>
    </div>
  </footer>

  <script src="/static/app.js"></script>
</body>
</html>`
}

export async function getSiteConfig(db: D1Database): Promise<SiteConfig> {
  const rows = await db.prepare('SELECT config_key, config_value FROM site_config').all()
  const config: Record<string, string> = {}
  for (const row of rows.results as any[]) {
    config[row.config_key] = row.config_value || ''
  }
  return {
    site_title: config.site_title || 'TopUp Store',
    site_logo: config.site_logo || '',
    site_icon: config.site_icon || '',
    site_author: config.site_author || 'TopUp Store',
    site_keywords: config.site_keywords || 'topup, game, voucher',
    site_description: config.site_description || 'Top Up Game Terpercaya',
    whatsapp_number: config.whatsapp_number || '6281234567890',
    theme: config.theme || 'dark',
  }
}
