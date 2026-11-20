import { useState, type FormEvent } from 'react';
import { ArrowLeft, Lock, ShieldAlert } from 'lucide-react';
import { ADMIN_EMAIL } from '../constants/marketplace';

interface AdminLoginPageProps {
  onGoogleAdminSignIn: () => Promise<void>;
  onBack: () => void;
  externalError?: string;
}

export function AdminLoginPage({
  onGoogleAdminSignIn,
  onBack,
  externalError = '',
}: AdminLoginPageProps) {
  const [emailInput, setEmailInput] = useState('');
  const [localError, setLocalError] = useState('');
  const [loading, setLoading] = useState(false);

  const errorMessage = localError || externalError;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLocalError('');

    const normalized = emailInput.trim().toLowerCase();
    if (normalized !== ADMIN_EMAIL) {
      setLocalError('Acesso negado, apenas o Administrador');
      return;
    }

    setLoading(true);
    try {
      await onGoogleAdminSignIn();
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="max-w-lg mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="bg-white border border-slate-200 rounded-2xl p-7 sm:p-9 shadow-sm">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#0A1A33] mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar à Página Inicial</span>
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-[#0A1A33] text-[#FF7A00] flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-[#0A1A33]">
              Login do Administrador
            </h1>
            <p className="text-xs text-slate-500">
              Área restrita ao Administrador do Marketing Dias
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          Apenas a conta autorizada do Administrador pode aceder ao painel para criar contas de vendedores e aprovar anúncios.
        </p>

        {errorMessage && (
          <div
            role="alert"
            className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 flex items-start gap-2.5 text-xs font-semibold text-red-700"
          >
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div>
            <label htmlFor="admin-email-check" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email do Administrador
            </label>
            <input
              id="admin-email-check"
              type="email"
              required
              value={emailInput}
              onChange={(e) => {
                setEmailInput(e.target.value);
                setLocalError('');
              }}
              placeholder="Digite o email do Administrador"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:border-[#0A1A33]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#0A1A33] hover:bg-[#12284F] disabled:opacity-60 text-[#FF7A00] text-sm font-bold transition-colors cursor-pointer"
          >
            {loading ? 'A verificar acesso...' : 'Entrar como Administrador (Google)'}
          </button>
        </form>
      </div>
    </section>
  );
}
