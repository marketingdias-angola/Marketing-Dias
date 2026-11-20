import { useEffect, useState } from 'react';
import { MapPin, MessageCircle, Package, ShoppingBag, X } from 'lucide-react';
import {
  ADMIN_WHATSAPP_LOCAL,
  buildListingWhatsAppUrl,
  formatKwanza,
} from '../constants/marketplace';
import type { Listing } from '../types/listing';

interface ListingDetailModalProps {
  listing: Listing | null;
  onClose: () => void;
}

export function ListingDetailModal({ listing, onClose }: ListingDetailModalProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [listing?.id]);

  if (!listing) {
    return null;
  }

  const buyUrl = buildListingWhatsAppUrl(listing, 'comprar');
  const messageUrl = buildListingWhatsAppUrl(listing, 'mensagem');
  const activeImage = listing.images[activeImageIndex] ?? listing.images[0] ?? '';

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="listing-detail-title"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
          <div className="text-xs text-slate-500 flex items-center gap-2 truncate">
            <span className="font-semibold text-[#0A1A36]">{listing.category}</span>
            <span aria-hidden="true">·</span>
            <span>{listing.province}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar detalhes"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          <div className="space-y-3">
            <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
              {activeImage ? (
                <img
                  src={activeImage}
                  alt={listing.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-6">
                  <Package className="w-12 h-12 mb-2 text-[#0A1A36]/40" strokeWidth={1.5} />
                  <span className="text-sm font-medium text-slate-500">{listing.category}</span>
                </div>
              )}
            </div>

            {listing.images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {listing.images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`aspect-square rounded-lg overflow-hidden border transition-all cursor-pointer ${
                      idx === activeImageIndex
                        ? 'border-[#FF6A00] ring-2 ring-[#FF6A00]'
                        : 'border-slate-200 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${listing.title} — foto ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col justify-between gap-6">
            <div>
              <h2
                id="listing-detail-title"
                className="font-display text-2xl font-bold text-slate-900 leading-tight text-balance"
              >
                {listing.title}
              </h2>

              <p className="mt-3 font-display text-3xl font-extrabold text-[#0A1A36] tabular-nums">
                {formatKwanza(listing.price)}
              </p>

              <div className="mt-4 space-y-2 text-sm text-slate-600 border-y border-slate-100 py-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>
                    Província de <strong className="text-slate-900">{listing.province}</strong>
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Descrição
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {listing.description}
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <a
                href={buyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#FF6A00] hover:bg-[#E55D00] text-[#0A1A36] text-sm font-bold transition-colors"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Comprar via WhatsApp do Administrador</span>
              </a>

              <a
                href={messageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0A1A36] hover:bg-[#12284F] text-white text-sm font-semibold transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-[#FF6A00]" />
                <span>Enviar Mensagem ({ADMIN_WHATSAPP_LOCAL})</span>
              </a>

              <p className="text-xs text-slate-500 text-center">
                Atendimento exclusivo pela central oficial Marketing Dias para todas as 21 províncias.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
