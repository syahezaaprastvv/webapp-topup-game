import { Hono } from 'hono'
import { layout, getSiteConfig } from '../lib/layout'
import type { Bindings } from '../lib/types'

const home = new Hono<{ Bindings: Bindings }>()

home.get('/', async (c) => {
  const db = c.env.DB
  const config = await getSiteConfig(db)
  const categoryFilter = c.req.query('category') || 'all'

  // Fetch banners
  const bannersResult = await db.prepare('SELECT * FROM banners WHERE is_active=1 ORDER BY sort_order ASC').all()
  const banners = bannersResult.results as any[]

  // Fetch categories
  const catsResult = await db.prepare('SELECT * FROM categories WHERE is_active=1 ORDER BY sort_order ASC').all()
  const categories = catsResult.results as any[]

  // Fetch games
  let gamesQuery = `SELECT g.*, c.name as category_name, c.slug as category_slug 
    FROM games g LEFT JOIN categories c ON g.category_id = c.id`
  if (categoryFilter !== 'all') {
    gamesQuery += ` WHERE c.slug = '${categoryFilter}'`
  }
  gamesQuery += ` ORDER BY g.sort_order ASC, g.id ASC`
  const gamesResult = await db.prepare(gamesQuery).all()
  const games = gamesResult.results as any[]

  // Fetch game status labels
  const labelsResult = await db.prepare('SELECT * FROM game_status_labels').all()
  const labels = labelsResult.results as any[]
  const labelsByGame: Record<number, any[]> = {}
  for (const label of labels) {
    if (!labelsByGame[label.game_id]) labelsByGame[label.game_id] = []
    labelsByGame[label.game_id].push(label)
  }

  // Flash sale products
  const flashResult = await db.prepare(`
    SELECT p.*, g.name as game_name, g.slug as game_slug, g.image as game_image
    FROM products p LEFT JOIN games g ON p.game_id = g.id
    WHERE p.is_flash_sale=1 AND p.is_active=1
    ORDER BY p.sort_order ASC LIMIT 8
  `).all()
  const flashProducts = flashResult.results as any[]

  // Build banners HTML
  const slidesHtml = banners.length > 0
    ? banners.map(b => `
      <div class="slide">
        <img src="${b.image}" alt="${b.title || 'Banner'}" loading="lazy">
        ${b.title ? `<div class="slide-overlay"><div class="slide-content"><h2>${b.title}</h2></div></div>` : ''}
      </div>`).join('')
    : `<div class="slide">
        <img src="https://placehold.co/1200x400/6366f1/white?text=Selamat+Datang+di+${encodeURIComponent(config.site_title)}" alt="Banner">
        <div class="slide-overlay"><div class="slide-content"><h2>Selamat Datang!</h2><p>${config.site_description}</p></div></div>
      </div>`

  // Build flash sale HTML
  const flashHtml = flashProducts.length > 0 ? `
    <section class="flash-sale-section">
      <div class="flash-header">
        <div class="flash-title"><i class="fas fa-bolt"></i> FLASH SALE</div>
        <div class="flash-timer" id="flashTimer">
          Berakhir dalam: 
          <div class="timer-block" id="timer-h">00</div>
          <span class="timer-sep">:</span>
          <div class="timer-block" id="timer-m">00</div>
          <span class="timer-sep">:</span>
          <div class="timer-block" id="timer-s">00</div>
        </div>
      </div>
      <div class="flash-products">
        ${flashProducts.map(p => `
          <a href="/game/${p.game_slug}" class="flash-product-card">
            <img src="${p.game_image}" alt="${p.game_name}" class="flash-product-img">
            <div class="flash-product-name">${p.game_name} - ${p.name}</div>
            ${p.original_price ? `<div class="flash-original-price">Rp ${p.original_price.toLocaleString('id-ID')}</div>` : ''}
            <div class="flash-product-price">Rp ${p.price.toLocaleString('id-ID')}</div>
          </a>`).join('')}
      </div>
    </section>` : ''

  // Build categories tabs
  const tabsHtml = `
    <button class="tab-btn ${categoryFilter === 'all' ? 'active' : ''}" data-category="all">
      <span class="tab-icon">🌟</span> Semua
    </button>
    ${categories.map(cat => `
      <button class="tab-btn ${categoryFilter === cat.slug ? 'active' : ''}" data-category="${cat.slug}">
        <span class="tab-icon">${cat.icon}</span> ${cat.name}
      </button>`).join('')}`

  // Build games grid
  const gamesGridHtml = games.length > 0
    ? games.map(game => {
      const gameLabels = labelsByGame[game.id] || []
      const isFlash = flashProducts.some(f => f.game_id === game.id)
      return `
      <a href="/game/${game.slug}" class="game-card" data-category="${game.category_slug}">
        ${isFlash ? '<span class="game-badge badge-flash">Flash</span>' : game.is_featured ? '<span class="game-badge badge-hot">Hot</span>' : ''}
        <img src="${game.image}" alt="${game.name}" class="game-card-img" loading="lazy">
        <div class="game-card-body">
          <div class="game-card-name">${game.name}</div>
          <div class="game-card-status">
            <span class="status-dot ${game.status === 'active' ? 'active' : 'inactive'}"></span>
            <span class="status-text ${game.status === 'active' ? 'active' : 'inactive'}">${game.status === 'active' ? 'Online' : 'Offline'}</span>
          </div>
        </div>
      </a>`
    }).join('')
    : `<div class="empty-state" style="grid-column:1/-1">
        <i class="fas fa-gamepad"></i>
        <h3>Belum ada game</h3>
        <p>Game belum ditambahkan</p>
      </div>`

  // Build game list table
  const tableRowsHtml = games.length > 0
    ? games.map(game => {
      const gameLabels = labelsByGame[game.id] || []
      return `
      <tr class="game-row" data-category="${game.category_slug}">
        <td>
          <div class="game-table-info">
            <img src="${game.image}" alt="${game.name}" class="game-table-img">
            <div>
              <div class="game-table-name">${game.name}</div>
              <div class="game-table-cat">${game.category_name || '-'}</div>
            </div>
          </div>
        </td>
        <td>
          <span class="status-badge ${game.status === 'active' ? 'active' : 'inactive'}">
            <i class="fas fa-circle" style="font-size:8px"></i>
            ${game.status === 'active' ? 'Online' : 'Offline'}
          </span>
        </td>
        <td>
          <div class="label-tags">
            ${gameLabels.map(l => `<span class="label-tag label-${l.color}">${l.label}</span>`).join('')}
          </div>
        </td>
        <td><a href="/game/${game.slug}" class="btn-topup"><i class="fas fa-bolt"></i> Top Up</a></td>
      </tr>`
    }).join('')
    : `<tr><td colspan="4" class="text-center"><div class="empty-state"><i class="fas fa-gamepad"></i><h3>Belum ada game</h3></div></td></tr>`

  const content = `
    <!-- Banner Slider -->
    <section class="hero-section">
      <div class="banner-slider">
        <div class="slider-track">${slidesHtml}</div>
        <button class="slider-btn slider-prev"><i class="fas fa-chevron-left"></i></button>
        <button class="slider-btn slider-next"><i class="fas fa-chevron-right"></i></button>
        <div class="slider-dots"></div>
      </div>
    </section>

    <!-- Main Content -->
    <div class="main-section">
      <div class="container">
        <!-- Search -->
        <div class="search-section">
          <div class="search-box">
            <input type="text" id="gameSearch" placeholder="Cari game, voucher, pulsa...">
            <i class="fas fa-search search-icon"></i>
          </div>
        </div>

        <!-- Category Tabs -->
        <div class="category-tabs">
          <div class="tabs-container">${tabsHtml}</div>
        </div>

        <!-- Flash Sale -->
        ${flashHtml}

        <!-- Featured Games -->
        <div class="section-header">
          <h2 class="section-title">Semua Produk</h2>
          <span class="text-muted" style="font-size:13px">${games.length} produk tersedia</span>
        </div>
        <div class="games-grid" id="gamesGrid">${gamesGridHtml}</div>

        <!-- Game List Table -->
        <div class="game-list-section">
          <div class="section-header">
            <h2 class="section-title">Daftar Game & Status</h2>
          </div>
          <div class="game-table-wrap">
            <table class="game-table">
              <thead>
                <tr>
                  <th>Nama Game</th>
                  <th>Status</th>
                  <th>Keterangan</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody id="gameTableBody">${tableRowsHtml}</tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  `

  return c.html(layout(content, config, undefined))
})

export default home
