import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import { cors } from 'hono/cors'
import type { Bindings } from '../lib/types'

const api = new Hono<{ Bindings: Bindings }>()

api.use('*', cors())

// Auth check for admin APIs
async function checkAdminAuth(c: any): Promise<boolean> {
  const session = getCookie(c, 'admin_session')
  if (!session) return false
  const admin = await c.env.DB.prepare('SELECT id FROM admins WHERE id = ?').bind(parseInt(session)).first()
  return !!admin
}

// ================================
// PUBLIC API
// ================================

// Theme toggle
api.post('/theme', async (c) => {
  const body = await c.req.json()
  const { theme } = body
  if (theme === 'dark' || theme === 'light') {
    await c.env.DB.prepare('UPDATE site_config SET config_value = ? WHERE config_key = ?')
      .bind(theme, 'theme').run()
  }
  return c.json({ success: true })
})

// Get games list (for search)
api.get('/games', async (c) => {
  const q = c.req.query('q') || ''
  const category = c.req.query('category') || ''

  let query = `SELECT g.id, g.name, g.slug, g.image, g.status, c.name as category_name, c.slug as category_slug
    FROM games g LEFT JOIN categories c ON g.category_id = c.id`

  const conditions = []
  if (q) conditions.push(`g.name LIKE '%${q.replace(/'/g, "''")}%'`)
  if (category && category !== 'all') conditions.push(`c.slug = '${category.replace(/'/g, "''")}'`)

  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ')
  query += ' ORDER BY g.sort_order ASC LIMIT 50'

  const games = await c.env.DB.prepare(query).all()
  return c.json({ games: games.results })
})

// ================================
// ADMIN API (protected)
// ================================

// Delete game
api.delete('/admin/games/:id', async (c) => {
  if (!await checkAdminAuth(c)) return c.json({ success: false, error: 'Unauthorized' }, 401)
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM games WHERE id = ?').bind(id).run()
  return c.json({ success: true })
})

// Delete product
api.delete('/admin/products/:id', async (c) => {
  if (!await checkAdminAuth(c)) return c.json({ success: false, error: 'Unauthorized' }, 401)
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM products WHERE id = ?').bind(id).run()
  return c.json({ success: true })
})

// Delete banner
api.delete('/admin/banners/:id', async (c) => {
  if (!await checkAdminAuth(c)) return c.json({ success: false, error: 'Unauthorized' }, 401)
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM banners WHERE id = ?').bind(id).run()
  return c.json({ success: true })
})

// Delete payment method
api.delete('/admin/payments/:id', async (c) => {
  if (!await checkAdminAuth(c)) return c.json({ success: false, error: 'Unauthorized' }, 401)
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM payment_methods WHERE id = ?').bind(id).run()
  return c.json({ success: true })
})

// Delete admin
api.delete('/admin/admins/:id', async (c) => {
  if (!await checkAdminAuth(c)) return c.json({ success: false, error: 'Unauthorized' }, 401)
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM admins WHERE id = ?').bind(id).run()
  return c.json({ success: true })
})

// Add game status label
api.post('/admin/labels', async (c) => {
  if (!await checkAdminAuth(c)) return c.json({ success: false, error: 'Unauthorized' }, 401)
  const body = await c.req.json()
  await c.env.DB.prepare('INSERT INTO game_status_labels (game_id, label, color) VALUES (?, ?, ?)')
    .bind(body.game_id, body.label, body.color || 'green').run()
  return c.json({ success: true })
})

// Delete game status label
api.delete('/admin/labels/:id', async (c) => {
  if (!await checkAdminAuth(c)) return c.json({ success: false, error: 'Unauthorized' }, 401)
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM game_status_labels WHERE id = ?').bind(id).run()
  return c.json({ success: true })
})

// Update contact
api.post('/admin/contacts', async (c) => {
  if (!await checkAdminAuth(c)) return c.json({ success: false, error: 'Unauthorized' }, 401)
  const body = await c.req.json()
  await c.env.DB.prepare('UPDATE contacts SET contact_value = ? WHERE contact_key = ?')
    .bind(body.value, body.key).run()
  return c.json({ success: true })
})

export default api
