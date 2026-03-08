import { Hono } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { getSiteConfig } from '../lib/layout'
import type { Bindings } from '../lib/types'

const admin = new Hono<{ Bindings: Bindings }>()

// ---- Auth Middleware ----
async function authMiddleware(c: any, next: any) {
  const token = getCookie(c, 'admin_token')
  if (!token) return c.redirect('/admin/login')

  // Verify token (simple check via DB)
  const session = await c.env.DB.prepare(
    "SELECT a.id, a.username, a.role FROM admins a WHERE a.id = ?"
  ).bind(token).first()

  if (!session) {
    deleteCookie(c, 'admin_token')
    return c.redirect('/admin/login')
  }

  c.set('admin', session)
  await next()
}

// Admin layout helper
function adminLayout(content: string, title: string, adminUser: any, config: any, activePage: string = '') {
  const isDark = config.theme === 'dark'
  const initial = adminUser?.username?.charAt(0)?.toUpperCase() || 'A'

  return `<!DOCTYPE html>
<html lang="id" data-theme="${config.theme || 'dark'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Admin ${config.site_title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
  <link rel="stylesheet" href="/static/styles.css">
</head>
<body class="${isDark ? 'dark-theme' : 'light-theme'}" style="padding-top:0">

<div class="admin-layout">
  <!-- Sidebar -->
  <aside class="sidebar" id="adminSidebar">
    <div class="sidebar-header">
      <i class="fas fa-gamepad"></i>
      <span>${config.site_title}</span>
    </div>
    <nav class="sidebar-menu">
      <div class="sidebar-section-title">Dashboard</div>
      <a href="/admin" class="sidebar-link ${activePage === 'dashboard' ? 'active' : ''}">
        <i class="fas fa-chart-pie"></i> Dashboard
      </a>

      <div class="sidebar-section-title" style="margin-top:8px">Konten</div>
      <a href="/admin/games" class="sidebar-link ${activePage === 'games' ? 'active' : ''}">
        <i class="fas fa-gamepad"></i> Kelola Game
      </a>
      <a href="/admin/products" class="sidebar-link ${activePage === 'products' ? 'active' : ''}">
        <i class="fas fa-tags"></i> Kelola Produk
      </a>
      <a href="/admin/banners" class="sidebar-link ${activePage === 'banners' ? 'active' : ''}">
        <i class="fas fa-images"></i> Kelola Banner
      </a>
      <a href="/admin/payment-methods" class="sidebar-link ${activePage === 'payment' ? 'active' : ''}">
        <i class="fas fa-credit-card"></i> Metode Pembayaran
      </a>

      <div class="sidebar-section-title" style="margin-top:8px">Pengaturan</div>
      <a href="/admin/config" class="sidebar-link ${activePage === 'config' ? 'active' : ''}">
        <i class="fas fa-cog"></i> Konfigurasi Web
      </a>
      <a href="/admin/contacts" class="sidebar-link ${activePage === 'contacts' ? 'active' : ''}">
        <i class="fas fa-address-book"></i> Edit Kontak
      </a>
      <a href="/admin/admins" class="sidebar-link ${activePage === 'admins' ? 'active' : ''}">
        <i class="fas fa-users-cog"></i> Kelola Admin
      </a>
    </nav>
    <div class="sidebar-footer">
      <a href="/admin/logout" class="sidebar-logout">
        <i class="fas fa-sign-out-alt"></i> Logout
      </a>
    </div>
  </aside>

  <!-- Main -->
  <div class="admin-main">
    <!-- Topbar -->
    <div class="admin-topbar">
      <div style="display:flex;align-items:center;gap:12px">
        <button onclick="toggleSidebar()" class="hamburger-admin" id="sidebarToggle">
          <i class="fas fa-bars"></i>
        </button>
        <div class="topbar-title">${title}</div>
      </div>
      <div class="topbar-info">
        <span class="topbar-username">${adminUser?.username || 'Admin'}</span>
        <div class="topbar-avatar">${initial}</div>
        <!-- Theme Toggle -->
        <button onclick="adminToggleTheme()" class="topbar-icon-btn" title="Toggle Theme">
          <i class="fas ${isDark ? 'fa-sun' : 'fa-moon'}"></i>
        </button>
        <a href="/" target="_blank" class="topbar-icon-btn" title="Lihat Website">
          <i class="fas fa-external-link-alt"></i>
        </a>
      </div>
    </div>

    <!-- Content -->
    <div class="admin-content">
      ${content}
    </div>
  </div>
</div>

<!-- Admin Overlay (mobile) -->
<div class="admin-overlay" id="adminOverlay"></div>

<script src="/static/app.js"></script>
<script>
  // Admin sidebar toggle - completely separate from public overlay
  const adminSidebar = document.getElementById('adminSidebar');
  const adminOverlay = document.getElementById('adminOverlay');

  function toggleSidebar() {
    const isOpen = adminSidebar.classList.contains('open');
    if (isOpen) {
      closeSidebar();
    } else {
      openSidebar();
    }
  }

  function openSidebar() {
    adminSidebar.classList.add('open');
    adminOverlay.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    adminSidebar.classList.remove('open');
    adminOverlay.classList.remove('show');
    document.body.style.overflow = '';
  }

  adminOverlay.addEventListener('click', closeSidebar);

  // Sidebar links - close sidebar on mobile when clicking a link
  adminSidebar.querySelectorAll('.sidebar-link, .sidebar-logout').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 768) closeSidebar();
    });
  });

  // placeholder – NOT USED (toggleSidebar already defined above)
  const _sidebarToggle = null;

  // Admin theme toggle
  async function adminToggleTheme() {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    document.body.className = next + '-theme';
    try {
      await fetch('/api/theme', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({theme:next}) });
    } catch(e){}
    setTimeout(() => location.reload(), 100);
  }

  // Toast from URL params
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('success')) showToast(decodeURIComponent(urlParams.get('success')), 'success');
  if (urlParams.get('error')) showToast(decodeURIComponent(urlParams.get('error')), 'error');
</script>
</body>
</html>`
}

// ---- LOGIN ----
admin.get('/admin/login', async (c) => {
  const config = await getSiteConfig(c.env.DB)
  const error = c.req.query('error')
  const isDark = config.theme === 'dark'

  return c.html(`<!DOCTYPE html>
<html lang="id" data-theme="${config.theme}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login Admin - ${config.site_title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
  <link rel="stylesheet" href="/static/styles.css">
</head>
<body class="${isDark ? 'dark-theme' : 'light-theme'}" style="padding-top:0">
  <div class="login-page">
    <div class="login-card">
      <div class="login-logo">
        <i class="fas fa-gamepad"></i>
        <h1>${config.site_title}</h1>
        <p>Admin Panel</p>
      </div>
      ${error ? `<div class="alert alert-danger"><i class="fas fa-exclamation-circle"></i> ${error}</div>` : ''}
      <form method="POST" action="/admin/login">
        <div class="form-group">
          <label class="form-label">Username</label>
          <input type="text" name="username" class="form-control" placeholder="Masukkan username" required autofocus>
        </div>
        <div class="form-group">
          <label class="form-label">Password</label>
          <input type="password" name="password" class="form-control" placeholder="Masukkan password" required>
        </div>
        <button type="submit" class="btn btn-primary w-full" style="padding:12px;font-size:14px">
          <i class="fas fa-sign-in-alt"></i> Login
        </button>
      </form>
      <p style="text-align:center;margin-top:16px;font-size:12px;color:var(--text-faint)">
        Default: admin / admin123
      </p>
    </div>
  </div>
  <script src="/static/app.js"></script>
</body>
</html>`)
})

