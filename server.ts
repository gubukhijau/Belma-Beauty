import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { asc, desc, eq, inArray } from 'drizzle-orm';
import { db } from './src/db/index.ts';
import {
  adminUsers,
  banners,
  categories,
  inquiries,
  mediaAssets,
  pages,
  productImages,
  products,
  resellers,
  storeSettings,
  testimonials,
} from './src/db/schema.ts';
import { ensureSeeded } from './src/db/seed.ts';
import {
  createResellerSessionToken,
  createSessionToken,
  hashPassword,
  requireAdmin,
  requireResellerAuth,
  resolveAdminFromRequest,
  resolveResellerFromRequest,
  verifyPassword,
  type AuthRequest,
} from './src/lib/auth.ts';
import { adminAuth } from './src/lib/firebase-admin.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', 1);

const PORT =
  process.env.NGINX_PORT && process.env.PORT === process.env.NGINX_PORT
    ? Number(process.env.DEFAULT_APP_PORT) || 3000
    : process.env.NODE_ENV !== 'production'
      ? Number(process.env.DEFAULT_APP_PORT) || 3000
      : Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '15mb' }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file gambar (JPG, PNG, WEBP, SVG) yang diperbolehkan.'));
    }
  },
});

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

async function attachProductsMeta(productRows: (typeof products.$inferSelect)[]) {
  if (productRows.length === 0) return [];
  const productIds = productRows.map((p) => p.id);
  const [imageRows, catRows] = await Promise.all([
    db
      .select()
      .from(productImages)
      .where(inArray(productImages.productId, productIds))
      .orderBy(desc(productImages.isPrimary), asc(productImages.sortOrder), asc(productImages.id)),
    db.select().from(categories),
  ]);

  const catMap = new Map(catRows.map((c) => [c.id, c]));
  const imgMap = new Map<number, (typeof productImages.$inferSelect)[]>();
  for (const img of imageRows) {
    const list = imgMap.get(img.productId) || [];
    list.push(img);
    imgMap.set(img.productId, list);
  }

  return productRows.map((p) => {
    const cat = p.categoryId ? catMap.get(p.categoryId) : null;
    return {
      ...p,
      categoryName: cat?.name ?? 'Uncategorized',
      categorySlug: cat?.slug ?? 'uncategorized',
      images: imgMap.get(p.id) || [],
    };
  });
}

// Lazy seed middleware for API endpoints
app.use('/api', async (req, res, next) => {
  if (req.path.startsWith('/media/')) {
    return next();
  }
  try {
    await ensureSeeded();
    next();
  } catch (error) {
    console.error('Database initialization error:', error);
    res.status(503).json({ error: 'Layanan database sedang disiapkan, silakan coba sesaat lagi.' });
  }
});

// ============================================================================
// PUBLIC MEDIA SERVING
// ============================================================================
app.get('/api/media/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid media ID' });
    }
    const rows = await db.select().from(mediaAssets).where(eq(mediaAssets.id, id)).limit(1);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Media not found' });
    }
    const asset = rows[0];
    const buffer = Buffer.from(asset.base64Data, 'base64');
    res.setHeader('Content-Type', asset.mimeType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(buffer);
  } catch (error) {
    console.error('Failed to serve media:', error);
    res.status(500).json({ error: 'Failed to serve media' });
  }
});

// ============================================================================
// PUBLIC STOREFRONT ENDPOINTS (RLS-equivalent filtering: active/published only)
// ============================================================================
app.get('/api/storefront', async (_req, res) => {
  try {
    const [settingsRows, categoryRows, productRows, bannerRows, testimonialRows, pageRows] =
      await Promise.all([
        db.select().from(storeSettings).limit(1),
        db
          .select()
          .from(categories)
          .where(eq(categories.isActive, true))
          .orderBy(asc(categories.sortOrder), asc(categories.id)),
        db
          .select()
          .from(products)
          .where(eq(products.status, 'active'))
          .orderBy(asc(products.sortOrder), desc(products.id)),
        db
          .select()
          .from(banners)
          .where(eq(banners.isActive, true))
          .orderBy(asc(banners.sortOrder), asc(banners.id)),
        db
          .select()
          .from(testimonials)
          .where(eq(testimonials.isPublished, true))
          .orderBy(asc(testimonials.sortOrder), desc(testimonials.id)),
        db.select().from(pages).where(eq(pages.isPublished, true)).orderBy(asc(pages.id)),
      ]);

    const enrichedProducts = (await attachProductsMeta(productRows)).map(
      ({ resellerPrice: _hiddenResellerPrice, ...publicProd }) => publicProd
    );

    const publicSettings = settingsRows[0]
      ? (() => {
          const { resellerDefaultDiscountPct: _hiddenPct, ...rest } = settingsRows[0];
          return rest;
        })()
      : null;

    res.json({
      settings: publicSettings,
      categories: categoryRows,
      products: enrichedProducts,
      banners: bannerRows,
      testimonials: testimonialRows,
      pages: pageRows,
    });
  } catch (error) {
    console.error('Storefront load failed:', error);
    res.status(500).json({ error: 'Gagal memuat data toko.' });
  }
});

