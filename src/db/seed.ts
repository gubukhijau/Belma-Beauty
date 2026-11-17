import { count, eq } from 'drizzle-orm';
import { db, pool } from './index.ts';
import {
  adminUsers,
  banners,
  categories,
  customerOrders,
  customers,
  inquiries,
  pages,
  productImages,
  products,
  resellers,
  storeSettings,
  testimonials,
} from './schema.ts';
import { hashPassword } from '../lib/auth.ts';

let seedPromise: Promise<void> | null = null;

export async function ensureSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = runSeed().catch((err) => {
      seedPromise = null;
      throw err;
    });
  }
  return seedPromise;
}

async function ensureSchemaTables(): Promise<void> {
  const check = await pool.query<{ tbl: string | null }>(
    "SELECT to_regclass('public.store_settings') AS tbl"
  );
  if (check.rows[0]?.tbl) {
    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT DEFAULT '',
      image_url TEXT DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      sku TEXT NOT NULL UNIQUE,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      price INTEGER NOT NULL DEFAULT 0,
      discount_price INTEGER,
      reseller_price INTEGER,
      short_description TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      benefits TEXT NOT NULL DEFAULT '',
      how_to_use TEXT NOT NULL DEFAULT '',
      ingredients TEXT NOT NULL DEFAULT '',
      size_variant TEXT NOT NULL DEFAULT '30 ml',
      stock INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      is_best_seller BOOLEAN NOT NULL DEFAULT false,
      is_new_arrival BOOLEAN NOT NULL DEFAULT false,
      sort_order INTEGER NOT NULL DEFAULT 0,
      whatsapp_message TEXT DEFAULT '',
      tiktok_url TEXT DEFAULT '',
      shopee_url TEXT DEFAULT '',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    ALTER TABLE products ADD COLUMN IF NOT EXISTS reseller_price INTEGER;

    CREATE TABLE IF NOT EXISTS product_images (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      image_url TEXT NOT NULL,
      alt_text TEXT DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_primary BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS banners (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      subtitle TEXT DEFAULT '',
      badge_text TEXT DEFAULT '',
      cta_text TEXT DEFAULT 'SHOP NOW',
      cta_link TEXT DEFAULT '#catalog',
      image_url TEXT DEFAULT '',
      placement TEXT NOT NULL DEFAULT 'hero',
      countdown_end_at TIMESTAMP,
      is_active BOOLEAN NOT NULL DEFAULT true,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS testimonials (
      id SERIAL PRIMARY KEY,
      customer_name TEXT NOT NULL,
      customer_role TEXT DEFAULT 'Verified Customer',
      avatar_url TEXT DEFAULT '',
      rating INTEGER NOT NULL DEFAULT 5,
      review TEXT NOT NULL,
      product_name TEXT DEFAULT '',
      is_published BOOLEAN NOT NULL DEFAULT true,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS store_settings (
      id SERIAL PRIMARY KEY,
      store_name TEXT NOT NULL DEFAULT 'BELMA BEAUTY',
      tagline TEXT NOT NULL DEFAULT 'Reveal Your Natural Beauty',
      logo_url TEXT DEFAULT '',
      favicon_url TEXT DEFAULT '',
      whatsapp_number TEXT NOT NULL DEFAULT '6281234567890',
      whatsapp_default_message TEXT NOT NULL DEFAULT 'Halo Belma Beauty, saya ingin membeli [NAMA PRODUK] dengan harga [HARGA]. Apakah produk masih tersedia?',
      instagram_url TEXT DEFAULT 'https://instagram.com/belmabeauty.official',
      tiktok_url TEXT DEFAULT 'https://www.tiktok.com/@belmabeauty.official',
      shopee_store_url TEXT DEFAULT 'https://shopee.co.id/belmabeauty.official',
      email TEXT DEFAULT 'concierge@belmabeauty.com',
      store_address TEXT DEFAULT 'Jl. Senopati No. 88, Kebayoran Baru, Jakarta Selatan 12190',
      seo_title TEXT DEFAULT 'BELMA BEAUTY — Luxury Botanical Skincare & Beauty Essentials',
      seo_description TEXT DEFAULT 'Reveal your natural beauty with Belma Beauty. Discover clinical-grade botanical skincare, serums, moisturizers, and daily beauty essentials.',
      hero_banner_url TEXT DEFAULT '',
      reseller_default_discount_pct INTEGER NOT NULL DEFAULT 0,
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS reseller_default_discount_pct INTEGER NOT NULL DEFAULT 0;

    CREATE TABLE IF NOT EXISTS admin_users (
      id SERIAL PRIMARY KEY,
      uid TEXT UNIQUE,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL DEFAULT 'Belma Administrator',
      password_hash TEXT,
      role TEXT NOT NULL DEFAULT 'administrator',
      is_active BOOLEAN NOT NULL DEFAULT true,
      last_login_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS pages (
      id SERIAL PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      subtitle TEXT DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      image_url TEXT DEFAULT '',
      is_published BOOLEAN NOT NULL DEFAULT true,
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS inquiries (
      id SERIAL PRIMARY KEY,
      customer_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT DEFAULT '',
      subject TEXT NOT NULL DEFAULT 'Product Consultation',
      message TEXT NOT NULL,
      product_name TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'new',
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS media_assets (
      id SERIAL PRIMARY KEY,
      filename TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL DEFAULT 0,
      base64_data TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS resellers (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      phone TEXT DEFAULT '',
      city TEXT DEFAULT '',
      tier_code TEXT NOT NULL DEFAULT 'RESELLER',
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'reseller',
      is_active BOOLEAN NOT NULL DEFAULT true,
      notes TEXT DEFAULT '',
      last_login_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      whatsapp_number TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL DEFAULT 'pelanggan',
      last_login_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS customer_orders (
      id SERIAL PRIMARY KEY,
      order_number TEXT NOT NULL UNIQUE,
      customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
      customer_name TEXT NOT NULL,
      customer_whatsapp TEXT NOT NULL,
      customer_email TEXT DEFAULT '',
      shipping_address TEXT NOT NULL DEFAULT '',
      product_summary TEXT NOT NULL,
      total_amount INTEGER NOT NULL DEFAULT 0,
      order_channel TEXT NOT NULL DEFAULT 'whatsapp',
      status TEXT NOT NULL DEFAULT 'diproses',
      courier TEXT DEFAULT '',
      tracking_number TEXT DEFAULT '',
      tracking_note TEXT DEFAULT '',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
}

async function runSeed() {
  await ensureSchemaTables();

  // 1. Seed Store Settings
  const [{ value: settingsCount }] = await db.select({ value: count() }).from(storeSettings);
  if (settingsCount === 0) {
    await db.insert(storeSettings).values({
      storeName: 'BELMA BEAUTY',
      tagline: 'Reveal Your Natural Beauty',
      logoUrl: '',
      faviconUrl: '',
      whatsappNumber: '6281234567890',
      whatsappDefaultMessage:
        'Halo Belma Beauty, saya ingin membeli [NAMA PRODUK] dengan harga [HARGA]. Apakah produk masih tersedia?',
      instagramUrl: 'https://instagram.com/belmabeauty.official',
      tiktokUrl: 'https://www.tiktok.com/@belmabeauty.official',
      shopeeStoreUrl: 'https://shopee.co.id/belmabeauty.official',
      email: 'concierge@belmabeauty.com',
      storeAddress: 'Jl. Senopati No. 88, Kebayoran Baru, Jakarta Selatan 12190',
      seoTitle: 'BELMA BEAUTY — Reveal Your Natural Beauty',
      seoDescription:
        'Discover your beauty essentials with Belma Beauty. Clinical botanical skincare, facial treatments, and daily body care crafted for luminous skin.',
      heroBannerUrl: '/src/assets/images/hero_belma_skincare_1794911225042.jpg',
    });
  }

  // 2. Seed Admin Users
  const [{ value: adminCount }] = await db.select({ value: count() }).from(adminUsers);
  if (adminCount === 0) {
    await db.insert(adminUsers).values([
      {
        email: 'admin@belmabeauty.com',
        name: 'Belma Head Admin',
        passwordHash: hashPassword('BelmaAdmin2026!'),
        role: 'administrator',
        isActive: true,
      },
      {
        email: 'cs.sapalewa@gmail.com',
        name: 'Store Owner',
        passwordHash: null,
        role: 'administrator',
        isActive: true,
      },
    ]);
  }

  // 3. Seed Categories
  const [{ value: catCount }] = await db.select({ value: count() }).from(categories);
  let categoryMap: Record<string, number> = {};
  if (catCount === 0) {
    const insertedCats = await db
      .insert(categories)
      .values([
        {
          name: 'Skincare',
          slug: 'skincare',
          description: 'Serum konsentrat, pelembap barrier, dan pembersih wajah harian berbahan aktif botani.',
          imageUrl: '/src/assets/images/prod_brightening_serum_1794911226187.jpg',
          sortOrder: 1,
          isActive: true,
        },
        {
          name: 'Body Care',
          slug: 'body-care',
          description: 'Perawatan tubuh lembut dengan shea butter, niacinamide, dan keharuman floral-woody yang menenangkan.',
          imageUrl: '/src/assets/images/prod_body_lotion_1794911228620.jpg',
          sortOrder: 2,
          isActive: true,
        },
        {
          name: 'Facial Treatment',
          slug: 'facial-treatment',
          description: 'Ritual perawatan intensif di rumah untuk kulit tenang, kenyal, dan bercahaya sehat.',
          imageUrl: '/src/assets/images/cat_facial_treatment_1794911229238.jpg',
          sortOrder: 3,
          isActive: true,
        },
        {
          name: 'Beauty Essentials',
          slug: 'beauty-essentials',
          description: 'Perlindungan harian UV dan produk esensial yang menyempurnakan rutinitas kecantikan Anda.',
          imageUrl: '/src/assets/images/prod_sunscreen_fluid_1794911227579.jpg',
          sortOrder: 4,
          isActive: true,
        },
      ])
      .returning();

    for (const c of insertedCats) {
      categoryMap[c.slug] = c.id;
    }
  } else {
    const existingCats = await db.select().from(categories);
    for (const c of existingCats) {
      categoryMap[c.slug] = c.id;
    }
  }

  // 4. Seed Sample Products + Gallery Images
  const [{ value: prodCount }] = await db.select({ value: count() }).from(products);
  if (prodCount === 0) {
    const seedProducts = [
      {
        name: 'Belma Brightening Serum',
        slug: 'belma-brightening-serum',
        sku: 'BLM-SRM-001',
        categoryId: categoryMap['skincare'] ?? null,
        price: 245000,
        discountPrice: 189000,
        shortDescription:
          'Serum pencerah 10% Niacinamide, Alpha Arbutin, dan Ekstrak Licorice untuk kulit tampak lebih merata dan bercahaya.',
        description:
          'Belma Brightening Serum diformulasikan dengan kombinasi bahan aktif klinis dan ekstrak botani yang bekerja lembut menyamarkan noda hitam, meratakan warna kulit, dan menjaga kelembapan alami tanpa rasa lengket.',
        benefits:
          '• Membantu mencerahkan kulit kusam secara bertahap\n• Menyamarkan noda bekas jerawat dan hiperpigmentasi\n• Memperkuat skin barrier dan menjaga elastisitas kulit\n• Tekstur ringan yang cepat meresap sempurna',
        howToUse:
          'Teteskan 2–3 tetes serum pada wajah yang telah dibersihkan pada pagi dan malam hari. Ratakan perlahan dan lanjutkan dengan pelembap.',
        ingredients:
          'Aqua, Niacinamide 10%, Alpha-Arbutin 2%, Glycyrrhiza Glabra (Licorice) Root Extract, Sodium Hyaluronate, Panthenol, Centella Asiatica Extract, Allantoin.',
        sizeVariant: '30 ml',
        stock: 42,
        status: 'active',
        isBestSeller: true,
        isNewArrival: false,
        sortOrder: 1,
        whatsappMessage: '',
        tiktokUrl: 'https://www.tiktok.com/@belmabeauty.official',
        shopeeUrl: 'https://shopee.co.id/belmabeauty.official',
        images: [
          '/src/assets/images/prod_brightening_serum_1794911226187.jpg',
          '/src/assets/images/hero_belma_skincare_1794911225042.jpg',
        ],
      },
      {
        name: 'Belma Acne Calming Serum',
        slug: 'belma-acne-calming-serum',
        sku: 'BLM-SRM-002',
        categoryId: categoryMap['facial-treatment'] ?? categoryMap['skincare'] ?? null,
        price: 229000,
        discountPrice: 179000,
        shortDescription:
          'Serum penenang kulit berjerawat dengan Centella Asiatica, Mugwort, dan BHA lembut untuk meredakan kemerahan.',
        description:
          'Dirancang khusus untuk kulit sensitif dan rentan berjerawat, Belma Acne Calming Serum menyeimbangkan produksi sebum sekaligus menenangkan iritasi tanpa membuat kulit kering mengelupas.',
        benefits:
          '• Meredakan kemerahan dan peradangan jerawat aktif\n• Membersihkan pori-pori tersumbat secara lembut\n• Mengontrol minyak berlebih tanpa menarik kelembapan\n• Menjaga keseimbangan mikrobioma kulit',
        howToUse:
          'Aplikasikan 2–3 tetes pada area berjerawat atau seluruh wajah setelah toner pada pagi dan malam hari.',
        ingredients:
          'Aqua, Centella Asiatica Leaf Water, Artemisia Vulgaris (Mugwort) Extract, Salicylic Acid 1%, Zinc PCA, Madecassoside, Tea Tree Hydrosol.',
        sizeVariant: '30 ml',
        stock: 28,
        status: 'active',
        isBestSeller: false,
        isNewArrival: true,
        sortOrder: 2,
        whatsappMessage: '',
        tiktokUrl: 'https://www.tiktok.com/@belmabeauty.official',
        shopeeUrl: 'https://shopee.co.id/belmabeauty.official',
        images: [
          '/src/assets/images/prod_acne_calming_serum_1794911226662.jpg',
          '/src/assets/images/cat_facial_treatment_1794911229238.jpg',
        ],
      },
      {
        name: 'Belma Moisturizing Cream',
        slug: 'belma-moisturizing-cream',
        sku: 'BLM-CRM-003',
        categoryId: categoryMap['skincare'] ?? null,
        price: 265000,
        discountPrice: null,
        shortDescription:
          'Krim pelembap intensif dengan 5x Ceramide, Squalane, dan Oat Extract untuk mengunci hidrasi 48 jam.',
        description:
          'Belma Moisturizing Cream menghadirkan tekstur velvety-rich yang meleleh seketika di kulit, memulihkan lapisan pelindung kulit yang lelah dan memberikan efek kenyal sepanjang hari.',
        benefits:
          '• Mengunci kelembapan kulit hingga 48 jam\n• Memperbaiki skin barrier yang rusak atau dehidrasi\n• Menenangkan kulit kering dan sensitif\n• Hasil akhir lembut matte-satin yang nyaman di bawah riasan',
        howToUse:
          'Ambil krim seukuran mutiara dengan spatula, oleskan merata pada wajah dan leher setelah pemakaian serum.',
        ingredients:
          'Aqua, Glycerin, Squalane, Ceramide NP, Ceramide AP, Ceramide EOP, Avena Sativa (Oat) Kernel Extract, Butyrospermum Parkii Butter, Cholesterol.',
        sizeVariant: '50 ml',
        stock: 35,
        status: 'active',
        isBestSeller: true,
        isNewArrival: false,
        sortOrder: 3,
        whatsappMessage: '',
        tiktokUrl: 'https://www.tiktok.com/@belmabeauty.official',
        shopeeUrl: 'https://shopee.co.id/belmabeauty.official',
        images: [
          '/src/assets/images/prod_moisturizing_cream_1794911226731.jpg',
          '/src/assets/images/promo_belma_ritual_1794911225986.jpg',
        ],
      },
      {
        name: 'Belma Sunscreen',
        slug: 'belma-sunscreen',
        sku: 'BLM-SUN-004',
        categoryId: categoryMap['beauty-essentials'] ?? null,
        price: 175000,
        discountPrice: 149000,
        shortDescription:
          'Tabir surya harian SPF 50+ PA++++ bertekstur cair tanpa whitecast, melindungi dari sinar UVA, UVB, dan blue light.',
        description:
          'Belma Daily UV Sunscreen hadir dengan formula hybrid yang sejuk di kulit tropis. Tidak menyumbat pori, bebas whitecast, dan diperkaya antioksidan untuk perlindungan menyeluruh.',
        benefits:
          '• Perlindungan spektrum luas SPF 50+ PA++++\n• Tanpa whitecast dan tidak membuat wajah abu-abu\n• Ringan, cepat meresap, dan tahan keringat\n• Mengandung Vitamin E & Ectoin sebagai anti-polusi',
        howToUse:
          'Oleskan dua ruas jari secara merata ke wajah dan leher 15 menit sebelum beraktivitas di luar ruangan. Ulangi setiap 2–3 jam.',
        ingredients:
          'Aqua, Ethylhexyl Methoxycinnamate, Bis-Ethylhexyloxyphenol Methoxyphenyl Triazine, Ectoin, Tocopherol, Niacinamide, Chamomilla Recutita Extract.',
        sizeVariant: '50 ml',
        stock: 54,
        status: 'active',
        isBestSeller: true,
        isNewArrival: true,
        sortOrder: 4,
        whatsappMessage: '',
        tiktokUrl: 'https://www.tiktok.com/@belmabeauty.official',
        shopeeUrl: 'https://shopee.co.id/belmabeauty.official',
        images: [
          '/src/assets/images/prod_sunscreen_fluid_1794911227579.jpg',
          '/src/assets/images/hero_belma_skincare_1794911225042.jpg',
        ],
      },
      {
        name: 'Belma Body Lotion',
        slug: 'belma-body-lotion',
        sku: 'BLM-BDY-005',
        categoryId: categoryMap['body-care'] ?? null,
        price: 195000,
        discountPrice: 159000,
        shortDescription:
          'Losion tubuh mewah dengan Shea Butter, Niacinamide, dan aroma lembut White Tea & Warm Vanilla.',
        description:
          'Belma Body Lotion menutrisi kulit tubuh yang kering agar terasa halus seperti sutra, tampak cerah alami, dan harum elegan sepanjang hari tanpa rasa berminyak.',
        benefits:
          '• Melembapkan dan menghaluskan area kulit kering seperti siku dan lutut\n• Membantu meratakan kecerahan kulit tubuh\n• Aroma menenangkan tahan hingga 8 jam\n• Cepat meresap tanpa meninggalkan rasa lengket di pakaian',
        howToUse:
          'Usapkan secukupnya ke seluruh tubuh setelah mandi saat kulit masih sedikit lembap untuk hasil hidrasi maksimal.',
        ingredients:
          'Aqua, Butyrospermum Parkii (Shea) Butter, Niacinamide, Sweet Almond Oil, Panthenol, Tocopheryl Acetate, Camellia Sinensis Leaf Extract.',
        sizeVariant: '250 ml',
        stock: 19,
        status: 'active',
        isBestSeller: false,
        isNewArrival: false,
        sortOrder: 5,
        whatsappMessage: '',
        tiktokUrl: 'https://www.tiktok.com/@belmabeauty.official',
        shopeeUrl: 'https://shopee.co.id/belmabeauty.official',
        images: [
          '/src/assets/images/prod_body_lotion_1794911228620.jpg',
          '/src/assets/images/hero_belma_skincare_1794911225042.jpg',
        ],
      },
      {
        name: 'Belma Gentle Gel Cleanser',
        slug: 'belma-gentle-gel-cleanser',
        sku: 'BLM-CLN-006',
        categoryId: categoryMap['skincare'] ?? null,
        price: 145000,
        discountPrice: null,
        shortDescription:
          'Pembersih wajah pH seimbang 5.5 dengan Asam Amino dan Ekstrak Chamomile untuk kulit bersih tanpa rasa tertarik.',
        description:
          'Langkah awal ritual skincare Belma Beauty. Gel pembersih lembut bebas sulfat ini mengangkat kotoran, debu, dan sisa tabir surya sambil menjaga kehalusan kulit.',
        benefits:
          '• Membersihkan pori tanpa merusak lapisan pelindung kulit\n• pH seimbang 5.5 cocok untuk semua jenis kulit termasuk sensitif\n• Bebas SLS, alkohol, dan pewangi sintetis keras\n• Memberikan sensasi segar dan kenyal setelah dibilas',
        howToUse:
          'Basahi wajah, pijat lembut 1–2 pump gel cleanser dengan gerakan memutar selama 30 detik, lalu bilas hingga bersih.',
        ingredients:
          'Aqua, Sodium Cocoyl Glycinate, Coco-Betaine, Glycerin, Chamomilla Recutita Flower Extract, Panthenol, Betaine.',
        sizeVariant: '150 ml',
        stock: 0,
        status: 'active',
        isBestSeller: false,
        isNewArrival: true,
        sortOrder: 6,
        whatsappMessage: '',
        tiktokUrl: '',
        shopeeUrl: 'https://shopee.co.id/belmabeauty.official',
        images: [
          '/src/assets/images/prod_facial_cleanser_1794911228651.jpg',
        ],
      },
    ];

    for (const item of seedProducts) {
      const { images, ...prodData } = item;
      const [inserted] = await db.insert(products).values(prodData).returning();
      if (inserted && images.length > 0) {
        await db.insert(productImages).values(
          images.map((url, idx) => ({
            productId: inserted.id,
            imageUrl: url,
            altText: inserted.name,
            sortOrder: idx,
            isPrimary: idx === 0,
          }))
        );
      }
    }
  }

  // 5. Seed Banners
  const [{ value: bannerCount }] = await db.select({ value: count() }).from(banners);
  if (bannerCount === 0) {
    const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.insert(banners).values([
      {
        title: 'Reveal Your Natural Beauty',
        subtitle: 'Discover your beauty essentials with Belma Beauty.',
        badgeText: 'Botanical Clinical Collection',
        ctaText: 'SHOP NOW',
        ctaLink: '#catalog',
        imageUrl: '/src/assets/images/hero_belma_skincare_1794911225042.jpg',
        placement: 'hero',
        countdownEndAt: null,
        isActive: true,
        sortOrder: 1,
      },
      {
        title: 'The Radiant Ritual Set — Hemat hingga 23%',
        subtitle:
          'Padukan Belma Brightening Serum & Daily UV Sunscreen untuk kulit tampak cerah bercahaya sepanjang hari. Penawaran terbatas bulan ini.',
        badgeText: 'Seasonal Privilege',
        ctaText: 'SHOP NOW',
        ctaLink: '#catalog',
        imageUrl: '/src/assets/images/promo_belma_ritual_1794911225986.jpg',
        placement: 'promo',
        countdownEndAt: sevenDaysLater,
        isActive: true,
        sortOrder: 2,
      },
    ]);
  }

  // 6. Seed Testimonials
  const [{ value: testCount }] = await db.select({ value: count() }).from(testimonials);
  if (testCount === 0) {
    await db.insert(testimonials).values([
      {
        customerName: 'Clarissa Wijaya',
        customerRole: 'Verified Buyer · Jakarta',
        avatarUrl: '/src/assets/images/testimonial_portrait_one_1794911229654.jpg',
        rating: 5,
        review:
          'Dalam 3 minggu pemakaian Belma Brightening Serum, bekas jerawat memudar jauh lebih cepat dan wajah terasa sangat lembap tanpa terasa berminyak.',
        productName: 'Belma Brightening Serum',
        isPublished: true,
        sortOrder: 1,
      },
      {
        customerName: 'Nadia Kusuma',
        customerRole: 'Verified Buyer · Bandung',
        avatarUrl: '',
        rating: 5,
        review:
          'Belma Sunscreen benar-benar ringan dan tidak ada whitecast sama sekali. Dipakai di bawah makeup pun tetap halus dan tidak pilling seharian.',
        productName: 'Belma Sunscreen',
        isPublished: true,
        sortOrder: 2,
      },
      {
        customerName: 'Siti Rahmawati',
        customerRole: 'Verified Buyer · Surabaya',
        avatarUrl: '',
        rating: 5,
        review:
          'Kulit saya sangat sensitif, tetapi Belma Moisturizing Cream langsung menenangkan area kering dan kemerahan sejak pemakaian pertama.',
        productName: 'Belma Moisturizing Cream',
        isPublished: true,
        sortOrder: 3,
      },
    ]);
  }

  // 7. Seed CMS Pages
  const [{ value: pageCount }] = await db.select({ value: count() }).from(pages);
  if (pageCount === 0) {
    await db.insert(pages).values([
      {
        slug: 'about-us',
        title: 'Filosofi Kecantikan Alami Belma Beauty',
        subtitle: 'Formulasi bersih berstandar dermatologi yang menghormati keseimbangan alami kulit Anda.',
        content:
          'Belma Beauty lahir dari keyakinan bahwa perawatan kulit mewah tidak perlu rumit. Setiap formula kami menggabungkan bahan aktif klinis yang teruji efektivitasnya dengan ekstrak botani pilihan dari alam.\n\nSeluruh rangkaian produk kami telah terdaftar BPOM, bebas paraben, bebas alkohol keras, dan ramah untuk kulit sensitif tropis. Kami percaya kulit terbaik adalah kulit yang sehat, terhidrasi, dan memancarkan kilau alaminya sendiri.',
        imageUrl: '/src/assets/images/cat_facial_treatment_1794911229238.jpg',
        isPublished: true,
      },
      {
        slug: 'contact',
        title: 'Konsultasi & Layanan Pelanggan',
        subtitle: 'Tim beauty advisor kami siap membantu menemukan rangkaian perawatan yang tepat untuk jenis kulit Anda.',
        content:
          'Butuh rekomendasi produk yang sesuai dengan kondisi kulit Anda atau ingin bertanya seputar pengiriman dan reseller resmi Belma Beauty? Hubungi kami langsung melalui WhatsApp atau kirimkan pesan melalui formulir di samping.',
        imageUrl: '/src/assets/images/promo_belma_ritual_1794911225986.jpg',
        isPublished: true,
      },
    ]);
  }

  // 8. Seed Sample Inquiries
  const [{ value: inqCount }] = await db.select({ value: count() }).from(inquiries);
  if (inqCount === 0) {
    await db.insert(inquiries).values([
      {
        customerName: 'Amira Putri',
        email: 'amira.putri@example.com',
        phone: '081298765432',
        subject: 'Konsultasi Kulit Sensitif',
        message: 'Halo Belma Beauty, apakah Belma Brightening Serum aman dipakai bersamaan dengan Acne Calming Serum?',
        productName: 'Belma Brightening Serum',
        status: 'new',
      },
      {
        customerName: 'Dina Maharani',
        email: 'dina.maharani@example.com',
        phone: '081345678901',
        subject: 'Pertanyaan Stok Cleanser',
        message: 'Kapan Belma Gentle Gel Cleanser akan restock kembali? Terima kasih.',
        productName: 'Belma Gentle Gel Cleanser',
        status: 'replied',
      },
    ]);
  }

  // 9. Seed Reseller Accounts (Registered exclusively by Admin)
  const [{ value: resellerCount }] = await db.select({ value: count() }).from(resellers);
  if (resellerCount === 0) {
    await db.insert(resellers).values([
      {
        email: 'reseller@belmabeauty.com',
        name: 'Boutique Cantik Nusantara',
        phone: '081234001122',
        city: 'Jakarta Selatan',
        tierCode: 'OFFICIAL RESELLER',
        passwordHash: hashPassword('BelmaReseller2026!'),
        role: 'reseller',
        isActive: true,
        notes: 'Reseller aktif wilayah Jabodetabek.',
      },
      {
        email: 'pending@belmabeauty.com',
        name: 'Ayu Glow Partner',
        phone: '081399887766',
        city: 'Bandung',
        tierCode: 'RESELLER',
        passwordHash: hashPassword('BelmaReseller2026!'),
        role: 'reseller',
        isActive: false,
        notes: 'Status nonaktif sementara — harga mengikuti harga toko normal.',
      },
    ]);
  }

  // 10. Ensure seeded products have initial resellerPrice if null
  const defaultResellerPrices: Record<string, number> = {
    'BLM-SRM-001': 145000,
    'BLM-SRM-002': 135000,
    'BLM-CRM-003': 185000,
    'BLM-SUN-004': 115000,
    'BLM-BDY-005': 120000,
    'BLM-CLN-006': 105000,
  };
  for (const [sku, rPrice] of Object.entries(defaultResellerPrices)) {
    const existing = await db
      .select({ id: products.id, resellerPrice: products.resellerPrice })
      .from(products)
      .where(eq(products.sku, sku))
      .limit(1);
    if (existing.length > 0 && existing[0].resellerPrice === null) {
      await db
        .update(products)
        .set({ resellerPrice: rPrice })
        .where(eq(products.id, existing[0].id));
    }
  }

  // 11. Seed Sample Customer & WhatsApp Orders for Pelanggan Dashboard
  const [{ value: custCount }] = await db.select({ value: count() }).from(customers);
  let seededCustomerId: number | null = null;
  if (custCount === 0) {
    const [insertedCust] = await db
      .insert(customers)
      .values({
        name: 'Rania Putri',
        address: 'Jl. Kemang Raya No. 45, Mampang Prapatan, Jakarta Selatan 12730',
        whatsappNumber: '081288990011',
        email: 'pelanggan@belmabeauty.com',
        role: 'pelanggan',
      })
      .returning();
    seededCustomerId = insertedCust?.id ?? null;
  }

  const [{ value: orderCount }] = await db.select({ value: count() }).from(customerOrders);
  if (orderCount === 0) {
    await db.insert(customerOrders).values([
      {
        orderNumber: 'BLM-WA-20261101',
        customerId: seededCustomerId,
        customerName: 'Rania Putri',
        customerWhatsapp: '081288990011',
        customerEmail: 'pelanggan@belmabeauty.com',
        shippingAddress: 'Jl. Kemang Raya No. 45, Mampang Prapatan, Jakarta Selatan 12730',
        productSummary: '1x Belma Brightening Serum, 1x Belma Sunscreen',
        totalAmount: 338000,
        orderChannel: 'whatsapp',
        status: 'dikirim',
        courier: 'jne',
        trackingNumber: 'KDRAA01056184914',
        trackingNote: 'Resi JNE Regular telah diinput oleh Admin Belma Beauty.',
      },
      {
        orderNumber: 'BLM-WA-20261102',
        customerId: seededCustomerId,
        customerName: 'Rania Putri',
        customerWhatsapp: '081288990011',
        customerEmail: 'pelanggan@belmabeauty.com',
        shippingAddress: 'Jl. Kemang Raya No. 45, Mampang Prapatan, Jakarta Selatan 12730',
        productSummary: '1x Belma Moisturizing Cream',
        totalAmount: 265000,
        orderChannel: 'whatsapp',
        status: 'diproses',
        courier: '',
        trackingNumber: '',
        trackingNote: 'Pesanan via WhatsApp sedang dikemas oleh tim gudang.',
      },
    ]);
  }
}
