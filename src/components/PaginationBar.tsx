import { ChevronLeft, ChevronRight } from 'lucide-react';
import { LISTING_LIMITS } from '../types/listing';

interface PaginationBarProps {
  currentPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export function PaginationBar({
  currentPage,
  totalItems,
  onPageChange,
}: PaginationBarProps) {
  const maxPagesAllowed = Math.ceil(
    LISTING_LIMITS.MAX_CATEGORY_LISTINGS / LISTING_LIMITS.PAGE_SIZE,
  );
  const totalPages = Math.min(
    maxPagesAllowed,
    Math.max(1, Math.ceil(totalItems / LISTING_LIMITS.PAGE_SIZE)),
  );

  if (totalItems === 0) {
    return null;
  }

  const startItem = (currentPage - 1) * LISTING_LIMITS.PAGE_SIZE + 1;
  const endItem = Math.min(totalItems, currentPage * LISTING_LIMITS.PAGE_SIZE);

  const visiblePages: number[] = [];
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);
  for (let p = startPage; p <= endPage; p += 1) {
    visiblePages.push(p);
  }

  return (
    <div className="mt-8 pt-6 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-4">
      <p className="text-xs sm:text-sm text-zinc-600 tabular-nums">
        Mostrando <strong className="text-zinc-950">{startItem}–{endItem}</strong> de{' '}
        <strong className="text-zinc-950">{totalItems}</strong> anúncios reais (20 por página · até 4.000)
      </p>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Página anterior"
          className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-zinc-300 bg-white text-xs font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Anterior</span>
        </button>

        {startPage > 1 && (
          <button
            type="button"
            onClick={() => onPageChange(1)}
            className="w-9 h-9 rounded-lg border border-zinc-300 bg-white text-xs font-semibold text-zinc-700 hover:bg-zinc-50 tabular-nums cursor-pointer"
          >
            1
          </button>
        )}

        {visiblePages.map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={`w-9 h-9 rounded-lg text-xs font-bold tabular-nums transition-colors cursor-pointer ${
              page === currentPage
                ? 'bg-zinc-950 text-yellow-400'
                : 'border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50'
            }`}
          >
            {page}
          </button>
        ))}

        {endPage < totalPages && (
          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            className="w-9 h-9 rounded-lg border border-zinc-300 bg-white text-xs font-semibold text-zinc-700 hover:bg-zinc-50 tabular-nums cursor-pointer"
          >
            {totalPages}
          </button>
        )}

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Próxima página"
          className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-zinc-300 bg-white text-xs font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
        >
          <span>Seguinte</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
