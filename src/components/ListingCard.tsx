import { ArrowUpRight, MapPin, Package } from 'lucide-react';
import { buildListingWhatsAppUrl, formatKwanza } from '../constants/marketplace';
import type { Listing } from '../types/listing';

interface ListingCardProps {
  listing: Listing;
  onSelect: (listing: Listing) => void;
}

export function ListingCard({ listing, onSelect }: ListingCardProps) {
  const whatsappHref = buildListingWhatsAppUrl(listing, 'comprar');
  const coverImage = listing.images[0] ?? '';

  return (
    <article className="group bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <button
        type="button"
        onClick={() => onSelect(listing)}
        className="relative aspect-[4/3] w-full bg-slate-100 overflow-hidden text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6A00]"
      >
        {coverImage ? (
          <img
            src={coverImage}
            alt={listing.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 flex flex-col items-center justify-center p-6 text-slate-400">
            <Package className="w-10 h-10 mb-2 text-[#0A1A36]/40" strokeWidth={1.5} />
            <span className="text-xs font-medium text-slate-500 text-center line-clamp-1">
              {listing.category}
            </span>
          </div>
        )}
      </button>

      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5 truncate">
            <span className="font-medium text-slate-700 truncate">{listing.category}</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
              {listing.province}
            </span>
            {listing.images.length > 1 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums shrink-0">{listing.images.length} fotos</span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => onSelect(listing)}
            className="text-left w-full cursor-pointer focus-visible:outline-none focus-visible:underline"
          >
            <h3 className="font-display text-base font-semibold text-slate-900 leading-snug line-clamp-2 group-hover:text-[#0A1A36]">
              {listing.title}
            </h3>
          </button>

          <p className="mt-2 font-display text-lg font-bold text-[#0A1A36] tabular-nums">
            {formatKwanza(listing.price)}
          </p>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onSelect(listing)}
            className="text-xs font-semibold text-slate-600 hover:text-[#0A1A36] transition-colors cursor-pointer whitespace-nowrap shrink-0 py-2"
          >
            Ver detalhes
          </button>

          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#0A1A36] text-[#FF6A00] hover:bg-[#12284F] text-xs font-bold transition-colors whitespace-nowrap shrink-0"
          >
            <span>Comprar</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </article>
  );
}
