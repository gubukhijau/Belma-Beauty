import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Loader2,
  Lock,
  LogOut,
  MapPin,
  Mail,
  Package,
  Phone,
  Search,
  ShieldCheck,
  ShieldAlert,
  User,
} from 'lucide-react';
import type { Category, Product, ResellerAccount, StoreSettings } from '../types/store';
import { formatDateShort, formatIDR, getEffectivePrice } from '../lib/format';
import { SafeImage } from './SafeImage';
import { WhatsAppIcon } from './PurchaseButtons';
import { useToast } from './ToastContext';

interface ResellerPortalProps {
  onExitToStore: () => void;
}

type ResellerTab = 'products' | 'profile';

export function ResellerPortal({ onExitToStore }: ResellerPortalProps) {
  const { showToast } = useToast();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [reseller, setReseller] = useState<ResellerAccount | null>(null);
  const [isActiveReseller, setIsActiveReseller] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState<ResellerTab>('products');
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const loadResellerCatalog = useCallback(async (tokenOverride?: string | null) => {
    setLoadingProducts(true);
    try {
      const headers: Record<string, string> = {};
      const token = tokenOverride ?? authToken;
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/reseller/products', { headers });
      if (res.status === 401) {
        setReseller(null);
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memuat katalog reseller.');

      setReseller(data.reseller);
      setIsActiveReseller(Boolean(data.isActiveReseller));
      setProducts(data.products || []);
      setCategories(data.categories || []);
      setSettings(data.settings || null);
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat data reseller.', 'error');
    } finally {
      setLoadingProducts(false);
    }
  }, [authToken, showToast]);

  useEffect(() => {
    fetch('/api/reseller/me')
      .then(async (res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (data?.reseller) {
          setReseller(data.reseller);
          loadResellerCatalog(null);
        }
      })
      .finally(() => setCheckingAuth(false));
  }, [loadResellerCatalog]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await fetch('/api/reseller/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login gagal.');

      setAuthToken(data.token);
      setReseller(data.reseller);
      showToast(`Selamat datang, ${data.reseller.name}`);
      await loadResellerCatalog(data.token);
    } catch (err: any) {
      setLoginError(err.message || 'Email atau kata sandi salah.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/reseller/logout', { method: 'POST' });
    } finally {
      setReseller(null);
      setAuthToken(null);
      setProducts([]);
      setIsActiveReseller(false);
      showToast('Anda telah keluar dari Portal Reseller.');
    }
  };

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const matchCat = selectedCategory === 'all' || String(p.categoryId) === selectedCategory;
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.categoryName || '').toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [products, searchQuery, selectedCategory]);

  const buildOrderWhatsAppUrl = (product: Product, displayPrice: number) => {
    const rawPhone = (settings?.whatsappNumber || '6281234567890').replace(/[^0-9]/g, '');
    const formattedPhone = rawPhone.startsWith('0') ? `62${rawPhone.slice(1)}` : rawPhone;
    const priceFormatted = formatIDR(displayPrice);

    const text = isActiveReseller
      ? `Halo Belma Beauty, saya Reseller ${reseller?.name || ''} (${reseller?.tierCode || 'RESELLER'}) ingin memesan ${product.name} dengan harga reseller ${priceFormatted}. Apakah stok tersedia?`
      : `Halo Belma Beauty, saya ingin membeli ${product.name} dengan harga ${priceFormatted}. Apakah produk masih tersedia?`;

    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#F8F4EE] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-[#9C7965]">
          <Loader2 className="w-7 h-7 animate-spin" />
          <p className="text-xs uppercase tracking-[0.2em]">Memuat Portal Reseller...</p>
        </div>
      </div>
    );
  }

  // Reseller Login Gate (NO self-registration)
  if (!reseller) {
    return (
      <div className="min-h-screen bg-[#F8F4EE] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl border border-[#D8C3AD]/70 p-7 sm:p-9 shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="w-11 h-11 rounded-full bg-[#E9DDD1] text-[#493B34] flex items-center justify-center mx-auto">
              <Lock className="w-5 h-5" />
            </div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#9C7965] font-medium">
              BELMA BEAUTY
            </p>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#493B34]">
              Portal Khusus Reseller
            </h1>
            <p className="text-xs text-[#493B34]/75 leading-relaxed">
              Masuk menggunakan akun yang telah didaftarkan oleh Admin Belma Beauty. Pendaftaran akun reseller tidak tersedia secara mandiri.
            </p>
          </div>

          {loginError && (
            <div className="rounded-lg bg-[#FFF5F5] border border-[#E5A9A9] p-3 text-xs text-[#B91C1C]">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#493B34] mb-1">
                Email Reseller
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="reseller@belmabeauty.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#D8C3AD] text-sm focus:outline-none focus:border-[#9C7965]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#493B34] mb-1">Kata Sandi</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#D8C3AD] text-sm focus:outline-none focus:border-[#9C7965]"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 rounded-lg bg-[#493B34] hover:bg-[#9C7965] disabled:opacity-50 text-white text-xs font-medium tracking-[0.14em] uppercase transition-colors"
            >
              {loginLoading ? 'Memverifikasi...' : 'Masuk Portal Reseller'}
            </button>
          </form>

          <div className="rounded-xl bg-[#F8F4EE] border border-[#E9DDD1] p-3.5 text-xs text-[#493B34]/80 space-y-2">
            <p className="font-medium text-[#493B34]">Akun Demo Terdaftar Admin:</p>
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#E9DDD1]">
              <div>
                <p className="font-medium text-[#1F7A4C]">Reseller Aktif (Harga Reseller)</p>
                <p className="text-[11px] text-[#9C7965] tabular-nums">reseller@belmabeauty.com</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setLoginEmail('reseller@belmabeauty.com');
                  setLoginPassword('BelmaReseller2026!');
                }}
                className="text-[11px] font-medium text-[#493B34] underline shrink-0"
              >
                Isi Akun Aktif
              </button>
            </div>
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#E9DDD1]">
              <div>
                <p className="font-medium text-[#9C7965]">Reseller Nonaktif (Harga Toko)</p>
                <p className="text-[11px] text-[#9C7965] tabular-nums">pending@belmabeauty.com</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setLoginEmail('pending@belmabeauty.com');
                  setLoginPassword('BelmaReseller2026!');
                }}
                className="text-[11px] font-medium text-[#493B34] underline shrink-0"
              >
                Isi Akun Nonaktif
              </button>
            </div>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={onExitToStore}
              className="inline-flex items-center gap-1.5 text-xs text-[#9C7965] hover:text-[#493B34] underline underline-offset-4"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Halaman Toko</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F4EE] text-[#493B34] flex flex-col">
      {/* Restricted Reseller Header: ONLY All Produk + Profil + Exit/Logout */}
      <header className="sticky top-0 z-40 bg-[#F8F4EE]/95 backdrop-blur-md border-b border-[#D8C3AD]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-serif text-lg sm:text-xl font-semibold tracking-[0.16em] text-[#493B34] whitespace-nowrap">
              {settings?.storeName || 'BELMA BEAUTY'}
            </span>
            <span className="hidden sm:inline-block text-xs uppercase tracking-[0.16em] text-[#9C7965] border-l border-[#D8C3AD] pl-3">
              Reseller Portal
            </span>
          </div>

          {/* Exclusively 2 views: All Produk and Profil */}
          <nav className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('products')}
              className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'products'
                  ? 'bg-[#493B34] text-white'
                  : 'text-[#493B34] hover:bg-[#E9DDD1]/70'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>All Produk</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'profile'
                  ? 'bg-[#493B34] text-white'
                  : 'text-[#493B34] hover:bg-[#E9DDD1]/70'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Profil</span>
            </button>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onExitToStore}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#D8C3AD] text-xs font-medium text-[#493B34] hover:bg-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Ke Toko</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E5A9A9] text-xs font-medium text-[#B91C1C] hover:bg-[#FFF5F5] transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
        {/* Role & Pricing Status Banner */}
        <div
          className={`rounded-xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            isActiveReseller
              ? 'bg-white border-[#1F7A4C]/35'
              : 'bg-white border-[#D8C3AD]'
          }`}
        >
          <div className="flex items-start sm:items-center gap-3.5">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                isActiveReseller
                  ? 'bg-[#E9F5EE] text-[#1F7A4C]'
                  : 'bg-[#F8F4EE] text-[#9C7965]'
              }`}
            >
              {isActiveReseller ? (
                <ShieldCheck className="w-5 h-5" />
              ) : (
                <ShieldAlert className="w-5 h-5" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-[#493B34]">
                {reseller.name} —{' '}
                <span className={isActiveReseller ? 'text-[#1F7A4C]' : 'text-[#9C7965]'}>
                  {isActiveReseller ? 'Role Reseller Aktif' : 'Bukan Reseller Aktif'}
                </span>
              </p>
              <p className="text-xs text-[#493B34]/75 mt-0.5">
                {isActiveReseller
                  ? 'Seluruh katalog menampilkan Harga Khusus Reseller yang telah ditentukan oleh Admin Belma Beauty.'
                  : 'Akun Anda berstatus nonaktif atau bukan role reseller aktif. Harga produk pada katalog menyesuaikan dengan Harga Toko normal.'}
              </p>
            </div>
          </div>

          <div className="text-xs text-[#9C7965] shrink-0 sm:text-right">
            <p className="uppercase tracking-wider font-medium">{reseller.tierCode}</p>
            <p className="tabular-nums mt-0.5">{reseller.email}</p>
          </div>
        </div>

        {activeTab === 'profile' ? (
          /* PROFILE SECTION ONLY */
          <section className="max-w-3xl bg-white rounded-2xl border border-[#D8C3AD]/60 p-6 sm:p-8 space-y-6">
            <div className="border-b border-[#E9DDD1] pb-5">
              <p className="text-xs uppercase tracking-[0.2em] text-[#9C7965] mb-1">
                Profil Akun
              </p>
              <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#493B34]">
                {reseller.name}
              </h1>
              <p className="text-xs text-[#9C7965] mt-1">
                Akun terdaftar secara resmi oleh Administrator Belma Beauty
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
              <div className="rounded-xl bg-[#F8F4EE] border border-[#E9DDD1] p-4 space-y-1">
                <p className="text-[11px] uppercase tracking-wider text-[#9C7965] flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email Login</span>
                </p>
                <p className="font-medium text-[#493B34]">{reseller.email}</p>
              </div>

              <div className="rounded-xl bg-[#F8F4EE] border border-[#E9DDD1] p-4 space-y-1">
                <p className="text-[11px] uppercase tracking-wider text-[#9C7965] flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  <span>No. Telepon / WhatsApp</span>
                </p>
                <p className="font-medium text-[#493B34] tabular-nums">
                  {reseller.phone || '-'}
                </p>
              </div>

              <div className="rounded-xl bg-[#F8F4EE] border border-[#E9DDD1] p-4 space-y-1">
                <p className="text-[11px] uppercase tracking-wider text-[#9C7965] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Kota / Area Distribusi</span>
                </p>
                <p className="font-medium text-[#493B34]">{reseller.city || '-'}</p>
              </div>

              <div className="rounded-xl bg-[#F8F4EE] border border-[#E9DDD1] p-4 space-y-1">
                <p className="text-[11px] uppercase tracking-wider text-[#9C7965]">
                  Kode Tier & Role
                </p>
                <p className="font-medium text-[#493B34] uppercase">
                  {reseller.tierCode} · Role: {reseller.role}
                </p>
              </div>

              <div className="rounded-xl bg-[#F8F4EE] border border-[#E9DDD1] p-4 space-y-1">
                <p className="text-[11px] uppercase tracking-wider text-[#9C7965]">
                  Status Harga Katalog
                </p>
                <p
                  className={`font-semibold ${
                    isActiveReseller ? 'text-[#1F7A4C]' : 'text-[#9C7965]'
                  }`}
                >
                  {isActiveReseller
                    ? 'Reseller Aktif (Harga Khusus Reseller)'
                    : 'Nonaktif (Mengikuti Harga Toko)'}
                </p>
              </div>

              <div className="rounded-xl bg-[#F8F4EE] border border-[#E9DDD1] p-4 space-y-1">
                <p className="text-[11px] uppercase tracking-wider text-[#9C7965]">
                  Terdaftar Sejak
                </p>
                <p className="font-medium text-[#493B34] tabular-nums">
                  {formatDateShort(reseller.createdAt)}
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-4 border-t border-[#E9DDD1]">
              <button
                type="button"
                onClick={() => setActiveTab('products')}
                className="px-5 py-2.5 rounded-lg bg-[#493B34] hover:bg-[#9C7965] text-white text-xs font-medium uppercase tracking-wider transition-colors"
              >
                Lihat All Produk
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="px-4 py-2.5 rounded-lg border border-[#E5A9A9] text-xs font-medium text-[#B91C1C] hover:bg-[#FFF5F5]"
              >
                Keluar Akun
              </button>
            </div>
          </section>
        ) : (
          /* ALL PRODUK SECTION ONLY */
          <section className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#9C7965] mb-1">
                  Katalog Partner Belma Beauty
                </p>
                <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#493B34]">
                  All Produk — {isActiveReseller ? 'Harga Reseller' : 'Harga Toko'}
                </h1>
              </div>

              {/* Search & Category Filter */}
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 text-[#9C7965] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama produk atau SKU..."
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-[#D8C3AD] text-sm focus:outline-none focus:border-[#9C7965]"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-white border border-[#D8C3AD] text-sm"
                >
                  <option value="all">Semua Kategori</option>
                  {categories.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loadingProducts ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl border border-[#D8C3AD]/40 h-80 animate-pulse"
                  />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#D8C3AD]/60 p-12 text-center space-y-2">
                <p className="font-serif text-lg font-semibold text-[#493B34]">
                  Produk Tidak Ditemukan
                </p>
                <p className="text-xs text-[#9C7965]">
                  Coba ubah kata kunci pencarian atau filter kategori.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {filteredProducts.map((product) => {
                  const storePrice = getEffectivePrice(product);
                  const activeResellerPrice =
                    isActiveReseller && product.resellerPrice && product.resellerPrice > 0
                      ? product.resellerPrice
                      : null;
                  const finalPrice = activeResellerPrice ?? storePrice;
                  const savingsPct =
                    activeResellerPrice && storePrice > activeResellerPrice
                      ? Math.round(((storePrice - activeResellerPrice) / storePrice) * 100)
                      : 0;
                  const primaryImage = product.images?.[0]?.imageUrl;

                  return (
                    <article
                      key={product.id}
                      className="bg-white rounded-2xl border border-[#D8C3AD]/50 overflow-hidden flex flex-col justify-between hover:border-[#9C7965]/70 transition-colors"
                    >
                      <div>
                        <div className="aspect-[4/3] bg-[#F8F4EE] relative overflow-hidden">
                          <SafeImage
                            src={primaryImage}
                            alt={product.name}
                            fallbackLabel={product.name}
                            className="w-full h-full object-cover"
                          />
                          {activeResellerPrice && savingsPct > 0 && (
                            <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded bg-[#1F7A4C] text-white text-[10px] font-medium tracking-wider uppercase tabular-nums">
                              Hemat {savingsPct}% Reseller
                            </span>
                          )}
                          {product.stock <= 0 && (
                            <span className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded bg-[#493B34]/85 text-white text-[10px] font-medium uppercase">
                              Stok Habis
                            </span>
                          )}
                        </div>

                        <div className="p-4 space-y-2">
                          <div className="flex items-center justify-between gap-2 text-[11px] uppercase tracking-wider text-[#9C7965]">
                            <span className="truncate">{product.categoryName}</span>
                            <span className="tabular-nums shrink-0">{product.sizeVariant}</span>
                          </div>

                          <h3 className="font-serif text-base sm:text-lg font-semibold text-[#493B34] leading-snug line-clamp-2">
                            {product.name}
                          </h3>

                          <p className="text-[11px] text-[#9C7965] tabular-nums">
                            SKU: {product.sku} · Stok: {product.stock}
                          </p>

                          <p className="text-xs text-[#493B34]/75 line-clamp-2 leading-relaxed">
                            {product.shortDescription}
                          </p>
                        </div>
                      </div>

                      <div className="px-4 pb-4 pt-3 border-t border-[#E9DDD1] space-y-3">
                        {activeResellerPrice ? (
                          <div className="space-y-0.5 tabular-nums">
                            <p className="text-[11px] uppercase tracking-wider text-[#1F7A4C] font-medium">
                              Harga Khusus Reseller
                            </p>
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <span className="text-base sm:text-lg font-semibold text-[#493B34]">
                                {formatIDR(activeResellerPrice)}
                              </span>
                              {storePrice > activeResellerPrice && (
                                <span className="text-xs text-[#9C7965] line-through">
                                  Harga Toko {formatIDR(storePrice)}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-0.5 tabular-nums">
                            <p className="text-[11px] uppercase tracking-wider text-[#9C7965] font-medium">
                              Harga Toko
                            </p>
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <span className="text-base sm:text-lg font-semibold text-[#493B34]">
                                {formatIDR(storePrice)}
                              </span>
                              {product.discountPrice && product.discountPrice < product.price && (
                                <span className="text-xs text-[#9C7965] line-through">
                                  {formatIDR(product.price)}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        <a
                          href={buildOrderWhatsAppUrl(product, finalPrice)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2.5 px-3 rounded-lg bg-[#1F7A4C] hover:bg-[#17613B] text-white text-xs font-medium tracking-wider uppercase flex items-center justify-center gap-2 transition-colors"
                        >
                          <WhatsAppIcon className="w-4 h-4 shrink-0" />
                          <span>Order via WhatsApp</span>
                        </a>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