app.get('/api/products/:slug', async (req, res) => {
  try {
    const slug = req.params.slug;
    const rows = await db
      .select()
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1);

    if (rows.length === 0 || rows[0].status !== 'active') {
      return res.status(404).json({ error: 'Produk tidak ditemukan.' });
    }

    const [enrichedProduct] = await attachProductsMeta(rows);
    const { resellerPrice: _hiddenPrice, ...product } = enrichedProduct;
    const allActive = await db
      .select()
      .from(products)
      .where(eq(products.status, 'active'))
      .orderBy(asc(products.sortOrder), desc(products.id));

    const relatedRaw = allActive
      .filter((p) => p.id !== product.id)
      .sort((a, b) => {
        const aSameCat = a.categoryId === product.categoryId ? 0 : 1;
        const bSameCat = b.categoryId === product.categoryId ? 0 : 1;
        return aSameCat - bSameCat;
      })
      .slice(0, 4);

    const related = (await attachProductsMeta(relatedRaw)).map(
      ({ resellerPrice: _hiddenRelPrice, ...pubRel }) => pubRel
    );
    res.json({ product, related });
  } catch (error) {
    console.error('Product detail load failed:', error);
    res.status(500).json({ error: 'Gagal memuat detail produk.' });
  }
});

app.post('/api/inquiries', async (req, res) => {
  try {
    const { customerName, email, phone, subject, message, productName } = req.body || {};
    if (!customerName || !email || !message) {
      return res.status(400).json({ error: 'Nama, email, dan pesan wajib diisi.' });
    }
    const [created] = await db
      .insert(inquiries)
      .values({
        customerName: String(customerName).trim(),
        email: String(email).trim(),
        phone: phone ? String(phone).trim() : '',
        subject: subject ? String(subject).trim() : 'Konsultasi Produk',
        message: String(message).trim(),
        productName: productName ? String(productName).trim() : '',
        status: 'new',
      })
      .returning();

    res.status(201).json({ inquiry: created });
  } catch (error) {
    console.error('Inquiry submission failed:', error);
    res.status(500).json({ error: 'Gagal mengirim pesan. Silakan coba lagi.' });
  }
});

// ============================================================================
// AUTHENTICATION ENDPOINTS
// ============================================================================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan kata sandi wajib diisi.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const rows = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, normalizedEmail))
      .limit(1);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Email atau kata sandi salah.' });
    }

    const admin = rows[0];
    if (!admin.isActive || admin.role !== 'administrator') {
      return res.status(403).json({ error: 'Akun ini tidak memiliki akses administrator.' });
    }

    if (!admin.passwordHash || !verifyPassword(String(password), admin.passwordHash)) {
      return res.status(401).json({ error: 'Email atau kata sandi salah.' });
    }

    await db
      .update(adminUsers)
      .set({ lastLoginAt: new Date() })
      .where(eq(adminUsers.id, admin.id));

    const payload = {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      uid: admin.uid,
    };
    const token = createSessionToken(payload);

    res.cookie('belma_admin_session', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: req.secure || process.env.VERCEL === '1',
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    res.json({ token, user: payload });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan saat proses login.' });
  }
});

app.post('/api/auth/firebase', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const idToken =
      authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7).trim()
        : req.body?.idToken;

    if (!idToken) {
      return res.status(400).json({ error: 'Token Firebase tidak ditemukan.' });
    }

    const decoded = await adminAuth.verifyIdToken(idToken);
    const email = decoded.email?.toLowerCase();
    if (!email) {
      return res.status(403).json({ error: 'Akun Google tidak memiliki alamat email.' });
    }

    const rows = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, email))
      .limit(1);

    if (rows.length === 0) {
      return res.status(403).json({
        error: `Email ${email} belum terdaftar sebagai administrator Belma Beauty.`,
      });
    }

    const admin = rows[0];
    if (!admin.isActive || admin.role !== 'administrator') {
      return res.status(403).json({ error: 'Akun ini tidak aktif sebagai administrator.' });
    }

    await db
      .update(adminUsers)
      .set({
        uid: decoded.uid,
        name: admin.name || decoded.name || 'Administrator',
        lastLoginAt: new Date(),
      })
      .where(eq(adminUsers.id, admin.id));

    const payload = {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      uid: decoded.uid,
    };
    const token = createSessionToken(payload);

    res.cookie('belma_admin_session', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: req.secure || process.env.VERCEL === '1',
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    res.json({ token, user: payload });
  } catch (error) {
    console.error('Firebase auth verification failed:', error);
    res.status(401).json({ error: 'Verifikasi akun Google gagal.' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const admin = await resolveAdminFromRequest(req);
    if (!admin) {
      return res.status(401).json({ error: 'Belum terautentikasi.' });
    }
    res.json({ user: admin });
  } catch {
    res.status(401).json({ error: 'Sesi tidak valid.' });
  }
});

app.post('/api/auth/logout', (_req, res) => {
  res.clearCookie('belma_admin_session', { path: '/' });
  res.json({ ok: true });
});

