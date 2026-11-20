import { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';

interface BaixarAppButtonProps {
  label?: string;
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  onInstall: () => Promise<'accepted' | 'dismissed' | 'unavailable'>;
  variant?: 'header' | 'banner' | 'footer';
}

export function BaixarAppButton({
  label = 'Baixar App',
  isInstallable,
  isInstalled,
  isIOS,
  onInstall,
  variant = 'header',
}: BaixarAppButtonProps) {
  const [showGuideModal, setShowGuideModal] = useState(false);

  if (isInstalled) {
    return null;
  }

  async function handleClick() {
    if (isInstallable) {
      const result = await onInstall();
      if (result === 'unavailable') {
        setShowGuideModal(true);
      }
      return;
    }
    setShowGuideModal(true);
  }

  const buttonClass =
    variant === 'banner'
      ? 'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#FF7A00] hover:bg-[#E56800] text-[#0A1A33] text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer'
      : variant === 'footer'
        ? 'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#FF7A00] text-[#FF7A00] hover:bg-[#FF7A00] hover:text-[#0A1A33] text-xs sm:text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer'
        : 'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-500/60 bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer';

  return (
    <>
      <button type="button" onClick={() => void handleClick()} className={buttonClass}>
        <Download className="w-3.5 h-3.5" />
        <span>{label}</span>
      </button>

      {showGuideModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4 text-left"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-guide-title"
          onClick={() => setShowGuideModal(false)}
        >
          <div
            className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl text-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#0A1A33] text-[#FF7A00] flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="pwa-install-guide-title" className="font-display text-lg font-bold text-[#0A1A33]">
                    Instalar App Marketing Dias
                  </h3>
                  <p className="text-xs text-slate-500">Funciona como aplicativo no seu telemóvel</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                aria-label="Fechar guia de instalação"
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <ol className="space-y-2.5 text-sm text-slate-700 list-decimal pl-5">
                <li>
                  Abra o site no navegador <strong>Safari</strong>.
                </li>
                <li>
                  Toque no botão <strong>Partilhar</strong> na barra inferior.
                </li>
                <li>
                  Selecione <strong>Adicionar ao Ecrã Principal</strong> e confirme.
                </li>
              </ol>
            ) : (
              <ol className="space-y-2.5 text-sm text-slate-700 list-decimal pl-5">
                <li>
                  Abra esta página diretamente no navegador <strong>Google Chrome</strong> (fora de pré-visualizações em janela).
                </li>
                <li>
                  Toque no menu do Chrome (<strong>⋮</strong>) no canto superior direito.
                </li>
                <li>
                  Toque em <strong>Instalar aplicação</strong> ou <strong>Adicionar ao ecrã principal</strong>.
                </li>
              </ol>
            )}

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="mt-6 w-full py-2.5 rounded-xl bg-[#0A1A33] hover:bg-[#12284F] text-[#FF7A00] text-sm font-bold transition-colors cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
