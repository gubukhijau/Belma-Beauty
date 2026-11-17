import { Instagram, MessageCircle, ShoppingBag, Mail, MapPin } from 'lucide-react';
import type { StoreSettings } from '../types/store';

interface StoreFooterProps {
  settings: StoreSettings;
  onNavigate: (path: string, categoryFilter?: string) => void;
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

export function StoreFooter({ settings, onNavigate }: StoreFooterProps) {
  const cleanPhone = (settings.whatsappNumber || '6281234567890').replace(/[^0-9]/g, '');
  const waHref = `https://wa.me/${cleanPhone.startsWith('0') ? `62${cleanPhone.slice(1)}` : cleanPhone}`;

  return (
    <footer className="bg-[#493B34] text-[#F8F4EE] mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-[#D8C3AD]/20">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              {settings.logoUrl && (
                <img
                  src={settings.logoUrl}
                  alt={settings.storeName}
                  referrerPolicy="no-referrer"
                  className="h-8 w-auto object-contain brightness-0 invert"
                />
              )}
              <span className="font-serif text-xl tracking-[0.18em] font-semibold">
                {settings.storeName || 'BELMA BEAUTY'}
              </span>
            </div>
            <p className="text-sm text-[#E9DDD1]/85 leading-relaxed max-w-md">
              {settings.seoDescription ||
                'Perawatan kulit dan kecantikan botani mewah yang memadukan keahlian formulasi dermatologi dengan bahan alami pilihan untuk menonjolkan kilau alami kulit Anda.'}
            </p>
            <div className="space-y-1.5 text-xs text-[#D8C3AD]/90 pt-1">
              {settings.storeAddress && (
                <p className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{settings.storeAddress}</span>
                </p>
              )}
              {settings.email && (
                <p className="flex items-center gap-2">
                  <Mail className="w-4 h-4 shrink-0" />
                  <a href={`mailto:${settings.email}`} className="hover:text-white transition-colors">
                    {settings.email}
                  </a>
                </p>
              )}
            </div>
          </div>

          {/* Navigation Column */}
          <div>
            <h4 className="font-serif text-base font-semibold tracking-wide mb-4 text-[#D8C3AD]">
              Navigasi
            </h4>
            <ul className="space-y-2.5 text-sm text-[#E9DDD1]/85">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/')}
                  className="hover:text-white transition-colors"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/#catalog', 'all')}
                  className="hover:text-white transition-colors"
                >
                  All Products
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/#catalog', 'skincare')}
                  className="hover:text-white transition-colors"
                >
                  Skincare
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/#catalog', 'body-care')}
                  className="hover:text-white transition-colors"
                >
                  Body Care
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/about')}
                  className="hover:text-white transition-colors"
                >
                  About Us
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/contact')}
                  className="hover:text-white transition-colors"
                >
                  Contact
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/reseller')}
                  className="hover:text-white transition-colors"
                >
                  Portal Reseller
                </button>
              </li>
            </ul>
          </div>

          {/* Official Channels */}
          <div>
            <h4 className="font-serif text-base font-semibold tracking-wide mb-4 text-[#D8C3AD]">
              Official Channels
            </h4>
            <div className="space-y-2.5 text-sm text-[#E9DDD1]/85">
              {settings.instagramUrl && (
                <a
                  href={settings.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 hover:text-white transition-colors"
                >
                  <Instagram className="w-4 h-4 text-[#D8C3AD]" />
                  <span>Instagram</span>
                </a>
              )}
              {settings.tiktokUrl && (
                <a
                  href={settings.tiktokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 hover:text-white transition-colors"
                >
                  <TikTokIcon className="w-4 h-4 text-[#D8C3AD]" />
                  <span>TikTok Shop</span>
                </a>
              )}
              {settings.shopeeStoreUrl && (
                <a
                  href={settings.shopeeStoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 hover:text-white transition-colors"
                >
                  <ShoppingBag className="w-4 h-4 text-[#D8C3AD]" />
                  <span>Shopee Official Store</span>
                </a>
              )}
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 hover:text-white transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-[#D8C3AD]" />
                <span>WhatsApp Beauty Advisor</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-4 text-xs text-[#D8C3AD]/80">
          <p>
            © {new Date().getFullYear()} {settings.storeName || 'BELMA BEAUTY'}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