// ============================================================================
// RESELLER PORTAL AUTH & CATALOG ENDPOINTS (Admin-registered only, no self-signup)
// ============================================================================
app.post('/api/reseller/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan kata sandi wajib diisi.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const rows = await db
      .select()
      .from(resellers)
      .where(eq(resellers.email, normalizedEmail))
      .limit(1);

    if (rows.length === 0) {
      return res.status(401).json({
        error: 'Akun reseller tidak ditemukan. Hubungi admin Belma Beauty untuk pendaftaran.',
      });
    }

    const account = rows[0];
    if (!account.passwordHash || !verifyPassword(String(password), account.passwordHash)) {
      return res.status(401).json({ error: 'Email atau kata sandi salah.' });
    }

    await db
      .update(resellers)
      .set({ lastLoginAt: new Date() })
      .where(eq(resellers.id, account.id));

    const payload = {
      id: account.id,
      email: account.email,
      name: account.name,
      phone: account.phone || '',
      city: account.city || '',
      tierCode: account.tierCode || 'RESELLER',
      role: account.role || 'reseller',
      isActive: Boolean(account.isActive),
      createdAt: account.createdAt.toISOString(),
    };

    const token = createResellerSessionToken(account.id, account.email);
    res.cookie('belma_reseller_session', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: req.secure || process.env.VERCEL === '1',
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    res.json({ token, reseller: payload });
  } catch (error) {
    console.error('Reseller login error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan saat login reseller.' });
  }
});

app.get('/api/reseller/me', async (req, res) => {
  try {
    const reseller = await resolveResellerFromRequest(req);
    if (!reseller) {
      return res.status(401).json({ error: 'Belum login sebagai reseller.' });
    }
    res.json({ reseller });
  } catch {
    res.status(401).json({ error: 'Sesi reseller tidak valid.' });
  }
});

app.post('/api/reseller/logout', (_req, res) => {
  res.clearCookie('belma_reseller_session', { path: '/' });
  res.json({ ok: true });
});

app.get('/api/reseller/products', requireResellerAuth, async (req: AuthRequest, res) => {
  try {
    const reseller = req.resellerUser!;
    const isActiveReseller = reseller.role === 'reseller' && reseller.isActive === true;

    const [settingsRows, categoryRows, productRows] = await Promise.all([
      db.select().from(storeSettings).limit(1),
      db
        .select()
        .from(categories)
        .where(eq(categories.isActive, true))
        .orderBy(asc(categories.sortOrder), asc(categories.id)),
      db
        .select()
        .from(products)
        .where(eq(products.status, 'active'))
        .orderBy(asc(products.sortOrder), desc(products.id)),
    ]);

    const currentSettings = settingsRows[0] || null;
    const defaultDiscountPct = currentSettings?.resellerDefaultDiscountPct || 0;
    const enriched = await attachProductsMeta(productRows);

    const resolvedProducts = enriched.map((prod) => {
      if (!isActiveReseller) {
        // Non-active reseller falls back strictly to normal store pricing
        return {
          ...prod,
          resellerPrice: null,
        };
      }

      let effectiveResellerPrice: number | null = prod.resellerPrice ?? null;
      if (effectiveResellerPrice === null || effectiveResellerPrice <= 0) {
        if (defaultDiscountPct > 0) {
          effectiveResellerPrice = Math.round(prod.price * (1 - defaultDiscountPct / 100));
        } else {
          effectiveResellerPrice =
            prod.discountPrice && prod.discountPrice > 0 && prod.discountPrice < prod.price
              ? prod.discountPrice
              : prod.price;
        }
      }

      return {
        ...prod,
        resellerPrice: effectiveResellerPrice,
      };
    });

    res.json({
      reseller,
      isActiveReseller,
      settings: currentSettings,
      categories: categoryRows,
      products: resolvedProducts,
    });
  } catch (error) {
    console.error('Reseller products load failed:', error);
    res.status(500).json({ error: 'Gagal memuat katalog produk reseller.' });
  }
});

// ============================================================================
// PROTECTED ADMIN CMS ENDPOINTS
// ============================================================================

// Image upload endpoint (stores in PostgreSQL media_assets)
app.post('/api/admin/upload', requireAdmin, upload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File gambar wajib dipilih.' });
    }
    const base64Data = req.file.buffer.toString('base64');
    const [inserted] = await db
      .insert(mediaAssets)
      .values({
        filename: req.file.originalname || 'image.jpg',
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
        base64Data,
      })
      .returning({
        id: mediaAssets.id,
        filename: mediaAssets.filename,
        mimeType: mediaAssets.mimeType,
        sizeBytes: mediaAssets.sizeBytes,
      });

    res.status(201).json({
      id: inserted.id,
      url: `/api/media/${inserted.id}`,
      filename: inserted.filename,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Gagal mengunggah gambar.' });
  }
});

// Dashboard overview
app.get('/api/admin/overview', requireAdmin, async (_req, res) => {
  try {
    const [allProducts, allCategories, allInquiries] = await Promise.all([
      db.select().from(products).orderBy(desc(products.createdAt)),
      db.select().from(categories),
      db.select().from(inquiries).orderBy(desc(inquiries.createdAt)),
    ]);

    const enrichedRecent = await attachProductsMeta(allProducts.slice(0, 5));

    res.json({
      totalProducts: allProducts.length,
      totalCategories: allCategories.length,
      activeProducts: allProducts.filter((p) => p.status === 'active').length,
      outOfStockProducts: allProducts.filter((p) => p.stock <= 0).length,
      bestSellerProducts: allProducts.filter((p) => p.isBestSeller).length,
      newInquiriesCount: allInquiries.filter((i) => i.status === 'new').length,
      recentProducts: enrichedRecent,
      recentInquiries: allInquiries.slice(0, 5),
    });
  } catch (error) {
    console.error('Overview query error:', error);
    res.status(500).json({ error: 'Gagal memuat ringkasan dashboard.' });
  }
});

