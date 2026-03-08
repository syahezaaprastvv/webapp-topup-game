import { Hono } from 'hono'
import { layout, getSiteConfig } from '../lib/layout'
import type { Bindings } from '../lib/types'

const game = new Hono<{ Bindings: Bindings }>()

game.get('/game/:slug', async (c) => {
  const db = c.env.DB
  const slug = c.req.param('slug')
  const config = await getSiteConfig(db)

  // Fetch game details
  const gameResult = await db.prepare(`
    SELECT g.*, c.name as category_name, c.slug as category_slug
    FROM games g LEFT JOIN categories c ON g.category_id = c.id
    WHERE g.slug = ?
  `).bind(slug).first() as any

  if (!gameResult) {
    return c.html(layout(
      `<div class="container" style="padding-top:100px;padding-bottom:60px;text-align:center">
        <div class="empty-state">
          <i class="fas fa-gamepad"></i>
          <h3>Game tidak ditemukan</h3>
          <p>Game yang Anda cari tidak tersedia</p>
          <a href="/" class="btn btn-primary" style="margin-top:16px">Kembali ke Beranda</a>
        </div>
      </div>`, config, 'Game Tidak Ditemukan'), 404)
  }

  // Fetch products
  const productsResult = await db.prepare(`
    SELECT * FROM products WHERE game_id = ? AND is_active = 1 ORDER BY sort_order ASC, price ASC
  `).bind(gameResult.id).all()
  const products = productsResult.results as any[]

  // Fetch status labels
  const labelsResult = await db.prepare(`
    SELECT * FROM game_status_labels WHERE game_id = ?
  `).bind(gameResult.id).all()
  const labels = labelsResult.results as any[]

  // Fetch payment methods
  const pmResult = await db.prepare(`
    SELECT * FROM payment_methods WHERE is_active = 1 ORDER BY sort_order ASC
  `).all()
  const paymentMethods = pmResult.results as any[]

  // Products HTML
  const productsHtml = products.length > 0
    ? products.map(p => `
      <div class="product-card" data-product-id="${p.id}"
        onclick="selectProduct(${p.id}, '${p.name.replace(/'/g, "\\'")}', ${p.price}, ${p.original_price || 'null'})">
        ${p.is_flash_sale ? '<div class="product-flash-badge">FLASH SALE</div>' : ''}
        <div class="product-name" style="${p.is_flash_sale ? 'margin-top:14px' : ''}">${p.name}</div>
        ${p.original_price ? `<div class="product-original-price">Rp ${p.original_price.toLocaleString('id-ID')}</div>` : ''}
        <div class="product-price">Rp ${p.price.toLocaleString('id-ID')}</div>
      </div>`).join('')
    : `<div class="empty-state" style="grid-column:1/-1">
        <i class="fas fa-box-open"></i>
        <h3>Produk tidak tersedia</h3>
        <p>Produk belum ditambahkan</p>
      </div>`

  // Payment Methods HTML
  const paymentHtml = paymentMethods.length > 0
    ? paymentMethods.map((pm, i) => `
      <div class="payment-method-item">
        <input type="radio" name="payment_method" id="pm_${pm.id}" value="${pm.name}" ${i === 0 ? 'checked' : ''}>
        <label for="pm_${pm.id}" class="payment-method-label">
          ${pm.image ? `<img src="${pm.image}" alt="${pm.name}" class="payment-method-img">` : ''}
          <span class="payment-method-name">${pm.name}</span>
        </label>
      </div>`).join('')
    : `<p class="text-muted" style="font-size:13px">Belum ada metode pembayaran</p>`

  // Labels HTML
  const labelsHtml = labels.map(l =>
    `<span class="label-tag label-${l.color}">${l.label}</span>`
  ).join('')

  // Server field - show only for certain games
  const hasServer = ['mobile-legends', 'genshin-impact', 'honkai-star-rail'].includes(slug)

  const bannerImg = gameResult.banner || gameResult.image

  const content = `
    <div class="detail-page">
      <div class="container">
        <!-- Breadcrumb -->
        <div class="breadcrumb">
          <a href="/">Beranda</a>
          <i class="fas fa-chevron-right"></i>
          <a href="/?category=${gameResult.category_slug}">${gameResult.category_name || 'Game'}</a>
          <i class="fas fa-chevron-right"></i>
          <span>${gameResult.name}</span>
        </div>

        <div class="detail-layout">
          <!-- Left: Game Info + Products -->
          <div>
            <!-- Game Info Card -->
            <div class="game-info-card">
              <img src="${bannerImg}" alt="${gameResult.name}" class="game-banner-img">
              <div class="game-info-body">
                <div class="game-info-header">
                  <img src="${gameResult.image}" alt="${gameResult.name}" class="game-detail-img">
                  <div>
                    <div class="game-detail-name">${gameResult.name}</div>
                    <div class="game-detail-status">
                      <span class="status-badge ${gameResult.status === 'active' ? 'active' : 'inactive'}">
                        <i class="fas fa-circle" style="font-size:8px"></i>
                        ${gameResult.status === 'active' ? 'Online' : 'Offline / Maintenance'}
                      </span>
                    </div>
                  </div>
                </div>
                ${gameResult.description ? `<p class="game-detail-desc">${gameResult.description}</p>` : ''}
                ${labelsHtml ? `<div class="game-detail-labels">${labelsHtml}</div>` : ''}
              </div>
            </div>

            <!-- Products Section -->
            <div class="products-section">
              <div class="section-header" style="margin-top:24px">
                <h3 class="section-title">Pilih Nominal</h3>
              </div>
              <div class="products-grid">${productsHtml}</div>
            </div>
          </div>

          <!-- Right: Purchase Form -->
          <div>
            <div class="purchase-form-card">
              <div class="form-title"><i class="fas fa-shopping-cart"></i> Form Pembelian</div>

              <!-- Hidden fields -->
              <input type="hidden" id="gameName" value="${gameResult.name}">
              <input type="hidden" id="waNumber" value="${config.whatsapp_number}">

              <!-- Nickname -->
              <div class="form-group">
                <label class="form-label">Nickname <span class="required">*</span></label>
                <input type="text" id="inputNickname" class="form-control" placeholder="Masukkan nickname Anda">
              </div>

              <!-- Player ID -->
              <div class="form-group">
                <label class="form-label">ID Game <span class="required">*</span></label>
                <input type="text" id="inputGameId" class="form-control" placeholder="Masukkan ID Game Anda">
              </div>

              <!-- Server (optional) -->
              ${hasServer ? `
              <div class="form-group">
                <label class="form-label">Server <span class="optional">(Opsional)</span></label>
                <input type="text" id="inputServer" class="form-control" placeholder="Contoh: ID, SEA, NA...">
              </div>` : '<input type="hidden" id="inputServer" value="">'}

              <!-- Voucher Code (optional) -->
              <div class="form-group">
                <label class="form-label">Kode Voucher <span class="optional">(Opsional)</span></label>
                <input type="text" id="inputVoucher" class="form-control" placeholder="Masukkan kode voucher jika ada">
              </div>

              <!-- Payment Methods -->
              <div class="form-group">
                <label class="form-label">Metode Pembayaran <span class="required">*</span></label>
                <div class="payment-methods-grid">${paymentHtml}</div>
              </div>

              <!-- Order Summary -->
              <div class="order-summary" id="orderSummary" style="display:none">
                <div class="order-summary-title">Ringkasan Pesanan</div>
                <div class="order-row">
                  <span class="text-muted">Produk</span>
                  <span id="summaryProduct" class="fw-semibold">-</span>
                </div>
                <div class="order-row">
                  <span class="text-muted">Harga</span>
                  <span id="summaryPrice" class="price-tag">-</span>
                </div>
                <div class="order-row total">
                  <span>Total</span>
                  <span id="summaryTotal" class="order-total-price">-</span>
                </div>
              </div>

              <!-- Buy Button -->
              <button class="btn-buy" onclick="buyNow()">
                <i class="fab fa-whatsapp"></i>
                Beli Sekarang via WhatsApp
              </button>

              <p style="font-size:12px;color:var(--text-faint);text-align:center;margin-top:12px">
                <i class="fas fa-shield-alt" style="color:var(--success)"></i>
                Transaksi aman & terpercaya
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- WA Float -->
    <a href="https://wa.me/${config.whatsapp_number}" target="_blank" class="wa-float">
      <i class="fab fa-whatsapp"></i>
    </a>
  `

  return c.html(layout(content, config, `Top Up ${gameResult.name}`))
})

export default game
