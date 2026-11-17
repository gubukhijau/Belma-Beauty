import { useEffect, useState } from 'react';
import { ArrowLeft, Check, Heart, PackageCheck, ShieldCheck } from 'lucide-react';
import type { Product, StoreSettings } from '../types/store';
import { formatIDR, getDiscountPercent } from '../lib/format';
import { SafeImage } from './SafeImage';
import { PurchaseButtons } from './PurchaseButtons';
import { ProductCard } from './ProductCard';

interface ProductDetailPageProps {
  slug: string;
  settings: StoreSettings;
  wishlistIds: number[];
  onToggleWishlist: (id: number) => void;
  onNavigate: (path: string, categoryFilter?: string) => void;
}

export function ProductDetailPage({
  slug,
  settings,
  wishlistIds,
  onToggleWishlist,
  onNavigate,
}: ProductDetailPageProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<'description' | 'benefits' | 'usage' | 'ingredients'>('description');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setSelectedImageIdx(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    fetch(`/api/products/${encodeURIComponent(slug)}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Produk tidak ditemukan.');
        }
        return res.json();
      })
      .then((data) => {
        if (!active) return;
        setProduct(data.product);
        setRelated(data.related || []);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || 'Gagal memuat produk.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-pulse">
        <div className="h-4 w-48 bg-[#E9DDD1] rounded mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-6 aspect-[4/3] bg-[#E9DDD1] rounded-2xl" />
          <div className="lg:col-span-6 space-y-5">
            <div className="h-4 w-32 bg-[#E9DDD1] rounded" />
            <div className="h-10 w-3/4 bg-[#E9DDD1] rounded" />
            <div className="h-7 w-40 bg-[#E9DDD1] rounded" />
            <div className="h-24 w-full bg-[#E9DDD1]/70 rounded" />
            <div className="h-12 w-full bg-[#E9DDD1] rounded-lg" />
            <div className="h-12 w-full bg-[#E9DDD1] rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <h1 className="font-serif text-3xl font-semibold text-[#493B34] mb-3">
          Produk Tidak Ditemukan
        </h1>
        <p className="text-sm text-[#493B34]/75 mb-8">{error}</p>
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#493B34] text-white text-xs font-medium tracking-wider uppercase"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Katalog</span>
        </button>
      </div>
    );
  }

  const images = product.images?.length ? product.images : [];
  const activeImgUrl = images[selectedImageIdx]?.imageUrl || null;
  const discountPct = getDiscountPercent(product.price, product.discountPrice);
  const hasDiscount = discountPct > 0 && product.discountPrice !== null;
  const isWishlisted = wishlistIds.includes(product.id);

  const tabs = [
    { key: 'description' as const, label: 'Deskripsi', content: product.description },
    { key: 'benefits' as const, label: 'Manfaat Produk', content: product.benefits },
    { key: 'usage' as const, label: 'Cara Penggunaan', content: product.howToUse },
    { key: 'ingredients' as const, label: 'Kandungan', content: product.ingredients },
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#9C7965] mb-6 sm:mb-8 flex-wrap">
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className="hover:text-[#493B34] transition-colors"
        >
          Home
        </button>
        <span aria-hidden="true">/</span>
        <button
          type="button"
          onClick={() => onNavigate('/#catalog', product.categorySlug || 'all')}
          className="hover:text-[#493B34] transition-colors"
        >
          {product.categoryName || 'Products'}
        </button>
        <span aria-hidden="true">/</span>
        <span className="text-[#493B34] font-medium truncate">{product.name}</span>
      </nav>

      {/* Main Split Product Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Gallery */}
        <div className="lg:col-span-6 space-y-4 lg:sticky lg:top-24">
          <div className="aspect-[4/3] w-full rounded-2xl overflow-hidden bg-white border border-[#D8C3AD]/50">
            <SafeImage
              src={activeImgUrl}
              alt={product.name}
              fallbackLabel={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {images.length > 1 && (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
              {images.map((img, idx) => (
                <button
                  key={img.id || idx}
                  type="button"
                  onClick={() => setSelectedImageIdx(idx)}
                  className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                    selectedImageIdx === idx
                      ? 'border-[#493B34] ring-1 ring-[#493B34]'
                      : 'border-transparent opacity-75 hover:opacity-100'
                  }`}
                >
                  <SafeImage
                    src={img.imageUrl}
                    alt={`${product.name} tampilan ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Contiguous Purchase Module */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-3 pb-5 border-b border-[#D8C3AD]/45">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[#9C7965] font-medium">
                <span>{product.categoryName || 'Skincare'}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">SKU {product.sku}</span>
                {product.isBestSeller && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-[#493B34] font-semibold">Best Seller</span>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => onToggleWishlist(product.id)}
                aria-label={isWishlisted ? 'Hapus dari favorit' : 'Simpan ke favorit'}
                className="inline-flex items-center gap-1.5 text-xs text-[#493B34] hover:text-[#9C7965]"
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-[#9C7965] text-[#9C7965]' : ''}`} />
                <span>{isWishlisted ? 'Tersimpan' : 'Simpan'}</span>
              </button>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#493B34] leading-tight">
              {product.name}
            </h1>

            {/* Pricing */}
            <div className="flex items-baseline gap-3 flex-wrap pt-1 tabular-nums">
              {hasDiscount ? (
                <>
                  <span className="text-2xl sm:text-3xl font-semibold text-[#493B34]">
                    {formatIDR(product.discountPrice)}
                  </span>
                  <span className="text-base text-[#9C7965] line-through">
                    {formatIDR(product.price)}
                  </span>
                  <span className="text-xs font-semibold text-[#1F7A4C]">
                    Hemat {discountPct}%
                  </span>
                </>
              ) : (
                <span className="text-2xl sm:text-3xl font-semibold text-[#493B34]">
                  {formatIDR(product.price)}
                </span>
              )}
            </div>
          </div>

          {/* Short Description + Size & Stock Metadata */}
          <p className="text-sm sm:text-base text-[#493B34]/85 leading-relaxed">
            {product.shortDescription}
          </p>

          <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm bg-white rounded-xl border border-[#D8C3AD]/50 p-4">
            <div>
              <span className="text-[#9C7965] block text-xs mb-0.5">Ukuran / Varian</span>
              <span className="font-medium text-[#493B34]">{product.sizeVariant || '-'}</span>
            </div>
            <div>
              <span className="text-[#9C7965] block text-xs mb-0.5">Ketersediaan Stok</span>
              <span
                className={`font-medium tabular-nums inline-flex items-center gap-1.5 ${
                  product.stock > 0 ? 'text-[#1F7A4C]' : 'text-[#B91C1C]'
                }`}
              >
                <PackageCheck className="w-4 h-4" />
                {product.stock > 0 ? `Tersedia (${product.stock} pcs)` : 'Stok Habis'}
              </span>
            </div>
          </div>

          {/* THREE PURCHASE BUTTONS (WhatsApp, TikTok Shop, Shopee) */}
          <div className="bg-white rounded-xl border border-[#D8C3AD]/60 p-5 space-y-3">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#9C7965]">
              Pilih Platform Pembelian Resmi
            </p>
            <PurchaseButtons product={product} settings={settings} />
            <div className="flex items-center gap-4 pt-2 text-[11px] text-[#493B34]/70">
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#9C7965]" />
                100% Original & BPOM
              </span>
              <span className="inline-flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-[#9C7965]" />
                Konsultasi Gratis via WhatsApp
              </span>
            </div>
          </div>

          {/* Product Details Tabs */}
          <div className="pt-4">
            <div className="flex items-center gap-1 border-b border-[#D8C3AD]/50 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2.5 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'border-[#493B34] text-[#493B34]'
                      : 'border-transparent text-[#9C7965] hover:text-[#493B34]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="py-5 text-sm text-[#493B34]/85 leading-relaxed whitespace-pre-line">
              {tabs.find((t) => t.key === activeTab)?.content ||
                'Informasi detail produk tersedia melalui layanan konsultasi kami.'}
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="pt-16 sm:pt-24 mt-12 border-t border-[#D8C3AD]/45">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#9C7965] font-medium mb-1">
                Complete Your Ritual
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#493B34]">
                Produk Terkait Lainnya
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {related.map((item) => (
              <ProductCard
                key={item.id}
                product={item}
                isWishlisted={wishlistIds.includes(item.id)}
                onToggleWishlist={onToggleWishlist}
                onViewDetail={(s) => onNavigate(`/product/${s}`)}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