// Products CRUD
app.get('/api/admin/products', requireAdmin, async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(products)
      .orderBy(asc(products.sortOrder), desc(products.id));
    const enriched = await attachProductsMeta(rows);
    res.json({ products: enriched });
  } catch (error) {
    console.error('Admin products list error:', error);
    res.status(500).json({ error: 'Gagal memuat daftar produk.' });
  }
});

app.post('/api/admin/products', requireAdmin, async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.name || !body.sku) {
      return res.status(400).json({ error: 'Nama produk dan SKU wajib diisi.' });
    }
    const baseSlug = slugify(body.slug || body.name);
    const existingSlug = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.slug, baseSlug))
      .limit(1);
    const finalSlug = existingSlug.length > 0 ? `${baseSlug}-${Date.now().toString().slice(-4)}` : baseSlug;

    const [created] = await db
      .insert(products)
      .values({
        name: String(body.name).trim(),
        slug: finalSlug,
        sku: String(body.sku).trim(),
        categoryId: body.categoryId ? Number(body.categoryId) : null,
        price: Math.max(0, Number(body.price) || 0),
        discountPrice:
          body.discountPrice !== null && body.discountPrice !== undefined && body.discountPrice !== ''
            ? Math.max(0, Number(body.discountPrice))
            : null,
        resellerPrice:
          body.resellerPrice !== null && body.resellerPrice !== undefined && body.resellerPrice !== ''
            ? Math.max(0, Number(body.resellerPrice))
            : null,
        shortDescription: String(body.shortDescription || ''),
        description: String(body.description || ''),
        benefits: String(body.benefits || ''),
        howToUse: String(body.howToUse || ''),
        ingredients: String(body.ingredients || ''),
        sizeVariant: String(body.sizeVariant || '30 ml'),
        stock: Math.max(0, Number(body.stock) || 0),
        status: String(body.status || 'active'),
        isBestSeller: Boolean(body.isBestSeller),
        isNewArrival: Boolean(body.isNewArrival),
        sortOrder: Number(body.sortOrder) || 0,
        whatsappMessage: String(body.whatsappMessage || ''),
        tiktokUrl: String(body.tiktokUrl || ''),
        shopeeUrl: String(body.shopeeUrl || ''),
      })
      .returning();

    const imagesInput: { imageUrl: string; altText?: string; isPrimary?: boolean }[] = Array.isArray(
      body.images
    )
      ? body.images
      : [];

    if (imagesInput.length > 0) {
      await db.insert(productImages).values(
        imagesInput
          .filter((img) => img && img.imageUrl)
          .map((img, idx) => ({
            productId: created.id,
            imageUrl: img.imageUrl,
            altText: img.altText || created.name,
            sortOrder: idx,
            isPrimary: img.isPrimary ?? idx === 0,
          }))
      );
    }

    const [enriched] = await attachProductsMeta([created]);
    res.status(201).json({ product: enriched });
  } catch (error: any) {
    console.error('Create product error:', error);
    if (error?.code === '23505') {
      return res.status(409).json({ error: 'SKU atau slug produk sudah digunakan.' });
    }
    res.status(500).json({ error: 'Gagal menambahkan produk baru.' });
  }
});

app.put('/api/admin/products/:id', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'ID produk tidak valid.' });
    }
    const body = req.body || {};
    if (!body.name || !body.sku) {
      return res.status(400).json({ error: 'Nama produk dan SKU wajib diisi.' });
    }

    const [updated] = await db
      .update(products)
      .set({
        name: String(body.name).trim(),
        slug: slugify(body.slug || body.name),
        sku: String(body.sku).trim(),
        categoryId: body.categoryId ? Number(body.categoryId) : null,
        price: Math.max(0, Number(body.price) || 0),
        discountPrice:
          body.discountPrice !== null && body.discountPrice !== undefined && body.discountPrice !== ''
            ? Math.max(0, Number(body.discountPrice))
            : null,
        resellerPrice:
          body.resellerPrice !== null && body.resellerPrice !== undefined && body.resellerPrice !== ''
            ? Math.max(0, Number(body.resellerPrice))
            : null,
        shortDescription: String(body.shortDescription || ''),
        description: String(body.description || ''),
        benefits: String(body.benefits || ''),
        howToUse: String(body.howToUse || ''),
        ingredients: String(body.ingredients || ''),
        sizeVariant: String(body.sizeVariant || '30 ml'),
        stock: Math.max(0, Number(body.stock) || 0),
        status: String(body.status || 'active'),
        isBestSeller: Boolean(body.isBestSeller),
        isNewArrival: Boolean(body.isNewArrival),
        sortOrder: Number(body.sortOrder) || 0,
        whatsappMessage: String(body.whatsappMessage || ''),
        tiktokUrl: String(body.tiktokUrl || ''),
        shopeeUrl: String(body.shopeeUrl || ''),
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Produk tidak ditemukan.' });
    }

    if (Array.isArray(body.images)) {
      await db.delete(productImages).where(eq(productImages.productId, id));
      const validImages = body.images.filter((img: any) => img && img.imageUrl);
      if (validImages.length > 0) {
        await db.insert(productImages).values(
          validImages.map((img: any, idx: number) => ({
            productId: id,
            imageUrl: img.imageUrl,
            altText: img.altText || updated.name,
            sortOrder: idx,
            isPrimary: img.isPrimary ?? idx === 0,
          }))
        );
      }
    }

    const [enriched] = await attachProductsMeta([updated]);
    res.json({ product: enriched });
  } catch (error: any) {
    console.error('Update product error:', error);
    if (error?.code === '23505') {
      return res.status(409).json({ error: 'SKU atau slug produk sudah digunakan.' });
    }
    res.status(500).json({ error: 'Gagal memperbarui produk.' });
  }
});

