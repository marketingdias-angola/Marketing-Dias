import { useState, type FormEvent } from 'react';
import type { User } from 'firebase/auth';
import {
  Ban,
  Check,
  Edit3,
  KeyRound,
  Pause,
  Play,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  ANGOLA_PROVINCES,
  formatKwanza,
  STATUS_LABELS,
} from '../constants/marketplace';
import { deleteListing, updateListingStatus } from '../services/listings';
import {
  createSellerAccount,
  deleteSellerDoc,
  toggleSellerBlocked,
} from '../services/sellers';
import type { Listing, ListingStatus } from '../types/listing';
import { SELLER_LIMITS, type SellerAccount } from '../types/seller';

type AdminTab = 'criar-vendedor' | 'ver-vendedores' | 'aprovar-anuncios';

interface AdminDashboardProps {
  adminUser: User;
  listings: Listing[];
  sellers: SellerAccount[];
  onEditListing: (listing: Listing) => void;
  onNotify: (msg: string) => void;
}

export function AdminDashboard({
  adminUser,
  listings,
  sellers,
  onEditListing,
  onNotify,
}: AdminDashboardProps) {
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>('aprovar-anuncios');

  // Tab A: Criar Conta para Vendedor
  const [sellerName, setSellerName] = useState('');
  const [sellerEmail, setSellerEmail] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [creatingSeller, setCreatingSeller] = useState(false);
  const [sellerFormError, setSellerFormError] = useState('');
  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    email: string;
    password: string;
  } | null>(null);

  // Tab B: Ver Todos os Vendedores
  const [busySellerId, setBusySellerId] = useState<string | null>(null);
  const [confirmDeleteSellerId, setConfirmDeleteSellerId] = useState<string | null>(null);

  // Tab C: Aprovar Anúncios
  const [statusFilter, setStatusFilter] = useState<'all' | ListingStatus>('pending');
  const [provinceFilter, setProvinceFilter] = useState<string>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const counts = {
    all: listings.length,
    pending: listings.filter((l) => l.status === 'pending').length,
    approved: listings.filter((l) => l.status === 'approved').length,
    paused: listings.filter((l) => l.status === 'paused').length,
    sold: listings.filter((l) => l.status === 'sold').length,
  };

  const filteredListings = listings.filter((item) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) {
      return false;
    }
    if (provinceFilter !== 'all' && item.province !== provinceFilter) {
      return false;
    }
    return true;
  });

  async function handleCreateSeller(e: FormEvent) {
    e.preventDefault();
    setSellerFormError('');
    setCreatedCredentials(null);
    setCreatingSeller(true);

    try {
      await createSellerAccount(
        {
          name: sellerName,
          email: sellerEmail,
          tempPassword,
        },
        adminUser,
      );
      setCreatedCredentials({
        name: sellerName.trim(),
        email: sellerEmail.trim().toLowerCase(),
        password: tempPassword,
      });
      setSellerName('');
      setSellerEmail('');
      setTempPassword('');
      onNotify('Conta de vendedor criada com sucesso.');
    } catch (err) {
      setSellerFormError(
        err instanceof Error ? err.message : 'Não foi possível criar a conta do vendedor.',
      );
    } finally {
      setCreatingSeller(false);
    }
  }

  async function handleToggleBlockSeller(seller: SellerAccount) {
    setBusySellerId(seller.id);
    try {
      await toggleSellerBlocked(seller.id, !seller.blocked);
      onNotify(
        !seller.blocked
          ? `Vendedor "${seller.name}" bloqueado.`
          : `Vendedor "${seller.name}" desbloqueado.`,
      );
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Erro ao atualizar vendedor.');
    } finally {
      setBusySellerId(null);
    }
  }

  async function handleDeleteSeller(sellerId: string) {
    setBusySellerId(sellerId);
    try {
      await deleteSellerDoc(sellerId);
      setConfirmDeleteSellerId(null);
      onNotify('Vendedor removido.');
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Erro ao apagar vendedor.');
    } finally {
      setBusySellerId(null);
    }
  }

  async function handleStatusChange(listingId: string, nextStatus: ListingStatus) {
    setBusyId(listingId);
    try {
      await updateListingStatus(listingId, nextStatus);
      onNotify(`Estado alterado para "${STATUS_LABELS[nextStatus]}".`);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Erro ao atualizar estado.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleDeleteListing(listingId: string) {
    setBusyId(listingId);
    try {
      await deleteListing(listingId);
      setConfirmDeleteId(null);
      onNotify('Anúncio removido permanentemente.');
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Erro ao remover anúncio.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#0A1A33]">
            Painel do Administrador
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Gestão exclusiva de vendedores e aprovação de anúncios para as 21 províncias de Angola.
          </p>
        </div>

        {/* 3 Main Admin Tabs */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveAdminTab('criar-vendedor')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
              activeAdminTab === 'criar-vendedor'
                ? 'bg-[#0A1A33] text-[#FF7A00]'
                : 'text-slate-700 hover:text-[#0A1A33]'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Criar Conta para Vendedor</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveAdminTab('ver-vendedores')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer tabular-nums ${
              activeAdminTab === 'ver-vendedores'
                ? 'bg-[#0A1A33] text-[#FF7A00]'
                : 'text-slate-700 hover:text-[#0A1A33]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Ver Todos os Vendedores ({sellers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveAdminTab('aprovar-anuncios')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer tabular-nums ${
              activeAdminTab === 'aprovar-anuncios'
                ? 'bg-[#0A1A33] text-[#FF7A00]'
                : 'text-slate-700 hover:text-[#0A1A33]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Aprovar Anúncios ({counts.pending})</span>
          </button>
        </div>
      </div>

      {/* TAB A: Criar Conta para Vendedor */}
      {activeAdminTab === 'criar-vendedor' && (
        <div className="mt-8 max-w-xl bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
          <h3 className="font-display text-lg font-bold text-[#0A1A33] mb-1">
            Criar Conta para Vendedor
          </h3>
          <p className="text-xs text-slate-600 mb-6 leading-relaxed">
            Vendedores não podem criar contas sozinhos. Crie aqui o acesso e entregue o email e a senha temporária ao vendedor para ele publicar anúncios (sem telefone).
          </p>

          {sellerFormError && (
            <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs font-medium text-red-700">
              {sellerFormError}
            </div>
          )}

          {createdCredentials && (
            <div className="mb-5 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs text-emerald-900 space-y-1">
              <p className="font-bold">Conta criada com sucesso!</p>
              <p>Vendedor: {createdCredentials.name}</p>
              <p>Email: {createdCredentials.email}</p>
              <p>Senha temporária: {createdCredentials.password}</p>
            </div>
          )}

          <form onSubmit={(e) => void handleCreateSeller(e)} className="space-y-4">
            <div>
              <label htmlFor="new-seller-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nome do vendedor *
              </label>
              <input
                id="new-seller-name"
                type="text"
                required
                minLength={SELLER_LIMITS.NAME_MIN}
                maxLength={SELLER_LIMITS.NAME_MAX}
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
                placeholder="Ex: António Manuel"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:border-[#0A1A33]"
              />
            </div>

            <div>
              <label htmlFor="new-seller-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email do vendedor *
              </label>
              <input
                id="new-seller-email"
                type="email"
                required
                minLength={SELLER_LIMITS.EMAIL_MIN}
                maxLength={SELLER_LIMITS.EMAIL_MAX}
                value={sellerEmail}
                onChange={(e) => setSellerEmail(e.target.value)}
                placeholder="Ex: vendedor@exemplo.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:border-[#0A1A33]"
              />
            </div>

            <div>
              <label htmlFor="new-seller-password" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Senha temporária (mínimo 6 caracteres) *
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="new-seller-password"
                  type="text"
                  required
                  minLength={SELLER_LIMITS.PASSWORD_MIN}
                  maxLength={SELLER_LIMITS.PASSWORD_MAX}
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  placeholder="Ex: Dias2026!"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:border-[#0A1A33]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={creatingSeller}
              className="w-full py-3 rounded-xl bg-[#FF7A00] hover:bg-[#E56800] disabled:opacity-60 text-[#0A1A33] text-sm font-bold transition-colors cursor-pointer"
            >
              {creatingSeller ? 'A criar conta...' : 'Criar Conta'}
            </button>
          </form>
        </div>
      )}

      {/* TAB B: Ver Todos os Vendedores */}
      {activeAdminTab === 'ver-vendedores' && (
        <div className="mt-8">
          {sellers.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
              <p className="text-sm font-medium text-slate-600 mb-4">
                Ainda não criou nenhuma conta de vendedor.
              </p>
              <button
                type="button"
                onClick={() => setActiveAdminTab('criar-vendedor')}
                className="px-5 py-2.5 rounded-xl bg-[#FF7A00] hover:bg-[#E56800] text-[#0A1A33] text-xs font-bold cursor-pointer"
              >
                Criar Primeiro Vendedor
              </button>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200">
              {sellers.map((seller) => {
                const isBusy = busySellerId === seller.id;
                return (
                  <div
                    key={seller.id}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span
                          className={`font-bold ${
                            seller.blocked ? 'text-red-700' : 'text-emerald-700'
                          }`}
                        >
                          {seller.blocked ? 'Bloqueado' : 'Ativo'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">{seller.email}</span>
                      </div>
                      <h3 className="font-display text-base font-bold text-slate-900 mt-0.5 truncate">
                        {seller.name}
                      </h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => void handleToggleBlockSeller(seller)}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                          seller.blocked
                            ? 'bg-[#FF7A00] hover:bg-[#E56800] text-[#0A1A33]'
                            : 'border border-slate-300 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>{seller.blocked ? 'Desbloquear' : 'Bloquear'}</span>
                      </button>

                      {confirmDeleteSellerId === seller.id ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => void handleDeleteSeller(seller.id)}
                            className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer"
                          >
                            Confirmar
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteSellerId(null)}
                            className="px-3 py-2 rounded-lg border border-slate-300 text-slate-600 text-xs font-semibold cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => setConfirmDeleteSellerId(seller.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 text-xs font-semibold cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Apagar</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB C: Aprovar Anúncios */}
      {activeAdminTab === 'aprovar-anuncios' && (
        <div className="mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 rounded-xl w-fit">
              {(
                [
                  ['pending', `Pendentes (${counts.pending})`],
                  ['approved', `Publicados (${counts.approved})`],
                  ['paused', `Pausados (${counts.paused})`],
                  ['sold', `Vendidos (${counts.sold})`],
                  ['all', `Todos (${counts.all})`],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatusFilter(key)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
                    statusFilter === key
                      ? 'bg-[#0A1A33] text-[#FF7A00] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <select
              value={provinceFilter}
              onChange={(e) => setProvinceFilter(e.target.value)}
              aria-label="Filtrar por província"
              className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
            >
              <option value="all">Todas as 21 províncias</option>
              {ANGOLA_PROVINCES.map((prov) => (
                <option key={prov} value={prov}>
                  {prov}
                </option>
              ))}
            </select>
          </div>

          {filteredListings.length === 0 ? (
            <div className="mt-6 bg-white border border-slate-200 rounded-xl p-10 text-center">
              <p className="text-sm font-medium text-slate-600">
                Nenhum anúncio encontrado neste estado.
              </p>
            </div>
          ) : (
            <div className="mt-6 bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200">
              {filteredListings.map((item) => {
                const isBusy = busyId === item.id;
                return (
                  <div
                    key={item.id}
                    className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                  >
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="w-20 h-16 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
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

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                          <span className="font-semibold text-[#0A1A33]">
                            {STATUS_LABELS[item.status]}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{item.province}</span>
                          <span aria-hidden="true">·</span>
                          <span>{item.category}</span>
                        </div>

                        <h3 className="font-display text-base font-bold text-slate-900 mt-0.5 truncate">
                          {item.title}
                        </h3>

                        <p className="text-sm font-bold text-[#0A1A33] tabular-nums mt-0.5">
                          {formatKwanza(item.price)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {item.status !== 'approved' && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => void handleStatusChange(item.id, 'approved')}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#FF7A00] hover:bg-[#E56800] text-[#0A1A33] text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Aprovar</span>
                        </button>
                      )}

                      {item.status === 'approved' && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => void handleStatusChange(item.id, 'paused')}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <Pause className="w-3.5 h-3.5" />
                          <span>Pausar</span>
                        </button>
                      )}

                      {item.status !== 'sold' && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => void handleStatusChange(item.id, 'sold')}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Vendido</span>
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => onEditListing(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>

                      {confirmDeleteId === item.id ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => void handleDeleteListing(item.id)}
                            className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
                          >
                            Confirmar
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-3 py-2 rounded-lg border border-slate-300 text-slate-600 text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => setConfirmDeleteId(item.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Excluir</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
