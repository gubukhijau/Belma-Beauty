import { Heart } from 'lucide-react';
import type { Product } from '../types/store';
import { formatIDR, getDiscountPercent } from '../lib/format';
import { SafeImage } from './SafeImage';

interface ProductCardProps {
  product: Product;
  isWishlisted: boolean;
  onToggleWishlist: (productId: number) => void;
  onViewDetail: (slug: string) => void;
}

export function ProductCard({
  product,
  isWishlisted,
  onToggleWishlist,
  onViewDetail,
}: ProductCardProps) {
  const primaryImage = product.images?.[0]?.imageUrl || null;
  const discountPct = getDiscountPercent(product.price, product.discountPrice);
  const hasDiscount = discountPct > 0 && product.discountPrice !== null;

  // At most 1 subtle corner text tag (no badge sandwiches)
  const cornerLabel = hasDiscount
    ? `Hemat ${discountPct}%`
    : product.isBestSeller
      ? 'Best Seller'
      : product.isNewArrival
        ? 'New Arrival'
        : null;

  return (
    <article className="group bg-white rounded-xl border border-[#D8C3AD]/45 overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-12px_rgba(73,59,52,0.16)]">
      {/* Image Container */}
      <div className="relative aspect-[4/3] bg-[#F8F4EE] overflow-hidden">
        <button
          type="button"
          onClick={() => onViewDetail(product.slug)}
          className="block w-full h-full text-left focus-visible:outline-2 focus-visible:outline-[#9C7965]"
          aria-label={`Lihat detail ${product.name}`}
        >
          <SafeImage
            src={primaryImage}
            alt={product.name}
            fallbackLabel={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        </button>

        {cornerLabel && (
          <span className="absolute top-3 left-3 bg-[#F8F4EE]/95 backdrop-blur-sm text-[#493B34] text-[11px] font-medium tracking-wide px-2.5 py-1 rounded">
            {cornerLabel}
          </span>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(product.id);
          }}
          aria-label={isWishlisted ? 'Hapus dari favorit' : 'Simpan ke favorit'}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-[#493B34] hover:text-[#9C7965] transition-colors shadow-xs"
        >
          <Heart
            className={`w-4 h-4 ${isWishlisted ? 'fill-[#9C7965] text-[#9C7965]' : ''}`}
          />
        </button>

        {product.stock <= 0 && (
          <div className="absolute inset-x-0 bottom-0 bg-[#493B34]/80 text-white text-[11px] tracking-wider uppercase text-center py-1">
            Stok Habis
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col">
        <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-[#9C7965] font-medium mb-1">
          <span className="truncate">{product.categoryName || 'Skincare'}</span>
          {product.sizeVariant && (
            <>
              <span aria-hidden="true">·</span>
              <span className="shrink-0">{product.sizeVariant}</span>
            </>
          )}
        </div>

        <h3 className="font-serif text-base sm:text-lg font-semibold text-[#493B34] leading-snug line-clamp-1 mb-1.5">
          <button
            type="button"
            onClick={() => onViewDetail(product.slug)}
            className="text-left hover:text-[#9C7965] transition-colors"
          >
            {product.name}
          </button>
        </h3>

        <p className="text-xs sm:text-[13px] text-[#493B34]/75 leading-relaxed line-clamp-2 mb-4 flex-1">
          {product.shortDescription || product.description}
        </p>

        {/* Price & Action */}
        <div className="pt-3 border-t border-[#E9DDD1] flex flex-col gap-3">
          <div className="flex items-baseline gap-2 flex-wrap tabular-nums">
            {hasDiscount ? (
              <>
                <span className="text-sm sm:text-base font-semibold text-[#493B34]">
                  {formatIDR(product.discountPrice)}
                </span>
                <span className="text-xs text-[#9C7965] line-through">
                  {formatIDR(product.price)}
                </span>
              </>
            ) : (
              <span className="text-sm sm:text-base font-semibold text-[#493B34]">
                {formatIDR(product.price)}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => onViewDetail(product.slug)}
            className="w-full py-2.5 px-4 rounded-lg bg-[#E9DDD1]/75 hover:bg-[#493B34] text-[#493B34] hover:text-white text-xs font-medium tracking-[0.12em] uppercase transition-colors duration-150 whitespace-nowrap"
          >
            VIEW DETAIL
          </button>
        </div>
      </div>
    </article>
  );
}