app.delete('/api/admin/products/:id', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(products).where(eq(products.id, id));
    res.json({ ok: true });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Gagal menghapus produk.' });
  }
});

// Categories CRUD
app.get('/api/admin/categories', requireAdmin, async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(categories)
      .orderBy(asc(categories.sortOrder), asc(categories.id));
    res.json({ categories: rows });
  } catch (error) {
    console.error('Admin categories error:', error);
    res.status(500).json({ error: 'Gagal memuat kategori.' });
  }
});

app.post('/api/admin/categories', requireAdmin, async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.name) {
      return res.status(400).json({ error: 'Nama kategori wajib diisi.' });
    }
    const [created] = await db
      .insert(categories)
      .values({
        name: String(body.name).trim(),
        slug: slugify(body.slug || body.name),
        description: String(body.description || ''),
        imageUrl: String(body.imageUrl || ''),
        sortOrder: Number(body.sortOrder) || 0,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      })
      .returning();
    res.status(201).json({ category: created });
  } catch (error: any) {
    console.error('Create category error:', error);
    if (error?.code === '23505') {
      return res.status(409).json({ error: 'Slug kategori sudah digunakan.' });
    }
    res.status(500).json({ error: 'Gagal membuat kategori.' });
  }
});

app.put('/api/admin/categories/:id', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const body = req.body || {};
    const [updated] = await db
      .update(categories)
      .set({
        name: String(body.name).trim(),
        slug: slugify(body.slug || body.name),
        description: String(body.description || ''),
        imageUrl: String(body.imageUrl || ''),
        sortOrder: Number(body.sortOrder) || 0,
        isActive: Boolean(body.isActive),
      })
      .where(eq(categories.id, id))
      .returning();
    if (!updated) return res.status(404).json({ error: 'Kategori tidak ditemukan.' });
    res.json({ category: updated });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Gagal memperbarui kategori.' });
  }
});

app.delete('/api/admin/categories/:id', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(categories).where(eq(categories.id, id));
    res.json({ ok: true });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Gagal menghapus kategori.' });
  }
});

// Banners CRUD
app.get('/api/admin/banners', requireAdmin, async (_req, res) => {
  try {
    const rows = await db.select().from(banners).orderBy(asc(banners.sortOrder), asc(banners.id));
    res.json({ banners: rows });
  } catch (error) {
    console.error('Admin banners error:', error);
    res.status(500).json({ error: 'Gagal memuat banner.' });
  }
});

app.post('/api/admin/banners', requireAdmin, async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.title) return res.status(400).json({ error: 'Judul banner wajib diisi.' });
    const [created] = await db
      .insert(banners)
      .values({
        title: String(body.title).trim(),
        subtitle: String(body.subtitle || ''),
        badgeText: String(body.badgeText || ''),
        ctaText: String(body.ctaText || 'SHOP NOW'),
        ctaLink: String(body.ctaLink || '#catalog'),
        imageUrl: String(body.imageUrl || ''),
        placement: String(body.placement || 'promo'),
        countdownEndAt: body.countdownEndAt ? new Date(body.countdownEndAt) : null,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
        sortOrder: Number(body.sortOrder) || 0,
      })
      .returning();
    res.status(201).json({ banner: created });
  } catch (error) {
    console.error('Create banner error:', error);
    res.status(500).json({ error: 'Gagal menambahkan banner.' });
  }
});

app.put('/api/admin/banners/:id', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const body = req.body || {};
    const [updated] = await db
      .update(banners)
      .set({
        title: String(body.title).trim(),
        subtitle: String(body.subtitle || ''),
        badgeText: String(body.badgeText || ''),
        ctaText: String(body.ctaText || 'SHOP NOW'),
        ctaLink: String(body.ctaLink || '#catalog'),
        imageUrl: String(body.imageUrl || ''),
        placement: String(body.placement || 'promo'),
        countdownEndAt: body.countdownEndAt ? new Date(body.countdownEndAt) : null,
        isActive: Boolean(body.isActive),
        sortOrder: Number(body.sortOrder) || 0,
      })
      .where(eq(banners.id, id))
      .returning();
    if (!updated) return res.status(404).json({ error: 'Banner tidak ditemukan.' });
    res.json({ banner: updated });
  } catch (error) {
    console.error('Update banner error:', error);
    res.status(500).json({ error: 'Gagal memperbarui banner.' });
  }
});

