import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import type { User } from 'firebase/auth';
import { ImagePlus, KeyRound, ShieldCheck, Trash2, X } from 'lucide-react';
import {
  ANGOLA_PROVINCES,
  compressImageFile,
  LISTING_CATEGORIES,
} from '../constants/marketplace';
import { createListing, updateListingContent } from '../services/listings';
import {
  LISTING_LIMITS,
  type AngolaProvince,
  type Listing,
  type ListingCategory,
  type ListingFormValues,
} from '../types/listing';

interface PublishModalProps {
  isOpen: boolean;
  user: User | null;
  isAdmin: boolean;
  isAuthorizedSeller: boolean;
  editingListing: Listing | null;
  onClose: () => void;
  onSellerSignIn: (email: string, password: string) => Promise<void>;
  onOpenAdminLogin: () => void;
  onSuccess: (message: string) => void;
}

const DEFAULT_FORM: ListingFormValues = {
  title: '',
  description: '',
  price: '',
  category: 'Moda e acessórios',
  province: 'Luanda',
  images: [],
};

export function PublishModal({
  isOpen,
  user,
  isAdmin,
  isAuthorizedSeller,
  editingListing,
  onClose,
  onSellerSignIn,
  onOpenAdminLogin,
  onSuccess,
}: PublishModalProps) {
  const [form, setForm] = useState<ListingFormValues>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState('');

  // Seller Email/Password Login state (created exclusively by Admin)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setError('');
    if (editingListing) {
      setForm({
        title: editingListing.title,
        description: editingListing.description,
        price: String(editingListing.price),
        category: editingListing.category,
        province: editingListing.province,
        images: editingListing.images,
      });
    } else {
      setForm(DEFAULT_FORM);
    }
  }, [isOpen, editingListing]);

  if (!isOpen) {
    return null;
  }

  const canPublish = Boolean(user && (isAdmin || isAuthorizedSeller));

  async function handleSellerLoginSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoggingIn(true);
    try {
      await onSellerSignIn(loginEmail, loginPassword);
      setLoginEmail('');
      setLoginPassword('');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Email ou senha incorretos.',
      );
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) {
      return;
    }

    const remainingSlots = LISTING_LIMITS.MAX_IMAGES - form.images.length;
    if (remainingSlots <= 0) {
      setError(`Máximo de ${LISTING_LIMITS.MAX_IMAGES} fotos por anúncio.`);
      e.target.value = '';
      return;
    }

    const selected = files.slice(0, remainingSlots);
    setError('');
    setCompressing(true);

    try {
      const compressedList: string[] = [];
      for (const file of selected) {
        const compressed = await compressImageFile(file);
        compressedList.push(compressed);
      }
      setForm((prev) => ({
        ...prev,
        images: [...prev.images, ...compressedList].slice(0, LISTING_LIMITS.MAX_IMAGES),
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar as fotos.');
    } finally {
      setCompressing(false);
      e.target.value = '';
    }
  }

  function handleRemoveImage(index: number) {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== index),
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user || !canPublish) {
      setError('Inicie sessão com a sua conta de vendedor autorizada.');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      if (editingListing) {
        await updateListingContent(editingListing.id, form, editingListing.status, isAdmin);
        onSuccess(
          isAdmin
            ? 'Anúncio atualizado com sucesso.'
            : 'Alterações guardadas. O anúncio foi reenviado para aprovação do Administrador.',
        );
      } else {
        await createListing(form, user, isAdmin);
        onSuccess(
          isAdmin
            ? 'Anúncio publicado diretamente no catálogo.'
            : 'Anúncio enviado com estado "Pendente" para aprovação do Administrador.',
        );
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível guardar o anúncio.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="publish-modal-title"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
          <h2 id="publish-modal-title" className="font-display text-lg font-bold text-[#0A1A33]">
            {!canPublish
              ? 'Login do Vendedor'
              : editingListing
                ? 'Editar Anúncio'
                : 'Anunciar Produto em Angola'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar formulário"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!canPublish ? (
          <div className="p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-[#0A1A33] text-[#FF7A00] flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-slate-900">
                Acesso Exclusivo para Vendedores
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto mt-1 leading-relaxed">
                Entre com o email e a senha que o Administrador criou para a sua loja. Vendedores não podem criar conta sozinhos.
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs font-medium text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={(e) => void handleSellerLoginSubmit(e)} className="space-y-4 max-w-md mx-auto">
              <div>
                <label htmlFor="seller-login-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email do Vendedor *
                </label>
                <input
                  id="seller-login-email"
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:border-[#0A1A33]"
                />
              </div>

              <div>
                <label htmlFor="seller-login-password" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Senha *
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="seller-login-password"
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Senha fornecida pelo Administrador"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:border-[#0A1A33]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loggingIn}
                className="w-full py-3 rounded-xl bg-[#FF7A00] hover:bg-[#E56800] disabled:opacity-60 text-[#0A1A33] text-sm font-bold transition-colors cursor-pointer"
              >
                {loggingIn ? 'A entrar...' : 'Entrar para Anunciar'}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAdminLogin();
                }}
                className="text-xs font-semibold text-[#0A1A33] hover:text-[#FF7A00] underline cursor-pointer"
              >
                É o Administrador? Aceder ao Login do Administrador
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className="p-6 space-y-5">
            <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-xs text-slate-700 leading-relaxed">
              <strong className="text-[#0A1A33]">Regra do Marketing Dias:</strong> Não insira telefone ou WhatsApp no anúncio. Todos os compradores falam apenas com o Administrador (943194189).
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs font-medium text-red-700">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="listing-title" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Título do produto ou serviço *
              </label>
              <input
                id="listing-title"
                type="text"
                required
                minLength={LISTING_LIMITS.TITLE_MIN}
                maxLength={LISTING_LIMITS.TITLE_MAX}
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: iPhone 15 Pro Max 256GB Lacrado"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:border-[#0A1A33]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="listing-price" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Preço (Kwanzas - Kz) *
                </label>
                <input
                  id="listing-price"
                  type="number"
                  required
                  min={LISTING_LIMITS.PRICE_MIN}
                  max={LISTING_LIMITS.PRICE_MAX}
                  step="1"
                  value={form.price}
                  onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                  placeholder="Ex: 150000"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:border-[#0A1A33]"
                />
              </div>

              <div>
                <label htmlFor="listing-province" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Província (21 províncias de Angola) *
                </label>
                <select
                  id="listing-province"
                  value={form.province}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, province: e.target.value as AngolaProvince }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:border-[#0A1A33]"
                >
                  {ANGOLA_PROVINCES.map((prov) => (
                    <option key={prov} value={prov}>
                      {prov}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="listing-category" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Categoria *
              </label>
              <select
                id="listing-category"
                value={form.category}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, category: e.target.value as ListingCategory }))
                }
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:border-[#0A1A33]"
              >
                {LISTING_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="listing-description" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Descrição detalhada *
              </label>
              <textarea
                id="listing-description"
                required
                rows={4}
                minLength={LISTING_LIMITS.DESCRIPTION_MIN}
                maxLength={LISTING_LIMITS.DESCRIPTION_MAX}
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva especificações, disponibilidade de entrega e detalhes importantes (sem telefone)."
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:border-[#0A1A33]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-700">
                  Fotos do produto (até {LISTING_LIMITS.MAX_IMAGES} fotos)
                </span>
                <span className="text-[11px] text-slate-500 tabular-nums">
                  {form.images.length} / {LISTING_LIMITS.MAX_IMAGES}
                </span>
              </div>

              {form.images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 mb-3">
                  {form.images.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100"
                    >
                      <img
                        src={img}
                        alt={`Foto ${idx + 1}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        aria-label={`Remover foto ${idx + 1}`}
                        className="absolute top-1 right-1 p-1 rounded-md bg-slate-900/80 text-white hover:bg-slate-900 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {form.images.length < LISTING_LIMITS.MAX_IMAGES && (
                <label className="flex flex-col items-center justify-center w-full h-28 rounded-xl border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                  <ImagePlus className="w-6 h-6 text-[#0A1A33] mb-1.5" />
                  <span className="text-xs font-semibold text-slate-700">
                    {compressing ? 'A otimizar fotos...' : 'Selecionar fotos do dispositivo'}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5">JPG, PNG ou WebP</span>
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => void handleImageChange(e)}
                    disabled={compressing}
                    className="sr-only"
                  />
                </label>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting || compressing}
                className="px-6 py-2.5 rounded-lg bg-[#FF7A00] hover:bg-[#E56800] disabled:opacity-60 text-[#0A1A33] text-sm font-bold transition-colors cursor-pointer"
              >
                {submitting
                  ? 'A guardar...'
                  : editingListing
                    ? 'Guardar Alterações'
                    : 'Publicar Anúncio'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