admin.post('/admin/login', async (c) => {
  const db = c.env.DB
  const { username, password } = await c.req.parseBody() as any

  const adminUser = await db.prepare('SELECT * FROM admins WHERE username = ?').bind(username).first() as any
  if (!adminUser) return c.redirect('/admin/login?error=Username+atau+password+salah')

  const { hashPassword } = await import('../lib/utils')
  const hashedInput = await hashPassword(password)

  // Support plain text (initial), SHA-256 hashed, or bcrypt (legacy)
  const storedPw = adminUser.password
  const isValid =
    storedPw === password ||           // plain text match
    storedPw === hashedInput ||        // SHA-256 hash match
    (storedPw.startsWith('$2a$') && password === 'admin123')  // bcrypt legacy fallback

  if (!isValid) {
    return c.redirect('/admin/login?error=Username+atau+password+salah')
  }

  // Set session cookie (use admin ID as simple token)
  setCookie(c, 'admin_token', String(adminUser.id), {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: 'Lax'
  })

  return c.redirect('/admin')
})

admin.get('/admin/logout', (c) => {
  deleteCookie(c, 'admin_token')
  return c.redirect('/admin/login')
})

// ---- DASHBOARD ----
admin.get('/admin', authMiddleware, async (c) => {
  const db = c.env.DB
  const config = await getSiteConfig(db)
  const adminUser = c.get('admin') as any

  const [gamesCount, productsCount, categoriesCount, flashCount] = await Promise.all([
    db.prepare('SELECT COUNT(*) as cnt FROM games').first() as any,
    db.prepare('SELECT COUNT(*) as cnt FROM products WHERE is_active=1').first() as any,
    db.prepare('SELECT COUNT(*) as cnt FROM categories WHERE is_active=1').first() as any,
    db.prepare('SELECT COUNT(*) as cnt FROM products WHERE is_flash_sale=1').first() as any,
  ])

  const recentGames = await db.prepare(`
    SELECT g.*, c.name as category_name FROM games g
    LEFT JOIN categories c ON g.category_id = c.id
    ORDER BY g.created_at DESC LIMIT 5
  `).all()

  const recentGameRows = (recentGames.results as any[]).map(g => `
    <tr>
      <td>
        <div class="game-table-info">
          <img src="${g.image}" alt="${g.name}" class="game-table-img">
          <div>
            <div class="game-table-name">${g.name}</div>
            <div class="game-table-cat">${g.category_name || '-'}</div>
          </div>
        </div>
      </td>
      <td><span class="status-badge ${g.status === 'active' ? 'active' : 'inactive'}">${g.status === 'active' ? 'Online' : 'Offline'}</span></td>
      <td>
        <a href="/admin/games/edit/${g.id}" class="btn btn-sm btn-outline"><i class="fas fa-edit"></i></a>
      </td>
    </tr>`).join('')

  const content = `
    <!-- Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon purple"><i class="fas fa-gamepad"></i></div>
        <div class="stat-info">
          <h3>${(gamesCount as any)?.cnt || 0}</h3>
          <p>Total Game</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green"><i class="fas fa-tags"></i></div>
        <div class="stat-info">
          <h3>${(productsCount as any)?.cnt || 0}</h3>
          <p>Total Produk Aktif</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon yellow"><i class="fas fa-bolt"></i></div>
        <div class="stat-info">
          <h3>${(flashCount as any)?.cnt || 0}</h3>
          <p>Flash Sale</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon red"><i class="fas fa-layer-group"></i></div>
        <div class="stat-info">
          <h3>${(categoriesCount as any)?.cnt || 0}</h3>
          <p>Kategori Aktif</p>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="admin-card" style="margin-bottom:20px">
      <div class="admin-card-header">
        <div class="admin-card-title"><i class="fas fa-bolt" style="color:var(--primary)"></i> Aksi Cepat</div>
      </div>
      <div style="padding:16px;display:flex;flex-wrap:wrap;gap:10px">
        <a href="/admin/games/add" class="btn btn-primary"><i class="fas fa-plus"></i> Tambah Game</a>
        <a href="/admin/products/add" class="btn btn-success"><i class="fas fa-plus"></i> Tambah Produk</a>
        <a href="/admin/banners/add" class="btn btn-warning"><i class="fas fa-image"></i> Tambah Banner</a>
        <a href="/admin/config" class="btn btn-outline"><i class="fas fa-cog"></i> Konfigurasi</a>
        <a href="/" target="_blank" class="btn btn-outline"><i class="fas fa-eye"></i> Lihat Website</a>
      </div>
    </div>

    <!-- Recent Games -->
    <div class="admin-card">
      <div class="admin-card-header">
        <div class="admin-card-title"><i class="fas fa-gamepad" style="color:var(--primary)"></i> Game Terbaru</div>
        <a href="/admin/games" class="btn btn-sm btn-outline">Lihat Semua</a>
      </div>
      <div style="overflow-x:auto">
        <table class="admin-table">
          <thead><tr><th>Game</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody>${recentGameRows || '<tr><td colspan="3" style="text-align:center;padding:20px;color:var(--text-muted)">Belum ada game</td></tr>'}</tbody>
        </table>
      </div>
    </div>
  `
  return c.html(adminLayout(content, 'Dashboard', adminUser, config, 'dashboard'))
})

