import { Component, type ErrorInfo, type ReactNode } from 'react';
import { buildAdminWhatsAppUrl } from '../constants/marketplace';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    message: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error.message || 'Ocorreu um erro inesperado na aplicação.',
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Erro capturado pelo ErrorBoundary:', error, errorInfo);
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-8 text-center shadow-sm">
            <div className="w-24 mx-auto mb-5 rounded-xl bg-[#0A1A36] p-2 flex items-center justify-center">
              <img
                src="/assets/aistudio/IMG-20261105-WA4864_bbfc24b7.jpg"
                alt="Marketing Dias"
                referrerPolicy="no-referrer"
                className="h-14 w-auto object-contain"
              />
            </div>
            <h1 className="font-display text-xl font-bold text-slate-900 mb-2">
              Algo interrompeu o carregamento
            </h1>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              O Marketing Dias encontrou um problema temporário. Recarregue a página ou fale com o Administrador.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 rounded-lg bg-[#0A1A36] text-white text-sm font-semibold hover:bg-[#12284F] transition-colors cursor-pointer"
              >
                Recarregar Página
              </button>
              <a
                href={buildAdminWhatsAppUrl('Olá Administrador do Marketing Dias, preciso de suporte técnico no site.')}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-lg bg-[#FF6A00] text-[#0A1A36] text-sm font-bold hover:bg-[#E55D00] transition-colors"
              >
                WhatsApp Administrador
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
