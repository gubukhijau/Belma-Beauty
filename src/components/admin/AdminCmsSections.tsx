import React, { useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Star,
  Check,
  X,
  MessageCircle,
  Loader2,
  UserPlus,
  Truck,
} from 'lucide-react';
import type {
  AdminUser,
  Banner,
  Category,
  CmsPage,
  CustomerAccount,
  CustomerOrder,
  Inquiry,
  ResellerAccount,
  StoreSettings,
  Testimonial,
} from '../../types/store';
import { formatDateShort, formatIDR } from '../../lib/format';
import { SafeImage } from '../SafeImage';
import { SingleImageUploader } from './ImageUploader';
import { useToast } from '../ToastContext';

interface SectionProps {
  authToken: string | null;
  onRefreshAll: () => void;
}

function getHeaders(authToken: string | null, json = true): Record<string, string> {
  const h: Record<string, string> = {};
  if (json) h['Content-Type'] = 'application/json';
  if (authToken) h['Authorization'] = `Bearer ${authToken}`;
  return h;
}

// ============================================================================
// 1. CATEGORIES MANAGER
// ============================================================================
export function CategoriesManager({
  categories,
  authToken,
  onRefreshAll,
}: SectionProps & { categories: Category[] }) {
  const { showToast } = useToast();
  const [editing, setEditing] = useState<Category | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setSlug('');
    setDescription('');
    setImageUrl('');
    setSortOrder(String(categories.length + 1));
    setIsActive(true);
    setModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setImageUrl(cat.imageUrl || '');
    setSortOrder(String(cat.sortOrder));
    setIsActive(cat.isActive);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(
        editing ? `/api/admin/categories/${editing.id}` : '/api/admin/categories',
        {
          method: editing ? 'PUT' : 'POST',
          headers: getHeaders(authToken),
          body: JSON.stringify({
            name,
            slug: slug || name,
            description,
            imageUrl,
            sortOrder: Number(sortOrder) || 0,
            isActive,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan kategori.');
      showToast(editing ? 'Kategori diperbarui.' : 'Kategori ditambahkan.');
      setModalOpen(false);
      onRefreshAll();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/admin/categories/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: getHeaders(authToken, false),
      });
      if (!res.ok) throw new Error('Gagal menghapus kategori.');
      showToast('Kategori dihapus.');
      setDeleteTarget(null);
      onRefreshAll();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-[#493B34]">Kategori Produk</h2>
          <p className="text-xs text-[#9C7965]">
            Kelola kategori utama yang tampil di etalase Belma Beauty.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#493B34] hover:bg-[#9C7965] text-white text-xs font-medium tracking-wider uppercase transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kategori</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="bg-white rounded-xl border border-[#D8C3AD]/60 overflow-hidden flex flex-col"
          >
            <div className="aspect-[16/10] bg-[#F8F4EE]">
              <SafeImage
                src={cat.imageUrl}
                alt={cat.name}
                fallbackLabel={cat.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="font-serif text-lg font-semibold text-[#493B34]">{cat.name}</h3>
                  <span
                    className={`text-[11px] font-medium ${
                      cat.isActive ? 'text-[#1F7A4C]' : 'text-[#9C7965]'
                    }`}
                  >
                    {cat.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
                <p className="text-xs text-[#9C7965] mb-1.5">/{cat.slug} · Urutan {cat.sortOrder}</p>
                <p className="text-xs text-[#493B34]/75 line-clamp-2">{cat.description}</p>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E9DDD1]">
                <button
                  type="button"
                  onClick={() => openEdit(cat)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#D8C3AD] text-xs font-medium text-[#493B34] hover:bg-[#F8F4EE]"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(cat)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E5A9A9] text-xs font-medium text-[#B91C1C] hover:bg-[#FFF5F5]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Category Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-[#493B34]/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#D8C3AD] w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl font-semibold text-[#493B34]">
                {editing ? 'Edit Kategori' : 'Tambah Kategori'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-[#9C7965] hover:text-[#493B34]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#493B34] mb-1">
                  Nama Kategori *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-[#D8C3AD] text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#493B34] mb-1">Slug URL</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="Otomatis"
                    className="w-full px-3.5 py-2 rounded-lg border border-[#D8C3AD] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#493B34] mb-1">Urutan</label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-[#D8C3AD] text-sm tabular-nums"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#493B34] mb-1">Deskripsi</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-[#D8C3AD] text-sm"
                />
              </div>
              <SingleImageUploader
                label="Gambar Kategori"
                value={imageUrl}
                onChange={setImageUrl}
                authToken={authToken}
              />
              <label className="inline-flex items-center gap-2 text-xs font-medium text-[#493B34] cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="accent-[#493B34]"
                />
                <span>Tampilkan kategori di toko</span>
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#D8C3AD] text-xs font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-lg bg-[#493B34] text-white text-xs font-medium uppercase tracking-wider"
                >
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-[#493B34]/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#D8C3AD] max-w-sm w-full p-6 space-y-4">
            <h3 className="font-serif text-lg font-semibold text-[#493B34]">
              Hapus Kategori “{deleteTarget.name}”?
            </h3>
            <p className="text-xs text-[#493B34]/75">
              Produk dalam kategori ini tetap aman namun tidak akan terhubung dengan kategori ini.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg border border-[#D8C3AD] text-xs font-medium"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 rounded-lg bg-[#B91C1C] text-white text-xs font-medium"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 2. BANNERS & PROMO MANAGER
// ============================================================================
export function BannersManager({
  banners,
  authToken,
  onRefreshAll,
}: SectionProps & { banners: Banner[] }) {
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [badgeText, setBadgeText] = useState('');
  const [ctaText, setCtaText] = useState('SHOP NOW');
  const [ctaLink, setCtaLink] = useState('#catalog');
  const [imageUrl, setImageUrl] = useState('');
  const [placement, setPlacement] = useState('promo');
  const [countdownEndAt, setCountdownEndAt] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setTitle('');
    setSubtitle('');
    setBadgeText('Seasonal Offer');
    setCtaText('SHOP NOW');
    setCtaLink('#catalog');
    setImageUrl('');
    setPlacement('promo');
    setCountdownEndAt('');
    setIsActive(true);
    setModalOpen(true);
  };

  const openEdit = (b: Banner) => {
    setEditing(b);
    setTitle(b.title);
    setSubtitle(b.subtitle || '');
    setBadgeText(b.badgeText || '');
    setCtaText(b.ctaText || 'SHOP NOW');
    setCtaLink(b.ctaLink || '#catalog');
    setImageUrl(b.imageUrl || '');
    setPlacement(b.placement || 'promo');
    setCountdownEndAt(b.countdownEndAt ? b.countdownEndAt.slice(0, 16) : '');
    setIsActive(b.isActive);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(
        editing ? `/api/admin/banners/${editing.id}` : '/api/admin/banners',
        {
          method: editing ? 'PUT' : 'POST',
          headers: getHeaders(authToken),
          body: JSON.stringify({
            title,
            subtitle,
            badgeText,
            ctaText,
            ctaLink,
            imageUrl,
            placement,
            countdownEndAt: countdownEndAt ? new Date(countdownEndAt).toISOString() : null,
            isActive,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan banner.');
      showToast('Banner berhasil disimpan.');
      setModalOpen(false);
      onRefreshAll();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/admin/banners/${id}`, {
        method: 'DELETE',
        headers: getHeaders(authToken, false),
      });
      showToast('Banner dihapus.');
      onRefreshAll();
    } catch {
      showToast('Gagal menghapus banner.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-[#493B34]">Promo & Banner</h2>
          <p className="text-xs text-[#9C7965]">
            Atur Hero Banner utama dan Promo Banner lengkap dengan countdown penawaran.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#493B34] hover:bg-[#9C7965] text-white text-xs font-medium tracking-wider uppercase transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Banner</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {banners.map((b) => (
          <div
            key={b.id}
            className="bg-white rounded-xl border border-[#D8C3AD]/60 overflow-hidden flex flex-col"
          >
            <div className="aspect-[16/9] bg-[#F8F4EE]">
              <SafeImage src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" />
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between text-xs text-[#9C7965] mb-1">
                  <span className="uppercase tracking-wider font-medium">
                    {b.placement === 'hero' ? 'Hero Banner Utama' : 'Promo Banner'}
                  </span>
                  <span className={b.isActive ? 'text-[#1F7A4C] font-medium' : ''}>
                    {b.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
                <h3 className="font-serif text-lg font-semibold text-[#493B34]">{b.title}</h3>
                <p className="text-xs text-[#493B34]/75 mt-1 line-clamp-2">{b.subtitle}</p>
                {b.countdownEndAt && (
                  <p className="text-[11px] text-[#9C7965] mt-2 tabular-nums">
                    Countdown hingga: {formatDateShort(b.countdownEndAt)}
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-[#E9DDD1]">
                <button
                  type="button"
                  onClick={() => openEdit(b)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#D8C3AD] text-xs font-medium text-[#493B34] hover:bg-[#F8F4EE]"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(b.id)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E5A9A9] text-xs font-medium text-[#B91C1C] hover:bg-[#FFF5F5]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-[#493B34]/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#D8C3AD] w-full max-w-xl p-6 space-y-4 my-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl font-semibold text-[#493B34]">
                {editing ? 'Edit Banner' : 'Tambah Banner'}
              </h3>
              <button type="button" onClick={() => setModalOpen(false)}>
                <X className="w-5 h-5 text-[#9C7965]" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#493B34] mb-1">Posisi</label>
                  <select
                    value={placement}
                    onChange={(e) => setPlacement(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#D8C3AD] text-sm bg-white"
                  >
                    <option value="hero">Hero Banner (Atas)</option>
                    <option value="promo">Promo Banner</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#493B34] mb-1">
                    Label Kicker
                  </label>
                  <input
                    type="text"
                    value={badgeText}
                    onChange={(e) => setBadgeText(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#D8C3AD] text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#493B34] mb-1">Judul *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#D8C3AD] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#493B34] mb-1">Subjudul</label>
                <textarea
                  rows={2}
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#D8C3AD] text-sm"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#493B34] mb-1">
                    Teks Tombol CTA
                  </label>
                  <input
                    type="text"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#D8C3AD] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#493B34] mb-1">
                    Countdown Berakhir (Opsional)
                  </label>
                  <input
                    type="datetime-local"
                    value={countdownEndAt}
                    onChange={(e) => setCountdownEndAt(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#D8C3AD] text-sm"
                  />
                </div>
              </div>
              <SingleImageUploader
                label="Gambar Banner (16:9)"
                value={imageUrl}
                onChange={setImageUrl}
                authToken={authToken}
              />
              <label className="inline-flex items-center gap-2 text-xs font-medium text-[#493B34]">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="accent-[#493B34]"
                />
                <span>Aktifkan banner ini</span>
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#D8C3AD] text-xs font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-lg bg-[#493B34] text-white text-xs font-medium uppercase tracking-wider"
                >
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 3. TESTIMONIALS MANAGER
// ============================================================================
export function TestimonialsManager({
  testimonials,
  authToken,
  onRefreshAll,
}: SectionProps & { testimonials: Testimonial[] }) {
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerRole, setCustomerRole] = useState('Verified Buyer');
  const [productName, setProductName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [rating, setRating] = useState('5');
  const [review, setReview] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setCustomerName('');
    setCustomerRole('Verified Buyer');
    setProductName('');
    setAvatarUrl('');
    setRating('5');
    setReview('');
    setIsPublished(true);
    setModalOpen(true);
  };

  const openEdit = (t: Testimonial) => {
    setEditing(t);
    setCustomerName(t.customerName);
    setCustomerRole(t.customerRole || 'Verified Buyer');
    setProductName(t.productName || '');
    setAvatarUrl(t.avatarUrl || '');
    setRating(String(t.rating));
    setReview(t.review);
    setIsPublished(t.isPublished);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(
        editing ? `/api/admin/testimonials/${editing.id}` : '/api/admin/testimonials',
        {
          method: editing ? 'PUT' : 'POST',
          headers: getHeaders(authToken),
          body: JSON.stringify({
            customerName,
            customerRole,
            productName,
            avatarUrl,
            rating: Number(rating) || 5,
            review,
            isPublished,
          }),
        }
      );
      if (!res.ok) throw new Error('Gagal menyimpan testimoni.');
      showToast('Testimoni disimpan.');
      setModalOpen(false);
      onRefreshAll();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/admin/testimonials/${id}`, {
      method: 'DELETE',
      headers: getHeaders(authToken, false),
    });
    showToast('Testimoni dihapus.');
    onRefreshAll();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-[#493B34]">Testimoni Pelanggan</h2>
          <p className="text-xs text-[#9C7965]">
            Kelola ulasan dan rating pelanggan yang ditampilkan di halaman utama.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#493B34] hover:bg-[#9C7965] text-white text-xs font-medium tracking-wider uppercase self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Testimoni</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {testimonials.map((t) => (
          <div
            key={t.id}
            className="bg-white rounded-xl border border-[#D8C3AD]/60 p-5 flex flex-col justify-between gap-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-[#9C7965]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < t.rating ? 'fill-[#9C7965]' : 'text-[#D8C3AD]'
                      }`}
                    />
                  ))}
                </div>
                <span className={`text-[11px] font-medium ${t.isPublished ? 'text-[#1F7A4C]' : 'text-[#9C7965]'}`}>
                  {t.isPublished ? 'Dipublikasikan' : 'Tersembunyi'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#493B34]/85 italic leading-relaxed">
                “{t.review}”
              </p>
            </div>
            <div className="space-y-3 pt-3 border-t border-[#E9DDD1]">
              <div className="flex items-center gap-3">
                {t.avatarUrl ? (
                  <img
                    src={t.avatarUrl}
                    alt={t.customerName}
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-[#E9DDD1] flex items-center justify-center text-xs font-serif font-semibold">
                    {t.customerName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#493B34] truncate">{t.customerName}</p>
                  <p className="text-[11px] text-[#9C7965] truncate">
                    {t.productName || t.customerRole}
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(t)}
                  className="px-3 py-1.5 rounded-lg border border-[#D8C3AD] text-xs font-medium"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(t.id)}
                  className="px-3 py-1.5 rounded-lg border border-[#E5A9A9] text-xs font-medium text-[#B91C1C]"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-[#493B34]/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#D8C3AD] w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl font-semibold text-[#493B34]">
                {editing ? 'Edit Testimoni' : 'Tambah Testimoni'}
              </h3>
              <button type="button" onClick={() => setModalOpen(false)}>
                <X className="w-5 h-5 text-[#9C7965]" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#493B34] mb-1">
                    Nama Pelanggan *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#D8C3AD] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#493B34] mb-1">
                    Rating (1-5)
                  </label>
                  <select
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#D8C3AD] text-sm bg-white"
                  >
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>
                        {n} Bintang
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#493B34] mb-1">
                    Kota / Keterangan
                  </label>
                  <input
                    type="text"
                    value={customerRole}
                    onChange={(e) => setCustomerRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#D8C3AD] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#493B34] mb-1">
                    Produk yang Dibeli
                  </label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#D8C3AD] text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#493B34] mb-1">Ulasan *</label>
                <textarea
                  required
                  rows={3}
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#D8C3AD] text-sm"
                />
              </div>
              <SingleImageUploader
                label="Foto Pelanggan (Opsional)"
                value={avatarUrl}
                onChange={setAvatarUrl}
                authToken={authToken}
              />
              <label className="inline-flex items-center gap-2 text-xs font-medium text-[#493B34]">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="accent-[#493B34]"
                />
                <span>Publikasikan di website</span>
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#D8C3AD] text-xs font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-lg bg-[#493B34] text-white text-xs font-medium uppercase tracking-wider"
                >
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 4. INQUIRIES / ORDER LEADS MANAGER
// ============================================================================
export function InquiriesManager({
  inquiries,
  authToken,
  onRefreshAll,
}: SectionProps & { inquiries: Inquiry[] }) {
  const { showToast } = useToast();

  const updateStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/admin/inquiries/${id}`, {
        method: 'PUT',
        headers: getHeaders(authToken),
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Gagal memperbarui status.');
      showToast('Status pesan diperbarui.');
      onRefreshAll();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const removeInquiry = async (id: number) => {
    await fetch(`/api/admin/inquiries/${id}`, {
      method: 'DELETE',
      headers: getHeaders(authToken, false),
    });
    showToast('Pesan dihapus.');
    onRefreshAll();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-semibold text-[#493B34]">
          Konsultasi & Pesan Pelanggan
        </h2>
        <p className="text-xs text-[#9C7965]">
          Daftar pertanyaan produk dan pesan konsultasi yang masuk dari halaman Contact.
        </p>
      </div>

      {inquiries.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#D8C3AD]/60 p-12 text-center text-sm text-[#9C7965]">
          Belum ada pesan konsultasi yang masuk.
        </div>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inq) => {
            const cleanWa = (inq.phone || '').replace(/[^0-9]/g, '');
            const waUrl = cleanWa
              ? `https://wa.me/${cleanWa.startsWith('0') ? `62${cleanWa.slice(1)}` : cleanWa}?text=${encodeURIComponent(
                  `Halo ${inq.customerName}, terima kasih telah menghubungi Belma Beauty mengenai ${inq.subject}.`
                )}`
              : null;

            return (
              <div
                key={inq.id}
                className="bg-white rounded-xl border border-[#D8C3AD]/60 p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-[#493B34]">
                      {inq.customerName}
                    </span>
                    <span className="text-xs text-[#9C7965]">· {inq.email}</span>
                    {inq.phone && <span className="text-xs text-[#9C7965]">· {inq.phone}</span>}
                    <span className="text-xs text-[#9C7965] tabular-nums">
                      · {formatDateShort(inq.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-[#9C7965]">
                    {inq.subject} {inq.productName ? `— ${inq.productName}` : ''}
                  </p>
                  <p className="text-sm text-[#493B34]/85 pt-1 leading-relaxed">{inq.message}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <select
                    value={inq.status}
                    onChange={(e) => updateStatus(inq.id, e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-[#D8C3AD] text-xs bg-[#F8F4EE] text-[#493B34]"
                  >
                    <option value="new">Baru</option>
                    <option value="replied">Sudah Dibalas</option>
                    <option value="closed">Selesai</option>
                  </select>
                  {waUrl && (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1F7A4C] text-white text-xs font-medium"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Balas WA</span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => removeInquiry(inq.id)}
                    className="p-1.5 rounded-lg border border-[#E5A9A9] text-[#B91C1C] hover:bg-[#FFF5F5]"
                    aria-label="Hapus pesan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 5. PAGES MANAGER
// ============================================================================
export function PagesManager({
  pages,
  authToken,
  onRefreshAll,
}: SectionProps & { pages: CmsPage[] }) {
  const { showToast } = useToast();
  const [selected, setSelected] = useState<CmsPage | null>(pages[0] || null);
  const [title, setTitle] = useState(pages[0]?.title || '');
  const [slug, setSlug] = useState(pages[0]?.slug || '');
  const [subtitle, setSubtitle] = useState(pages[0]?.subtitle || '');
  const [content, setContent] = useState(pages[0]?.content || '');
  const [imageUrl, setImageUrl] = useState(pages[0]?.imageUrl || '');
  const [isPublished, setIsPublished] = useState(pages[0]?.isPublished ?? true);
  const [saving, setSaving] = useState(false);

  const selectPage = (p: CmsPage | null) => {
    setSelected(p);
    if (p) {
      setTitle(p.title);
      setSlug(p.slug);
      setSubtitle(p.subtitle || '');
      setContent(p.content || '');
      setImageUrl(p.imageUrl || '');
      setIsPublished(p.isPublished);
    } else {
      setTitle('');
      setSlug('');
      setSubtitle('');
      setContent('');
      setImageUrl('');
      setIsPublished(true);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(
        selected ? `/api/admin/pages/${selected.id}` : '/api/admin/pages',
        {
          method: selected ? 'PUT' : 'POST',
          headers: getHeaders(authToken),
          body: JSON.stringify({ title, slug: slug || title, subtitle, content, imageUrl, isPublished }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan halaman.');
      showToast('Konten halaman berhasil diperbarui.');
      onRefreshAll();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-[#493B34]">Halaman Website</h2>
          <p className="text-xs text-[#9C7965]">
            Edit konten halaman About Us, Contact, atau tambah halaman informasi baru.
          </p>
        </div>
        <button
          type="button"
          onClick={() => selectPage(null)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#493B34] hover:bg-[#9C7965] text-white text-xs font-medium tracking-wider uppercase self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Halaman Baru</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-2">
          {pages.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => selectPage(p)}
              className={`w-full text-left p-4 rounded-xl border transition-colors ${
                selected?.id === p.id
                  ? 'bg-white border-[#493B34]'
                  : 'bg-white/70 border-[#D8C3AD]/60 hover:bg-white'
              }`}
            >
              <p className="font-serif text-base font-semibold text-[#493B34]">{p.title}</p>
              <p className="text-xs text-[#9C7965] mt-0.5">/{p.slug}</p>
            </button>
          ))}
        </div>

        <form
          onSubmit={handleSave}
          className="lg:col-span-8 bg-white rounded-xl border border-[#D8C3AD]/60 p-6 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#493B34] mb-1">
                Judul Halaman *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-[#D8C3AD] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#493B34] mb-1">Slug URL</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-[#D8C3AD] text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#493B34] mb-1">Subjudul</label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-[#D8C3AD] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#493B34] mb-1">Isi Konten</label>
            <textarea
              rows={7}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-[#D8C3AD] text-sm"
            />
          </div>

          <SingleImageUploader
            label="Foto Halaman"
            value={imageUrl}
            onChange={setImageUrl}
            authToken={authToken}
          />

          <div className="flex items-center justify-between pt-2">
            <label className="inline-flex items-center gap-2 text-xs font-medium text-[#493B34]">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="accent-[#493B34]"
              />
              <span>Publikasikan halaman</span>
            </label>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#493B34] hover:bg-[#9C7965] text-white text-xs font-medium uppercase tracking-wider"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>{saving ? 'Menyimpan...' : 'Simpan Halaman'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// 6. STORE SETTINGS & ADMIN USERS MANAGER
// ============================================================================
export function SettingsManager({
  settings,
  adminUsers,
  authToken,
  onRefreshAll,
}: SectionProps & { settings: StoreSettings; adminUsers: AdminUser[] }) {
  const { showToast } = useToast();
  const [form, setForm] = useState<StoreSettings>(settings);
  const [saving, setSaving] = useState(false);

  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [addingUser, setAddingUser] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: getHeaders(authToken),
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan pengaturan.');
      showToast('Pengaturan toko berhasil diperbarui.');
      onRefreshAll();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingUser(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: getHeaders(authToken),
        body: JSON.stringify({
          email: newAdminEmail,
          name: newAdminName,
          password: newAdminPassword || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menambahkan admin.');
      showToast('Administrator baru ditambahkan.');
      setNewAdminEmail('');
      setNewAdminName('');
      setNewAdminPassword('');
      onRefreshAll();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setAddingUser(false);
    }
  };

  const handleDeleteAdmin = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: getHeaders(authToken, false),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus admin.');
      showToast('Administrator dihapus.');
      onRefreshAll();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-2xl font-semibold text-[#493B34]">Pengaturan Toko</h2>
        <p className="text-xs text-[#9C7965]">
          Kelola identitas brand, nomor WhatsApp resmi, link marketplace, SEO, dan visual website.
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        <div className="bg-white rounded-xl border border-[#D8C3AD]/60 p-6 space-y-4">
          <h3 className="font-serif text-lg font-semibold text-[#493B34]">Identitas & Visual Toko</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#493B34] mb-1">Nama Toko *</label>
              <input
                type="text"
                required
                value={form.storeName}
                onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-[#D8C3AD] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#493B34] mb-1">Tagline</label>
              <input
                type="text"
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-[#D8C3AD] text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <SingleImageUploader
              label="Logo Toko"
              value={form.logoUrl || ''}
              onChange={(url) => setForm({ ...form, logoUrl: url })}
              authToken={authToken}
            />
            <SingleImageUploader
              label="Favicon"
              value={form.faviconUrl || ''}
              onChange={(url) => setForm({ ...form, faviconUrl: url })}
              authToken={authToken}
            />
          </div>

          <div className="pt-2">
            <SingleImageUploader
              label="Banner Utama Website (Fallback Hero)"
              value={form.heroBannerUrl || ''}
              onChange={(url) => setForm({ ...form, heroBannerUrl: url })}
              authToken={authToken}
              aspectHint="Disarankan 16:9"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#D8C3AD]/60 p-6 space-y-4">
          <h3 className="font-serif text-lg font-semibold text-[#493B34]">
            WhatsApp & Saluran Resmi
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#493B34] mb-1">
                Nomor WhatsApp Admin (contoh: 6281234567890) *
              </label>
              <input
                type="text"
                required
                value={form.whatsappNumber}
                onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-[#D8C3AD] text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#493B34] mb-1">Email Toko</label>
              <input
                type="email"
                value={form.email || ''}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-[#D8C3AD] text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#493B34] mb-1">
              Template Pesan Default WhatsApp
            </label>
            <input
              type="text"
              value={form.whatsappDefaultMessage}
              onChange={(e) => setForm({ ...form, whatsappDefaultMessage: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg border border-[#D8C3AD] text-sm"
            />
            <p className="text-[11px] text-[#9C7965] mt-1">
              Gunakan placeholder [NAMA PRODUK] dan [HARGA] agar terisi otomatis pada setiap produk.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#493B34] mb-1">Instagram URL</label>
              <input
                type="url"
                value={form.instagramUrl || ''}
                onChange={(e) => setForm({ ...form, instagramUrl: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-[#D8C3AD] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#493B34] mb-1">TikTok URL</label>
              <input
                type="url"
                value={form.tiktokUrl || ''}
                onChange={(e) => setForm({ ...form, tiktokUrl: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-[#D8C3AD] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#493B34] mb-1">
                Shopee Store URL
              </label>
              <input
                type="url"
                value={form.shopeeStoreUrl || ''}
                onChange={(e) => setForm({ ...form, shopeeStoreUrl: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-[#D8C3AD] text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#493B34] mb-1">Alamat Toko</label>
            <input
              type="text"
              value={form.storeAddress || ''}
              onChange={(e) => setForm({ ...form, storeAddress: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg border border-[#D8C3AD] text-sm"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#D8C3AD]/60 p-6 space-y-4">
          <h3 className="font-serif text-lg font-semibold text-[#493B34]">
            Pengaturan Harga Default Reseller
          </h3>
          <p className="text-xs text-[#9C7965]">
            Berlaku otomatis untuk akun dengan role reseller aktif jika harga reseller spesifik pada produk dikosongkan.
          </p>
          <div className="max-w-xs">
            <label className="block text-xs font-medium text-[#493B34] mb-1">
              Diskon Default Reseller (%)
            </label>
            <input
              type="number"
              min={0}
              max={90}
              value={form.resellerDefaultDiscountPct ?? 0}
              onChange={(e) =>
                setForm({
                  ...form,
                  resellerDefaultDiscountPct: Math.min(90, Math.max(0, Number(e.target.value) || 0)),
                })
              }
              className="w-full px-3.5 py-2 rounded-lg border border-[#D8C3AD] text-sm tabular-nums"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#D8C3AD]/60 p-6 space-y-4">
          <h3 className="font-serif text-lg font-semibold text-[#493B34]">SEO Metadata</h3>
          <div>
            <label className="block text-xs font-medium text-[#493B34] mb-1">SEO Title</label>
            <input
              type="text"
              value={form.seoTitle || ''}
              onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg border border-[#D8C3AD] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#493B34] mb-1">
              SEO Description
            </label>
            <textarea
              rows={2}
              value={form.seoDescription || ''}
              onChange={(e) => setForm({ ...form, seoDescription: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg border border-[#D8C3AD] text-sm"
            />
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#493B34] hover:bg-[#9C7965] text-white text-xs font-medium uppercase tracking-wider"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>{saving ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Admin Users Access */}
      <div className="bg-white rounded-xl border border-[#D8C3AD]/60 p-6 space-y-5">
        <div>
          <h3 className="font-serif text-lg font-semibold text-[#493B34]">
            Akses Administrator CMS
          </h3>
          <p className="text-xs text-[#9C7965]">
            Kelola akun yang memiliki hak akses ke dashboard admin Belma Beauty.
          </p>
        </div>

        <div className="divide-y divide-[#E9DDD1]">
          {adminUsers.map((u) => (
            <div key={u.id} className="py-3 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[#493B34]">{u.name}</p>
                <p className="text-xs text-[#9C7965]">
                  {u.email} · {u.role}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteAdmin(u.id)}
                className="p-1.5 rounded-lg text-[#B91C1C] hover:bg-[#FFF5F5]"
                aria-label="Hapus admin"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddAdmin} className="pt-4 border-t border-[#E9DDD1] grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-[#493B34] mb-1">Nama</label>
            <input
              type="text"
              required
              value={newAdminName}
              onChange={(e) => setNewAdminName(e.target.value)}
              placeholder="Admin Store"
              className="w-full px-3 py-2 rounded-lg border border-[#D8C3AD] text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#493B34] mb-1">Email</label>
            <input
              type="email"
              required
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              placeholder="staff@belmabeauty.com"
              className="w-full px-3 py-2 rounded-lg border border-[#D8C3AD] text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#493B34] mb-1">
              Password (Opsional untuk Google)
            </label>
            <input
              type="password"
              value={newAdminPassword}
              onChange={(e) => setNewAdminPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              className="w-full px-3 py-2 rounded-lg border border-[#D8C3AD] text-xs"
            />
          </div>
          <button
            type="submit"
            disabled={addingUser}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#493B34] hover:bg-[#9C7965] text-white text-xs font-medium"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{addingUser ? 'Menambah...' : 'Tambah Admin'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// 7. RESELLERS MANAGER (Admin registers & controls active reseller role & pricing)
// ============================================================================
export function ResellersManager({
  resellers,
  settings,
  authToken,
  onRefreshAll,
}: SectionProps & { resellers: ResellerAccount[]; settings: StoreSettings | null }) {
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ResellerAccount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ResellerAccount | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [tierCode, setTierCode] = useState('OFFICIAL RESELLER');
  const [role, setRole] = useState('reseller');
  const [isActive, setIsActive] = useState(true);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const [defaultDiscountPct, setDefaultDiscountPct] = useState(
    String(settings?.resellerDefaultDiscountPct ?? 0)
  );
  const [savingDiscount, setSavingDiscount] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setEmail('');
    setPassword('');
    setPhone('');
    setCity('');
    setTierCode('OFFICIAL RESELLER');
    setRole('reseller');
    setIsActive(true);
    setNotes('');
    setModalOpen(true);
  };

  const openEdit = (r: ResellerAccount) => {
    setEditing(r);
    setName(r.name);
    setEmail(r.email);
    setPassword('');
    setPhone(r.phone || '');
    setCity(r.city || '');
    setTierCode(r.tierCode || 'RESELLER');
    setRole(r.role || 'reseller');
    setIsActive(r.isActive);
    setNotes(r.notes || '');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(
        editing ? `/api/admin/resellers/${editing.id}` : '/api/admin/resellers',
        {
          method: editing ? 'PUT' : 'POST',
          headers: getHeaders(authToken),
          body: JSON.stringify({
            name,
            email,
            password: password || undefined,
            phone,
            city,
            tierCode,
            role,
            isActive,
            notes,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan akun reseller.');
      showToast(editing ? 'Akun reseller diperbarui.' : 'Akun reseller baru berhasil didaftarkan.');
      setModalOpen(false);
      onRefreshAll();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (r: ResellerAccount) => {
    try {
      const res = await fetch(`/api/admin/resellers/${r.id}`, {
        method: 'PUT',
        headers: getHeaders(authToken),
        body: JSON.stringify({
          name: r.name,
          email: r.email,
          phone: r.phone || '',
          city: r.city || '',
          tierCode: r.tierCode,
          role: r.role,
          isActive: !r.isActive,
          notes: r.notes || '',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengubah status reseller.');
      showToast(
        !r.isActive
          ? `${r.name} diaktifkan (mendapatkan harga reseller).`
          : `${r.name} dinonaktifkan (harga menyesuaikan harga toko).`
      );
      onRefreshAll();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/admin/resellers/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: getHeaders(authToken, false),
      });
      if (!res.ok) throw new Error('Gagal menghapus reseller.');
      showToast(`Akun reseller "${deleteTarget.name}" dihapus.`);
      setDeleteTarget(null);
      onRefreshAll();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleSaveDefaultDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSavingDiscount(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: getHeaders(authToken),
        body: JSON.stringify({
          ...settings,
          resellerDefaultDiscountPct: Math.min(90, Math.max(0, Number(defaultDiscountPct) || 0)),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan diskon default.');
      showToast('Diskon default reseller diperbarui.');
      onRefreshAll();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSavingDiscount(false);
    }
  };

  const activeCount = resellers.filter((r) => r.isActive && r.role === 'reseller').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-[#493B34]">
            Manajemen Akun Reseller
          </h2>
          <p className="text-xs text-[#9C7965]">
            Daftarkan akun reseller secara eksklusif. Reseller tidak bisa mendaftar mandiri; hanya akun dengan role reseller aktif yang melihat harga khusus reseller.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#493B34] hover:bg-[#9C7965] text-white text-xs font-medium tracking-wider uppercase transition-colors self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Daftarkan Reseller</span>
        </button>
      </div>

      {/* Reseller Global Settings & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 bg-white rounded-xl border border-[#D8C3AD]/60 p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-[#9C7965]">Total Akun Reseller Terdaftar</p>
            <p className="font-serif text-3xl font-semibold text-[#493B34] mt-1 tabular-nums">
              {resellers.length}
            </p>
            <p className="text-xs text-[#1F7A4C] mt-1 tabular-nums">
              {activeCount} aktif · {resellers.length - activeCount} nonaktif / harga toko
            </p>
          </div>
          <div className="text-right text-xs text-[#9C7965]">
            <p>Akses Portal:</p>
            <p className="font-mono text-[#493B34] mt-0.5">/reseller</p>
          </div>
        </div>

        <form
          onSubmit={handleSaveDefaultDiscount}
          className="lg:col-span-7 bg-white rounded-xl border border-[#D8C3AD]/60 p-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4"
        >
          <div className="flex-1">
            <label className="block text-xs font-medium text-[#493B34] mb-1">
              Diskon Default Reseller (%) — Jika Harga Reseller Produk Kosong
            </label>
            <input
              type="number"
              min={0}
              max={90}
              value={defaultDiscountPct}
              onChange={(e) => setDefaultDiscountPct(e.target.value)}
              className="w-full sm:w-48 px-3.5 py-2 rounded-lg border border-[#D8C3AD] text-sm tabular-nums"
            />
            <p className="text-[11px] text-[#9C7965] mt-1">
              Harga reseller per produk dapat diatur langsung pada menu Products &rarr; Edit Produk.
            </p>
          </div>
          <button
            type="submit"
            disabled={savingDiscount}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#493B34] hover:bg-[#9C7965] text-white text-xs font-medium uppercase tracking-wider shrink-0"
          >
            {savingDiscount ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            <span>Simpan Diskon</span>
          </button>
        </form>
      </div>

      {/* Resellers Table */}
      <div className="bg-white rounded-xl border border-[#D8C3AD]/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E9DDD1] bg-[#F8F4EE]/70 text-[11px] uppercase tracking-wider text-[#9C7965]">
                <th className="py-3 px-4 font-medium">Partner / Reseller</th>
                <th className="py-3 px-4 font-medium">Kontak & Kota</th>
                <th className="py-3 px-4 font-medium">Role & Kode</th>
                <th className="py-3 px-4 font-medium">Status Harga</th>
                <th className="py-3 px-4 font-medium text-right">Terdaftar</th>
                <th className="py-3 px-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9DDD1] text-sm">
              {resellers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-xs text-[#9C7965]">
                    Belum ada akun reseller yang didaftarkan admin.
                  </td>
                </tr>
              ) : (
                resellers.map((r) => {
                  const activeReseller = r.role === 'reseller' && r.isActive;
                  return (
                    <tr key={r.id} className="hover:bg-[#F8F4EE]/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-[#493B34]">{r.name}</p>
                        <p className="text-xs text-[#9C7965]">{r.email}</p>
                        {r.notes && (
                          <p className="text-[11px] text-[#493B34]/65 mt-0.5 line-clamp-1">
                            {r.notes}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#493B34]/80">
                        <p className="tabular-nums">{r.phone || '-'}</p>
                        <p className="text-[#9C7965]">{r.city || '-'}</p>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <p className="font-medium text-[#493B34] uppercase">{r.role}</p>
                        <p className="text-[11px] text-[#9C7965]">{r.tierCode}</p>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(r)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] font-medium transition-colors ${
                            activeReseller
                              ? 'bg-[#E9F5EE] border-[#1F7A4C]/30 text-[#1F7A4C]'
                              : 'bg-[#F8F4EE] border-[#D8C3AD] text-[#9C7965]'
                          }`}
                        >
                          {activeReseller ? 'Aktif (Harga Reseller)' : 'Nonaktif (Harga Toko)'}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right text-xs text-[#9C7965] tabular-nums whitespace-nowrap">
                        {formatDateShort(r.createdAt)}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEdit(r)}
                            className="p-2 rounded-lg border border-[#D8C3AD] text-[#493B34] hover:bg-[#F8F4EE]"
                            aria-label={`Edit ${r.name}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(r)}
                            className="p-2 rounded-lg border border-[#E5A9A9] text-[#B91C1C] hover:bg-[#FFF5F5]"
                            aria-label={`Hapus ${r.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Reseller Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-[#493B34]/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#D8C3AD] w-full max-w-lg p-6 space-y-4 my-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl font-semibold text-[#493B34]">
                {editing ? `Edit Reseller: ${editing.name}` : 'Daftarkan Reseller Baru'}
              </h3>
              <button type="button" onClick={() => setModalOpen(false)}>
                <X className="w-5 h-5 text-[#9C7965]" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#493B34] mb-1">
                    Nama / Toko Partner *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Boutique Cantik Nusantara"
                    className="w-full px-3.5 py-2 rounded-lg border border-[#D8C3AD] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#493B34] mb-1">
                    Email Login Reseller *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="partner@tokocantik.com"
                    className="w-full px-3.5 py-2 rounded-lg border border-[#D8C3AD] text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#493B34] mb-1">
                  {editing ? 'Password Baru (Kosongkan jika tidak diubah)' : 'Password Login *'}
                </label>
                <input
                  type="password"
                  required={!editing}
                  minLength={editing ? undefined : 6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-3.5 py-2 rounded-lg border border-[#D8C3AD] text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#493B34] mb-1">No. WhatsApp</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0812..."
                    className="w-full px-3.5 py-2 rounded-lg border border-[#D8C3AD] text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#493B34] mb-1">Kota</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Jakarta Selatan"
                    className="w-full px-3.5 py-2 rounded-lg border border-[#D8C3AD] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#493B34] mb-1">Kode Tier</label>
                  <input
                    type="text"
                    value={tierCode}
                    onChange={(e) => setTierCode(e.target.value)}
                    placeholder="OFFICIAL RESELLER"
                    className="w-full px-3.5 py-2 rounded-lg border border-[#D8C3AD] text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-xs font-medium text-[#493B34] mb-1">Role Akun</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-[#D8C3AD] text-sm bg-white"
                  >
                    <option value="reseller">reseller (Akses Harga Reseller jika Aktif)</option>
                    <option value="member">member (Harga Mengikuti Toko)</option>
                  </select>
                </div>
                <label className="inline-flex items-center gap-2 text-xs font-medium text-[#493B34] pt-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="accent-[#493B34]"
                  />
                  <span>Status Reseller Aktif</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#493B34] mb-1">Catatan Admin</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Wilayah distribusi atau keterangan tambahan..."
                  className="w-full px-3.5 py-2 rounded-lg border border-[#D8C3AD] text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#D8C3AD] text-xs font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-lg bg-[#493B34] hover:bg-[#9C7965] text-white text-xs font-medium uppercase tracking-wider"
                >
                  {saving ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : 'Daftarkan Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-[#493B34]/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#D8C3AD] max-w-sm w-full p-6 space-y-4">
            <h3 className="font-serif text-lg font-semibold text-[#493B34]">
              Hapus Akun “{deleteTarget.name}”?
            </h3>
            <p className="text-xs text-[#493B34]/75">
              Akun reseller ini tidak akan dapat mengakses portal reseller lagi kecuali didaftarkan ulang oleh admin.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg border border-[#D8C3AD] text-xs font-medium"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 rounded-lg bg-[#B91C1C] text-white text-xs font-medium"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 8. CUSTOMER ORDERS & MANUAL RESI MANAGER (Orders via WhatsApp -> Manual Resi)
// ============================================================================
const ADMIN_COURIER_OPTIONS = [
  { code: '', label: '-- Belum Ada Kurir --' },
  { code: 'jne', label: 'JNE Express (jne)' },
  { code: 'jnt', label: 'J&T Express (jnt)' },
  { code: 'sicepat', label: 'SiCepat (sicepat)' },
  { code: 'anteraja', label: 'AnterAja (anteraja)' },
  { code: 'pos', label: 'POS Indonesia (pos)' },
  { code: 'tiki', label: 'TIKI (tiki)' },
  { code: 'wahana', label: 'Wahana (wahana)' },
  { code: 'ninja', label: 'Ninja Xpress (ninja)' },
  { code: 'spx', label: 'Shopee Express (spx)' },
  { code: 'lion', label: 'Lion Parcel (lion)' },
  { code: 'idexpress', label: 'ID Express (idexpress)' },
];

export function CustomerOrdersManager({
  orders,
  customers,
  authToken,
  onRefreshAll,
}: SectionProps & { orders: CustomerOrder[]; customers: CustomerAccount[] }) {
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerOrder | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CustomerOrder | null>(null);

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerWhatsapp, setCustomerWhatsapp] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [productSummary, setProductSummary] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [orderChannel, setOrderChannel] = useState('whatsapp');
  const [status, setStatus] = useState('diproses');
  const [courier, setCourier] = useState('jne');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingNote, setTrackingNote] = useState('');
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setSelectedCustomerId('');
    setCustomerName('');
    setCustomerWhatsapp('');
    setCustomerEmail('');
    setShippingAddress('');
    setProductSummary('');
    setTotalAmount('189000');
    setOrderChannel('whatsapp');
    setStatus('diproses');
    setCourier('jne');
    setTrackingNumber('');
    setTrackingNote('');
    setModalOpen(true);
  };

  const openEdit = (ord: CustomerOrder) => {
    setEditing(ord);
    setSelectedCustomerId(ord.customerId ? String(ord.customerId) : '');
    setCustomerName(ord.customerName);
    setCustomerWhatsapp(ord.customerWhatsapp);
    setCustomerEmail(ord.customerEmail || '');
    setShippingAddress(ord.shippingAddress || '');
    setProductSummary(ord.productSummary);
    setTotalAmount(String(ord.totalAmount || 0));
    setOrderChannel(ord.orderChannel || 'whatsapp');
    setStatus(ord.status || 'diproses');
    setCourier(ord.courier || '');
    setTrackingNumber(ord.trackingNumber || '');
    setTrackingNote(ord.trackingNote || '');
    setModalOpen(true);
  };

  const handleSelectCustomer = (custIdStr: string) => {
    setSelectedCustomerId(custIdStr);
    const found = customers.find((c) => String(c.id) === custIdStr);
    if (found) {
      setCustomerName(found.name);
      setCustomerWhatsapp(found.whatsappNumber);
      setCustomerEmail(found.email);
      setShippingAddress(found.address);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(
        editing ? `/api/admin/orders/${editing.id}` : '/api/admin/orders',
        {
          method: editing ? 'PUT' : 'POST',
          headers: getHeaders(authToken),
          body: JSON.stringify({
            customerId: selectedCustomerId ? Number(selectedCustomerId) : null,
            customerName,
            customerWhatsapp,
            customerEmail,
            shippingAddress,
            productSummary,
            totalAmount: Number(totalAmount) || 0,
            orderChannel,
            status: trackingNumber.trim() && status === 'diproses' ? 'dikirim' : status,
            courier,
            trackingNumber,
            trackingNote,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan pesanan.');
      showToast(
        editing
          ? 'Pesanan & nomor resi berhasil diperbarui.'
          : 'Pesanan WhatsApp baru berhasil dicatat.'
      );
      setModalOpen(false);
      onRefreshAll();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/admin/orders/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: getHeaders(authToken, false),
      });
      if (!res.ok) throw new Error('Gagal menghapus pesanan.');
      showToast(`Pesanan ${deleteTarget.orderNumber} dihapus.`);
      setDeleteTarget(null);
      onRefreshAll();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-[#493B34]">
            Pesanan Pelanggan & Input Resi
          </h2>
          <p className="text-xs text-[#9C7965]">
            Catat pesanan WhatsApp pelanggan dan input nomor resi secara manual agar pelanggan dapat melakukan Tracking Cekresi di Dashboard Pelanggan.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#493B34] hover:bg-[#9C7965] text-white text-xs font-medium tracking-wider uppercase transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pesanan & Resi</span>
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-[#D8C3AD]/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E9DDD1] bg-[#F8F4EE]/70 text-[11px] uppercase tracking-wider text-[#9C7965]">
                <th className="py-3 px-4 font-medium">No. Order</th>
                <th className="py-3 px-4 font-medium">Pelanggan</th>
                <th className="py-3 px-4 font-medium">Produk & Total</th>
                <th className="py-3 px-4 font-medium">Kurir & No. Resi</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9DDD1] text-sm">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-xs text-[#9C7965]">
                    Belum ada pesanan pelanggan yang dicatat.
                  </td>
                </tr>
              ) : (
                orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-[#F8F4EE]/50 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <p className="font-mono text-xs font-semibold text-[#493B34]">
                        {ord.orderNumber}
                      </p>
                      <p className="text-[11px] text-[#9C7965] tabular-nums">
                        {formatDateShort(ord.createdAt)} · {ord.orderChannel}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <p className="font-medium text-[#493B34]">{ord.customerName}</p>
                      <p className="text-[#9C7965] tabular-nums">{ord.customerWhatsapp}</p>
                      {ord.customerEmail && (
                        <p className="text-[11px] text-[#9C7965]">{ord.customerEmail}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs max-w-xs">
                      <p className="text-[#493B34] line-clamp-2">{ord.productSummary}</p>
                      <p className="font-semibold text-[#493B34] mt-0.5 tabular-nums">
                        {formatIDR(ord.totalAmount)}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                      {ord.trackingNumber ? (
                        <div>
                          <span className="uppercase font-medium text-[#1F7A4C] block">
                            {ord.courier || 'JNE'}
                          </span>
                          <span className="font-mono font-semibold text-[#493B34]">
                            {ord.trackingNumber}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[#9C7965] italic">Belum ada resi</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs whitespace-nowrap capitalize">
                      <span className="font-medium text-[#493B34]">{ord.status}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(ord)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#D8C3AD] text-xs font-medium text-[#493B34] hover:bg-[#F8F4EE]"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>{ord.trackingNumber ? 'Edit Resi' : 'Input Resi'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(ord)}
                          className="p-2 rounded-lg border border-[#E5A9A9] text-[#B91C1C] hover:bg-[#FFF5F5]"
                          aria-label={`Hapus ${ord.orderNumber}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Registered Customers List */}
      <div className="bg-white rounded-xl border border-[#D8C3AD]/60 p-6 space-y-4">
        <div>
          <h3 className="font-serif text-lg font-semibold text-[#493B34]">
            Daftar Pelanggan Terdaftar ({customers.length})
          </h3>
          <p className="text-xs text-[#9C7965]">
            Pelanggan yang mendaftar melalui formulir pendaftaran di halaman Pelanggan (/pelanggan).
          </p>
        </div>

        {customers.length === 0 ? (
          <p className="text-xs text-[#9C7965] py-4">Belum ada pelanggan terdaftar.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E9DDD1] text-[11px] uppercase tracking-wider text-[#9C7965]">
                  <th className="py-2.5 px-3 font-medium">Nama</th>
                  <th className="py-2.5 px-3 font-medium">Email & No. WhatsApp</th>
                  <th className="py-2.5 px-3 font-medium">Alamat</th>
                  <th className="py-2.5 px-3 font-medium text-right">Terdaftar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9DDD1]">
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td className="py-2.5 px-3 font-medium text-[#493B34]">{c.name}</td>
                    <td className="py-2.5 px-3 text-[#493B34]/80">
                      <p>{c.email}</p>
                      <p className="text-[#9C7965] tabular-nums">{c.whatsappNumber}</p>
                    </td>
                    <td className="py-2.5 px-3 text-[#493B34]/75 max-w-sm">{c.address}</td>
                    <td className="py-2.5 px-3 text-right text-[#9C7965] tabular-nums whitespace-nowrap">
                      {formatDateShort(c.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Order & Manual Resi Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-[#493B34]/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#D8C3AD] w-full max-w-xl p-6 space-y-4 my-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl font-semibold text-[#493B34]">
                {editing ? `Kelola Pesanan ${editing.orderNumber}` : 'Catat Pesanan WhatsApp & Resi'}
              </h3>
              <button type="button" onClick={() => setModalOpen(false)}>
                <X className="w-5 h-5 text-[#9C7965]" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {!editing && customers.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-[#493B34] mb-1">
                    Pilih dari Pelanggan Terdaftar (Opsional)
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => handleSelectCustomer(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-[#D8C3AD] text-sm bg-white"
                  >
                    <option value="">-- Isi Data Pelanggan Secara Manual --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {c.name} ({c.whatsappNumber} · {c.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#493B34] mb-1">
                    Nama Pelanggan *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-[#D8C3AD] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#493B34] mb-1">
                    No WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerWhatsapp}
                    onChange={(e) => setCustomerWhatsapp(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-[#D8C3AD] text-sm tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#493B34] mb-1">
                    Email Pelanggan (Agar sinkron ke dashboard)
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-[#D8C3AD] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#493B34] mb-1">
                    Saluran Pembelian
                  </label>
                  <select
                    value={orderChannel}
                    onChange={(e) => setOrderChannel(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-[#D8C3AD] text-sm bg-white"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="tiktok">TikTok Shop</option>
                    <option value="shopee">Shopee</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#493B34] mb-1">
                  Alamat Pengiriman
                </label>
                <input
                  type="text"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-[#D8C3AD] text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-[#493B34] mb-1">
                    Produk yang Dipesan *
                  </label>
                  <input
                    type="text"
                    required
                    value={productSummary}
                    onChange={(e) => setProductSummary(e.target.value)}
                    placeholder="1x Belma Brightening Serum, 1x Belma Sunscreen"
                    className="w-full px-3.5 py-2 rounded-lg border border-[#D8C3AD] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#493B34] mb-1">
                    Total (Rp) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-[#D8C3AD] text-sm tabular-nums"
                  />
                </div>
              </div>

              {/* Manual Resi Input Section */}
              <div className="rounded-xl bg-[#F8F4EE] border border-[#D8C3AD] p-4 space-y-3">
                <p className="text-xs font-semibold text-[#493B34]">
                  Input Manual Resi Pengiriman (Tracking Cekresi.com)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#493B34] mb-1">Kurir</label>
                    <select
                      value={courier}
                      onChange={(e) => setCourier(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#D8C3AD] text-sm bg-white"
                    >
                      {ADMIN_COURIER_OPTIONS.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#493B34] mb-1">
                      Nomor Resi (AWB)
                    </label>
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="Contoh: KDRAA01056184914"
                      className="w-full px-3 py-2 rounded-lg border border-[#D8C3AD] text-sm font-mono bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#493B34] mb-1">
                      Status Pesanan
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#D8C3AD] text-sm bg-white"
                    >
                      <option value="menunggu">Menunggu</option>
                      <option value="diproses">Diproses</option>
                      <option value="dikirim">Dikirim</option>
                      <option value="selesai">Selesai</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#493B34] mb-1">
                    Catatan Pengiriman
                  </label>
                  <input
                    type="text"
                    value={trackingNote}
                    onChange={(e) => setTrackingNote(e.target.value)}
                    placeholder="Contoh: Dikirim via JNE Regular dari Jakarta"
                    className="w-full px-3 py-2 rounded-lg border border-[#D8C3AD] text-sm bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#D8C3AD] text-xs font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-lg bg-[#493B34] hover:bg-[#9C7965] text-white text-xs font-medium uppercase tracking-wider"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Pesanan & Resi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-[#493B34]/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#D8C3AD] max-w-sm w-full p-6 space-y-4">
            <h3 className="font-serif text-lg font-semibold text-[#493B34]">
              Hapus Pesanan “{deleteTarget.orderNumber}”?
            </h3>
            <p className="text-xs text-[#493B34]/75">
              Data pesanan dan resi ini akan dihapus permanen.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg border border-[#D8C3AD] text-xs font-medium"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 rounded-lg bg-[#B91C1C] text-white text-xs font-medium"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


