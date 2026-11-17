import React, { useState } from 'react';
import { ArrowLeft, Mail, MapPin, MessageCircle, Send } from 'lucide-react';
import type { CmsPage, Product, StoreSettings } from '../types/store';
import { SafeImage } from './SafeImage';
import { useToast } from './ToastContext';

interface AboutPageProps {
  page?: CmsPage;
  onNavigate: (path: string) => void;
}

export function AboutPage({ page, onNavigate }: AboutPageProps) {
  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <button
        type="button"
        onClick={() => onNavigate('/')}
        className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[#9C7965] hover:text-[#493B34] mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke Beranda</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        <div className="lg:col-span-6 space-y-6">
          <p className="text-xs uppercase tracking-[0.2em] text-[#9C7965] font-medium">
            Our Story
          </p>
          <h1 className="font-serif text-3xl sm:text-5xl font-semibold text-[#493B34] leading-tight">
            {page?.title || 'Filosofi Kecantikan Alami Belma Beauty'}
          </h1>
          {page?.subtitle && (
            <p className="text-base text-[#9C7965] leading-relaxed">{page.subtitle}</p>
          )}
          <div className="text-sm sm:text-base text-[#493B34]/85 leading-relaxed whitespace-pre-line space-y-4">
            {page?.content ||
              'Belma Beauty menghadirkan perawatan kulit modern yang menggabungkan bahan aktif dermatologi dengan kelembutan ekstrak botani alami.'}
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onNavigate('/#catalog')}
              className="px-7 py-3.5 rounded-lg bg-[#493B34] hover:bg-[#9C7965] text-white text-xs font-medium tracking-[0.14em] uppercase transition-colors"
            >
              Jelajahi Produk Kami
            </button>
          </div>
        </div>

        <div className="lg:col-span-6">
          <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-[#D8C3AD]/60 bg-white">
            <SafeImage
              src={page?.imageUrl || '/src/assets/images/cat_facial_treatment_1794911229238.jpg'}
              alt={page?.title || 'About Belma Beauty'}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </main>
  );
}

interface ContactPageProps {
  page?: CmsPage;
  settings: StoreSettings;
  products: Product[];
  onNavigate: (path: string) => void;
}

export function ContactPage({ page, settings, products, onNavigate }: ContactPageProps) {
  const { showToast } = useToast();
  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [productName, setProductName] = useState('');
  const [subject, setSubject] = useState('Konsultasi Skincare');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const cleanPhone = (settings.whatsappNumber || '6281234567890').replace(/[^0-9]/g, '');
  const waHref = `https://wa.me/${cleanPhone.startsWith('0') ? `62${cleanPhone.slice(1)}` : cleanPhone}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName, email, phone, subject, message, productName }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Gagal mengirim pesan.');
      }
      setSubmitted(true);
      setCustomerName('');
      setEmail('');
      setPhone('');
      setProductName('');
      setMessage('');
      showToast('Pesan Anda berhasil dikirim! Tim kami akan segera menghubungi Anda.');
    } catch (err: any) {
      showToast(err.message || 'Gagal mengirim pesan.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <button
        type="button"
        onClick={() => onNavigate('/')}
        className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[#9C7965] hover:text-[#493B34] mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke Beranda</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
        <div className="lg:col-span-5 space-y-6">
          <p className="text-xs uppercase tracking-[0.2em] text-[#9C7965] font-medium">
            Contact Concierge
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#493B34] leading-tight">
            {page?.title || 'Konsultasi & Layanan Pelanggan'}
          </h1>
          <p className="text-sm sm:text-base text-[#493B34]/80 leading-relaxed">
            {page?.content ||
              'Tim beauty advisor Belma Beauty siap membantu memberikan rekomendasi produk sesuai kondisi kulit Anda.'}
          </p>

          <div className="space-y-4 pt-2 text-sm text-[#493B34]">
            {settings.storeAddress && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#9C7965] shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium block">Butik & Kantor</span>
                  <span className="text-[#493B34]/75">{settings.storeAddress}</span>
                </div>
              </div>
            )}
            {settings.email && (
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-[#9C7965] shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium block">Email Resmi</span>
                  <span className="text-[#493B34]/75">{settings.email}</span>
                </div>
              </div>
            )}
          </div>

          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-lg bg-[#1F7A4C] hover:bg-[#18623D] text-white text-xs font-medium tracking-wider uppercase transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Chat Langsung via WhatsApp</span>
          </a>
        </div>

        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#D8C3AD]/60 p-6 sm:p-8">
          <h2 className="font-serif text-2xl font-semibold text-[#493B34] mb-2">
            Kirim Pesan atau Pertanyaan Produk
          </h2>
          <p className="text-xs text-[#9C7965] mb-6">
            Pesan Anda akan langsung masuk ke panel Admin Belma Beauty.
          </p>

          {submitted && (
            <div className="mb-6 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] p-4 text-sm text-[#166534]">
              Terima kasih! Pesan konsultasi Anda telah kami terima.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#493B34] mb-1.5">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Clarissa Wijaya"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#D8C3AD] bg-[#F8F4EE]/40 text-sm focus:outline-none focus:border-[#9C7965]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#493B34] mb-1.5">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#D8C3AD] bg-[#F8F4EE]/40 text-sm focus:outline-none focus:border-[#9C7965]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#493B34] mb-1.5">
                  No. WhatsApp
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0812..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#D8C3AD] bg-[#F8F4EE]/40 text-sm focus:outline-none focus:border-[#9C7965]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#493B34] mb-1.5">
                  Produk Terkait (Opsional)
                </label>
                <select
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#D8C3AD] bg-[#F8F4EE]/40 text-sm focus:outline-none focus:border-[#9C7965]"
                >
                  <option value="">-- Pilih Produk --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#493B34] mb-1.5">
                Subjek
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#D8C3AD] bg-[#F8F4EE]/40 text-sm focus:outline-none focus:border-[#9C7965]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#493B34] mb-1.5">
                Pesan Anda *
              </label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ceritakan jenis kulit atau pertanyaan Anda..."
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#D8C3AD] bg-[#F8F4EE]/40 text-sm focus:outline-none focus:border-[#9C7965]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-lg bg-[#493B34] hover:bg-[#9C7965] disabled:opacity-50 text-white text-xs font-medium tracking-[0.14em] uppercase transition-colors"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Mengirim...' : 'Kirim Pesan'}</span>
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