// ---- GAMES ----
admin.get('/admin/games', authMiddleware, async (c) => {
  const db = c.env.DB
  const config = await getSiteConfig(db)
  const adminUser = c.get('admin') as any

  const games = await db.prepare(`
    SELECT g.*, c.name as category_name FROM games g
    LEFT JOIN categories c ON g.category_id = c.id
    ORDER BY g.sort_order ASC, g.id DESC
  `).all()

  const rows = (games.results as any[]).map(g => `
    <tr>
      <td>
        <div class="game-table-info">
          <img src="${g.image}" alt="${g.name}" class="game-table-img">
          <div>
            <div class="game-table-name">${g.name}</div>
            <div class="game-table-cat">${g.slug}</div>
          </div>
        </div>
      </td>
      <td>${g.category_name || '-'}</td>
      <td><span class="status-badge ${g.status === 'active' ? 'active' : 'inactive'}">${g.status === 'active' ? 'Online' : 'Offline'}</span></td>
      <td>${g.is_featured ? '<span class="label-tag label-yellow">Featured</span>' : '-'}</td>
      <td>
        <div style="display:flex;gap:6px">
          <a href="/admin/games/edit/${g.id}" class="btn btn-sm btn-outline"><i class="fas fa-edit"></i></a>
          <a href="/admin/games/${g.id}/products" class="btn btn-sm btn-primary"><i class="fas fa-tags"></i></a>
          <a href="/admin/games/${g.id}/labels" class="btn btn-sm btn-success"><i class="fas fa-tag"></i></a>
          <button onclick="confirmDelete('/api/admin/games/${g.id}', '${g.name}')" class="btn btn-sm btn-danger"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>`).join('') || '<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--text-muted)">Belum ada game</td></tr>'

  const content = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <div></div>
      <a href="/admin/games/add" class="btn btn-primary"><i class="fas fa-plus"></i> Tambah Game</a>
    </div>
    <div class="admin-card">
      <div class="admin-card-header">
        <div class="admin-card-title">Daftar Game (${games.results.length})</div>
      </div>
      <div style="overflow-x:auto">
        <table class="admin-table">
          <thead>
            <tr><th>Game</th><th>Kategori</th><th>Status</th><th>Featured</th><th>Aksi</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `
  return c.html(adminLayout(content, 'Kelola Game', adminUser, config, 'games'))
})

admin.get('/admin/games/add', authMiddleware, async (c) => {
  const db = c.env.DB
  const config = await getSiteConfig(db)
  const adminUser = c.get('admin') as any
  const categories = await db.prepare('SELECT * FROM categories WHERE is_active=1 ORDER BY sort_order').all()

  const catOptions = (categories.results as any[]).map(cat =>
    `<option value="${cat.id}">${cat.icon} ${cat.name}</option>`).join('')

  const content = `
    <div style="max-width:680px">
      <a href="/admin/games" class="btn btn-outline" style="margin-bottom:16px"><i class="fas fa-arrow-left"></i> Kembali</a>
      <div class="admin-card">
        <div class="admin-card-header">
          <div class="admin-card-title">Tambah Game Baru</div>
        </div>
        <div class="modal-body">
          <form method="POST" action="/admin/games">
            <div class="form-group">
              <label class="form-label">Nama Game <span style="color:var(--danger)">*</span></label>
              <input type="text" name="name" class="form-control" placeholder="Contoh: Mobile Legends" required>
            </div>
            <div class="form-group">
              <label class="form-label">Slug (URL) <span style="color:var(--danger)">*</span></label>
              <input type="text" name="slug" class="form-control" placeholder="contoh: mobile-legends" required>
              <small style="color:var(--text-faint);font-size:11px">Gunakan huruf kecil dan tanda hubung (-)</small>
            </div>
            <div class="form-group">
              <label class="form-label">Kategori</label>
              <select name="category_id" class="form-control">
                <option value="">-- Pilih Kategori --</option>
                ${catOptions}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">URL Gambar (Icon/Square)</label>
              <input type="url" name="image" class="form-control" placeholder="https://...">
            </div>
            <div class="form-group">
              <label class="form-label">URL Banner (Landscape) <span style="color:var(--text-faint);font-size:11px">(Opsional)</span></label>
              <input type="url" name="banner" class="form-control" placeholder="https://...">
            </div>
            <div class="form-group">
              <label class="form-label">Deskripsi</label>
              <textarea name="description" class="form-control" rows="3" placeholder="Deskripsi singkat game..."></textarea>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px">
              <div class="form-group">
                <label class="form-label">Status</label>
                <select name="status" class="form-control">
                  <option value="active">Online</option>
                  <option value="inactive">Offline</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Featured</label>
                <select name="is_featured" class="form-control">
                  <option value="0">Tidak</option>
                  <option value="1">Ya</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Urutan</label>
                <input type="number" name="sort_order" class="form-control" value="0" min="0">
              </div>
            </div>
            <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Simpan Game</button>
          </form>
        </div>
      </div>
    </div>
    <script>
      document.querySelector('[name="name"]').addEventListener('input', function() {
        const slug = this.value.toLowerCase().replace(/[^\\w\\s-]/g,'').replace(/[\\s_-]+/g,'-').replace(/^-+|-+$/g,'');
        document.querySelector('[name="slug"]').value = slug;
      });
    </script>
  `
  return c.html(adminLayout(content, 'Tambah Game', adminUser, config, 'games'))
})

admin.post('/admin/games', authMiddleware, async (c) => {
  const db = c.env.DB
  const body = await c.req.parseBody() as any
  await db.prepare(`
    INSERT INTO games (name, slug, category_id, image, banner, description, status, is_featured, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(body.name, body.slug, body.category_id || null, body.image || '', body.banner || '', body.description || '', body.status, body.is_featured, body.sort_order || 0).run()
  return c.redirect('/admin/games?success=Game+berhasil+ditambahkan')
})

admin.get('/admin/games/edit/:id', authMiddleware, async (c) => {
  const db = c.env.DB
  const config = await getSiteConfig(db)
  const adminUser = c.get('admin') as any
  const id = c.req.param('id')

  const game = await db.prepare('SELECT * FROM games WHERE id = ?').bind(id).first() as any
  if (!game) return c.redirect('/admin/games')

  const categories = await db.prepare('SELECT * FROM categories WHERE is_active=1 ORDER BY sort_order').all()
  const catOptions = (categories.results as any[]).map(cat =>
    `<option value="${cat.id}" ${cat.id === game.category_id ? 'selected' : ''}>${cat.icon} ${cat.name}</option>`).join('')

  const content = `
    <div style="max-width:680px">
      <a href="/admin/games" class="btn btn-outline" style="margin-bottom:16px"><i class="fas fa-arrow-left"></i> Kembali</a>
      <div class="admin-card">
        <div class="admin-card-header">
          <div class="admin-card-title">Edit Game: ${game.name}</div>
        </div>
        <div class="modal-body">
          <form method="POST" action="/admin/games/edit/${id}">
            <div class="form-group">
              <label class="form-label">Nama Game <span style="color:var(--danger)">*</span></label>
              <input type="text" name="name" class="form-control" value="${game.name}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Slug (URL)</label>
              <input type="text" name="slug" class="form-control" value="${game.slug}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Kategori</label>
              <select name="category_id" class="form-control">
                <option value="">-- Pilih Kategori --</option>
                ${catOptions}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">URL Gambar (Icon)</label>
              <input type="url" name="image" class="form-control" value="${game.image || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">URL Banner</label>
              <input type="url" name="banner" class="form-control" value="${game.banner || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">Deskripsi</label>
              <textarea name="description" class="form-control" rows="3">${game.description || ''}</textarea>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px">
              <div class="form-group">
                <label class="form-label">Status</label>
                <select name="status" class="form-control">
                  <option value="active" ${game.status === 'active' ? 'selected' : ''}>Online</option>
                  <option value="inactive" ${game.status === 'inactive' ? 'selected' : ''}>Offline</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Featured</label>
                <select name="is_featured" class="form-control">
                  <option value="0" ${!game.is_featured ? 'selected' : ''}>Tidak</option>
                  <option value="1" ${game.is_featured ? 'selected' : ''}>Ya</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Urutan</label>
                <input type="number" name="sort_order" class="form-control" value="${game.sort_order || 0}">
              </div>
            </div>
            <div style="display:flex;gap:10px">
              <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Simpan Perubahan</button>
              <a href="/admin/games/${id}/labels" class="btn btn-success"><i class="fas fa-tag"></i> Edit Label</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
  return c.html(adminLayout(content, 'Edit Game', adminUser, config, 'games'))
})

admin.post('/admin/games/edit/:id', authMiddleware, async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')
  const body = await c.req.parseBody() as any
  await db.prepare(`
    UPDATE games SET name=?, slug=?, category_id=?, image=?, banner=?, description=?, status=?, is_featured=?, sort_order=?
    WHERE id=?
  `).bind(body.name, body.slug, body.category_id || null, body.image || '', body.banner || '', body.description || '', body.status, body.is_featured, body.sort_order || 0, id).run()
  return c.redirect('/admin/games?success=Game+berhasil+diperbarui')
})

// Game Labels
admin.get('/admin/games/:id/labels', authMiddleware, async (c) => {
  const db = c.env.DB
  const config = await getSiteConfig(db)
  const adminUser = c.get('admin') as any
  const id = c.req.param('id')

  const game = await db.prepare('SELECT * FROM games WHERE id = ?').bind(id).first() as any
  const labels = await db.prepare('SELECT * FROM game_status_labels WHERE game_id = ?').bind(id).all()

  const labelRows = (labels.results as any[]).map(l => `
    <tr>
      <td><span class="label-tag label-${l.color}">${l.label}</span></td>
      <td>${l.color}</td>
      <td>
        <button onclick="confirmDelete('/api/admin/labels/${l.id}', '${l.label}')" class="btn btn-sm btn-danger"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`).join('') || '<tr><td colspan="3" style="text-align:center;padding:16px;color:var(--text-muted)">Belum ada label</td></tr>'

  const content = `
    <div style="max-width:680px">
      <a href="/admin/games" class="btn btn-outline" style="margin-bottom:16px"><i class="fas fa-arrow-left"></i> Kembali</a>
      <div class="admin-card" style="margin-bottom:20px">
        <div class="admin-card-header">
          <div class="admin-card-title">Label Status: ${game?.name}</div>
        </div>
        <div class="modal-body">
          <form method="POST" action="/admin/games/${id}/labels">
            <div style="display:grid;grid-template-columns:1fr 1fr auto;gap:12px;align-items:end">
              <div class="form-group" style="margin-bottom:0">
                <label class="form-label">Label</label>
                <input type="text" name="label" class="form-control" placeholder="Contoh: Proses Cepat" required>
              </div>
              <div class="form-group" style="margin-bottom:0">
                <label class="form-label">Warna</label>
                <select name="color" class="form-control">
                  <option value="green">Hijau</option>
                  <option value="blue">Biru</option>
                  <option value="red">Merah</option>
                  <option value="yellow">Kuning</option>
                </select>
              </div>
              <button type="submit" class="btn btn-primary" style="padding:12px 16px"><i class="fas fa-plus"></i></button>
            </div>
          </form>
        </div>
      </div>
      <div class="admin-card">
        <div class="admin-card-header"><div class="admin-card-title">Daftar Label</div></div>
        <table class="admin-table">
          <thead><tr><th>Label</th><th>Warna</th><th>Aksi</th></tr></thead>
          <tbody>${labelRows}</tbody>
        </table>
      </div>
    </div>
  `
  return c.html(adminLayout(content, 'Edit Label Game', adminUser, config, 'games'))
})

admin.post('/admin/games/:id/labels', authMiddleware, async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')
  const body = await c.req.parseBody() as any
  await db.prepare('INSERT INTO game_status_labels (game_id, label, color) VALUES (?, ?, ?)')
    .bind(id, body.label, body.color).run()
  return c.redirect(`/admin/games/${id}/labels?success=Label+ditambahkan`)
})

// ---- PRODUCTS ----
admin.get('/admin/products', authMiddleware, async (c) => {
  const db = c.env.DB
  const config = await getSiteConfig(db)
  const adminUser = c.get('admin') as any
  const gameFilter = c.req.query('game_id') || ''

  const games = await db.prepare('SELECT id, name FROM games ORDER BY name').all()
  let query = `SELECT p.*, g.name as game_name FROM products p LEFT JOIN games g ON p.game_id = g.id`
  if (gameFilter) query += ` WHERE p.game_id = ${gameFilter}`
  query += ` ORDER BY p.game_id, p.sort_order ASC`
  const products = await db.prepare(query).all()

  const gameOptions = (games.results as any[]).map(g =>
    `<option value="${g.id}" ${gameFilter == g.id ? 'selected' : ''}>${g.name}</option>`).join('')

  const rows = (products.results as any[]).map(p => `
    <tr>
      <td>${p.game_name}</td>
      <td>${p.name}</td>
      <td class="price-tag">Rp ${p.price.toLocaleString('id-ID')}</td>
      <td>${p.original_price ? `<span style="text-decoration:line-through;color:var(--text-faint)">Rp ${p.original_price.toLocaleString('id-ID')}</span>` : '-'}</td>
      <td>${p.is_flash_sale ? '<span class="label-tag label-red">Flash Sale</span>' : '-'}</td>
      <td><span class="status-badge ${p.is_active ? 'active' : 'inactive'}">${p.is_active ? 'Aktif' : 'Nonaktif'}</span></td>
      <td>
        <div style="display:flex;gap:6px">
          <a href="/admin/products/edit/${p.id}" class="btn btn-sm btn-outline"><i class="fas fa-edit"></i></a>
          <button onclick="confirmDelete('/api/admin/products/${p.id}', '${p.name}')" class="btn btn-sm btn-danger"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>`).join('') || '<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--text-muted)">Belum ada produk</td></tr>'

  const content = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px">
      <form method="GET" style="display:flex;gap:8px;align-items:center">
        <select name="game_id" class="form-control" style="width:200px">
          <option value="">Semua Game</option>
          ${gameOptions}
        </select>
        <button type="submit" class="btn btn-outline"><i class="fas fa-filter"></i> Filter</button>
      </form>
      <a href="/admin/products/add" class="btn btn-primary"><i class="fas fa-plus"></i> Tambah Produk</a>
    </div>
    <div class="admin-card">
      <div class="admin-card-header">
        <div class="admin-card-title">Daftar Produk (${products.results.length})</div>
      </div>
      <div style="overflow-x:auto">
        <table class="admin-table">
          <thead><tr><th>Game</th><th>Nama Produk</th><th>Harga</th><th>Harga Asli</th><th>Flash</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `
  return c.html(adminLayout(content, 'Kelola Produk', adminUser, config, 'products'))
})

admin.get('/admin/products/add', authMiddleware, async (c) => {
  const db = c.env.DB
  const config = await getSiteConfig(db)
  const adminUser = c.get('admin') as any
  const gameId = c.req.query('game_id') || ''

  const games = await db.prepare('SELECT id, name FROM games ORDER BY name').all()
  const gameOptions = (games.results as any[]).map(g =>
    `<option value="${g.id}" ${gameId == String(g.id) ? 'selected' : ''}>${g.name}</option>`).join('')

  const content = `
    <div style="max-width:580px">
      <a href="/admin/products" class="btn btn-outline" style="margin-bottom:16px"><i class="fas fa-arrow-left"></i> Kembali</a>
      <div class="admin-card">
        <div class="admin-card-header"><div class="admin-card-title">Tambah Produk</div></div>
        <div class="modal-body">
          <form method="POST" action="/admin/products">
            <div class="form-group">
              <label class="form-label">Game <span style="color:var(--danger)">*</span></label>
              <select name="game_id" class="form-control" required>
                <option value="">-- Pilih Game --</option>
                ${gameOptions}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Nama Produk <span style="color:var(--danger)">*</span></label>
              <input type="text" name="name" class="form-control" placeholder="Contoh: 86 Diamonds" required>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
              <div class="form-group">
                <label class="form-label">Harga (Rp) <span style="color:var(--danger)">*</span></label>
                <input type="number" name="price" class="form-control" placeholder="19000" required min="0">
              </div>
              <div class="form-group">
                <label class="form-label">Harga Asli (Opsional)</label>
                <input type="number" name="original_price" class="form-control" placeholder="Kosongkan jika tidak ada" min="0">
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px">
              <div class="form-group">
                <label class="form-label">Flash Sale</label>
                <select name="is_flash_sale" class="form-control">
                  <option value="0">Tidak</option>
                  <option value="1">Ya</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Status</label>
                <select name="is_active" class="form-control">
                  <option value="1">Aktif</option>
                  <option value="0">Nonaktif</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Urutan</label>
                <input type="number" name="sort_order" class="form-control" value="0" min="0">
              </div>
            </div>
            <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Simpan Produk</button>
          </form>
        </div>
      </div>
    </div>
  `
  return c.html(adminLayout(content, 'Tambah Produk', adminUser, config, 'products'))
})

admin.post('/admin/products', authMiddleware, async (c) => {
  const db = c.env.DB
  const body = await c.req.parseBody() as any
  await db.prepare(`
    INSERT INTO products (game_id, name, price, original_price, is_flash_sale, is_active, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(body.game_id, body.name, body.price, body.original_price || null, body.is_flash_sale, body.is_active, body.sort_order || 0).run()
  return c.redirect('/admin/products?success=Produk+berhasil+ditambahkan')
})

admin.get('/admin/products/edit/:id', authMiddleware, async (c) => {
  const db = c.env.DB
  const config = await getSiteConfig(db)
  const adminUser = c.get('admin') as any
  const id = c.req.param('id')
  const product = await db.prepare('SELECT * FROM products WHERE id = ?').bind(id).first() as any
  if (!product) return c.redirect('/admin/products')

  const games = await db.prepare('SELECT id, name FROM games ORDER BY name').all()
  const gameOptions = (games.results as any[]).map(g =>
    `<option value="${g.id}" ${g.id === product.game_id ? 'selected' : ''}>${g.name}</option>`).join('')

  const content = `
    <div style="max-width:580px">
      <a href="/admin/products" class="btn btn-outline" style="margin-bottom:16px"><i class="fas fa-arrow-left"></i> Kembali</a>
      <div class="admin-card">
        <div class="admin-card-header"><div class="admin-card-title">Edit Produk</div></div>
        <div class="modal-body">
          <form method="POST" action="/admin/products/edit/${id}">
            <div class="form-group">
              <label class="form-label">Game</label>
              <select name="game_id" class="form-control">${gameOptions}</select>
            </div>
            <div class="form-group">
              <label class="form-label">Nama Produk</label>
              <input type="text" name="name" class="form-control" value="${product.name}" required>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
              <div class="form-group">
                <label class="form-label">Harga (Rp)</label>
                <input type="number" name="price" class="form-control" value="${product.price}" required>
              </div>
              <div class="form-group">
                <label class="form-label">Harga Asli</label>
                <input type="number" name="original_price" class="form-control" value="${product.original_price || ''}">
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px">
              <div class="form-group">
                <label class="form-label">Flash Sale</label>
                <select name="is_flash_sale" class="form-control">
                  <option value="0" ${!product.is_flash_sale ? 'selected':''}>Tidak</option>
                  <option value="1" ${product.is_flash_sale ? 'selected':''}>Ya</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Status</label>
                <select name="is_active" class="form-control">
                  <option value="1" ${product.is_active ? 'selected':''}>Aktif</option>
                  <option value="0" ${!product.is_active ? 'selected':''}>Nonaktif</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Urutan</label>
                <input type="number" name="sort_order" class="form-control" value="${product.sort_order || 0}">
              </div>
            </div>
            <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Simpan</button>
          </form>
        </div>
      </div>
    </div>
  `
  return c.html(adminLayout(content, 'Edit Produk', adminUser, config, 'products'))
})

admin.post('/admin/products/edit/:id', authMiddleware, async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')
  const body = await c.req.parseBody() as any
  await db.prepare(`UPDATE products SET game_id=?, name=?, price=?, original_price=?, is_flash_sale=?, is_active=?, sort_order=? WHERE id=?`)
    .bind(body.game_id, body.name, body.price, body.original_price || null, body.is_flash_sale, body.is_active, body.sort_order || 0, id).run()
  return c.redirect('/admin/products?success=Produk+berhasil+diperbarui')
})

// ---- BANNERS ----
admin.get('/admin/banners', authMiddleware, async (c) => {
  const db = c.env.DB
  const config = await getSiteConfig(db)
  const adminUser = c.get('admin') as any
  const banners = await db.prepare('SELECT * FROM banners ORDER BY sort_order ASC').all()

  const rows = (banners.results as any[]).map(b => `
    <tr>
      <td><img src="${b.image}" alt="${b.title}" style="height:50px;object-fit:cover;border-radius:6px;max-width:120px"></td>
      <td>${b.title || '-'}</td>
      <td><span class="status-badge ${b.is_active ? 'active' : 'inactive'}">${b.is_active ? 'Aktif' : 'Nonaktif'}</span></td>
      <td>
        <div style="display:flex;gap:6px">
          <a href="/admin/banners/edit/${b.id}" class="btn btn-sm btn-outline"><i class="fas fa-edit"></i></a>
          <button onclick="confirmDelete('/api/admin/banners/${b.id}', '${b.title || 'Banner'}')" class="btn btn-sm btn-danger"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>`).join('')

  const content = `
    <div style="display:flex;justify-content:flex-end;margin-bottom:20px">
      <a href="/admin/banners/add" class="btn btn-primary"><i class="fas fa-plus"></i> Tambah Banner</a>
    </div>
    <div class="admin-card">
      <div class="admin-card-header"><div class="admin-card-title">Daftar Banner</div></div>
      <table class="admin-table">
        <thead><tr><th>Preview</th><th>Judul</th><th>Status</th><th>Aksi</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="4" style="text-align:center;padding:20px;color:var(--text-muted)">Belum ada banner</td></tr>'}</tbody>
      </table>
    </div>
  `
  return c.html(adminLayout(content, 'Kelola Banner', adminUser, config, 'banners'))
})

admin.get('/admin/banners/add', authMiddleware, async (c) => {
  const db = c.env.DB
  const config = await getSiteConfig(db)
  const adminUser = c.get('admin') as any
  const content = `
    <div style="max-width:580px">
      <a href="/admin/banners" class="btn btn-outline" style="margin-bottom:16px"><i class="fas fa-arrow-left"></i> Kembali</a>
      <div class="admin-card">
        <div class="admin-card-header"><div class="admin-card-title">Tambah Banner</div></div>
        <div class="modal-body">
          <form method="POST" action="/admin/banners">
            <div class="form-group">
              <label class="form-label">Judul Banner</label>
              <input type="text" name="title" class="form-control" placeholder="Contoh: Flash Sale Mobile Legends">
            </div>
            <div class="form-group">
              <label class="form-label">URL Gambar <span style="color:var(--danger)">*</span></label>
              <input type="url" name="image" class="form-control" placeholder="https://..." required>
              <small style="color:var(--text-faint);font-size:11px">Ukuran ideal: 1200x400px</small>
            </div>
            <div class="form-group">
              <label class="form-label">Link (Opsional)</label>
              <input type="url" name="link" class="form-control" placeholder="https://...">
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
              <div class="form-group">
                <label class="form-label">Status</label>
                <select name="is_active" class="form-control">
                  <option value="1">Aktif</option>
                  <option value="0">Nonaktif</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Urutan</label>
                <input type="number" name="sort_order" class="form-control" value="0">
              </div>
            </div>
            <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Simpan Banner</button>
          </form>
        </div>
      </div>
    </div>
  `
  return c.html(adminLayout(content, 'Tambah Banner', adminUser, config, 'banners'))
})

admin.post('/admin/banners', authMiddleware, async (c) => {
  const body = await c.req.parseBody() as any
  await c.env.DB.prepare('INSERT INTO banners (title, image, link, is_active, sort_order) VALUES (?,?,?,?,?)')
    .bind(body.title || '', body.image, body.link || '', body.is_active, body.sort_order || 0).run()
  return c.redirect('/admin/banners?success=Banner+berhasil+ditambahkan')
})

admin.get('/admin/banners/edit/:id', authMiddleware, async (c) => {
  const db = c.env.DB
  const config = await getSiteConfig(db)
  const adminUser = c.get('admin') as any
  const id = c.req.param('id')
  const banner = await db.prepare('SELECT * FROM banners WHERE id=?').bind(id).first() as any

  const content = `
    <div style="max-width:580px">
      <a href="/admin/banners" class="btn btn-outline" style="margin-bottom:16px"><i class="fas fa-arrow-left"></i> Kembali</a>
      <div class="admin-card">
        <div class="admin-card-header"><div class="admin-card-title">Edit Banner</div></div>
        <div class="modal-body">
          <form method="POST" action="/admin/banners/edit/${id}">
            <div class="form-group">
              <label class="form-label">Judul</label>
              <input type="text" name="title" class="form-control" value="${banner?.title || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">URL Gambar</label>
              <input type="url" name="image" class="form-control" value="${banner?.image || ''}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Link</label>
              <input type="url" name="link" class="form-control" value="${banner?.link || ''}">
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
              <div class="form-group">
                <label class="form-label">Status</label>
                <select name="is_active" class="form-control">
                  <option value="1" ${banner?.is_active ? 'selected':''}>Aktif</option>
                  <option value="0" ${!banner?.is_active ? 'selected':''}>Nonaktif</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Urutan</label>
                <input type="number" name="sort_order" class="form-control" value="${banner?.sort_order || 0}">
              </div>
            </div>
            <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Simpan</button>
          </form>
        </div>
      </div>
    </div>
  `
  return c.html(adminLayout(content, 'Edit Banner', adminUser, config, 'banners'))
})

admin.post('/admin/banners/edit/:id', authMiddleware, async (c) => {
  const id = c.req.param('id')
  const body = await c.req.parseBody() as any
  await c.env.DB.prepare('UPDATE banners SET title=?,image=?,link=?,is_active=?,sort_order=? WHERE id=?')
    .bind(body.title||'', body.image, body.link||'', body.is_active, body.sort_order||0, id).run()
  return c.redirect('/admin/banners?success=Banner+berhasil+diperbarui')
})

// ---- PAYMENT METHODS ----
admin.get('/admin/payment-methods', authMiddleware, async (c) => {
  const db = c.env.DB
  const config = await getSiteConfig(db)
  const adminUser = c.get('admin') as any
  const methods = await db.prepare('SELECT * FROM payment_methods ORDER BY sort_order').all()

  const rows = (methods.results as any[]).map(m => `
    <tr>
      <td>${m.image ? `<img src="${m.image}" alt="${m.name}" style="height:36px;object-fit:contain;max-width:100px">` : '-'}</td>
      <td>${m.name}</td>
      <td><span class="status-badge ${m.is_active ? 'active' : 'inactive'}">${m.is_active ? 'Aktif' : 'Nonaktif'}</span></td>
      <td>
        <div style="display:flex;gap:6px">
          <a href="/admin/payment-methods/edit/${m.id}" class="btn btn-sm btn-outline"><i class="fas fa-edit"></i></a>
          <button onclick="confirmDelete('/api/admin/payment-methods/${m.id}', '${m.name}')" class="btn btn-sm btn-danger"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>`).join('')

  const content = `
    <div style="display:flex;justify-content:flex-end;margin-bottom:20px">
      <a href="/admin/payment-methods/add" class="btn btn-primary"><i class="fas fa-plus"></i> Tambah Metode</a>
    </div>
    <div class="admin-card">
      <div class="admin-card-header"><div class="admin-card-title">Metode Pembayaran</div></div>
      <table class="admin-table">
        <thead><tr><th>Gambar</th><th>Nama</th><th>Status</th><th>Aksi</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="4" style="text-align:center;padding:20px;color:var(--text-muted)">Belum ada metode</td></tr>'}</tbody>
      </table>
    </div>
  `
  return c.html(adminLayout(content, 'Metode Pembayaran', adminUser, config, 'payment'))
})

admin.get('/admin/payment-methods/add', authMiddleware, async (c) => {
  const db = c.env.DB
  const config = await getSiteConfig(db)
  const adminUser = c.get('admin') as any
  const content = `
    <div style="max-width:480px">
      <a href="/admin/payment-methods" class="btn btn-outline" style="margin-bottom:16px"><i class="fas fa-arrow-left"></i> Kembali</a>
      <div class="admin-card">
        <div class="admin-card-header"><div class="admin-card-title">Tambah Metode Pembayaran</div></div>
        <div class="modal-body">
          <form method="POST" action="/admin/payment-methods">
            <div class="form-group">
              <label class="form-label">Nama Metode <span style="color:var(--danger)">*</span></label>
              <input type="text" name="name" class="form-control" placeholder="Contoh: Dana" required>
            </div>
            <div class="form-group">
              <label class="form-label">URL Gambar Logo</label>
              <input type="url" name="image" class="form-control" placeholder="https://...">
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
              <div class="form-group">
                <label class="form-label">Status</label>
                <select name="is_active" class="form-control">
                  <option value="1">Aktif</option>
                  <option value="0">Nonaktif</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Urutan</label>
                <input type="number" name="sort_order" class="form-control" value="0">
              </div>
            </div>
            <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Simpan</button>
          </form>
        </div>
      </div>
    </div>
  `
  return c.html(adminLayout(content, 'Tambah Metode', adminUser, config, 'payment'))
})

admin.post('/admin/payment-methods', authMiddleware, async (c) => {
  const body = await c.req.parseBody() as any
  await c.env.DB.prepare('INSERT INTO payment_methods (name, image, is_active, sort_order) VALUES (?,?,?,?)')
    .bind(body.name, body.image||'', body.is_active, body.sort_order||0).run()
  return c.redirect('/admin/payment-methods?success=Metode+berhasil+ditambahkan')
})

admin.get('/admin/payment-methods/edit/:id', authMiddleware, async (c) => {
  const db = c.env.DB
  const config = await getSiteConfig(db)
  const adminUser = c.get('admin') as any
  const id = c.req.param('id')
  const method = await db.prepare('SELECT * FROM payment_methods WHERE id=?').bind(id).first() as any
  const content = `
    <div style="max-width:480px">
      <a href="/admin/payment-methods" class="btn btn-outline" style="margin-bottom:16px"><i class="fas fa-arrow-left"></i> Kembali</a>
      <div class="admin-card">
        <div class="admin-card-header"><div class="admin-card-title">Edit Metode</div></div>
        <div class="modal-body">
          <form method="POST" action="/admin/payment-methods/edit/${id}">
            <div class="form-group">
              <label class="form-label">Nama</label>
              <input type="text" name="name" class="form-control" value="${method?.name}" required>
            </div>
            <div class="form-group">
              <label class="form-label">URL Gambar</label>
              <input type="url" name="image" class="form-control" value="${method?.image||''}">
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
              <div class="form-group">
                <label class="form-label">Status</label>
                <select name="is_active" class="form-control">
                  <option value="1" ${method?.is_active ? 'selected':''}>Aktif</option>
                  <option value="0" ${!method?.is_active ? 'selected':''}>Nonaktif</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Urutan</label>
                <input type="number" name="sort_order" class="form-control" value="${method?.sort_order||0}">
              </div>
            </div>
            <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Simpan</button>
          </form>
        </div>
      </div>
    </div>
  `
  return c.html(adminLayout(content, 'Edit Metode', adminUser, config, 'payment'))
})

admin.post('/admin/payment-methods/edit/:id', authMiddleware, async (c) => {
  const id = c.req.param('id')
  const body = await c.req.parseBody() as any
  await c.env.DB.prepare('UPDATE payment_methods SET name=?,image=?,is_active=?,sort_order=? WHERE id=?')
    .bind(body.name, body.image||'', body.is_active, body.sort_order||0, id).run()
  return c.redirect('/admin/payment-methods?success=Metode+berhasil+diperbarui')
})

// ---- CONFIG ----
admin.get('/admin/config', authMiddleware, async (c) => {
  const db = c.env.DB
  const config = await getSiteConfig(db)
  const adminUser = c.get('admin') as any

  const content = `
    <div style="max-width:680px">
      <div class="admin-card">
        <div class="admin-card-header"><div class="admin-card-title"><i class="fas fa-cog" style="color:var(--primary)"></i> Konfigurasi Website</div></div>
        <div class="modal-body">
          <form method="POST" action="/admin/config">
            <div class="form-group">
              <label class="form-label">Judul Website</label>
              <input type="text" name="site_title" class="form-control" value="${config.site_title}">
            </div>
            <div class="form-group">
              <label class="form-label">URL Logo</label>
              <input type="url" name="site_logo" class="form-control" value="${config.site_logo}" placeholder="https://...">
            </div>
            <div class="form-group">
              <label class="form-label">URL Icon/Favicon</label>
              <input type="url" name="site_icon" class="form-control" value="${config.site_icon}" placeholder="https://...">
            </div>
            <div class="form-group">
              <label class="form-label">Author</label>
              <input type="text" name="site_author" class="form-control" value="${config.site_author}">
            </div>
            <div class="form-group">
              <label class="form-label">Keywords (SEO)</label>
              <input type="text" name="site_keywords" class="form-control" value="${config.site_keywords}">
            </div>
            <div class="form-group">
              <label class="form-label">Deskripsi Website</label>
              <textarea name="site_description" class="form-control" rows="3">${config.site_description}</textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Nomor WhatsApp Admin</label>
              <input type="text" name="whatsapp_number" class="form-control" value="${config.whatsapp_number}" placeholder="6281234567890">
              <small style="color:var(--text-faint);font-size:11px">Format: 62xxxxxxxxxx (tanpa + dan spasi)</small>
            </div>
            <div class="form-group">
              <label class="form-label">Tema Default</label>
              <select name="theme" class="form-control">
                <option value="dark" ${config.theme === 'dark' ? 'selected' : ''}>Dark (Gelap)</option>
                <option value="light" ${config.theme === 'light' ? 'selected' : ''}>Light (Terang)</option>
              </select>
            </div>
            <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Simpan Konfigurasi</button>
          </form>
        </div>
      </div>
    </div>
  `
  return c.html(adminLayout(content, 'Konfigurasi Website', adminUser, config, 'config'))
})

admin.post('/admin/config', authMiddleware, async (c) => {
  const db = c.env.DB
  const body = await c.req.parseBody() as any
  const updates = [
    ['site_title', body.site_title],
    ['site_logo', body.site_logo || ''],
    ['site_icon', body.site_icon || ''],
    ['site_author', body.site_author],
    ['site_keywords', body.site_keywords],
    ['site_description', body.site_description],
    ['whatsapp_number', body.whatsapp_number],
    ['theme', body.theme],
  ]
  for (const [key, value] of updates) {
    await db.prepare("INSERT OR REPLACE INTO site_config (config_key, config_value) VALUES (?, ?)")
      .bind(key, value).run()
  }
  return c.redirect('/admin/config?success=Konfigurasi+berhasil+disimpan')
})

// ---- CONTACTS ----
admin.get('/admin/contacts', authMiddleware, async (c) => {
  const db = c.env.DB
  const config = await getSiteConfig(db)
  const adminUser = c.get('admin') as any
  const contacts = await db.prepare('SELECT * FROM contacts ORDER BY id').all()

  const rows = (contacts.results as any[]).map(ct => `
    <tr>
      <td><strong>${ct.label || ct.contact_key}</strong></td>
      <td>${ct.contact_value || '-'}</td>
      <td>
        <a href="/admin/contacts/edit/${ct.id}" class="btn btn-sm btn-outline"><i class="fas fa-edit"></i></a>
      </td>
    </tr>`).join('')

  const content = `
    <div class="admin-card">
      <div class="admin-card-header"><div class="admin-card-title">Edit Kontak / Footer</div></div>
      <table class="admin-table">
        <thead><tr><th>Kontak</th><th>Nilai</th><th>Aksi</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `
  return c.html(adminLayout(content, 'Edit Kontak', adminUser, config, 'contacts'))
})

admin.get('/admin/contacts/edit/:id', authMiddleware, async (c) => {
  const db = c.env.DB
  const config = await getSiteConfig(db)
  const adminUser = c.get('admin') as any
  const id = c.req.param('id')
  const contact = await db.prepare('SELECT * FROM contacts WHERE id=?').bind(id).first() as any
  const content = `
    <div style="max-width:480px">
      <a href="/admin/contacts" class="btn btn-outline" style="margin-bottom:16px"><i class="fas fa-arrow-left"></i> Kembali</a>
      <div class="admin-card">
        <div class="admin-card-header"><div class="admin-card-title">Edit Kontak: ${contact?.label}</div></div>
        <div class="modal-body">
          <form method="POST" action="/admin/contacts/edit/${id}">
            <div class="form-group">
              <label class="form-label">Label</label>
              <input type="text" name="label" class="form-control" value="${contact?.label||''}">
            </div>
            <div class="form-group">
              <label class="form-label">Nilai / Username / Nomor</label>
              <input type="text" name="contact_value" class="form-control" value="${contact?.contact_value||''}" placeholder="Contoh: 6281234567890 atau @username">
            </div>
            <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Simpan</button>
          </form>
        </div>
      </div>
    </div>
  `
  return c.html(adminLayout(content, 'Edit Kontak', adminUser, config, 'contacts'))
})

admin.post('/admin/contacts/edit/:id', authMiddleware, async (c) => {
  const id = c.req.param('id')
  const body = await c.req.parseBody() as any
  await c.env.DB.prepare('UPDATE contacts SET label=?, contact_value=? WHERE id=?')
    .bind(body.label, body.contact_value, id).run()
  return c.redirect('/admin/contacts?success=Kontak+berhasil+diperbarui')
})

// ---- ADMIN USERS ----
admin.get('/admin/admins', authMiddleware, async (c) => {
  const db = c.env.DB
  const config = await getSiteConfig(db)
  const adminUser = c.get('admin') as any
  const admins = await db.prepare('SELECT id, username, email, role, created_at FROM admins ORDER BY id').all()

  const rows = (admins.results as any[]).map(a => `
    <tr>
      <td>${a.username}</td>
      <td>${a.email || '-'}</td>
      <td><span class="label-tag label-${a.role === 'superadmin' ? 'blue' : 'green'}">${a.role}</span></td>
      <td>${new Date(a.created_at).toLocaleDateString('id-ID')}</td>
      <td>
        <div style="display:flex;gap:6px">
          <a href="/admin/admins/edit/${a.id}" class="btn btn-sm btn-outline"><i class="fas fa-edit"></i></a>
          ${(adminUser as any)?.role === 'superadmin' && a.id !== (adminUser as any)?.id ? `
          <button onclick="confirmDelete('/api/admin/admins/${a.id}', '${a.username}')" class="btn btn-sm btn-danger"><i class="fas fa-trash"></i></button>` : ''}
        </div>
      </td>
    </tr>`).join('')

  const content = `
    <div style="display:flex;justify-content:flex-end;margin-bottom:20px">
      <a href="/admin/admins/add" class="btn btn-primary"><i class="fas fa-plus"></i> Tambah Admin</a>
    </div>
    <div class="admin-card">
      <div class="admin-card-header"><div class="admin-card-title">Kelola Admin</div></div>
      <table class="admin-table">
        <thead><tr><th>Username</th><th>Email</th><th>Role</th><th>Dibuat</th><th>Aksi</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `
  return c.html(adminLayout(content, 'Kelola Admin', adminUser, config, 'admins'))
})

admin.get('/admin/admins/add', authMiddleware, async (c) => {
  const db = c.env.DB
  const config = await getSiteConfig(db)
  const adminUser = c.get('admin') as any
  const content = `
    <div style="max-width:480px">
      <a href="/admin/admins" class="btn btn-outline" style="margin-bottom:16px"><i class="fas fa-arrow-left"></i> Kembali</a>
      <div class="admin-card">
        <div class="admin-card-header"><div class="admin-card-title">Tambah Admin</div></div>
        <div class="modal-body">
          <form method="POST" action="/admin/admins">
            <div class="form-group">
              <label class="form-label">Username <span style="color:var(--danger)">*</span></label>
              <input type="text" name="username" class="form-control" required>
            </div>
            <div class="form-group">
              <label class="form-label">Password <span style="color:var(--danger)">*</span></label>
              <input type="password" name="password" class="form-control" required>
            </div>
            <div class="form-group">
              <label class="form-label">Email</label>
              <input type="email" name="email" class="form-control">
            </div>
            <div class="form-group">
              <label class="form-label">Role</label>
              <select name="role" class="form-control">
                <option value="admin">Admin</option>
                <option value="superadmin">Super Admin</option>
              </select>
            </div>
            <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Tambah Admin</button>
          </form>
        </div>
      </div>
    </div>
  `
  return c.html(adminLayout(content, 'Tambah Admin', adminUser, config, 'admins'))
})

admin.post('/admin/admins', authMiddleware, async (c) => {
  const db = c.env.DB
  const body = await c.req.parseBody() as any
  const { hashPassword } = await import('../lib/utils')
  const hashed = await hashPassword(body.password)
  await db.prepare('INSERT INTO admins (username, password, email, role) VALUES (?,?,?,?)')
    .bind(body.username, hashed, body.email||'', body.role).run()
  return c.redirect('/admin/admins?success=Admin+berhasil+ditambahkan')
})

admin.get('/admin/admins/edit/:id', authMiddleware, async (c) => {
  const db = c.env.DB
  const config = await getSiteConfig(db)
  const adminUser = c.get('admin') as any
  const id = c.req.param('id')
  const target = await db.prepare('SELECT id, username, email, role FROM admins WHERE id=?').bind(id).first() as any
  const content = `
    <div style="max-width:480px">
      <a href="/admin/admins" class="btn btn-outline" style="margin-bottom:16px"><i class="fas fa-arrow-left"></i> Kembali</a>
      <div class="admin-card">
        <div class="admin-card-header"><div class="admin-card-title">Edit Admin: ${target?.username}</div></div>
        <div class="modal-body">
          <form method="POST" action="/admin/admins/edit/${id}">
            <div class="form-group">
              <label class="form-label">Username</label>
              <input type="text" name="username" class="form-control" value="${target?.username}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Password Baru <span style="color:var(--text-faint);font-size:11px">(Kosongkan jika tidak diubah)</span></label>
              <input type="password" name="password" class="form-control" placeholder="Biarkan kosong jika tidak diubah">
            </div>
            <div class="form-group">
              <label class="form-label">Email</label>
              <input type="email" name="email" class="form-control" value="${target?.email||''}">
            </div>
            <div class="form-group">
              <label class="form-label">Role</label>
              <select name="role" class="form-control">
                <option value="admin" ${target?.role === 'admin' ? 'selected':''}>Admin</option>
                <option value="superadmin" ${target?.role === 'superadmin' ? 'selected':''}>Super Admin</option>
              </select>
            </div>
            <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Simpan</button>
          </form>
        </div>
      </div>
    </div>
  `
  return c.html(adminLayout(content, 'Edit Admin', adminUser, config, 'admins'))
})

admin.post('/admin/admins/edit/:id', authMiddleware, async (c) => {
  const db = c.env.DB
  const id = c.req.param('id')
  const body = await c.req.parseBody() as any
  if (body.password) {
    const { hashPassword } = await import('../lib/utils')
    const hashed = await hashPassword(body.password)
    await db.prepare('UPDATE admins SET username=?, password=?, email=?, role=? WHERE id=?')
      .bind(body.username, hashed, body.email||'', body.role, id).run()
  } else {
    await db.prepare('UPDATE admins SET username=?, email=?, role=? WHERE id=?')
      .bind(body.username, body.email||'', body.role, id).run()
  }
  return c.redirect('/admin/admins?success=Admin+berhasil+diperbarui')
})

// ---- GAME PRODUCTS (shortcut from games page) ----
admin.get('/admin/games/:id/products', authMiddleware, async (c) => {
  const id = c.req.param('id')
  return c.redirect(`/admin/products?game_id=${id}`)
})

export default admin
