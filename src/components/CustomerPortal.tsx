import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  Check,
  ExternalLink,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  Package,
  Phone,
  Search,
  ShoppingBag,
  Truck,
  User,
} from 'lucide-react';
import type { CekResiResponse, CustomerAccount, CustomerOrder } from '../types/store';
import { formatDateShort, formatIDR } from '../lib/format';
import { useToast } from './ToastContext';

interface CustomerPortalProps {
  onExitToStore: () => void;
}

type CustomerTab = 'orders' | 'tracking' | 'profile';

const COURIER_OPTIONS = [
  { code: 'jne', label: 'JNE Express' },
  { code: 'jnt', label: 'J&T Express' },
  { code: 'sicepat', label: 'SiCepat' },
  { code: 'anteraja', label: 'AnterAja' },
  { code: 'pos', label: 'POS Indonesia' },
  { code: 'tiki', label: 'TIKI' },
  { code: 'wahana', label: 'Wahana' },
  { code: 'ninja', label: 'Ninja Xpress' },
  { code: 'spx', label: 'Shopee Express (SPX)' },
  { code: 'lion', label: 'Lion Parcel' },
  { code: 'idexpress', label: 'ID Express' },
];

export function CustomerPortal({ onExitToStore }: CustomerPortalProps) {
  const { showToast } = useToast();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [customer, setCustomer] = useState<CustomerAccount | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Simple Registration / Login gate
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register');
  const [regName, setRegName] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regWhatsapp, setRegWhatsapp] = useState('');
  const [regEmail, setRegEmail] = useState('');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginWhatsapp, setLoginWhatsapp] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Dashboard state
  const [activeTab, setActiveTab] = useState<CustomerTab>('orders');
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [storeInfo, setStoreInfo] = useState({ storeName: 'BELMA BEAUTY', whatsappNumber: '6281234567890' });

  // Profile edit state
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editWhatsapp, setEditWhatsapp] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Cek Resi state (following https://cekresi.com/api.php)
  const [trackAwb, setTrackAwb] = useState('');
  const [trackCourier, setTrackCourier] = useState('jne');
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingResult, setTrackingResult] = useState<CekResiResponse | null>(null);
  const [trackedMeta, setTrackedMeta] = useState<{ awb: string; courier: string } | null>(null);

  const loadCustomerOrders = useCallback(
    async (tokenOverride?: string | null) => {
      setLoadingOrders(true);
      try {
        const headers: Record<string, string> = {};
        const token = tokenOverride ?? authToken;
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch('/api/pelanggan/orders', { headers });
        if (res.status === 401) {
          setCustomer(null);
          return;
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Gagal memuat pesanan.');
        setOrders(data.orders || []);
        if (data.store) setStoreInfo(data.store);
      } catch (err: any) {
        showToast(err.message || 'Gagal memuat daftar pesanan.', 'error');
      } finally {
        setLoadingOrders(false);
      }
    },
    [authToken, showToast]
  );

  useEffect(() => {
    fetch('/api/pelanggan/me')
      .then(async (res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (data?.customer) {
          setCustomer(data.customer);
          setEditName(data.customer.name);
          setEditAddress(data.customer.address);
          setEditWhatsapp(data.customer.whatsappNumber);
          loadCustomerOrders(null);
        }
      })
      .finally(() => setCheckingAuth(false));
  }, [loadCustomerOrders]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await fetch('/api/pelanggan/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          address: regAddress,
          whatsappNumber: regWhatsapp,
          email: regEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Pendaftaran gagal.');

      setAuthToken(data.token);
      setCustomer(data.customer);
      setEditName(data.customer.name);
      setEditAddress(data.customer.address);
      setEditWhatsapp(data.customer.whatsappNumber);
      showToast(`Selamat datang, ${data.customer.name}`);
      await loadCustomerOrders(data.token);
    } catch (err: any) {
      setAuthError(err.message || 'Gagal mendaftar.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await fetch('/api/pelanggan/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail,
          whatsappNumber: loginWhatsapp,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal masuk.');

      setAuthToken(data.token);
      setCustomer(data.customer);
      setEditName(data.customer.name);
      setEditAddress(data.customer.address);
      setEditWhatsapp(data.customer.whatsappNumber);
      showToast(`Selamat datang kembali, ${data.customer.name}`);
      await loadCustomerOrders(data.token);
    } catch (err: any) {
      setAuthError(err.message || 'Email atau No WhatsApp tidak cocok.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/pelanggan/logout', { method: 'POST' });
    } finally {
      setCustomer(null);
      setAuthToken(null);
      setOrders([]);
      setTrackingResult(null);
      showToast('Anda telah keluar dari Dashboard Pelanggan.');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
      const res = await fetch('/api/pelanggan/profile', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          name: editName,
          address: editAddress,
          whatsappNumber: editWhatsapp,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memperbarui profil.');
      setCustomer(data.customer);
      showToast('Profil pelanggan berhasil diperbarui.');
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan profil.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const runCekResi = async (awbInput: string, courierInput: string) => {
    const cleanAwb = awbInput.trim();
    const cleanCourier = courierInput.trim().toLowerCase();
    if (!cleanAwb || !cleanCourier) {
      showToast('Masukkan nomor resi dan pilih kurir terlebih dahulu.', 'error');
      return;
    }

    setTrackAwb(cleanAwb);
    setTrackCourier(cleanCourier);
    setActiveTab('tracking');
    setTrackingLoading(true);
    setTrackingResult(null);
    setTrackedMeta({ awb: cleanAwb, courier: cleanCourier });

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const res = await fetch('/api/pelanggan/cek-resi', {
        method: 'POST',
        headers,
        body: JSON.stringify({ awb: cleanAwb, courier: cleanCourier }),
      });
      const data: CekResiResponse = await res.json();
      setTrackingResult(data);
    } catch (err: any) {
      setTrackingResult({
        error: err.message || 'Gagal mengambil status pengiriman dari cekresi.com.',
      });
    } finally {
      setTrackingLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'menunggu':
        return { text: 'Menunggu Konfirmasi', cls: 'bg-[#F8F4EE] text-[#9C7965] border-[#D8C3AD]' };
      case 'diproses':
        return { text: 'Sedang Dikemas', cls: 'bg-[#FDF6EB] text-[#9A5B13] border-[#E7C697]' };
      case 'dikirim':
        return { text: 'Dalam Pengiriman', cls: 'bg-[#EEF5FF] text-[#1D4ED8] border-[#BFDBFE]' };
      case 'selesai':
        return { text: 'Selesai Diterima', cls: 'bg-[#E9F5EE] text-[#1F7A4C] border-[#B7E1C7]' };
      default:
        return { text: status, cls: 'bg-[#F8F4EE] text-[#493B34] border-[#D8C3AD]' };
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#F8F4EE] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-[#9C7965]">
          <Loader2 className="w-7 h-7 animate-spin" />
          <p className="text-xs uppercase tracking-[0.2em]">Memuat Halaman Pelanggan...</p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // HALAMAN DAFTAR SIMPLE (Nama, Alamat, No WhatsApp, Email)
  // ============================================================================
  if (!customer) {
    return (
      <div className="min-h-screen bg-[#F8F4EE] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl border border-[#D8C3AD]/70 p-7 sm:p-9 shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="w-11 h-11 rounded-full bg-[#E9DDD1] text-[#493B34] flex items-center justify-center mx-auto">
              <User className="w-5 h-5" />
            </div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#9C7965] font-medium">
              BELMA BEAUTY
            </p>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#493B34]">
              {authMode === 'register' ? 'Daftar Pelanggan' : 'Masuk Pelanggan'}
            </h1>
            <p className="text-xs text-[#493B34]/75">
              {authMode === 'register'
                ? 'Lengkapi data diri Anda untuk melihat profil, pesanan WhatsApp, dan tracking cek resi pengiriman.'
                : 'Masuk menggunakan Email dan No WhatsApp yang sudah Anda daftarkan.'}
            </p>
          </div>

          {/* Toggle Daftar / Masuk */}
          <div className="grid grid-cols-2 rounded-xl bg-[#F8F4EE] p-1 border border-[#E9DDD1]">
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setAuthError('');
              }}
              className={`py-2 rounded-lg text-xs font-medium transition-colors ${
                authMode === 'register'
                  ? 'bg-white text-[#493B34] shadow-xs'
                  : 'text-[#9C7965] hover:text-[#493B34]'
              }`}
            >
              Daftar Baru
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setAuthError('');
              }}
              className={`py-2 rounded-lg text-xs font-medium transition-colors ${
                authMode === 'login'
                  ? 'bg-white text-[#493B34] shadow-xs'
                  : 'text-[#9C7965] hover:text-[#493B34]'
              }`}
            >
              Sudah Terdaftar
            </button>
          </div>

          {authError && (
            <div className="rounded-lg bg-[#FFF5F5] border border-[#E5A9A9] p-3 text-xs text-[#B91C1C]">
              {authError}
            </div>
          )}

          {authMode === 'register' ? (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#493B34] mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Contoh: Rania Putri"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#D8C3AD] text-sm focus:outline-none focus:border-[#9C7965]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#493B34] mb-1">
                  Alamat Lengkap *
                </label>
                <textarea
                  rows={2}
                  required
                  value={regAddress}
                  onChange={(e) => setRegAddress(e.target.value)}
                  placeholder="Jl. Kemang Raya No. 45, Jakarta Selatan"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#D8C3AD] text-sm focus:outline-none focus:border-[#9C7965]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#493B34] mb-1">
                  No WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  value={regWhatsapp}
                  onChange={(e) => setRegWhatsapp(e.target.value)}
                  placeholder="0812xxxxxxxx"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#D8C3AD] text-sm tabular-nums focus:outline-none focus:border-[#9C7965]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#493B34] mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#D8C3AD] text-sm focus:outline-none focus:border-[#9C7965]"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 rounded-lg bg-[#493B34] hover:bg-[#9C7965] disabled:opacity-50 text-white text-xs font-medium tracking-[0.14em] uppercase transition-colors"
              >
                {authLoading ? 'Mendaftarkan...' : 'Daftar & Masuk Dashboard'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#493B34] mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="pelanggan@belmabeauty.com"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#D8C3AD] text-sm focus:outline-none focus:border-[#9C7965]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#493B34] mb-1">
                  No WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  value={loginWhatsapp}
                  onChange={(e) => setLoginWhatsapp(e.target.value)}
                  placeholder="081288990011"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#D8C3AD] text-sm tabular-nums focus:outline-none focus:border-[#9C7965]"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 rounded-lg bg-[#493B34] hover:bg-[#9C7965] disabled:opacity-50 text-white text-xs font-medium tracking-[0.14em] uppercase transition-colors"
              >
                {authLoading ? 'Memeriksa...' : 'Masuk Dashboard Pelanggan'}
              </button>

              <div className="rounded-xl bg-[#F8F4EE] border border-[#E9DDD1] p-3 text-xs text-[#493B34]/80 flex items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-[#493B34]">Akun Demo Pelanggan:</p>
                  <p className="text-[11px] text-[#9C7965] tabular-nums">
                    pelanggan@belmabeauty.com · 081288990011
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setLoginEmail('pelanggan@belmabeauty.com');
                    setLoginWhatsapp('081288990011');
                  }}
                  className="text-[11px] font-medium text-[#493B34] underline shrink-0"
                >
                  Isi Demo
                </button>
              </div>
            </form>
          )}

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

  // ============================================================================
  // DASHBOARD PELANGGAN: Profile, Pesanan & Tracking Cekresi
  // ============================================================================
  return (
    <div className="min-h-screen bg-[#F8F4EE] text-[#493B34] flex flex-col">
      <header className="sticky top-0 z-40 bg-[#F8F4EE]/95 backdrop-blur-md border-b border-[#D8C3AD]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-serif text-lg sm:text-xl font-semibold tracking-[0.16em] text-[#493B34] whitespace-nowrap">
              {storeInfo.storeName || 'BELMA BEAUTY'}
            </span>
            <span className="hidden sm:inline-block text-xs uppercase tracking-[0.16em] text-[#9C7965] border-l border-[#D8C3AD] pl-3">
              Dashboard Pelanggan
            </span>
          </div>

          <nav className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'orders'
                  ? 'bg-[#493B34] text-white'
                  : 'text-[#493B34] hover:bg-[#E9DDD1]/70'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Pesanan</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('tracking')}
              className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'tracking'
                  ? 'bg-[#493B34] text-white'
                  : 'text-[#493B34] hover:bg-[#E9DDD1]/70'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Cek Resi</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'profile'
                  ? 'bg-[#493B34] text-white'
                  : 'text-[#493B34] hover:bg-[#E9DDD1]/70'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Profile</span>
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
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
        {/* Customer Greeting Card */}
        <div className="bg-white rounded-2xl border border-[#D8C3AD]/60 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#9C7965]">
              Role: Pelanggan
            </p>
            <h1 className="font-serif text-2xl font-semibold text-[#493B34] mt-0.5">
              Halo, {customer.name}
            </h1>
            <p className="text-xs text-[#493B34]/75 mt-1">
              Pantau pesanan WhatsApp Anda serta lacak status pengiriman paket melalui integrasi Cekresi.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs text-[#493B34]/80 tabular-nums shrink-0">
            <div className="bg-[#F8F4EE] rounded-xl px-4 py-2.5 border border-[#E9DDD1]">
              <p className="text-[11px] text-[#9C7965]">Total Pesanan</p>
              <p className="font-serif text-xl font-semibold text-[#493B34]">{orders.length}</p>
            </div>
            <div className="bg-[#F8F4EE] rounded-xl px-4 py-2.5 border border-[#E9DDD1]">
              <p className="text-[11px] text-[#9C7965]">Resi Tersedia</p>
              <p className="font-serif text-xl font-semibold text-[#1F7A4C]">
                {orders.filter((o) => Boolean(o.trackingNumber)).length}
              </p>
            </div>
          </div>
        </div>

        {/* TAB 1: PESANAN */}
        {activeTab === 'orders' && (
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-semibold text-[#493B34]">
                  Pesanan Anda
                </h2>
                <p className="text-xs text-[#9C7965]">
                  Pesanan via WhatsApp akan muncul di sini setelah dicatat dan resi diinput manual oleh Admin Belma Beauty.
                </p>
              </div>
              <a
                href={`https://wa.me/${storeInfo.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                  `Halo Belma Beauty, saya ${customer.name} (${customer.email}) ingin memesan produk Belma Beauty.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1F7A4C] hover:bg-[#17613B] text-white text-xs font-medium tracking-wider uppercase self-start sm:self-auto"
              >
                <span>Order Baru via WhatsApp</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {loadingOrders ? (
              <div className="bg-white rounded-2xl border border-[#D8C3AD]/60 p-10 text-center text-xs text-[#9C7965]">
                Memuat daftar pesanan...
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#D8C3AD]/60 p-12 text-center space-y-2">
                <Package className="w-8 h-8 text-[#D8C3AD] mx-auto" />
                <p className="font-serif text-lg font-semibold text-[#493B34]">
                  Belum Ada Pesanan Tercatat
                </p>
                <p className="text-xs text-[#9C7965] max-w-md mx-auto">
                  Saat Anda melakukan pemesanan via WhatsApp dengan email atau nomor WhatsApp yang terdaftar, admin akan menginput pesanan dan nomor resi Anda di sini.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((ord) => {
                  const statusBadge = getStatusLabel(ord.status);
                  const hasResi = Boolean(ord.trackingNumber && ord.trackingNumber.trim().length > 0);
                  return (
                    <div
                      key={ord.id}
                      className="bg-white rounded-2xl border border-[#D8C3AD]/60 p-5 sm:p-6 space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E9DDD1]">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-mono text-sm font-semibold text-[#493B34]">
                            {ord.orderNumber}
                          </span>
                          <span className="text-xs text-[#9C7965] tabular-nums">
                            {formatDateShort(ord.createdAt)}
                          </span>
                          <span className="text-[11px] uppercase tracking-wider text-[#9C7965]">
                            via {ord.orderChannel}
                          </span>
                        </div>
                        <span
                          className={`inline-block px-2.5 py-1 rounded border text-[11px] font-medium self-start sm:self-auto ${statusBadge.cls}`}
                        >
                          {statusBadge.text}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                        <div className="md:col-span-6 space-y-1.5">
                          <p className="text-xs uppercase tracking-wider text-[#9C7965]">
                            Produk Dipesan
                          </p>
                          <p className="text-sm font-medium text-[#493B34]">{ord.productSummary}</p>
                          {ord.shippingAddress && (
                            <p className="text-xs text-[#493B34]/75">
                              Tujuan: {ord.shippingAddress}
                            </p>
                          )}
                          {ord.trackingNote && (
                            <p className="text-xs text-[#9C7965] italic">{ord.trackingNote}</p>
                          )}
                        </div>

                        <div className="md:col-span-3 space-y-1 tabular-nums">
                          <p className="text-xs uppercase tracking-wider text-[#9C7965]">Total</p>
                          <p className="text-base font-semibold text-[#493B34]">
                            {formatIDR(ord.totalAmount)}
                          </p>
                        </div>

                        <div className="md:col-span-3 flex flex-col sm:items-end gap-2">
                          {hasResi ? (
                            <>
                              <div className="sm:text-right">
                                <p className="text-[11px] uppercase tracking-wider text-[#9C7965]">
                                  Kurir: {(ord.courier || 'JNE').toUpperCase()}
                                </p>
                                <p className="font-mono text-xs font-semibold text-[#493B34]">
                                  {ord.trackingNumber}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  runCekResi(ord.trackingNumber || '', ord.courier || 'jne')
                                }
                                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#493B34] hover:bg-[#9C7965] text-white text-xs font-medium tracking-wider uppercase transition-colors"
                              >
                                <Truck className="w-3.5 h-3.5" />
                                <span>Cek Resi</span>
                              </button>
                            </>
                          ) : (
                            <p className="text-xs text-[#9C7965] italic">
                              Resi pengiriman menunggu input Admin
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* TAB 2: TRACKING CEKRESI (API cekresi.com/api.php) */}
        {activeTab === 'tracking' && (
          <section className="space-y-6">
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-semibold text-[#493B34]">
                Tracking Cekresi Pengiriman
              </h2>
              <p className="text-xs text-[#9C7965]">
                Lacak perjalanan paket pesanan Anda menggunakan layanan resmi API Cekresi.com.
              </p>
            </div>

            {/* Quick Select from Orders with Resi */}
            {orders.some((o) => Boolean(o.trackingNumber)) && (
              <div className="bg-white rounded-2xl border border-[#D8C3AD]/60 p-5 space-y-3">
                <p className="text-xs font-medium text-[#493B34]">
                  Pilih Pesanan Anda yang Memiliki Resi:
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {orders
                    .filter((o) => Boolean(o.trackingNumber))
                    .map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => runCekResi(o.trackingNumber || '', o.courier || 'jne')}
                        className="px-3.5 py-2 rounded-lg border border-[#D8C3AD] bg-[#F8F4EE] hover:bg-[#E9DDD1] text-xs text-left transition-colors"
                      >
                        <span className="font-semibold text-[#493B34] block">
                          {o.orderNumber}
                        </span>
                        <span className="font-mono text-[11px] text-[#9C7965]">
                          {(o.courier || 'jne').toUpperCase()} · {o.trackingNumber}
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Manual Cek Resi Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                runCekResi(trackAwb, trackCourier);
              }}
              className="bg-white rounded-2xl border border-[#D8C3AD]/60 p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-12 gap-4 items-end"
            >
              <div className="sm:col-span-5">
                <label className="block text-xs font-medium text-[#493B34] mb-1">
                  Nomor Resi (AWB) *
                </label>
                <input
                  type="text"
                  required
                  value={trackAwb}
                  onChange={(e) => setTrackAwb(e.target.value)}
                  placeholder="Contoh: KDRAA01056184914"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#D8C3AD] text-sm font-mono focus:outline-none focus:border-[#9C7965]"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block text-xs font-medium text-[#493B34] mb-1">
                  Kurir Ekspedisi *
                </label>
                <select
                  value={trackCourier}
                  onChange={(e) => setTrackCourier(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#D8C3AD] text-sm bg-white focus:outline-none focus:border-[#9C7965]"
                >
                  {COURIER_OPTIONS.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3">
                <button
                  type="submit"
                  disabled={trackingLoading}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#493B34] hover:bg-[#9C7965] disabled:opacity-50 text-white text-xs font-medium tracking-wider uppercase inline-flex items-center justify-center gap-2 transition-colors"
                >
                  {trackingLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  <span>{trackingLoading ? 'Melacak...' : 'Cek Resi'}</span>
                </button>
              </div>
            </form>

            {/* CekResi API Result Panel */}
            {trackingResult && (
              <div className="bg-white rounded-2xl border border-[#D8C3AD]/60 p-6 space-y-5">
                {trackingResult.result ? (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E9DDD1]">
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-[#9C7965]">
                          Hasil Pelacakan Cekresi.com ({trackedMeta?.courier.toUpperCase()})
                        </p>
                        <h3 className="font-mono text-lg font-semibold text-[#493B34]">
                          {trackingResult.result.awb_no || trackedMeta?.awb}
                        </h3>
                      </div>
                      {trackingResult.summary?.status && (
                        <span className="px-3 py-1 rounded-lg bg-[#E9F5EE] text-[#1F7A4C] border border-[#1F7A4C]/30 text-xs font-semibold uppercase self-start sm:self-auto">
                          {trackingResult.summary.status}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div>
                        <p className="text-[#9C7965]">Layanan</p>
                        <p className="font-medium text-[#493B34] mt-0.5">
                          {trackingResult.result.service || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#9C7965]">Tanggal Kirim</p>
                        <p className="font-medium text-[#493B34] mt-0.5 tabular-nums">
                          {trackingResult.result.date_of_shipment || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#9C7965]">Asal</p>
                        <p className="font-medium text-[#493B34] mt-0.5">
                          {trackingResult.result.origin || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#9C7965]">Tujuan</p>
                        <p className="font-medium text-[#493B34] mt-0.5">
                          {trackingResult.result.destination || '-'}
                        </p>
                      </div>
                    </div>

                    {trackingResult.summary?.last_status && (
                      <div className="rounded-xl bg-[#F8F4EE] border border-[#E9DDD1] p-4 text-xs space-y-1">
                        <p className="font-semibold text-[#493B34]">
                          Status Terakhir: {trackingResult.summary.last_status}
                        </p>
                        <p className="text-[#9C7965] tabular-nums">
                          {trackingResult.summary.last_time} — {trackingResult.summary.last_position}
                        </p>
                      </div>
                    )}

                    {/* Manifest Timeline */}
                    <div className="space-y-3 pt-2">
                      <h4 className="font-serif text-base font-semibold text-[#493B34]">
                        Riwayat Perjalanan Paket
                      </h4>
                      <div className="space-y-3 border-l-2 border-[#D8C3AD] pl-4">
                        {[
                          ...(trackingResult.result.shipment_status?.pod_detail || []),
                          ...(trackingResult.result.shipment_status?.outbond || []),
                        ].map((item, idx) => (
                          <div key={idx} className="space-y-0.5 text-xs">
                            <p className="font-semibold text-[#493B34]">{item.status}</p>
                            <p className="text-[#9C7965] tabular-nums">
                              {item.time} {item.position ? `· ${item.position}` : ''}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-xl bg-[#F8F4EE] border border-[#D8C3AD] p-4 text-xs text-[#493B34] space-y-1.5">
                      <p className="font-semibold">
                        Informasi Tracking ({trackedMeta?.courier.toUpperCase()} · {trackedMeta?.awb})
                      </p>
                      <p className="text-[#493B34]/80">
                        {trackingResult.info?.error_txt ||
                          trackingResult.error ||
                          'Data resi belum tersedia dari api.cekresi.com.'}
                      </p>
                    </div>
                    {trackedMeta?.awb && (
                      <a
                        href={`https://cekresi.com/?noresi=${encodeURIComponent(trackedMeta.awb)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#493B34] hover:bg-[#9C7965] text-white text-xs font-medium uppercase tracking-wider"
                      >
                        <span>Lacak Langsung di Cekresi.com</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* TAB 3: PROFILE PELANGGAN */}
        {activeTab === 'profile' && (
          <section className="max-w-2xl bg-white rounded-2xl border border-[#D8C3AD]/60 p-6 sm:p-8 space-y-6">
            <div className="border-b border-[#E9DDD1] pb-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#9C7965] mb-1">
                Profile Akun
              </p>
              <h2 className="font-serif text-2xl font-semibold text-[#493B34]">
                Data Pelanggan Belma Beauty
              </h2>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-[#493B34] mb-1">
                  <User className="w-3.5 h-3.5 text-[#9C7965]" />
                  <span>Nama Lengkap *</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#D8C3AD] text-sm"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-[#493B34] mb-1">
                  <MapPin className="w-3.5 h-3.5 text-[#9C7965]" />
                  <span>Alamat Pengiriman *</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#D8C3AD] text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-[#493B34] mb-1">
                    <Phone className="w-3.5 h-3.5 text-[#9C7965]" />
                    <span>No WhatsApp *</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={editWhatsapp}
                    onChange={(e) => setEditWhatsapp(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#D8C3AD] text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-[#493B34] mb-1">
                    <Mail className="w-3.5 h-3.5 text-[#9C7965]" />
                    <span>Email (Terdaftar)</span>
                  </label>
                  <input
                    type="email"
                    disabled
                    value={customer.email}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E9DDD1] bg-[#F8F4EE] text-sm text-[#9C7965]"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between border-t border-[#E9DDD1]">
                <p className="text-xs text-[#9C7965] tabular-nums">
                  Terdaftar: {formatDateShort(customer.createdAt)}
                </p>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#493B34] hover:bg-[#9C7965] text-white text-xs font-medium uppercase tracking-wider"
                >
                  {savingProfile ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>{savingProfile ? 'Menyimpan...' : 'Simpan Profil'}</span>
                </button>
              </div>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}
