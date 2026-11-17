import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Search,
  Star,
  Sparkles,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import type { Banner, Category, Product, StoreSettings, Testimonial } from '../types/store';
import { getDiscountPercent, getEffectivePrice } from '../lib/format';
import { SafeImage } from './SafeImage';
import { ProductCard } from './ProductCard';

interface StorefrontHomeProps {
  settings: StoreSettings;
  categories: Category[];
  products: Product[];
  banners: Banner[];
  testimonials: Testimonial[];
  loading: boolean;
  activeFilter: string;
  searchQuery: string;
  wishlistIds: number[];
  onFilterChange: (filter: string) => void;
  onSearchChange: (q: string) => void;
  onToggleWishlist: (id: number) => void;
  onViewProduct: (slug: string) => void;
}

function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const diff = Math.max(0, new Date(targetDate).getTime() - now);
  if (diff <= 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  const units = [
    { label: 'Hari', val: days },
    { label: 'Jam', val: hours },
    { label: 'Menit', val: minutes },
    { label: 'Detik', val: seconds },
  ];

  return (
    <div className="flex items-center gap-2.5 sm:gap-3 pt-1">
      {units.map((u) => (
        <div
          key={u.label}
          className="bg-white/90 border border-[#D8C3AD]/60 rounded-lg px-3 py-2 min-w-[58px] text-center"
        >
          <div className="font-serif text-lg sm:text-xl font-semibold text-[#493B34] tabular-nums leading-none">
            {String(u.val).padStart(2, '0')}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-[#9C7965] mt-1">
            {u.label}
          </div>
        </div>
      ))}
    </div>
  );
}

export function StorefrontHome({
  settings,
  categories,
  products,
  banners,
  testimonials,
  loading,
  activeFilter,
  searchQuery,
  wishlistIds,
  onFilterChange,
  onSearchChange,
  onToggleWishlist,
  onViewProduct,
}: StorefrontHomeProps) {
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'newest'>('featured');
  const [visibleCount, setVisibleCount] = useState(8);

  const heroBanner = useMemo(
    () => banners.find((b) => b.placement === 'hero') || null,
    [banners]
  );

  const promoBanner = useMemo(
    () => banners.find((b) => b.placement === 'promo') || null,
    [banners]
  );

  const heroImageUrl =
    heroBanner?.imageUrl ||
    settings.heroBannerUrl ||
    '/src/assets/images/hero_belma_skincare_1794911225042.jpg';

  const heroTitle = heroBanner?.title || settings.tagline || 'Reveal Your Natural Beauty';
  const heroSubtitle =
    heroBanner?.subtitle || 'Discover your beauty essentials with Belma Beauty.';
  const heroCta = heroBanner?.ctaText || 'SHOP NOW';

  // Category cards: DB active categories + Best Seller + New Arrival
  const categoryCards = useMemo(() => {
    const dbCards = categories.map((cat) => ({
      key: cat.slug,
      name: cat.name,
      description: cat.description || 'Koleksi perawatan kulit pilihan.',
      imageUrl: cat.imageUrl || '/src/assets/images/prod_brightening_serum_1794911226187.jpg',
    }));

    const specialCards = [
      {
        key: 'best-seller',
        name: 'Best Seller',
        description: 'Formula favorit yang paling dicintai pelanggan kami.',
        imageUrl: '/src/assets/images/prod_moisturizing_cream_1794911226731.jpg',
      },
      {
        key: 'new-arrival',
        name: 'New Arrival',
        description: 'Inovasi terbaru dalam rutinitas kecantikan harian Anda.',
        imageUrl: '/src/assets/images/prod_acne_calming_serum_1794911226662.jpg',
      },
    ];

    return [...dbCards, ...specialCards];
  }, [categories]);

  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (activeFilter === 'best-seller') {
      list = list.filter((p) => p.isBestSeller);
    } else if (activeFilter === 'new-arrival') {
      list = list.filter((p) => p.isNewArrival);
    } else if (activeFilter === 'promo') {
      list = list.filter((p) => getDiscountPercent(p.price, p.discountPrice) > 0);
    } else if (activeFilter !== 'all') {
      list = list.filter((p) => p.categorySlug === activeFilter);
    }

    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.categoryName || '').toLowerCase().includes(q) ||
          p.shortDescription.toLowerCase().includes(q) ||
          p.ingredients.toLowerCase().includes(q)
      );
    }

    if (sortBy === 'price-asc') {
      list.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
    } else if (sortBy === 'newest') {
      list.sort((a, b) => b.id - a.id);
    } else {
      list.sort((a, b) => a.sortOrder - b.sortOrder);
    }

    return list;
  }, [products, activeFilter, searchQuery, sortBy]);

  const displayedProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  const scrollToCatalog = (filterKey?: string) => {
    if (filterKey) {
      onFilterChange(filterKey);
      setVisibleCount(8);
    }
    const el = document.getElementById('catalog');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <main>
      {/* ============================================================
          B. HERO SECTION
         ============================================================ */}
      <section className="relative overflow-hidden bg-[#E9DDD1]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 items-stretch min-h-[520px] lg:min-h-[600px]">
          {/* Left Copy Column */}
          <div className="lg:col-span-6 flex flex-col justify-center px-6 sm:px-10 lg:px-12 py-12 lg:py-20 relative z-10 bg-[#F8F4EE]">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#9C7965] mb-4">
              {heroBanner?.badgeText || 'Clinical Botanical Skincare'}
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-[3.5rem] font-semibold text-[#493B34] leading-[1.12] tracking-tight mb-5 [text-wrap:balance]">
              {heroTitle}
            </h1>
            <p className="text-sm sm:text-base text-[#493B34]/80 leading-relaxed max-w-lg mb-8">
              {heroSubtitle}
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => scrollToCatalog('all')}
                className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-lg bg-[#493B34] hover:bg-[#9C7965] text-white text-xs sm:text-sm font-medium tracking-[0.14em] uppercase transition-colors duration-200 whitespace-nowrap"
              >
                <span>{heroCta}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollToCatalog('best-seller')}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg border border-[#D8C3AD] text-[#493B34] hover:bg-[#E9DDD1]/60 text-xs sm:text-sm font-medium tracking-[0.1em] uppercase transition-colors duration-200 whitespace-nowrap"
              >
                Best Sellers
              </button>
            </div>
          </div>

          {/* Right Editorial Visual Column */}
          <div className="lg:col-span-6 relative min-h-[300px] sm:min-h-[400px] lg:min-h-full">
            <SafeImage
              src={heroImageUrl}
              alt={heroTitle}
              className="w-full h-full object-cover lg:absolute lg:inset-0"
            />
          </div>
        </div>
      </section>

      {/* ============================================================
          C. CATEGORY SECTION
         ============================================================ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-10">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#9C7965] font-medium mb-2">
              Curated Categories
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#493B34]">
              Jelajahi Kebutuhan Kulit Anda
            </h2>
          </div>
          <button
            type="button"
            onClick={() => scrollToCatalog('all')}
            className="text-xs font-medium uppercase tracking-[0.14em] text-[#9C7965] hover:text-[#493B34] inline-flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span>Lihat Semua Koleksi</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5">
          {categoryCards.map((cat) => {
            const isSelected = activeFilter === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => scrollToCatalog(cat.key)}
                className={`group text-left rounded-xl overflow-hidden bg-white border transition-all duration-200 flex flex-col ${
                  isSelected
                    ? 'border-[#9C7965] ring-1 ring-[#9C7965]'
                    : 'border-[#D8C3AD]/45 hover:border-[#9C7965]/70'
                }`}
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-[#F8F4EE]">
                  <SafeImage
                    src={cat.imageUrl}
                    alt={cat.name}
                    fallbackLabel={cat.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-3.5 flex-1 flex flex-col justify-between">
                  <h3 className="font-serif text-sm sm:text-base font-semibold text-[#493B34] group-hover:text-[#9C7965] transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-[11px] text-[#493B34]/70 line-clamp-2 mt-1 leading-relaxed">
                    {cat.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ============================================================
          D. PRODUCT CATALOG SECTION (4 cols desktop, 3 tablet, 2 mobile)
         ============================================================ */}
      <section id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#D8C3AD]/45">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#9C7965] font-medium mb-2">
              The Collection
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#493B34]">
              Rangkaian Produk Belma Beauty
            </h2>
          </div>

          {/* Search & Sort Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-[#9C7965] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  setVisibleCount(8);
                }}
                placeholder="Cari serum, cream, sunscreen..."
                className="w-full sm:w-64 pl-9 pr-8 py-2 rounded-lg bg-white border border-[#D8C3AD]/70 text-sm text-[#493B34] placeholder:text-[#9C7965]/70 focus:outline-none focus:border-[#9C7965]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  aria-label="Hapus pencarian"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9C7965] hover:text-[#493B34]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="relative flex items-center">
              <SlidersHorizontal className="w-4 h-4 text-[#9C7965] absolute left-3 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                aria-label="Urutkan produk"
                className="w-full sm:w-auto pl-9 pr-8 py-2 rounded-lg bg-white border border-[#D8C3AD]/70 text-sm text-[#493B34] focus:outline-none focus:border-[#9C7965]"
              >
                <option value="featured">Urutan Unggulan</option>
                <option value="price-asc">Harga Terendah</option>
                <option value="price-desc">Harga Tertinggi</option>
                <option value="newest">Produk Terbaru</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto py-4 no-scrollbar">
          {[
            { key: 'all', label: 'Semua Produk' },
            ...categories.map((c) => ({ key: c.slug, label: c.name })),
            { key: 'best-seller', label: 'Best Seller' },
            { key: 'new-arrival', label: 'New Arrival' },
            { key: 'promo', label: 'Promo' },
          ].map((tab) => {
            const active = activeFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  onFilterChange(tab.key);
                  setVisibleCount(8);
                }}
                className={`px-4 py-2 rounded-lg text-xs font-medium tracking-wide transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-[#493B34] text-white'
                    : 'bg-white border border-[#D8C3AD]/60 text-[#493B34] hover:bg-[#E9DDD1]/60'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Product Grid: 2 mobile, 3 tablet, 4 desktop */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 pt-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-[#D8C3AD]/40 overflow-hidden animate-pulse"
              >
                <div className="aspect-[4/3] bg-[#E9DDD1]/70" />
                <div className="p-5 space-y-3">
                  <div className="h-3 w-20 bg-[#E9DDD1] rounded" />
                  <div className="h-5 w-3/4 bg-[#E9DDD1] rounded" />
                  <div className="h-3 w-full bg-[#E9DDD1]/70 rounded" />
                  <div className="h-9 w-full bg-[#E9DDD1] rounded-lg mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : displayedProducts.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#D8C3AD]/50 py-16 px-6 text-center mt-4">
            <Sparkles className="w-8 h-8 text-[#9C7965] mx-auto mb-3 opacity-80" />
            <h3 className="font-serif text-xl font-semibold text-[#493B34] mb-1">
              Produk Tidak Ditemukan
            </h3>
            <p className="text-sm text-[#493B34]/75 max-w-md mx-auto mb-6">
              Tidak ada produk yang cocok dengan filter atau kata kunci pencarian Anda saat ini.
            </p>
            <button
              type="button"
              onClick={() => {
                onFilterChange('all');
                onSearchChange('');
              }}
              className="px-5 py-2.5 rounded-lg bg-[#493B34] text-white text-xs font-medium tracking-wider uppercase hover:bg-[#9C7965] transition-colors"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 pt-4">
              {displayedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isWishlisted={wishlistIds.includes(product.id)}
                  onToggleWishlist={onToggleWishlist}
                  onViewDetail={onViewProduct}
                />
              ))}
            </div>

            {hasMore && (
              <div className="mt-10 text-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + 8)}
                  className="px-8 py-3 rounded-lg border border-[#493B34] text-[#493B34] hover:bg-[#493B34] hover:text-white text-xs font-medium tracking-[0.14em] uppercase transition-colors"
                >
                  Muat Lebih Banyak ({filteredProducts.length - displayedProducts.length} lainnya)
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* ============================================================
          G. PROMO BANNER SECTION
         ============================================================ */}
      {promoBanner && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24">
          <div className="rounded-2xl overflow-hidden bg-[#E9DDD1] border border-[#D8C3AD]/60 grid grid-cols-1 lg:grid-cols-12 items-stretch">
            <div className="lg:col-span-6 relative min-h-[260px] sm:min-h-[340px]">
              <SafeImage
                src={promoBanner.imageUrl}
                alt={promoBanner.title}
                className="w-full h-full object-cover lg:absolute lg:inset-0"
              />
            </div>

            <div className="lg:col-span-6 p-7 sm:p-10 lg:p-14 flex flex-col justify-center space-y-5">
              {promoBanner.badgeText && (
                <p className="text-xs uppercase tracking-[0.2em] text-[#9C7965] font-medium">
                  {promoBanner.badgeText}
                </p>
              )}
              <h2 className="font-serif text-2xl sm:text-4xl font-semibold text-[#493B34] leading-tight [text-wrap:balance]">
                {promoBanner.title}
              </h2>
              {promoBanner.subtitle && (
                <p className="text-sm sm:text-base text-[#493B34]/80 leading-relaxed">
                  {promoBanner.subtitle}
                </p>
              )}

              {promoBanner.countdownEndAt && (
                <CountdownTimer targetDate={promoBanner.countdownEndAt} />
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => scrollToCatalog('promo')}
                  className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-lg bg-[#493B34] hover:bg-[#9C7965] text-white text-xs font-medium tracking-[0.14em] uppercase transition-colors"
                >
                  <span>{promoBanner.ctaText || 'SHOP NOW'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ============================================================
          H. TESTIMONIAL SECTION
         ============================================================ */}
      {testimonials.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
            <p className="text-xs uppercase tracking-[0.2em] text-[#9C7965] font-medium mb-2">
              Real Stories
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#493B34]">
              Dipercaya untuk Kulit Sehat Bercahaya
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <article
                key={t.id}
                className="bg-white rounded-xl border border-[#D8C3AD]/45 p-6 sm:p-7 flex flex-col justify-between gap-6"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-1 text-[#9C7965]" aria-label={`Rating ${t.rating} dari 5`}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < t.rating ? 'fill-[#9C7965] text-[#9C7965]' : 'text-[#D8C3AD]'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-[#493B34]/85 leading-relaxed italic">
                    “{t.review}”
                  </p>
                </div>

                <div className="flex items-center gap-3.5 pt-4 border-t border-[#E9DDD1]">
                  {t.avatarUrl ? (
                    <img
                      src={t.avatarUrl}
                      alt={t.customerName}
                      referrerPolicy="no-referrer"
                      className="w-11 h-11 rounded-full object-cover border border-[#D8C3AD]"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-[#E9DDD1] text-[#493B34] font-serif font-semibold flex items-center justify-center text-sm shrink-0">
                      {t.customerName
                        .split(' ')
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#493B34] truncate">
                      {t.customerName}
                    </p>
                    <p className="text-xs text-[#9C7965] truncate">
                      {t.productName || t.customerRole || 'Verified Buyer'}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
