import { useState } from 'react';
import { CheckCircle2, Edit3, MessageCircle, Pause, Plus, Trash2 } from 'lucide-react';
import {
  buildAdminWhatsAppUrl,
  formatKwanza,
  STATUS_LABELS,
} from '../constants/marketplace';
import { deleteListing, updateListingStatus } from '../services/listings';
import type { Listing } from '../types/listing';

interface MyListingsSectionProps {
  listings: Listing[];
  isSignedIn: boolean;
  onOpenSellerLogin: () => void;
  onOpenPublish: () => void;
  onEditListing: (listing: Listing) => void;
  onNotify: (msg: string) => void;
}

export function MyListingsSection({
  listings,
  isSignedIn,
  onOpenSellerLogin,
  onOpenPublish,
  onEditListing,
  onNotify,
}: MyListingsSectionProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  if (!isSignedIn) {
    return (
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="bg-white border border-slate-200 rounded-2xl p-10">
          <h2 className="font-display text-2xl font-bold text-[#0A1A33] mb-2">
            Os Meus Anúncios
          </h2>
          <p className="text-sm text-slate-600 mb-6">
            Inicie sessão com o email e senha fornecidos pelo Administrador para gerir os seus anúncios no Marketing Dias.
          </p>
          <button
            type="button"
            onClick={onOpenSellerLogin}
            className="px-6 py-3 rounded-xl bg-[#0A1A33] hover:bg-[#12284F] text-[#FF7A00] text-sm font-bold transition-colors cursor-pointer"
          >
            Entrar como Vendedor
          </button>
        </div>
      </section>
    );
  }

  async function handlePauseOrSold(id: string, status: 'paused' | 'sold' | 'pending') {
    setBusyId(id);
    try {
      await updateListingStatus(id, status);
      onNotify(`Estado atualizado para "${STATUS_LABELS[status]}".`);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Erro ao atualizar anúncio.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    try {
      await deleteListing(id);
      setConfirmDeleteId(null);
      onNotify('Anúncio removido.');
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Erro ao excluir anúncio.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#0A1A33]">
            Os Meus Anúncios
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Acompanhe o estado dos seus anúncios enviados para a central Marketing Dias.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenPublish}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF7A00] hover:bg-[#E56800] text-[#0A1A33] text-sm font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Anúncio</span>
        </button>
      </div>

      {listings.length === 0 ? (
        <div className="mt-8 bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <h3 className="font-display text-lg font-bold text-slate-900 mb-2">
            Ainda não publicou nenhum anúncio
          </h3>
          <p className="text-sm text-slate-600 mb-6 max-w-md mx-auto">
            Publique produtos ou serviços para todas as 21 províncias de Angola sem precisar divulgar o seu número pessoal.
          </p>
          <button
            type="button"
            onClick={onOpenPublish}
            className="px-6 py-3 rounded-xl bg-[#0A1A33] hover:bg-[#12284F] text-[#FF7A00] text-sm font-bold transition-colors cursor-pointer"
          >
            Anunciar Primeiro Produto
          </button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {listings.map((item) => {
            const isBusy = busyId === item.id;
            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-24 h-20 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                    {item.images[0] ? (
                      <img
                        src={item.images[0]}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[11px] font-semibold text-slate-400">
                        Sem foto
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-semibold text-[#0A1A36]">
                        {STATUS_LABELS[item.status]}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{item.province}</span>
                      <span aria-hidden="true">·</span>
                      <span>{item.category}</span>
                    </div>
                    <h3 className="font-display text-base font-bold text-slate-900 mt-1 truncate">
                      {item.title}
                    </h3>
                    <p className="text-base font-bold text-[#0A1A36] tabular-nums mt-1">
                      {formatKwanza(item.price)}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  {item.status === 'pending' && (
                    <a
                      href={buildAdminWhatsAppUrl(
                        `Olá Administrador, acabei de enviar o anúncio "${item.title}" (${item.province}) e aguardo aprovação.`,
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0A1A36] hover:underline"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Avisar Administrador</span>
                    </a>
                  )}

                  <div className="flex flex-wrap items-center gap-2 ml-auto">
                    {item.status !== 'sold' && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => onEditListing(item)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>
                    )}

                    {item.status === 'approved' && (
                      <>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => void handlePauseOrSold(item.id, 'paused')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                        >
                          <Pause className="w-3.5 h-3.5" />
                          <span>Pausar</span>
                        </button>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => void handlePauseOrSold(item.id, 'sold')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0A1A36] text-[#FF6A00] text-xs font-semibold hover:bg-[#12284F] cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Vendido</span>
                        </button>
                      </>
                    )}

                    {item.status === 'paused' && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => void handlePauseOrSold(item.id, 'pending')}
                        className="px-3 py-1.5 rounded-lg bg-[#FF6A00] text-[#0A1A36] text-xs font-bold hover:bg-[#E55D00] cursor-pointer"
                      >
                        Reenviar para Revisão
                      </button>
                    )}

                    {confirmDeleteId === item.id ? (
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => void handleDelete(item.id)}
                          className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 cursor-pointer"
                        >
                          Confirmar
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => setConfirmDeleteId(item.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 text-red-700 text-xs font-semibold hover:bg-red-50 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Excluir</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