app.delete('/api/admin/banners/:id', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(banners).where(eq(banners.id, id));
    res.json({ ok: true });
  } catch (error) {
    console.error('Delete banner error:', error);
    res.status(500).json({ error: 'Gagal menghapus banner.' });
  }
});

// Testimonials CRUD
app.get('/api/admin/testimonials', requireAdmin, async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(testimonials)
      .orderBy(asc(testimonials.sortOrder), desc(testimonials.id));
    res.json({ testimonials: rows });
  } catch (error) {
    console.error('Admin testimonials error:', error);
    res.status(500).json({ error: 'Gagal memuat testimoni.' });
  }
});

app.post('/api/admin/testimonials', requireAdmin, async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.customerName || !body.review) {
      return res.status(400).json({ error: 'Nama pelanggan dan ulasan wajib diisi.' });
    }
    const [created] = await db
      .insert(testimonials)
      .values({
        customerName: String(body.customerName).trim(),
        customerRole: String(body.customerRole || 'Verified Buyer'),
        avatarUrl: String(body.avatarUrl || ''),
        rating: Math.min(5, Math.max(1, Number(body.rating) || 5)),
        review: String(body.review).trim(),
        productName: String(body.productName || ''),
        isPublished: body.isPublished !== undefined ? Boolean(body.isPublished) : true,
        sortOrder: Number(body.sortOrder) || 0,
      })
      .returning();
    res.status(201).json({ testimonial: created });
  } catch (error) {
    console.error('Create testimonial error:', error);
    res.status(500).json({ error: 'Gagal menambah testimoni.' });
  }
});

app.put('/api/admin/testimonials/:id', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const body = req.body || {};
    const [updated] = await db
      .update(testimonials)
      .set({
        customerName: String(body.customerName).trim(),
        customerRole: String(body.customerRole || 'Verified Buyer'),
        avatarUrl: String(body.avatarUrl || ''),
        rating: Math.min(5, Math.max(1, Number(body.rating) || 5)),
        review: String(body.review).trim(),
        productName: String(body.productName || ''),
        isPublished: Boolean(body.isPublished),
        sortOrder: Number(body.sortOrder) || 0,
      })
      .where(eq(testimonials.id, id))
      .returning();
    if (!updated) return res.status(404).json({ error: 'Testimoni tidak ditemukan.' });
    res.json({ testimonial: updated });
  } catch (error) {
    console.error('Update testimonial error:', error);
    res.status(500).json({ error: 'Gagal memperbarui testimoni.' });
  }
});

app.delete('/api/admin/testimonials/:id', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(testimonials).where(eq(testimonials.id, id));
    res.json({ ok: true });
  } catch (error) {
    console.error('Delete testimonial error:', error);
    res.status(500).json({ error: 'Gagal menghapus testimoni.' });
  }
});

// Pages CRUD
app.get('/api/admin/pages', requireAdmin, async (_req, res) => {
  try {
    const rows = await db.select().from(pages).orderBy(asc(pages.id));
    res.json({ pages: rows });
  } catch (error) {
    console.error('Admin pages error:', error);
    res.status(500).json({ error: 'Gagal memuat halaman.' });
  }
});

app.post('/api/admin/pages', requireAdmin, async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.title) return res.status(400).json({ error: 'Judul halaman wajib diisi.' });
    const [created] = await db
      .insert(pages)
      .values({
        slug: slugify(body.slug || body.title),
        title: String(body.title).trim(),
        subtitle: String(body.subtitle || ''),
        content: String(body.content || ''),
        imageUrl: String(body.imageUrl || ''),
        isPublished: body.isPublished !== undefined ? Boolean(body.isPublished) : true,
        updatedAt: new Date(),
      })
      .returning();
    res.status(201).json({ page: created });
  } catch (error: any) {
    console.error('Create page error:', error);
    if (error?.code === '23505') {
      return res.status(409).json({ error: 'Slug halaman sudah digunakan.' });
    }
    res.status(500).json({ error: 'Gagal menambah halaman.' });
  }
});

app.put('/api/admin/pages/:id', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const body = req.body || {};
    const [updated] = await db
      .update(pages)
      .set({
        slug: slugify(body.slug || body.title),
        title: String(body.title).trim(),
        subtitle: String(body.subtitle || ''),
        content: String(body.content || ''),
        imageUrl: String(body.imageUrl || ''),
        isPublished: Boolean(body.isPublished),
        updatedAt: new Date(),
      })
      .where(eq(pages.id, id))
      .returning();
    if (!updated) return res.status(404).json({ error: 'Halaman tidak ditemukan.' });
    res.json({ page: updated });
  } catch (error) {
    console.error('Update page error:', error);
    res.status(500).json({ error: 'Gagal memperbarui halaman.' });
  }
});

app.delete('/api/admin/pages/:id', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(pages).where(eq(pages.id, id));
    res.json({ ok: true });
  } catch (error) {
    console.error('Delete page error:', error);
    res.status(500).json({ error: 'Gagal menghapus halaman.' });
  }
});

