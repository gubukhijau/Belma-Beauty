import React, { useRef, useState } from 'react';
import { Upload, Link as LinkIcon, Trash2, Star, Loader2 } from 'lucide-react';
import { useToast } from '../ToastContext';
import { SafeImage } from '../SafeImage';

interface SingleImageUploaderProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  authToken: string | null;
  aspectHint?: string;
}

export function SingleImageUploader({
  label,
  value,
  onChange,
  authToken,
  aspectHint,
}: SingleImageUploaderProps) {
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Harap pilih file gambar (JPG, PNG, WEBP).', 'error');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const headers: Record<string, string> = {};
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers,
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengunggah gambar.');
      onChange(data.url);
      showToast('Gambar berhasil diunggah.');
    } catch (err: any) {
      showToast(err.message || 'Gagal mengunggah gambar.', 'error');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-medium text-[#493B34]">{label}</label>
        {aspectHint && <span className="text-[11px] text-[#9C7965]">{aspectHint}</span>}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start">
        <div className="w-28 h-20 rounded-lg border border-[#D8C3AD] bg-[#F8F4EE] overflow-hidden shrink-0">
          <SafeImage src={value || null} alt={label} className="w-full h-full object-cover" />
        </div>

        <div className="flex-1 w-full space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFile(e.target.files?.[0])}
              className="hidden"
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E9DDD1] hover:bg-[#D8C3AD] text-[#493B34] text-xs font-medium transition-colors"
            >
              {uploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              <span>{uploading ? 'Mengunggah...' : 'Upload Gambar'}</span>
            </button>

            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E5A9A9] text-[#B91C1C] hover:bg-[#FFF5F5] text-xs transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus</span>
              </button>
            )}
          </div>

          <div className="relative">
            <LinkIcon className="w-3.5 h-3.5 text-[#9C7965] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Atau tempel URL gambar..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[#D8C3AD]/80 bg-white text-xs text-[#493B34] focus:outline-none focus:border-[#9C7965]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export interface GalleryImageItem {
  imageUrl: string;
  altText?: string;
  isPrimary?: boolean;
}

interface MultiImageUploaderProps {
  images: GalleryImageItem[];
  onChange: (images: GalleryImageItem[]) => void;
  authToken: string | null;
}

export function MultiImageUploader({ images, onChange, authToken }: MultiImageUploaderProps) {
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded: GalleryImageItem[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        const formData = new FormData();
        formData.append('file', file);
        const headers: Record<string, string> = {};
        if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          headers,
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Gagal mengunggah gambar.');
        uploaded.push({
          imageUrl: data.url,
          altText: file.name,
          isPrimary: images.length === 0 && uploaded.length === 0,
        });
      }
      if (uploaded.length > 0) {
        onChange([...images, ...uploaded]);
        showToast(`${uploaded.length} foto produk berhasil diunggah.`);
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal mengunggah foto.', 'error');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const addUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    onChange([
      ...images,
      { imageUrl: trimmed, altText: 'Foto Produk', isPrimary: images.length === 0 },
    ]);
    setUrlInput('');
  };

  const setPrimary = (idx: number) => {
    onChange(
      images.map((img, i) => ({
        ...img,
        isPrimary: i === idx,
      }))
    );
  };

  const removeImage = (idx: number) => {
    const next = images.filter((_, i) => i !== idx);
    if (next.length > 0 && !next.some((i) => i.isPrimary)) {
      next[0].isPrimary = true;
    }
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="block text-xs font-medium text-[#493B34]">
          Galeri Foto Produk (Bisa unggah banyak foto)
        </label>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#493B34] hover:bg-[#9C7965] text-white text-xs font-medium transition-colors"
        >
          {uploading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Upload className="w-3.5 h-3.5" />
          )}
          <span>{uploading ? 'Mengunggah...' : 'Pilih Foto dari Perangkat'}</span>
        </button>
      </div>

      {/* Paste URL input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="Atau tambah URL gambar..."
          className="flex-1 px-3 py-2 rounded-lg border border-[#D8C3AD] bg-white text-xs focus:outline-none focus:border-[#9C7965]"
        />
        <button
          type="button"
          onClick={addUrl}
          className="px-3.5 py-2 rounded-lg border border-[#D8C3AD] text-xs font-medium text-[#493B34] hover:bg-[#E9DDD1]"
        >
          Tambah URL
        </button>
      </div>

      {/* Preview grid */}
      {images.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          {images.map((img, idx) => (
            <div
              key={idx}
              className={`relative rounded-xl overflow-hidden border bg-[#F8F4EE] group ${
                img.isPrimary ? 'border-[#9C7965] ring-1 ring-[#9C7965]' : 'border-[#D8C3AD]/60'
              }`}
            >
              <div className="aspect-[4/3]">
                <SafeImage
                  src={img.imageUrl}
                  alt={img.altText || `Foto ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-1.5 flex items-center justify-between bg-white border-t border-[#E9DDD1]">
                <button
                  type="button"
                  onClick={() => setPrimary(idx)}
                  className={`inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded ${
                    img.isPrimary ? 'text-[#9C7965]' : 'text-[#493B34]/60 hover:text-[#493B34]'
                  }`}
                >
                  <Star className={`w-3 h-3 ${img.isPrimary ? 'fill-[#9C7965]' : ''}`} />
                  <span>{img.isPrimary ? 'Utama' : 'Jadikan Utama'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  aria-label="Hapus foto"
                  className="text-[#B91C1C] hover:bg-[#FFF5F5] p-1 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-[#D8C3AD] py-6 text-center text-xs text-[#9C7965]">
          Belum ada foto produk. Unggah minimal 1 foto produk untuk hasil terbaik.
        </div>
      )}
    </div>
  );
}
