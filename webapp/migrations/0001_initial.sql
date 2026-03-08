-- Site Configuration
CREATE TABLE IF NOT EXISTS site_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  config_key TEXT UNIQUE NOT NULL,
  config_value TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Admin Users
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  email TEXT,
  role TEXT DEFAULT 'admin',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Games
CREATE TABLE IF NOT EXISTS games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category_id INTEGER,
  image TEXT,
  banner TEXT,
  description TEXT,
  status TEXT DEFAULT 'active',
  is_featured INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Game Status Labels
CREATE TABLE IF NOT EXISTS game_status_labels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id INTEGER NOT NULL,
  label TEXT NOT NULL,
  color TEXT DEFAULT 'green',
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

-- Products (Nominal Top Up)
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  original_price INTEGER,
  is_flash_sale INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

-- Payment Methods (Images)
CREATE TABLE IF NOT EXISTS payment_methods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  image TEXT,
  is_active INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0
);

-- Banners
CREATE TABLE IF NOT EXISTS banners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  image TEXT NOT NULL,
  link TEXT,
  is_active INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0
);

-- Contacts / Footer
CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_key TEXT UNIQUE NOT NULL,
  contact_value TEXT,
  label TEXT
);

-- Insert default site config
INSERT OR IGNORE INTO site_config (config_key, config_value) VALUES
  ('site_title', 'TopUp Store'),
  ('site_logo', ''),
  ('site_icon', ''),
  ('site_author', 'TopUp Store'),
  ('site_keywords', 'topup, game, voucher, pulsa'),
  ('site_description', 'Top Up Game Terpercaya, Murah dan Cepat'),
  ('whatsapp_number', '6281234567890'),
  ('theme', 'dark');

-- Insert default admin (password: admin123)
INSERT OR IGNORE INTO admins (username, password, email, role) VALUES
  ('admin', '$2a$10$rQnm8Y5DwJFEUGXKU8mVBe9FxQjxKQ3nz8YcFhLBxV5mL5YTwVEei', 'admin@example.com', 'superadmin');

-- Insert default categories
INSERT OR IGNORE INTO categories (name, slug, icon, sort_order) VALUES
  ('Top Up Game', 'topup-game', '🎮', 1),
  ('Voucher & Aplikasi', 'voucher-aplikasi', '🎁', 2),
  ('Pulsa & Paket Data', 'pulsa-data', '📱', 3);

-- Insert default contacts
INSERT OR IGNORE INTO contacts (contact_key, contact_value, label) VALUES
  ('whatsapp', '6281234567890', 'WhatsApp'),
  ('instagram', 'topupstore', 'Instagram'),
  ('facebook', 'topupstore', 'Facebook'),
  ('email', 'admin@topupstore.com', 'Email'),
  ('address', 'Indonesia', 'Alamat');

-- Sample Games
INSERT OR IGNORE INTO games (name, slug, category_id, image, description, status, is_featured, sort_order) VALUES
  ('Mobile Legends', 'mobile-legends', 1, 'https://placehold.co/200x200/6366f1/white?text=ML', 'Mobile Legends: Bang Bang adalah game MOBA populer di Asia Tenggara.', 'active', 1, 1),
  ('PUBG Mobile', 'pubg-mobile', 1, 'https://placehold.co/200x200/f59e0b/white?text=PUBG', 'PUBG Mobile adalah game battle royale yang sangat populer.', 'active', 1, 2),
  ('Free Fire', 'free-fire', 1, 'https://placehold.co/200x200/ef4444/white?text=FF', 'Garena Free Fire adalah game battle royale mobile.', 'active', 1, 3),
  ('Genshin Impact', 'genshin-impact', 1, 'https://placehold.co/200x200/8b5cf6/white?text=GI', 'Genshin Impact adalah game RPG open-world dari miHoYo.', 'active', 1, 4),
  ('Valorant', 'valorant', 1, 'https://placehold.co/200x200/f43f5e/white?text=VAL', 'Valorant adalah game FPS tactical dari Riot Games.', 'active', 0, 5),
  ('Honkai Star Rail', 'honkai-star-rail', 1, 'https://placehold.co/200x200/0ea5e9/white?text=HSR', 'Honkai: Star Rail adalah RPG turn-based dari HoYoverse.', 'active', 0, 6),
  ('Google Play', 'google-play', 2, 'https://placehold.co/200x200/22c55e/white?text=GP', 'Voucher Google Play untuk berbagai pembelian.', 'active', 1, 1),
  ('Spotify Premium', 'spotify-premium', 2, 'https://placehold.co/200x200/1db954/white?text=SP', 'Berlangganan Spotify Premium.', 'active', 0, 2),
  ('Telkomsel', 'telkomsel', 3, 'https://placehold.co/200x200/ef4444/white?text=TEL', 'Pulsa & Paket Data Telkomsel.', 'active', 1, 1),
  ('XL Axiata', 'xl-axiata', 3, 'https://placehold.co/200x200/3b82f6/white?text=XL', 'Pulsa & Paket Data XL.', 'active', 0, 2);