// Inquiries CRUD
app.get('/api/admin/inquiries', requireAdmin, async (_req, res) => {
  try {
    const rows = await db.select().from(inquiries).orderBy(desc(inquiries.createdAt));
    res.json({ inquiries: rows });
  } catch (error) {
    console.error('Admin inquiries error:', error);
    res.status(500).json({ error: 'Gagal memuat pesan pelanggan.' });
  }
});

app.put('/api/admin/inquiries/:id', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body || {};
    const [updated] = await db
      .update(inquiries)
      .set({ status: String(status || 'replied') })
      .where(eq(inquiries.id, id))
      .returning();
    if (!updated) return res.status(404).json({ error: 'Pesan tidak ditemukan.' });
    res.json({ inquiry: updated });
  } catch (error) {
    console.error('Update inquiry error:', error);
    res.status(500).json({ error: 'Gagal memperbarui status pesan.' });
  }
});

app.delete('/api/admin/inquiries/:id', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(inquiries).where(eq(inquiries.id, id));
    res.json({ ok: true });
  } catch (error) {
    console.error('Delete inquiry error:', error);
    res.status(500).json({ error: 'Gagal menghapus pesan.' });
  }
});

// Store Settings
app.get('/api/admin/settings', requireAdmin, async (_req, res) => {
  try {
    const rows = await db.select().from(storeSettings).limit(1);
    res.json({ settings: rows[0] || null });
  } catch (error) {
    console.error('Admin settings error:', error);
    res.status(500).json({ error: 'Gagal memuat pengaturan toko.' });
  }
});

app.put('/api/admin/settings', requireAdmin, async (req, res) => {
  try {
    const body = req.body || {};
    const existing = await db.select().from(storeSettings).limit(1);
    const payload = {
      storeName: String(body.storeName || 'BELMA BEAUTY'),
      tagline: String(body.tagline || 'Reveal Your Natural Beauty'),
      logoUrl: String(body.logoUrl || ''),
      faviconUrl: String(body.faviconUrl || ''),
      whatsappNumber: String(body.whatsappNumber || '').replace(/[^0-9]/g, ''),
      whatsappDefaultMessage: String(body.whatsappDefaultMessage || ''),
      instagramUrl: String(body.instagramUrl || ''),
      tiktokUrl: String(body.tiktokUrl || ''),
      shopeeStoreUrl: String(body.shopeeStoreUrl || ''),
      email: String(body.email || ''),
      storeAddress: String(body.storeAddress || ''),
      seoTitle: String(body.seoTitle || ''),
      seoDescription: String(body.seoDescription || ''),
      heroBannerUrl: String(body.heroBannerUrl || ''),
      resellerDefaultDiscountPct: Math.min(
        90,
        Math.max(0, Number(body.resellerDefaultDiscountPct) || 0)
      ),
      updatedAt: new Date(),
    };

    let saved;
    if (existing.length > 0) {
      [saved] = await db
        .update(storeSettings)
        .set(payload)
        .where(eq(storeSettings.id, existing[0].id))
        .returning();
    } else {
      [saved] = await db.insert(storeSettings).values(payload).returning();
    }
    res.json({ settings: saved });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Gagal menyimpan pengaturan toko.' });
  }
});

// Admin Users management
app.get('/api/admin/users', requireAdmin, async (_req, res) => {
  try {
    const rows = await db
      .select({
        id: adminUsers.id,
        uid: adminUsers.uid,
        email: adminUsers.email,
        name: adminUsers.name,
        role: adminUsers.role,
        isActive: adminUsers.isActive,
        lastLoginAt: adminUsers.lastLoginAt,
        createdAt: adminUsers.createdAt,
      })
      .from(adminUsers)
      .orderBy(asc(adminUsers.id));
    res.json({ users: rows });
  } catch (error) {
    console.error('Admin users list error:', error);
    res.status(500).json({ error: 'Gagal memuat daftar admin.' });
  }
});

app.post('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const { email, name, password } = req.body || {};
    if (!email || !name) {
      return res.status(400).json({ error: 'Email dan nama administrator wajib diisi.' });
    }
    const [created] = await db
      .insert(adminUsers)
      .values({
        email: String(email).trim().toLowerCase(),
        name: String(name).trim(),
        passwordHash: password ? hashPassword(String(password)) : null,
        role: 'administrator',
        isActive: true,
      })
      .returning({
        id: adminUsers.id,
        uid: adminUsers.uid,
        email: adminUsers.email,
        name: adminUsers.name,
        role: adminUsers.role,
        isActive: adminUsers.isActive,
        lastLoginAt: adminUsers.lastLoginAt,
        createdAt: adminUsers.createdAt,
      });
    res.status(201).json({ user: created });
  } catch (error: any) {
    console.error('Create admin user error:', error);
    if (error?.code === '23505') {
      return res.status(409).json({ error: 'Email admin sudah terdaftar.' });
    }
    res.status(500).json({ error: 'Gagal menambahkan admin.' });
  }
});

