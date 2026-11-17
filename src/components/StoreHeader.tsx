import { useState } from 'react';
import { Menu, Search, Heart, X } from 'lucide-react';
import type { StoreSettings } from '../types/store';

interface StoreHeaderProps {
  settings: StoreSettings;
  currentPath: string;
  wishlistCount: number;
  onNavigate: (path: string, categoryFilter?: string) => void;
  onOpenSearch: () => void;
  onOpenWishlist: () => void;
}

export function StoreHeader({
  settings,
  currentPath,
  wishlistCount,
  onNavigate,
  onOpenSearch,
  onOpenWishlist,
}: StoreHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Home', action: () => onNavigate('/') },
    { label: 'All Products', action: () => onNavigate('/#catalog', 'all') },
    { label: 'Skincare', action: () => onNavigate('/#catalog', 'skincare') },
    { label: 'Body Care', action: () => onNavigate('/#catalog', 'body-care') },
    { label: 'Treatment', action: () => onNavigate('/#catalog', 'facial-treatment') },
    { label: 'About Us', action: () => onNavigate('/about') },
    { label: 'Contact', action: () => onNavigate('/contact') },
    { label: 'Reseller', action: () => onNavigate('/reseller') },
  ];

  const handleLinkClick = (fn: () => void) => {
    setMobileMenuOpen(false);
    fn();
  };

  return (
    <header className="sticky top-0 z-40 bg-[#F8F4EE]/95 backdrop-blur-md border-b border-[#D8C3AD]/45">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4 lg:gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="lg:hidden p-2 -ml-2 text-[#493B34] hover:text-[#9C7965] transition-colors rounded-lg"
            aria-label="Buka menu navigasi"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <button
            type="button"
            onClick={() => handleLinkClick(() => onNavigate('/'))}
            className="flex items-center gap-2.5 text-left focus-visible:outline-2 focus-visible:outline-[#9C7965] rounded"
          >
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={settings.storeName}
                referrerPolicy="no-referrer"
                className="h-8 w-auto object-contain"
              />
            ) : null}
            <span className="font-serif text-lg sm:text-xl font-semibold tracking-[0.16em] text-[#493B34] whitespace-nowrap shrink-0">
              {settings.storeName || 'BELMA BEAUTY'}
            </span>
          </button>
        </div>

        {/* Zone 2: Clean Single-Line Navigation Links */}
        <nav className="hidden lg:flex items-center gap-5 xl:gap-7 text-sm font-normal text-[#493B34]/85">
          {navItems.map((item) => {
            const isActive =
              (item.label === 'About Us' && currentPath === '/about') ||
              (item.label === 'Contact' && currentPath === '/contact') ||
              (item.label === 'Home' && currentPath === '/');
            return (
              <button
                key={item.label}
                type="button"
                onClick={item.action}
                className={`relative py-1 whitespace-nowrap shrink-0 transition-colors duration-150 hover:text-[#493B34] ${
                  isActive ? 'text-[#493B34] font-medium' : ''
                }`}
              >
                {item.label}
                <span
                  className={`absolute left-0 right-0 -bottom-0.5 h-[1.5px] bg-[#9C7965] transition-transform duration-200 origin-left ${
                    isActive ? 'scale-x-100' : 'scale-x-0'
                  }`}
                />
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Interactive Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="Cari produk"
            className="p-2 text-[#493B34] hover:text-[#9C7965] hover:bg-[#E9DDD1]/60 rounded-lg transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={onOpenWishlist}
            aria-label="Produk tersimpan"
            className="relative p-2 text-[#493B34] hover:text-[#9C7965] hover:bg-[#E9DDD1]/60 rounded-lg transition-colors"
          >
            <Heart className="w-5 h-5" />
            {wishlistCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#9C7965] text-white text-[10px] font-medium flex items-center justify-center tabular-nums">
                {wishlistCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#D8C3AD]/40 bg-[#F8F4EE] px-4 py-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => handleLinkClick(item.action)}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-[#493B34] hover:bg-[#E9DDD1]/70 transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
