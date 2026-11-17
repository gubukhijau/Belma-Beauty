import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  MessageSquareText,
  Image as ImageIcon,
  Star,
  FileText,
  Settings,
  LogOut,
  Plus,
  Search,
  Pencil,
  Trash2,
  ExternalLink,
  Menu,
  X,
  Lock,
  Loader2,
  AlertTriangle,
  Store,
  Truck,
} from 'lucide-react';
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleAuthProvider } from '../../lib/firebase';
import type {
  AdminUser,
  Banner,
  Category,
  CmsPage,
  CustomerAccount,
  CustomerOrder,
  DashboardOverview,
  Inquiry,
  Product,
  ResellerAccount,
  StoreSettings,
  Testimonial,
} from '../../types/store';
import { formatIDR, formatDateShort } from '../../lib/format';
import { SafeImage } from '../SafeImage';
import { useToast } from '../ToastContext';
import { AdminProductModal } from './AdminProductModal';
import {
  BannersManager,
  CategoriesManager,
  CustomerOrdersManager,
  InquiriesManager,
  PagesManager,
  ResellersManager,
  SettingsManager,
  TestimonialsManager,
} from './AdminCmsSections';

type AdminTab =
  | 'dashboard'
  | 'products'
  | 'categories'
  | 'customer-orders'
  | 'resellers'
  | 'inquiries'
  | 'banners'
  | 'testimonials'
  | 'pages'
  | 'settings';

interface AdminDashboardProps {
  onExitToStore: () => void;
  onStorefrontUpdated: () => void;
}