-- Sample Products for Mobile Legends
INSERT OR IGNORE INTO products (game_id, name, price, original_price, is_flash_sale, sort_order) VALUES
  (1, '86 Diamonds', 19000, NULL, 0, 1),
  (1, '172 Diamonds', 38000, NULL, 0, 2),
  (1, '257 Diamonds', 57000, NULL, 0, 3),
  (1, '344 Diamonds', 75000, 82000, 1, 4),
  (1, '429 Diamonds', 94000, NULL, 0, 5),
  (1, '514 Diamonds', 112000, NULL, 0, 6),
  (1, '706 Diamonds', 150000, 165000, 1, 7),
  (1, '2195 Diamonds', 450000, NULL, 0, 8);

-- Sample Products for PUBG Mobile
INSERT OR IGNORE INTO products (game_id, name, price, original_price, is_flash_sale, sort_order) VALUES
  (2, '60 UC', 14000, NULL, 0, 1),
  (2, '150 UC', 30000, NULL, 0, 2),
  (2, '300 UC', 57000, NULL, 0, 3),
  (2, '600 UC', 107000, 120000, 1, 4),
  (2, '1500 UC', 260000, NULL, 0, 5),
  (2, '3000 UC', 510000, NULL, 0, 6);

-- Sample Products for Free Fire
INSERT OR IGNORE INTO products (game_id, name, price, original_price, is_flash_sale, sort_order) VALUES
  (3, '70 Diamonds', 14000, NULL, 0, 1),
  (3, '140 Diamonds', 28000, NULL, 0, 2),
  (3, '355 Diamonds', 65000, 75000, 1, 3),
  (3, '720 Diamonds', 130000, NULL, 0, 4),
  (3, '1450 Diamonds', 260000, NULL, 0, 5);

-- Sample Payment Methods
INSERT OR IGNORE INTO payment_methods (name, image, sort_order) VALUES
  ('Dana', 'https://placehold.co/120x50/1677ff/white?text=DANA', 1),
  ('OVO', 'https://placehold.co/120x50/4c10c1/white?text=OVO', 2),
  ('GoPay', 'https://placehold.co/120x50/00aed6/white?text=GOPAY', 3),
  ('Transfer BCA', 'https://placehold.co/120x50/0066ae/white?text=BCA', 4),
  ('Transfer BRI', 'https://placehold.co/120x50/0056a8/white?text=BRI', 5),
  ('Transfer Mandiri', 'https://placehold.co/120x50/003087/white?text=MANDIRI', 6),
  ('Alfamart', 'https://placehold.co/120x50/ef4444/white?text=ALFA', 7),
  ('Indomaret', 'https://placehold.co/120x50/ef4444/white?text=INDO', 8);

-- Sample Banners
INSERT OR IGNORE INTO banners (title, image, is_active, sort_order) VALUES
  ('Flash Sale Mobile Legends', 'https://placehold.co/1200x400/6366f1/white?text=FLASH+SALE+ML+50%25+OFF', 1, 1),
  ('Top Up PUBG Promo', 'https://placehold.co/1200x400/f59e0b/white?text=TOP+UP+PUBG+PROMO', 1, 2),
  ('Voucher Google Play Murah', 'https://placehold.co/1200x400/22c55e/white?text=GOOGLE+PLAY+MURAH', 1, 3);

-- Sample Game Status Labels
INSERT OR IGNORE INTO game_status_labels (game_id, label, color) VALUES
  (1, 'Proses Cepat', 'green'),
  (1, 'Terpercaya', 'blue'),
  (2, 'Proses Cepat', 'green'),
  (3, 'Flash Sale', 'red');
