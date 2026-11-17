import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, X, Heart, Trash2, ArrowRight, RefreshCw } from 'lucide-react';
import type { StoreSettings, StorefrontData } from './types/store';
import { formatIDR, getEffectivePrice } from './lib/format';
import { ToastProvider, useToast } from './components/ToastContext';
import { StoreHeader } from './components/StoreHeader';
import { StoreFooter } from './components/StoreFooter';
import { StorefrontHome } from './components/StorefrontHome';
import { ProductDetailPage } from './components/ProductDetailPage';
import { AboutPage, ContactPage } from './components/StaticPages';
import { SafeImage } from './components/SafeImage';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ResellerPortal } from './components/ResellerPortal';

const DEFAULT_SETTINGS: StoreSettings = {
  id: 1,
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
  storeAddress: 'Jl. Senopati No. 88, Kebayoran Baru, Jakarta Selatan',
  seoTitle: 'BELMA BEAUTY — Reveal Your Natural Beauty',
  seoDescription: 'Discover your beauty essentials with Belma Beauty.',
  heroBannerUrl: '/src/assets/images/hero_belma_skincare_1794911225042.jpg',
};

function BelmaAppContent() {
  const { showToast } = useToast();
  const [pathname, setPathname] = useState(() => window.location.pathname || '/');
  const [storeData, setStoreData] = useState<StorefrontData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [modalSearchText, setModalSearchText] = useState('');
  const [wishlistOpen, setWishlistOpen] = useState(false);

  const [wishlistIds, setWishlistIds] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('belma_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const loadStorefront = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const res = await fetch('/api/storefront');
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Gagal memuat etalase toko.');
      }
      const data: StorefrontData = await res.json();
      setStoreData(data);
    } catch (err: any) {
      setFetchError(err.message || 'Gagal terhubung ke server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStorefront();
  }, [loadStorefront]);

  useEffect(() => {
    const onPopState = () => {
      setPathname(window.location.pathname || '/');
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const settings = storeData?.settings || DEFAULT_SETTINGS;

  // Sync SEO title & favicon dynamically from CMS settings
  useEffect(() => {
    if (settings.seoTitle) {
      document.title = settings.seoTitle;
    }
    if (settings.faviconUrl) {
      let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = settings.faviconUrl;
    }
  }, [settings.seoTitle, settings.faviconUrl]);

  const navigate = useCallback((target: string, categoryFilter?: string) => {
    if (target.startsWith('/#')) {
      const hashId = target.slice(2);
      if (window.location.pathname !== '/') {
        window.history.pushState({}, '', '/');
        setPathname('/');
      }
      if (categoryFilter) {
        setActiveFilter(categoryFilter);
      }
      setTimeout(() => {
        document.getElementById(hashId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
      return;
    }

    if (categoryFilter) {
      setActiveFilter(categoryFilter);
    }
    window.history.pushState({}, '', target);
    setPathname(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const toggleWishlist = (id: number) => {
    setWishlistIds((prev) => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter((i) => i !== id) : [...prev, id];
      try {
        localStorage.setItem('belma_wishlist', JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      showToast(exists ? 'Dihapus dari daftar favorit.' : 'Disimpan ke daftar favorit.');
      return next;
    });
  };

  const products = storeData?.products || [];
  const categories = storeData?.categories || [];
  const banners = storeData?.banners || [];
  const testimonials = storeData?.testimonials || [];
  const pages = storeData?.pages || [];

  const wishlistProducts = useMemo(
    () => products.filter((p) => wishlistIds.includes(p.id)),
    [products, wishlistIds]
  );

  const modalSearchResults = useMemo(() => {
    const q = modalSearchText.trim().toLowerCase();
    if (!q) return products.slice(0, 5);
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.categoryName || '').toLowerCase().includes(q) ||
          p.shortDescription.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [products, modalSearchText]);

  // Admin Route
  if (pathname.startsWith('/admin')) {
    return (
      <AdminDashboard
        onExitToStore={() => navigate('/')}
        onStorefrontUpdated={loadStorefront}
      />
    );
  }

  // Reseller Portal Route
  if (pathname.startsWith('/reseller')) {
    return <ResellerPortal onExitToStore={() => navigate('/')} />;
  }

  // Product Detail Route (/product/:slug)
  const isProductRoute = pathname.startsWith('/product/');
  const productSlug = isProductRoute ? pathname.replace('/product/', '').split('/')[0] : '';

  const aboutPage = pages.find((p) => p.slug === 'about-us');
  const contactPage = pages.find((p) => p.slug === 'contact');

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F4EE] text-[#493B34]">
      <StoreHeader
        settings={settings}
        currentPath={pathname}
        wishlistCount={wishlistProducts.length}
        onNavigate={navigate}
        onOpenSearch={() => setSearchModalOpen(true)}
        onOpenWishlist={() => setWishlistOpen(true)}
      />

      {fetchError && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 w-full">
          <div className="rounded-xl bg-[#FFF5F5] border border-[#E5A9A9] p-4 flex items-center justify-between gap-4">
            <p className="text-sm text-[#7A2727]">{fetchError}</p>
            <button
              type="button"
              onClick={loadStorefront}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#7A2727] text-white text-xs font-medium shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Coba Lagi</span>
            </button>
          </div>
        </div>
      )}

      <div className="flex-1">
        {isProductRoute ? (
          <ProductDetailPage
            slug={productSlug}
            settings={settings}
            wishlistIds={wishlistIds}
            onToggleWishlist={toggleWishlist}
            onNavigate={navigate}
          />
        ) : pathname === '/about' ? (
          <AboutPage page={aboutPage} onNavigate={navigate} />
        ) : pathname === '/contact' ? (
          <ContactPage
            page={contactPage}
            settings={settings}
            products={products}
            onNavigate={navigate}
          />
        ) : (
          <StorefrontHome
            settings={settings}
            categories={categories}
            products={products}
            banners={banners}
            testimonials={testimonials}
            loading={loading}
            activeFilter={activeFilter}
            searchQuery={searchQuery}
            wishlistIds={wishlistIds}
            onFilterChange={setActiveFilter}
            onSearchChange={setSearchQuery}
            onToggleWishlist={toggleWishlist}
            onViewProduct={(slug) => navigate(`/product/${slug}`)}
          />
        )}
      </div>

      <StoreFooter settings={settings} onNavigate={navigate} />

      {/* Search Overlay Modal */}
      {searchModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#493B34]/50 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-24 p-4"
          onClick={() => setSearchModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl border border-[#D8C3AD] w-full max-w-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#E9DDD1]">
              <Search className="w-5 h-5 text-[#9C7965] shrink-0" />
              <input
                type="text"
                autoFocus
                value={modalSearchText}
                onChange={(e) => setModalSearchText(e.target.value)}
                placeholder="Cari produk Belma Beauty (serum, sunscreen, cream)..."
                className="flex-1 text-sm text-[#493B34] placeholder:text-[#9C7965] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setSearchModalOpen(false)}
                aria-label="Tutup pencarian"
                className="p-1.5 text-[#9C7965] hover:text-[#493B34]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto divide-y divide-[#E9DDD1]">
              {modalSearchResults.length === 0 ? (
                <div className="py-10 text-center text-sm text-[#9C7965]">
                  Produk tidak ditemukan untuk kata kunci “{modalSearchText}”.
                </div>
              ) : (
                modalSearchResults.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSearchModalOpen(false);
                      navigate(`/product/${p.slug}`);
                    }}
                    className="w-full flex items-center gap-4 p-3.5 hover:bg-[#F8F4EE] text-left transition-colors"
                  >
                    <div className="w-14 h-12 rounded-lg overflow-hidden bg-[#F8F4EE] shrink-0">
                      <SafeImage
                        src={p.images?.[0]?.imageUrl}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs uppercase tracking-wider text-[#9C7965]">
                        {p.categoryName}
                      </p>
                      <p className="font-serif text-base font-semibold text-[#493B34] truncate">
                        {p.name}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-[#493B34] tabular-nums shrink-0">
                      {formatIDR(getEffectivePrice(p))}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Saved / Wishlist Drawer */}
      {wishlistOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-[#493B34]/45"
            onClick={() => setWishlistOpen(false)}
          />
          <aside className="relative w-full max-w-md bg-[#F8F4EE] h-full flex flex-col z-10 shadow-2xl border-l border-[#D8C3AD]">
            <div className="px-6 py-4 bg-white border-b border-[#E9DDD1] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-[#9C7965] fill-[#9C7965]" />
                <h2 className="font-serif text-lg font-semibold text-[#493B34]">
                  Produk Tersimpan ({wishlistProducts.length})
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setWishlistOpen(false)}
                aria-label="Tutup daftar favorit"
                className="p-1.5 text-[#9C7965] hover:text-[#493B34]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {wishlistProducts.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <Heart className="w-8 h-8 text-[#D8C3AD] mx-auto" />
                  <p className="font-serif text-lg text-[#493B34]">Belum Ada Produk Tersimpan</p>
                  <p className="text-xs text-[#9C7965] max-w-xs mx-auto">
                    Ketuk ikon hati pada produk favorit Anda untuk menyimpannya di sini.
                  </p>
                </div>
              ) : (
                wishlistProducts.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white rounded-xl border border-[#D8C3AD]/60 p-3.5 flex items-center gap-3.5"
                  >
                    <div className="w-16 h-14 rounded-lg overflow-hidden bg-[#F8F4EE] shrink-0">
                      <SafeImage
                        src={p.images?.[0]?.imageUrl}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => {
                          setWishlistOpen(false);
                          navigate(`/product/${p.slug}`);
                        }}
                        className="font-serif text-sm font-semibold text-[#493B34] hover:text-[#9C7965] text-left truncate block w-full"
                      >
                        {p.name}
                      </button>
                      <p className="text-xs font-medium text-[#9C7965] tabular-nums mt-0.5">
                        {formatIDR(getEffectivePrice(p))}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setWishlistOpen(false);
                          navigate(`/product/${p.slug}`);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-[#493B34] mt-1.5 hover:underline"
                      >
                        <span>Pilih Platform Beli</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleWishlist(p.id)}
                      aria-label={`Hapus ${p.name}`}
                      className="p-1.5 text-[#9C7965] hover:text-[#B91C1C]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <BelmaAppContent />
    </ToastProvider>
  );
}
