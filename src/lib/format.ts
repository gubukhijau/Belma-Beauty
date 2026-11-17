import type { Product, StoreSettings } from '../types/store';

export function formatIDR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getEffectivePrice(product: Pick<Product, 'price' | 'discountPrice'>): number {
  if (
    product.discountPrice !== null &&
    product.discountPrice !== undefined &&
    product.discountPrice > 0 &&
    product.discountPrice < product.price
  ) {
    return product.discountPrice;
  }
  return product.price;
}

export function getDiscountPercent(price: number, discountPrice: number | null): number {
  if (!discountPrice || discountPrice <= 0 || discountPrice >= price || price <= 0) return 0;
  return Math.round(((price - discountPrice) / price) * 100);
}

export function buildWhatsAppUrl(product: Product, settings: StoreSettings): string {
  const rawPhone = (settings.whatsappNumber || '6281234567890').replace(/[^0-9]/g, '');
  const formattedPhone = rawPhone.startsWith('0') ? `62${rawPhone.slice(1)}` : rawPhone;

  const effectivePrice = formatIDR(getEffectivePrice(product));
  const template =
    product.whatsappMessage && product.whatsappMessage.trim().length > 0
      ? product.whatsappMessage
      : settings.whatsappDefaultMessage ||
        'Halo Belma Beauty, saya ingin membeli [NAMA PRODUK] dengan harga [HARGA]. Apakah produk masih tersedia?';

  const message = template
    .replace(/\[NAMA PRODUK\]/gi, product.name)
    .replace(/\[HARGA\]/gi, effectivePrice);

  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
}

export function formatDateShort(dateStr?: string | null): string {
  if (!dateStr) return '-';
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateStr));
  } catch {
    return '-';
  }
}
