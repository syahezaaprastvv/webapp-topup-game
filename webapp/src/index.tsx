import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'
import { getCookie } from 'hono/cookie'
import type { Bindings } from './lib/types'
import home from './routes/home'
import game from './routes/game'
import pages from './routes/pages'
import admin from './routes/admin'

const app = new Hono<{ Bindings: Bindings }>()

// Static files
app.use('/static/*', serveStatic({ root: './' }))

// Public routes
app.route('/', home)
app.route('/', game)
app.route('/', pages)

// Admin routes
app.route('/', admin)

// ---- API ROUTES ----

// Theme toggle
app.post('/api/theme', async (c) => {
  const { theme } = await c.req.json()
  if (theme === 'dark' || theme === 'light') {
    await c.env.DB.prepare(
      "UPDATE site_config SET config_value = ? WHERE config_key = 'theme'"
    ).bind(theme).run()
  }
  return c.json({ success: true })
})

// Search API
app.get('/api/search', async (c) => {
  const q = c.req.query('q') || ''
  const results = await c.env.DB.prepare(`
    SELECT g.id, g.name, g.slug, g.image, g.status, c.name as category_name
    FROM games g LEFT JOIN categories c ON g.category_id = c.id
    WHERE g.name LIKE ? ORDER BY g.sort_order ASC LIMIT 10
  `).bind(`%${q}%`).all()
  return c.json(results.results)
})

// Admin API - simple auth check
async function checkAdminAuth(c: any) {
  const token = getCookie(c, 'admin_token')
  if (!token) return false
  const session = await c.env.DB.prepare('SELECT id FROM admins WHERE id = ?').bind(token).first()
  return !!session
}

// Delete game
app.delete('/api/admin/games/:id', async (c) => {
  if (!(await checkAdminAuth(c))) return c.json({ success: false, error: 'Unauthorized' }, 401)
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM games WHERE id = ?').bind(id).run()
  return c.json({ success: true })
})

// Delete product
app.delete('/api/admin/products/:id', async (c) => {
  if (!(await checkAdminAuth(c))) return c.json({ success: false, error: 'Unauthorized' }, 401)
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM products WHERE id = ?').bind(id).run()
  return c.json({ success: true })
})

// Delete banner
app.delete('/api/admin/banners/:id', async (c) => {
  if (!(await checkAdminAuth(c))) return c.json({ success: false, error: 'Unauthorized' }, 401)
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM banners WHERE id = ?').bind(id).run()
  return c.json({ success: true })
})

// Delete payment method
app.delete('/api/admin/payment-methods/:id', async (c) => {
  if (!(await checkAdminAuth(c))) return c.json({ success: false, error: 'Unauthorized' }, 401)
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM payment_methods WHERE id = ?').bind(id).run()
  return c.json({ success: true })
})

// Delete label
app.delete('/api/admin/labels/:id', async (c) => {
  if (!(await checkAdminAuth(c))) return c.json({ success: false, error: 'Unauthorized' }, 401)
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM game_status_labels WHERE id = ?').bind(id).run()
  return c.json({ success: true })
})

// Delete admin user
app.delete('/api/admin/admins/:id', async (c) => {
  if (!(await checkAdminAuth(c))) return c.json({ success: false, error: 'Unauthorized' }, 401)
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM admins WHERE id = ?').bind(id).run()
  return c.json({ success: true })
})

export default app