export function AdminDashboard({ onExitToStore, onStorefrontUpdated }: AdminDashboardProps) {
  const { showToast } = useToast();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // CMS state
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [resellersList, setResellersList] = useState<ResellerAccount[]>([]);
  const [customersList, setCustomersList] = useState<CustomerAccount[]>([]);
  const [customerOrdersList, setCustomerOrdersList] = useState<CustomerOrder[]>([]);

  // Products filter & modal
  const [prodSearch, setProdSearch] = useState('');
  const [prodCategoryFilter, setProdCategoryFilter] = useState('all');
  const [prodStatusFilter, setProdStatusFilter] = useState('all');
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const fetchHeaders = useCallback(
    (tokenOverride?: string | null): Record<string, string> => {
      const t = tokenOverride ?? authToken;
      return t ? { Authorization: `Bearer ${t}` } : {};
    },
    [authToken]
  );

  const loadAllCmsData = useCallback(
    async (tokenOverride?: string | null) => {
      setLoadingData(true);
      try {
        const headers = fetchHeaders(tokenOverride);
        const [
          ovRes,
          prodRes,
          catRes,
          banRes,
          testRes,
          pageRes,
          inqRes,
          setRes,
          usrRes,
          resRes,
          custRes,
          ordRes,
        ] = await Promise.all([
          fetch('/api/admin/overview', { headers }),
          fetch('/api/admin/products', { headers }),
          fetch('/api/admin/categories', { headers }),
          fetch('/api/admin/banners', { headers }),
          fetch('/api/admin/testimonials', { headers }),
          fetch('/api/admin/pages', { headers }),
          fetch('/api/admin/inquiries', { headers }),
          fetch('/api/admin/settings', { headers }),
          fetch('/api/admin/users', { headers }),
          fetch('/api/admin/resellers', { headers }),
          fetch('/api/admin/customers', { headers }),
          fetch('/api/admin/orders', { headers }),
        ]);

        if (ovRes.status === 401) {
          setAdminUser(null);
          return;
        }

        const [ov, pr, ca, ba, te, pg, iq, st, us, rs, cu, ords] = await Promise.all([
          ovRes.json(),
          prodRes.json(),
          catRes.json(),
          banRes.json(),
          testRes.json(),
          pageRes.json(),
          inqRes.json(),
          setRes.json(),
          usrRes.json(),
          resRes.json(),
          custRes.json(),
          ordRes.json(),
        ]);

        setOverview(ov);
        setProducts(pr.products || []);
        setCategories(ca.categories || []);
        setBanners(ba.banners || []);
        setTestimonials(te.testimonials || []);
        setPages(pg.pages || []);
        setInquiries(iq.inquiries || []);
        setSettings(st.settings || null);
        setAdminUsers(us.users || []);
        setResellersList(rs.resellers || []);
        setCustomersList(cu.customers || []);
        setCustomerOrdersList(ords.orders || []);
      } catch (err) {
        console.error('Failed to load CMS data:', err);
        showToast('Gagal memuat data CMS.', 'error');
      } finally {
        setLoadingData(false);
      }
    },
    [fetchHeaders, showToast]
  );

  useEffect(() => {
    fetch('/api/auth/me')
      .then(async (res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (data?.user) {
          setAdminUser(data.user);
          loadAllCmsData(null);
        }
      })
      .finally(() => setCheckingAuth(false));
  }, [loadAllCmsData]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login gagal.');
      setAuthToken(data.token);
      setAdminUser(data.user);
      showToast(`Selamat datang, ${data.user.name}`);
      await loadAllCmsData(data.token);
    } catch (err: any) {
      setLoginError(err.message || 'Email atau kata sandi salah.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoginLoading(true);
    setLoginError('');
    try {
      const credential = await signInWithPopup(auth, googleAuthProvider);
      const idToken = await credential.user.getIdToken();
      const res = await fetch('/api/auth/firebase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ idToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Autentikasi Google gagal.');
      setAuthToken(data.token);
      setAdminUser(data.user);
      showToast(`Login berhasil sebagai ${data.user.email}`);
      await loadAllCmsData(data.token);
    } catch (err: any) {
      setLoginError(err.message || 'Gagal masuk menggunakan Google.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      await signOut(auth).catch(() => {});
    } finally {
      setAdminUser(null);
      setAuthToken(null);
      showToast('Anda telah keluar dari Admin CMS.');
    }
  };

  const handleDeleteProduct = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/admin/products/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: fetchHeaders(),
      });
      if (!res.ok) throw new Error('Gagal menghapus produk.');
      showToast(`Produk "${deleteTarget.name}" telah dihapus.`);
      setDeleteTarget(null);
      await loadAllCmsData();
      onStorefrontUpdated();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !prodSearch.trim() ||
        p.name.toLowerCase().includes(prodSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(prodSearch.toLowerCase());
      const matchCat =
        prodCategoryFilter === 'all' || String(p.categoryId) === prodCategoryFilter;
      const matchStatus = prodStatusFilter === 'all' || p.status === prodStatusFilter;
      return matchSearch && matchCat && matchStatus;
    });
  }, [products, prodSearch, prodCategoryFilter, prodStatusFilter]);

  // Loading auth gate
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#F8F4EE] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-[#9C7965]">
          <Loader2 className="w-7 h-7 animate-spin" />
          <p className="text-xs uppercase tracking-[0.2em]">Memverifikasi Sesi Admin...</p>
        </div>
      </div>
    );
  }

  // Login Gate
  if (!adminUser) {
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
              Admin Dashboard CMS
            </h1>
            <p className="text-xs text-[#493B34]/75">
              Masuk untuk mengelola katalog produk, kategori, banner promo, dan pengaturan toko.
            </p>
          </div>

          {loginError && (
            <div className="rounded-lg bg-[#FFF5F5] border border-[#E5A9A9] p-3 text-xs text-[#B91C1C]">
              {loginError}
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#493B34] mb-1">
                Email Administrator
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="admin@belmabeauty.com"
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
              {loginLoading ? 'Memproses...' : 'Masuk ke Dashboard'}
            </button>
          </form>

          <div className="relative flex items-center py-1">
            <div className="flex-grow border-t border-[#E9DDD1]" />
            <span className="shrink mx-3 text-[11px] uppercase tracking-wider text-[#9C7965]">
              Atau
            </span>
            <div className="flex-grow border-t border-[#E9DDD1]" />
          </div>

          <button
            type="button"
            disabled={loginLoading}
            onClick={handleGoogleLogin}
            className="w-full py-2.5 px-4 rounded-lg border border-[#D8C3AD] hover:bg-[#F8F4EE] text-[#493B34] text-xs font-medium flex items-center justify-center gap-2.5 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Masuk dengan Google (Firebase Auth)</span>
          </button>

          <div className="rounded-xl bg-[#F8F4EE] border border-[#E9DDD1] p-3.5 text-xs text-[#493B34]/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-medium text-[#493B34]">Akses Demo Admin:</span>
              <button
                type="button"
                onClick={() => {
                  setLoginEmail('admin@belmabeauty.com');
                  setLoginPassword('BelmaAdmin2026!');
                }}
                className="text-[11px] font-medium text-[#9C7965] hover:text-[#493B34] underline"
              >
                Isi Otomatis
              </button>
            </div>
            <p className="tabular-nums">Email: admin@belmabeauty.com</p>
            <p className="tabular-nums">Password: BelmaAdmin2026!</p>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={onExitToStore}
              className="text-xs text-[#9C7965] hover:text-[#493B34] underline underline-offset-4"
            >
              Kembali ke Halaman Toko
            </button>
          </div>
        </div>
      </div>
    );
  }

  const sidebarItems: { id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'categories', label: 'Categories', icon: FolderTree },
    { id: 'customer-orders', label: 'Pesanan & Resi', icon: Truck },
    { id: 'resellers', label: 'Resellers', icon: Store },
    { id: 'inquiries', label: 'Inquiries', icon: MessageSquareText },
    { id: 'banners', label: 'Promo & Banner', icon: ImageIcon },
    { id: 'testimonials', label: 'Testimonials', icon: Star },
    { id: 'pages', label: 'Pages', icon: FileText },
    { id: 'settings', label: 'Store Settings', icon: Settings },
  ];

  const handleRefreshAll = () => {
    loadAllCmsData();
    onStorefrontUpdated();
  };

  return (
    <div className="min-h-screen bg-[#F8F4EE] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-white border-r border-[#D8C3AD]/60">
        <div className="h-16 px-6 border-b border-[#E9DDD1] flex items-center justify-between">
          <span className="font-serif text-base font-semibold tracking-[0.16em] text-[#493B34]">
            BELMA CMS
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  active
                    ? 'bg-[#493B34] text-white'
                    : 'text-[#493B34]/80 hover:bg-[#F8F4EE] hover:text-[#493B34]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
                {item.id === 'inquiries' && overview && overview.newInquiriesCount > 0 && (
                  <span
                    className={`ml-auto px-1.5 py-0.5 rounded text-[10px] tabular-nums ${
                      active ? 'bg-white text-[#493B34]' : 'bg-[#E9DDD1] text-[#493B34]'
                    }`}
                  >
                    {overview.newInquiriesCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#E9DDD1] space-y-2">
          <div className="px-2 py-1">
            <p className="text-xs font-semibold text-[#493B34] truncate">{adminUser.name}</p>
            <p className="text-[11px] text-[#9C7965] truncate">{adminUser.email}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-xs font-medium text-[#B91C1C] hover:bg-[#FFF5F5] transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[#493B34]/40"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <aside className="relative w-64 bg-white h-full flex flex-col z-10 shadow-xl">
            <div className="h-16 px-5 border-b border-[#E9DDD1] flex items-center justify-between">
              <span className="font-serif text-base font-semibold tracking-[0.14em] text-[#493B34]">
                BELMA CMS
              </span>
              <button type="button" onClick={() => setMobileSidebarOpen(false)}>
                <X className="w-5 h-5 text-[#9C7965]" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium ${
                      active ? 'bg-[#493B34] text-white' : 'text-[#493B34]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="p-3 border-t border-[#E9DDD1]">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-medium text-[#B91C1C]"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Admin Header */}
        <header className="h-16 bg-white border-b border-[#D8C3AD]/60 px-4 sm:px-8 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-[#493B34]"
              aria-label="Buka menu admin"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="text-xs text-[#9C7965] truncate">
              <span>Admin CMS</span>
              <span className="mx-2">/</span>
              <span className="text-[#493B34] font-medium capitalize">
                {sidebarItems.find((s) => s.id === activeTab)?.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onExitToStore}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#D8C3AD] text-xs font-medium text-[#493B34] hover:bg-[#F8F4EE] whitespace-nowrap"
            >
              <span>Lihat Toko</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#9C7965]" />
            </button>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {loadingData && !overview ? (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 animate-pulse">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-24 rounded-xl bg-white border border-[#D8C3AD]/40" />
              ))}
            </div>
          ) : activeTab === 'dashboard' && overview ? (
            <div className="space-y-8">
              <div>
                <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#493B34]">
                  Dashboard Overview
                </h1>
                <p className="text-xs text-[#9C7965] mt-1">
                  Ringkasan inventaris produk, kategori, dan performa katalog Belma Beauty.
                </p>
              </div>

              {/* 5 Overview KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {[
                  { label: 'Total Produk', val: overview.totalProducts },
                  { label: 'Total Kategori', val: overview.totalCategories },
                  { label: 'Produk Aktif', val: overview.activeProducts },
                  { label: 'Stok Habis', val: overview.outOfStockProducts },
                  { label: 'Best Seller', val: overview.bestSellerProducts },
                ].map((kpi) => (
                  <div
                    key={kpi.label}
                    className="bg-white rounded-xl border border-[#D8C3AD]/60 p-5"
                  >
                    <p className="text-xs text-[#9C7965] font-medium">{kpi.label}</p>
                    <p className="font-serif text-3xl font-semibold text-[#493B34] mt-2 tabular-nums">
                      {kpi.val}
                    </p>
                  </div>
                ))}
              </div>

              {/* Recent Products & Inquiries */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 bg-white rounded-xl border border-[#D8C3AD]/60 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-serif text-lg font-semibold text-[#493B34]">
                      Produk Terbaru
                    </h2>
                    <button
                      type="button"
                      onClick={() => setActiveTab('products')}
                      className="text-xs font-medium text-[#9C7965] hover:text-[#493B34]"
                    >
                      Kelola Semua →
                    </button>
                  </div>
                  <div className="divide-y divide-[#E9DDD1]">
                    {overview.recentProducts.map((p) => (
                      <div key={p.id} className="py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-lg overflow-hidden bg-[#F8F4EE] shrink-0">
                            <SafeImage
                              src={p.images?.[0]?.imageUrl}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[#493B34] truncate">{p.name}</p>
                            <p className="text-xs text-[#9C7965] tabular-nums">
                              {p.categoryName} · Stok {p.stock}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-[#493B34] tabular-nums shrink-0">
                          {formatIDR(p.discountPrice || p.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-5 bg-white rounded-xl border border-[#D8C3AD]/60 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-serif text-lg font-semibold text-[#493B34]">
                      Pesan Masuk Terbaru
                    </h2>
                    <button
                      type="button"
                      onClick={() => setActiveTab('inquiries')}
                      className="text-xs font-medium text-[#9C7965] hover:text-[#493B34]"
                    >
                      Lihat Semua →
                    </button>
                  </div>
                  {overview.recentInquiries.length === 0 ? (
                    <p className="text-xs text-[#9C7965] py-6 text-center">
                      Belum ada pesan masuk.
                    </p>
                  ) : (
                    <div className="divide-y divide-[#E9DDD1]">
                      {overview.recentInquiries.map((inq) => (
                        <div key={inq.id} className="py-3 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-[#493B34]">
                              {inq.customerName}
                            </span>
                            <span className="text-[11px] text-[#9C7965] tabular-nums">
                              {formatDateShort(inq.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-[#493B34]/75 line-clamp-2">{inq.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : activeTab === 'products' ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-serif text-2xl font-semibold text-[#493B34]">
                    Manajemen Produk
                  </h2>
                  <p className="text-xs text-[#9C7965]">
                    Tambah, edit, unggah banyak foto, dan atur tautan WhatsApp, TikTok Shop, serta Shopee per produk.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingProduct(null);
                    setProductModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#493B34] hover:bg-[#9C7965] text-white text-xs font-medium tracking-wider uppercase self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Produk</span>
                </button>
              </div>

              {/* Filter Toolbar */}
              <div className="bg-white rounded-xl border border-[#D8C3AD]/60 p-4 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#9C7965] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={prodSearch}
                    onChange={(e) => setProdSearch(e.target.value)}
                    placeholder="Cari nama produk atau SKU..."
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#D8C3AD] text-sm focus:outline-none focus:border-[#9C7965]"
                  />
                </div>
                <select
                  value={prodCategoryFilter}
                  onChange={(e) => setProdCategoryFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-[#D8C3AD] text-sm bg-white"
                >
                  <option value="all">Semua Kategori</option>
                  {categories.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <select
                  value={prodStatusFilter}
                  onChange={(e) => setProdStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-[#D8C3AD] text-sm bg-white"
                >
                  <option value="all">Semua Status</option>
                  <option value="active">Aktif</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Arsip</option>
                </select>
              </div>

              {/* Products Table */}
              {filteredProducts.length === 0 ? (
                <div className="bg-white rounded-xl border border-[#D8C3AD]/60 p-12 text-center space-y-3">
                  <p className="font-serif text-lg font-semibold text-[#493B34]">
                    Belum Ada Produk yang Cocok
                  </p>
                  <p className="text-xs text-[#9C7965]">
                    Ubah filter pencarian atau tambahkan produk baru.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-[#D8C3AD]/60 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#E9DDD1] bg-[#F8F4EE]/70 text-[11px] uppercase tracking-wider text-[#9C7965]">
                          <th className="py-3 px-4 font-medium">Produk</th>
                          <th className="py-3 px-4 font-medium">Kategori</th>
                          <th className="py-3 px-4 font-medium text-right">Harga Toko</th>
                          <th className="py-3 px-4 font-medium text-right">Harga Reseller</th>
                          <th className="py-3 px-4 font-medium text-right">Stok</th>
                          <th className="py-3 px-4 font-medium">Saluran</th>
                          <th className="py-3 px-4 font-medium">Status</th>
                          <th className="py-3 px-4 font-medium text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E9DDD1] text-sm">
                        {filteredProducts.map((p) => (
                          <tr key={p.id} className="hover:bg-[#F8F4EE]/50 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3 min-w-[200px]">
                                <div className="w-11 h-11 rounded-lg overflow-hidden bg-[#F8F4EE] shrink-0">
                                  <SafeImage
                                    src={p.images?.[0]?.imageUrl}
                                    alt={p.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-[#493B34] truncate">{p.name}</p>
                                  <p className="text-xs text-[#9C7965] tabular-nums">
                                    SKU: {p.sku}
                                    {p.isBestSeller ? ' · Best Seller' : ''}
                                    {p.isNewArrival ? ' · New' : ''}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-xs text-[#493B34]/80 whitespace-nowrap">
                              {p.categoryName}
                            </td>
                            <td className="py-3 px-4 text-right tabular-nums whitespace-nowrap">
                              {p.discountPrice ? (
                                <div>
                                  <span className="font-semibold text-[#493B34] block">
                                    {formatIDR(p.discountPrice)}
                                  </span>
                                  <span className="text-[11px] text-[#9C7965] line-through">
                                    {formatIDR(p.price)}
                                  </span>
                                </div>
                              ) : (
                                <span className="font-semibold text-[#493B34]">
                                  {formatIDR(p.price)}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right tabular-nums whitespace-nowrap text-xs">
                              {p.resellerPrice ? (
                                <span className="font-semibold text-[#1F7A4C]">
                                  {formatIDR(p.resellerPrice)}
                                </span>
                              ) : (
                                <span className="text-[#9C7965]">
                                  {settings?.resellerDefaultDiscountPct
                                    ? `-${settings.resellerDefaultDiscountPct}%`
                                    : 'Default'}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right tabular-nums text-xs">
                              <span
                                className={
                                  p.stock > 0 ? 'text-[#493B34]' : 'text-[#B91C1C] font-semibold'
                                }
                              >
                                {p.stock}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-[11px] text-[#9C7965] whitespace-nowrap">
                              WA
                              {p.tiktokUrl ? ' · TikTok' : ''}
                              {p.shopeeUrl ? ' · Shopee' : ''}
                            </td>
                            <td className="py-3 px-4 text-xs whitespace-nowrap">
                              <span
                                className={`font-medium ${
                                  p.status === 'active' ? 'text-[#1F7A4C]' : 'text-[#9C7965]'
                                }`}
                              >
                                {p.status === 'active'
                                  ? 'Aktif'
                                  : p.status === 'draft'
                                    ? 'Draft'
                                    : 'Arsip'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingProduct(p);
                                    setProductModalOpen(true);
                                  }}
                                  aria-label={`Edit ${p.name}`}
                                  className="p-2 rounded-lg border border-[#D8C3AD] text-[#493B34] hover:bg-[#F8F4EE]"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteTarget(p)}
                                  aria-label={`Hapus ${p.name}`}
                                  className="p-2 rounded-lg border border-[#E5A9A9] text-[#B91C1C] hover:bg-[#FFF5F5]"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === 'categories' ? (
            <CategoriesManager
              categories={categories}
              authToken={authToken}
              onRefreshAll={handleRefreshAll}
            />
          ) : activeTab === 'customer-orders' ? (
            <CustomerOrdersManager
              orders={customerOrdersList}
              customers={customersList}
              authToken={authToken}
              onRefreshAll={handleRefreshAll}
            />
          ) : activeTab === 'resellers' ? (
            <ResellersManager
              resellers={resellersList}
              settings={settings}
              authToken={authToken}
              onRefreshAll={handleRefreshAll}
            />
          ) : activeTab === 'inquiries' ? (
            <InquiriesManager
              inquiries={inquiries}
              authToken={authToken}
              onRefreshAll={handleRefreshAll}
            />
          ) : activeTab === 'banners' ? (
            <BannersManager
              banners={banners}
              authToken={authToken}
              onRefreshAll={handleRefreshAll}
            />
          ) : activeTab === 'testimonials' ? (
            <TestimonialsManager
              testimonials={testimonials}
              authToken={authToken}
              onRefreshAll={handleRefreshAll}
            />
          ) : activeTab === 'pages' ? (
            <PagesManager pages={pages} authToken={authToken} onRefreshAll={handleRefreshAll} />
          ) : activeTab === 'settings' && settings ? (
            <SettingsManager
              settings={settings}
              adminUsers={adminUsers}
              authToken={authToken}
              onRefreshAll={handleRefreshAll}
            />
          ) : null}
        </main>
      </div>

      {/* Add/Edit Product Modal */}
      <AdminProductModal
        isOpen={productModalOpen}
        product={editingProduct}
        categories={categories}
        authToken={authToken}
        onClose={() => setProductModalOpen(false)}
        onSaved={handleRefreshAll}
      />

      {/* Delete Product Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-[#493B34]/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#D8C3AD] max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-[#B91C1C]">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="font-serif text-lg font-semibold text-[#493B34]">
                Konfirmasi Hapus Produk
              </h3>
            </div>
            <p className="text-xs text-[#493B34]/80 leading-relaxed">
              Apakah Anda yakin ingin menghapus <strong>{deleteTarget.name}</strong>? Tindakan ini
              akan menghapus produk beserta seluruh foto galerinya secara permanen.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg border border-[#D8C3AD] text-xs font-medium text-[#493B34]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteProduct}
                className="px-4 py-2 rounded-lg bg-[#B91C1C] hover:bg-[#991B1B] text-white text-xs font-medium"
              >
                Ya, Hapus Produk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