app.delete('/api/admin/users/:id', requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    if (req.adminUser?.id === id) {
      return res.status(400).json({ error: 'Anda tidak dapat menghapus akun Anda sendiri.' });
    }
    await db.delete(adminUsers).where(eq(adminUsers.id, id));
    res.json({ ok: true });
  } catch (error) {
    console.error('Delete admin user error:', error);
    res.status(500).json({ error: 'Gagal menghapus administrator.' });
  }
});

// Admin Resellers Management (Register, Edit, Toggle Active Status, Delete)
app.get('/api/admin/resellers', requireAdmin, async (_req, res) => {
  try {
    const rows = await db
      .select({
        id: resellers.id,
        email: resellers.email,
        name: resellers.name,
        phone: resellers.phone,
        city: resellers.city,
        tierCode: resellers.tierCode,
        role: resellers.role,
        isActive: resellers.isActive,
        notes: resellers.notes,
        lastLoginAt: resellers.lastLoginAt,
        createdAt: resellers.createdAt,
      })
      .from(resellers)
      .orderBy(desc(resellers.createdAt), asc(resellers.id));
    res.json({ resellers: rows });
  } catch (error) {
    console.error('Admin resellers list error:', error);
    res.status(500).json({ error: 'Gagal memuat daftar reseller.' });
  }
});

app.post('/api/admin/resellers', requireAdmin, async (req, res) => {
  try {
    const { email, name, password, phone, city, tierCode, role, isActive, notes } = req.body || {};
    if (!email || !name || !password) {
      return res.status(400).json({ error: 'Nama, email, dan kata sandi reseller wajib diisi.' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: 'Kata sandi minimal 6 karakter.' });
    }
    const [created] = await db
      .insert(resellers)
      .values({
        email: String(email).trim().toLowerCase(),
        name: String(name).trim(),
        phone: String(phone || '').trim(),
        city: String(city || '').trim(),
        tierCode: String(tierCode || 'RESELLER').trim() || 'RESELLER',
        role: String(role || 'reseller').trim() || 'reseller',
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        notes: String(notes || '').trim(),
        passwordHash: hashPassword(String(password)),
      })
      .returning({
        id: resellers.id,
        email: resellers.email,
        name: resellers.name,
        phone: resellers.phone,
        city: resellers.city,
        tierCode: resellers.tierCode,
        role: resellers.role,
        isActive: resellers.isActive,
        notes: resellers.notes,
        lastLoginAt: resellers.lastLoginAt,
        createdAt: resellers.createdAt,
      });

    res.status(201).json({ reseller: created });
  } catch (error: any) {
    console.error('Create reseller error:', error);
    if (error?.code === '23505') {
      return res.status(409).json({ error: 'Email reseller sudah terdaftar.' });
    }
    res.status(500).json({ error: 'Gagal mendaftarkan reseller baru.' });
  }
});

app.put('/api/admin/resellers/:id', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'ID reseller tidak valid.' });
    }
    const { email, name, password, phone, city, tierCode, role, isActive, notes } = req.body || {};
    if (!email || !name) {
      return res.status(400).json({ error: 'Nama dan email reseller wajib diisi.' });
    }

    const updateValues: Partial<typeof resellers.$inferInsert> = {
      email: String(email).trim().toLowerCase(),
      name: String(name).trim(),
      phone: String(phone || '').trim(),
      city: String(city || '').trim(),
      tierCode: String(tierCode || 'RESELLER').trim() || 'RESELLER',
      role: String(role || 'reseller').trim() || 'reseller',
      isActive: Boolean(isActive),
      notes: String(notes || '').trim(),
    };

    if (password && String(password).trim().length > 0) {
      if (String(password).trim().length < 6) {
        return res.status(400).json({ error: 'Kata sandi baru minimal 6 karakter.' });
      }
      updateValues.passwordHash = hashPassword(String(password).trim());
    }

    const [updated] = await db
      .update(resellers)
      .set(updateValues)
      .where(eq(resellers.id, id))
      .returning({
        id: resellers.id,
        email: resellers.email,
        name: resellers.name,
        phone: resellers.phone,
        city: resellers.city,
        tierCode: resellers.tierCode,
        role: resellers.role,
        isActive: resellers.isActive,
        notes: resellers.notes,
        lastLoginAt: resellers.lastLoginAt,
        createdAt: resellers.createdAt,
      });

    if (!updated) return res.status(404).json({ error: 'Akun reseller tidak ditemukan.' });
    res.json({ reseller: updated });
  } catch (error: any) {
    console.error('Update reseller error:', error);
    if (error?.code === '23505') {
      return res.status(409).json({ error: 'Email reseller sudah digunakan.' });
    }
    res.status(500).json({ error: 'Gagal memperbarui akun reseller.' });
  }
});

app.delete('/api/admin/resellers/:id', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(resellers).where(eq(resellers.id, id));
    res.json({ ok: true });
  } catch (error) {
    console.error('Delete reseller error:', error);
    res.status(500).json({ error: 'Gagal menghapus akun reseller.' });
  }
});

// ============================================================================
// FRONTEND VITE / STATIC SERVING
// ============================================================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.use('/src/assets', express.static(path.resolve(distPath, 'src/assets')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BELMA BEAUTY server listening on port ${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export { app };
export default app;

