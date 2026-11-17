import { useState } from 'react';
import { Sparkles } from 'lucide-react';

interface SafeImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}

export function SafeImage({ src, alt, className = '', fallbackLabel }: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#F8F4EE] via-[#E9DDD1] to-[#D8C3AD]/60 text-[#9C7965] select-none ${className}`}
        role="img"
        aria-label={alt}
      >
        <Sparkles className="w-7 h-7 opacity-60 mb-1.5" />
        <span className="font-serif text-xs tracking-widest uppercase text-[#493B34]/70 px-3 text-center">
          {fallbackLabel || 'BELMA BEAUTY'}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
