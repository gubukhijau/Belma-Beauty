import { useId } from 'react';
import { ExternalLink } from 'lucide-react';
import type { Product, StoreSettings } from '../types/store';
import { buildWhatsAppUrl } from '../lib/format';

interface PurchaseButtonsProps {
  product: Product;
  settings: StoreSettings;
  compact?: boolean;
}

export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.031 2c-5.516 0-9.969 4.453-9.969 9.969 0 1.766.469 3.484 1.344 5l-1.406 5.156 5.281-1.375c1.469.797 3.109 1.219 4.75 1.219 5.516 0 9.969-4.453 9.969-9.969S17.547 2 12.031 2zm5.813 14.125c-.25.703-1.438 1.344-2 1.422-.516.078-1.172.109-1.891-.125-.438-.141-.984-.328-1.703-.641-2.984-1.297-4.938-4.313-5.094-4.516-.156-.203-1.219-1.625-1.219-3.094s.766-2.188 1.047-2.484c.281-.297.609-.375.813-.375s.406 0 .594.016c.188.016.438-.078.688.531.25.609.859 2.094.938 2.25.078.156.125.344.016.547-.109.203-.156.328-.313.516-.156.188-.328.422-.469.563-.156.156-.313.328-.141.641.172.313.781 1.281 1.672 2.078 1.156 1.031 2.125 1.344 2.438 1.5.313.156.484.125.672-.078.188-.203.781-.906.984-1.219.203-.313.406-.266.688-.156.281.109 1.797.844 2.109 1s.516.234.594.359c.078.125.078.734-.172 1.438z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  const path =
    'M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z';
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d={path} fill="#25F4EE" transform="translate(-0.7, -0.5)" />
      <path d={path} fill="#FE2C55" transform="translate(0.7, 0.5)" />
      <path d={path} fill="#FFFFFF" />
    </svg>
  );
}

function ShopeeIcon({ className }: { className?: string }) {
  const maskId = useId();
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <defs>
        <mask id={maskId}>
          <rect width="24" height="24" fill="white" />
          <path
            d="M14.3 11.5C14.05 10.65 13.1 10.2 12 10.2C10.65 10.2 9.7 10.95 9.7 12C9.7 13.25 10.95 13.75 12.2 14.2C13.6 14.7 14.6 15.25 14.6 16.65C14.6 17.85 13.5 18.65 12 18.65C10.6 18.65 9.65 18.05 9.4 17.1"
            fill="none"
            stroke="black"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </mask>
      </defs>
      <path
        d="M8.5 7.5V5.5C8.5 3.57 10.07 2 12 2C13.93 2 15.5 3.57 15.5 5.5V7.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M4.2 7.5H19.8L20.6 19.4C20.68 20.56 19.76 21.5 18.6 21.5H5.4C4.24 21.5 3.32 20.56 3.4 19.4L4.2 7.5Z"
        fill="currentColor"
        mask={`url(#${maskId})`}
      />
    </svg>
  );
}

export function PurchaseButtons({ product, settings, compact = false }: PurchaseButtonsProps) {
  const whatsappUrl = buildWhatsAppUrl(product, settings);
  const hasTiktok = Boolean(product.tiktokUrl && product.tiktokUrl.trim().length > 0);
  const hasShopee = Boolean(product.shopeeUrl && product.shopeeUrl.trim().length > 0);
  const isOutOfStock = product.stock <= 0;

  return (
    <div className="flex flex-col gap-3 w-full">
      {isOutOfStock && (
        <p className="text-xs text-[#9C7965] font-medium">
          Produk sedang habis. Anda tetap dapat menghubungi admin melalui WhatsApp untuk info restock.
        </p>
      )}

      {/* 1. BELI VIA WHATSAPP (Selalu tersedia menggunakan nomor WA toko) */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`w-full inline-flex items-center justify-center gap-2.5 rounded-lg bg-[#1F7A4C] hover:bg-[#18623D] active:scale-[0.99] text-white font-medium tracking-wide transition-all duration-150 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F7A4C] ${
          compact ? 'min-h-[44px] px-4 py-2.5 text-xs' : 'min-h-[50px] px-5 py-3.5 text-sm'
        }`}
      >
        <WhatsAppIcon className="w-5 h-5 shrink-0" />
        <span className="whitespace-nowrap">BELI VIA WHATSAPP</span>
        <ExternalLink className="w-3.5 h-3.5 opacity-80 shrink-0" />
      </a>

      {/* 2. BELI VIA TIKTOK SHOP (Ditampilkan hanya jika link diisi admin) */}
      {hasTiktok && (
        <a
          href={product.tiktokUrl!.trim()}
          target="_blank"
          rel="noopener noreferrer"
          className={`w-full inline-flex items-center justify-center gap-2.5 rounded-lg bg-[#18181B] hover:bg-[#27272A] active:scale-[0.99] text-white font-medium tracking-wide transition-all duration-150 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#18181B] ${
            compact ? 'min-h-[44px] px-4 py-2.5 text-xs' : 'min-h-[50px] px-5 py-3.5 text-sm'
          }`}
        >
          <TikTokIcon className="w-5 h-5 shrink-0" />
          <span className="whitespace-nowrap">BELI VIA TIKTOK SHOP</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-75 shrink-0" />
        </a>
      )}

      {/* 3. BELI VIA SHOPEE (Ditampilkan hanya jika link diisi admin) */}
      {hasShopee && (
        <a
          href={product.shopeeUrl!.trim()}
          target="_blank"
          rel="noopener noreferrer"
          className={`w-full inline-flex items-center justify-center gap-2.5 rounded-lg bg-[#EE4D2D] hover:bg-[#D73D1E] active:scale-[0.99] text-white font-medium tracking-wide transition-all duration-150 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EE4D2D] ${
            compact ? 'min-h-[44px] px-4 py-2.5 text-xs' : 'min-h-[50px] px-5 py-3.5 text-sm'
          }`}
        >
          <ShopeeIcon className="w-5 h-5 shrink-0" />
          <span className="whitespace-nowrap">BELI VIA SHOPEE</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-80 shrink-0" />
        </a>
      )}
    </div>
  );
}
