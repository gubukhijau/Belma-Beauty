import React, { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { Category, Product } from '../../types/store';
import { MultiImageUploader, type GalleryImageItem } from './ImageUploader';
import { useToast } from '../ToastContext';

interface AdminProductModalProps {
  isOpen: boolean;
  product: Product | null;
  categories: Category[];
  authToken: string | null;
  onClose: () => void;
  onSaved: () => void;
}

export function AdminProductModal({
  isOpen,
  product,
  categories,
  authToken,
  onClose,
  onSaved,
}: AdminProductModalProps) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [price, setPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [resellerPrice, setResellerPrice] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [benefits, setBenefits] = useState('');
  const [howToUse, setHowToUse] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [sizeVariant, setSizeVariant] = useState('30 ml');
  const [stock, setStock] = useState('25');
  const [status, setStatus] = useState('active');
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(false);
  const [sortOrder, setSortOrder] = useState('0');
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [shopeeUrl, setShopeeUrl] = useState('');
  const [images, setImages] = useState<GalleryImageItem[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    if (product) {
      setName(product.name);
      setSlug(product.slug);
      setSku(product.sku);
      setCategoryId(product.categoryId ? String(product.categoryId) : '');
      setPrice(String(product.price));
      setDiscountPrice(product.discountPrice ? String(product.discountPrice) : '');
      setResellerPrice(product.resellerPrice ? String(product.resellerPrice) : '');
      setShortDescription(product.shortDescription || '');
      setDescription(product.description || '');
      setBenefits(product.benefits || '');
      setHowToUse(product.howToUse || '');
      setIngredients(product.ingredients || '');
      setSizeVariant(product.sizeVariant || '30 ml');
      setStock(String(product.stock));
      setStatus(product.status || 'active');
      setIsBestSeller(product.isBestSeller);
      setIsNewArrival(product.isNewArrival);
      setSortOrder(String(product.sortOrder || 0));
      setWhatsappMessage(product.whatsappMessage || '');
      setTiktokUrl(product.tiktokUrl || '');
      setShopeeUrl(product.shopeeUrl || '');
      setImages(
        (product.images || []).map((img) => ({
          imageUrl: img.imageUrl,
          altText: img.altText || product.name,
          isPrimary: img.isPrimary,
        }))
      );
    } else {
      setName('');
      setSlug('');
      setSku(`BLM-${Date.now().toString().slice(-5)}`);
      setCategoryId(categories[0] ? String(categories[0].id) : '');
      setPrice('189000');
      setDiscountPrice('');
      setResellerPrice('');
      setShortDescription('');
      setDescription('');
      setBenefits('');
      setHowToUse('');
      setIngredients('');
      setSizeVariant('30 ml');
      setStock('25');
      setStatus('active');
      setIsBestSeller(false);
      setIsNewArrival(true);
      setSortOrder('0');
      setWhatsappMessage('');
      setTiktokUrl('');
      setShopeeUrl('');
      setImages([]);
    }
  }, [isOpen, product, categories]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const payload = {
        name,
        slug: slug || name,
        sku,
        categoryId: categoryId ? Number(categoryId) : null,
        price: Number(price) || 0,
        discountPrice: discountPrice ? Number(discountPrice) : null,
        resellerPrice: resellerPrice ? Number(resellerPrice) : null,
        shortDescription,
        description,
        benefits,
        howToUse,
        ingredients,
        sizeVariant,
        stock: Number(stock) || 0,
        status,
        isBestSeller,
        isNewArrival,
        sortOrder: Number(sortOrder) || 0,
        whatsappMessage,
        tiktokUrl,
        shopeeUrl,
        images,
      };

      const url = product ? `/api/admin/products/${product.id}` : '/api/admin/products';
      const method = product ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan produk.');

      showToast(product ? 'Produk berhasil diperbarui.' : 'Produk baru berhasil ditambahkan.');
      onSaved();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Terjadi kesalahan saat menyimpan produk.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#493B34]/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#F8F4EE] rounded-2xl border border-[#D8C3AD] w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-white border-b border-[#D8C3AD]/60 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl font-semibold text-[#493B34]">
              {product ? `Edit Produk: ${product.name}` : 'Tambah Produk Baru'}
            </h2>
            <p className="text-xs text-[#9C7965]">
              Lengkapi informasi produk, foto galeri, serta tautan pembelian WhatsApp, TikTok Shop, dan Shopee.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="p-2 rounded-lg text-[#9C7965] hover:text-[#493B34] hover:bg-[#F8F4EE]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-xl border border-[#D8C3AD]/50 p-5 space-y-4">
            <h3 className="font-serif text-base font-semibold text-[#493B34]">
              Informasi Dasar & Harga
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#493B34] mb-1">
                  Nama Produk *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Belma Brightening Serum"
                  className="w-full px-3.5 py-2 rounded-lg border border-[#D8C3AD] text-sm focus:outline-none focus:border-[#9C7965]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#493B34] mb-1">
                  Slug URL (SEO)
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="Otomatis dari nama produk"
                  className="w-full px-3.5 py-2 rounded-lg border border-[#D8C3AD] text-sm focus:outline-none focus:border-[#9C7965]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#493B34] mb-1">SKU *</label>
                <input
                  type="text"
                  required
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="BLM-SRM-001"
                  className="w-full px-3.5 py-2 rounded-lg border border-[#D8C3AD] text-sm focus:outline-none focus:border-[#9C7965]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#493B34] mb-1">Kategori</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-[#D8C3AD] text-sm bg-white focus:outline-none focus:border-[#9C7965]"
                >
                  <option value="">-- Pilih Kategori --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#493B34] mb-1">
                  Harga Normal (Rp) *
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-[#D8C3AD] text-sm tabular-nums focus:outline-none focus:border-[#9C7965]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#493B34] mb-1">
                  Harga Diskon (Rp)
                </label>
                <input
                  type="number"
                  min={0}
                  value={discountPrice}
                  onChange={(e) => setDiscountPrice(e.target.value)}
                  placeholder="Opsional"
                  className="w-full px-3.5 py-2 rounded-lg border border-[#D8C3AD] text-sm tabular-nums focus:outline-none focus:border-[#9C7965]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#493B34] mb-1">
                  Harga Reseller (Rp)
                </label>
                <input
                  type="number"
                  min={0}
                  value={resellerPrice}
                  onChange={(e) => setResellerPrice(e.target.value)}
                  placeholder="Khusus reseller"
                  className="w-full px-3.5 py-2 rounded-lg border border-[#D8C3AD] text-sm tabular-nums focus:outline-none focus:border-[#9C7965]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#493B34] mb-1">Stok *</label>
                <input
                  type="number"
                  min={0}
                  required
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-[#D8C3AD] text-sm tabular-nums focus:outline-none focus:border-[#9C7965]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#493B34] mb-1">
                  Ukuran / Varian
                </label>
                <input
                  type="text"
                  value={sizeVariant}
                  onChange={(e) => setSizeVariant(e.target.value)}
                  placeholder="30 ml"
                  className="w-full px-3.5 py-2 rounded-lg border border-[#D8C3AD] text-sm focus:outline-none focus:border-[#9C7965]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 items-center">
              <div>
                <label className="block text-xs font-medium text-[#493B34] mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-[#D8C3AD] text-sm bg-white focus:outline-none focus:border-[#9C7965]"
                >
                  <option value="active">Aktif (Tampil di Toko)</option>
                  <option value="draft">Draft (Disembunyikan)</option>
                  <option value="archived">Arsip</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#493B34] mb-1">
                  Urutan Tampil
                </label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-[#D8C3AD] text-sm tabular-nums focus:outline-none focus:border-[#9C7965]"
                />
              </div>
              <div className="flex items-center gap-5 pt-4">
                <label className="inline-flex items-center gap-2 text-xs font-medium text-[#493B34] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isBestSeller}
                    onChange={(e) => setIsBestSeller(e.target.checked)}
                    className="rounded border-[#D8C3AD] accent-[#493B34]"
                  />
                  <span>Best Seller</span>
                </label>
                <label className="inline-flex items-center gap-2 text-xs font-medium text-[#493B34] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isNewArrival}
                    onChange={(e) => setIsNewArrival(e.target.checked)}
                    className="rounded border-[#D8C3AD] accent-[#493B34]"
                  />
                  <span>New Arrival</span>
                </label>
              </div>
            </div>
          </div>

          {/* Multi-Image Upload */}
          <div className="bg-white rounded-xl border border-[#D8C3AD]/50 p-5">
            <MultiImageUploader images={images} onChange={setImages} authToken={authToken} />
          </div>

          {/* Three Purchase Channels (WA, TikTok Shop, Shopee) */}
          <div className="bg-white rounded-xl border border-[#D8C3AD]/50 p-5 space-y-4">
            <div>
              <h3 className="font-serif text-base font-semibold text-[#493B34]">
                Link 3 Saluran Pembelian Produk
              </h3>
              <p className="text-xs text-[#9C7965]">
                Jika URL TikTok Shop atau Shopee dikosongkan, tombol tersebut otomatis tidak ditampilkan di halaman produk.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#493B34] mb-1">
                1. Pesan Khusus WhatsApp (Opsional — menggunakan nomor admin global)
              </label>
              <input
                type="text"
                value={whatsappMessage}
                onChange={(e) => setWhatsappMessage(e.target.value)}
                placeholder="Kosongkan untuk template default: Halo Belma Beauty, saya ingin membeli [NAMA PRODUK]..."
                className="w-full px-3.5 py-2 rounded-lg border border-[#D8C3AD] text-sm focus:outline-none focus:border-[#9C7965]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#493B34] mb-1">
                  2. TikTok Shop Product URL
                </label>
                <input
                  type="url"
                  value={tiktokUrl}
                  onChange={(e) => setTiktokUrl(e.target.value)}
                  placeholder="https://shop.tiktok.com/..."
                  className="w-full px-3.5 py-2 rounded-lg border border-[#D8C3AD] text-sm focus:outline-none focus:border-[#9C7965]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#493B34] mb-1">
                  3. Shopee Product URL
                </label>
                <input
                  type="url"
                  value={shopeeUrl}
                  onChange={(e) => setShopeeUrl(e.target.value)}
                  placeholder="https://shopee.co.id/..."
                  className="w-full px-3.5 py-2 rounded-lg border border-[#D8C3AD] text-sm focus:outline-none focus:border-[#9C7965]"
                />
              </div>
            </div>
          </div>

          {/* Descriptions & Ingredients */}
          <div className="bg-white rounded-xl border border-[#D8C3AD]/50 p-5 space-y-4">
            <h3 className="font-serif text-base font-semibold text-[#493B34]">
              Detail Formula, Manfaat & Cara Pakai
            </h3>
            <div>
              <label className="block text-xs font-medium text-[#493B34] mb-1">
                Deskripsi Singkat (Tampil di kartu produk)
              </label>
              <textarea
                rows={2}
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-[#D8C3AD] text-sm focus:outline-none focus:border-[#9C7965]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#493B34] mb-1">
                Deskripsi Lengkap
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-[#D8C3AD] text-sm focus:outline-none focus:border-[#9C7965]"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#493B34] mb-1">
                  Manfaat Produk
                </label>
                <textarea
                  rows={4}
                  value={benefits}
                  onChange={(e) => setBenefits(e.target.value)}
                  placeholder="• Mencerahkan kulit..."
                  className="w-full px-3.5 py-2 rounded-lg border border-[#D8C3AD] text-sm focus:outline-none focus:border-[#9C7965]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#493B34] mb-1">
                  Cara Penggunaan
                </label>
                <textarea
                  rows={4}
                  value={howToUse}
                  onChange={(e) => setHowToUse(e.target.value)}
                  placeholder="Teteskan 2-3 tetes pada wajah bersih..."
                  className="w-full px-3.5 py-2 rounded-lg border border-[#D8C3AD] text-sm focus:outline-none focus:border-[#9C7965]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#493B34] mb-1">
                Kandungan Produk (Ingredients)
              </label>
              <textarea
                rows={2}
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                placeholder="Aqua, Niacinamide, Alpha-Arbutin..."
                className="w-full px-3.5 py-2 rounded-lg border border-[#D8C3AD] text-sm focus:outline-none focus:border-[#9C7965]"
              />
            </div>
          </div>

          {/* Sticky Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg border border-[#D8C3AD] text-xs font-medium text-[#493B34] hover:bg-[#E9DDD1]/60"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#493B34] hover:bg-[#9C7965] disabled:opacity-50 text-white text-xs font-medium tracking-wider uppercase transition-colors"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{saving ? 'Menyimpan...' : product ? 'Simpan Perubahan' : 'Simpan Produk'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
