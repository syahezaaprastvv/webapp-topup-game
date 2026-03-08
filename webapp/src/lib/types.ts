export type Bindings = {
  DB: D1Database;
}

export type SiteConfig = {
  site_title: string;
  site_logo: string;
  site_icon: string;
  site_author: string;
  site_keywords: string;
  site_description: string;
  whatsapp_number: string;
  theme: string;
}

export type Game = {
  id: number;
  name: string;
  slug: string;
  category_id: number;
  category_name?: string;
  image: string;
  banner: string;
  description: string;
  status: string;
  is_featured: number;
  sort_order: number;
  created_at: string;
}

export type Product = {
  id: number;
  game_id: number;
  name: string;
  price: number;
  original_price: number | null;
  is_flash_sale: number;
  is_active: number;
  sort_order: number;
}

export type Category = {
  id: number;
  name: string;
  slug: string;
  icon: string;
  sort_order: number;
  is_active: number;
}

export type PaymentMethod = {
  id: number;
  name: string;
  image: string;
  is_active: number;
  sort_order: number;
}

export type Banner = {
  id: number;
  title: string;
  image: string;
  link: string;
  is_active: number;
  sort_order: number;
}

export type Contact = {
  id: number;
  contact_key: string;
  contact_value: string;
  label: string;
}

export type GameStatusLabel = {
  id: number;
  game_id: number;
  label: string;
  color: string;
}

export type Admin = {
  id: number;
  username: string;
  password: string;
  email: string;
  role: string;
  created_at: string;
}
