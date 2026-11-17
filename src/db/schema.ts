import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

// 1. Categories
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description').default(''),
  imageUrl: text('image_url').default(''),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 2. Products
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  sku: text('sku').notNull().unique(),
  categoryId: integer('category_id')
    .references(() => categories.id, { onDelete: 'set null' }),
  price: integer('price').notNull().default(0),
  discountPrice: integer('discount_price'),
  resellerPrice: integer('reseller_price'),
  shortDescription: text('short_description').notNull().default(''),
  description: text('description').notNull().default(''),
  benefits: text('benefits').notNull().default(''),
  howToUse: text('how_to_use').notNull().default(''),
  ingredients: text('ingredients').notNull().default(''),
  sizeVariant: text('size_variant').notNull().default('30 ml'),
  stock: integer('stock').notNull().default(0),
  status: text('status').notNull().default('active'), // 'active' | 'draft' | 'archived'
  isBestSeller: boolean('is_best_seller').notNull().default(false),
  isNewArrival: boolean('is_new_arrival').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  whatsappMessage: text('whatsapp_message').default(''),
  tiktokUrl: text('tiktok_url').default(''),
  shopeeUrl: text('shopee_url').default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 3. Product Images
export const productImages = pgTable('product_images', {
  id: serial('id').primaryKey(),
  productId: integer('product_id')
    .references(() => products.id, { onDelete: 'cascade' })
    .notNull(),
  imageUrl: text('image_url').notNull(),
  altText: text('alt_text').default(''),
  sortOrder: integer('sort_order').notNull().default(0),
  isPrimary: boolean('is_primary').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 4. Banners (Hero & Promo)
export const banners = pgTable('banners', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  subtitle: text('subtitle').default(''),
  badgeText: text('badge_text').default(''),
  ctaText: text('cta_text').default('SHOP NOW'),
  ctaLink: text('cta_link').default('#catalog'),
  imageUrl: text('image_url').default(''),
  placement: text('placement').notNull().default('hero'), // 'hero' | 'promo'
  countdownEndAt: timestamp('countdown_end_at'),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 5. Testimonials
export const testimonials = pgTable('testimonials', {
  id: serial('id').primaryKey(),
  customerName: text('customer_name').notNull(),
  customerRole: text('customer_role').default('Verified Customer'),
  avatarUrl: text('avatar_url').default(''),
  rating: integer('rating').notNull().default(5),
  review: text('review').notNull(),
  productName: text('product_name').default(''),
  isPublished: boolean('is_published').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 6. Store Settings
export const storeSettings = pgTable('store_settings', {
  id: serial('id').primaryKey(),
  storeName: text('store_name').notNull().default('BELMA BEAUTY'),
  tagline: text('tagline').notNull().default('Reveal Your Natural Beauty'),
  logoUrl: text('logo_url').default(''),
  faviconUrl: text('favicon_url').default(''),
  whatsappNumber: text('whatsapp_number').notNull().default('6281234567890'),
  whatsappDefaultMessage: text('whatsapp_default_message')
    .notNull()
    .default('Halo Belma Beauty, saya ingin membeli [NAMA PRODUK] dengan harga [HARGA]. Apakah produk masih tersedia?'),
  instagramUrl: text('instagram_url').default('https://instagram.com/belmabeauty.official'),
  tiktokUrl: text('tiktok_url').default('https://www.tiktok.com/@belmabeauty.official'),
  shopeeStoreUrl: text('shopee_store_url').default('https://shopee.co.id/belmabeauty.official'),
  email: text('email').default('concierge@belmabeauty.com'),
  storeAddress: text('store_address').default('Jl. Senopati No. 88, Kebayoran Baru, Jakarta Selatan 12190'),
  seoTitle: text('seo_title').default('BELMA BEAUTY — Luxury Botanical Skincare & Beauty Essentials'),
  seoDescription: text('seo_description').default('Reveal your natural beauty with Belma Beauty. Discover clinical-grade botanical skincare, serums, moisturizers, and daily beauty essentials.'),
  heroBannerUrl: text('hero_banner_url').default(''),
  resellerDefaultDiscountPct: integer('reseller_default_discount_pct').notNull().default(0),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 7. Admin Users
export const adminUsers = pgTable('admin_users', {
  id: serial('id').primaryKey(),
  uid: text('uid').unique(),
  email: text('email').notNull().unique(),
  name: text('name').notNull().default('Belma Administrator'),
  passwordHash: text('password_hash'),
  role: text('role').notNull().default('administrator'),
  isActive: boolean('is_active').notNull().default(true),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 8. CMS Pages (About Us, Contact, Ritual Guide, etc.)
export const pages = pgTable('pages', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  subtitle: text('subtitle').default(''),
  content: text('content').notNull().default(''),
  imageUrl: text('image_url').default(''),
  isPublished: boolean('is_published').notNull().default(true),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 9. Customer Inquiries / Order Leads
export const inquiries = pgTable('inquiries', {
  id: serial('id').primaryKey(),
  customerName: text('customer_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').default(''),
  subject: text('subject').notNull().default('Product Consultation'),
  message: text('message').notNull(),
  productName: text('product_name').default(''),
  status: text('status').notNull().default('new'), // 'new' | 'replied' | 'closed'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 10. Persistent Uploaded Media Assets
export const mediaAssets = pgTable('media_assets', {
  id: serial('id').primaryKey(),
  filename: text('filename').notNull(),
  mimeType: text('mime_type').notNull(),
  sizeBytes: integer('size_bytes').notNull().default(0),
  base64Data: text('base64_data').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 11. Reseller Accounts (Registered exclusively by Admin)
export const resellers = pgTable('resellers', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  phone: text('phone').default(''),
  city: text('city').default(''),
  tierCode: text('tier_code').notNull().default('RESELLER'),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('reseller'),
  isActive: boolean('is_active').notNull().default(true),
  notes: text('notes').default(''),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 12. Customer Accounts (Role Pelanggan — simple registration: Nama, Alamat, No WhatsApp, Email)
export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  address: text('address').notNull(),
  whatsappNumber: text('whatsapp_number').notNull(),
  email: text('email').notNull().unique(),
  role: text('role').notNull().default('pelanggan'),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 13. Customer Orders & Manual Tracking Resi (Orders via WhatsApp, resi input manually in Admin)
export const customerOrders = pgTable('customer_orders', {
  id: serial('id').primaryKey(),
  orderNumber: text('order_number').notNull().unique(),
  customerId: integer('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  customerName: text('customer_name').notNull(),
  customerWhatsapp: text('customer_whatsapp').notNull(),
  customerEmail: text('customer_email').default(''),
  shippingAddress: text('shipping_address').notNull().default(''),
  productSummary: text('product_summary').notNull(),
  totalAmount: integer('total_amount').notNull().default(0),
  orderChannel: text('order_channel').notNull().default('whatsapp'), // 'whatsapp' | 'tiktok' | 'shopee'
  status: text('status').notNull().default('diproses'), // 'menunggu' | 'diproses' | 'dikirim' | 'selesai'
  courier: text('courier').default(''), // 'jne' | 'jnt' | 'sicepat' | 'anteraja' | 'pos' | 'tiki' | 'wahana' | 'ninja' | 'spx'
  trackingNumber: text('tracking_number').default(''),
  trackingNote: text('tracking_note').default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  images: many(productImages),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));
