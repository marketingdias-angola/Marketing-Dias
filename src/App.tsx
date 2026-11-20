import { useEffect, useMemo, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  Armchair,
  Briefcase,
  Building2,
  Car,
  Hammer,
  Laptop,
  LayoutGrid,
  Lock,
  LogOut,
  MapPin,
  MessageCircle,
  Plus,
  Search,
  Shield,
  Shirt,
  ShoppingBasket,
  Smartphone,
  Sprout,
  Tv,
  UserCheck,
  Watch,
  WifiOff,
  Wrench,
  X,
  type LucideIcon,
} from 'lucide-react';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLoginPage } from './components/AdminLoginPage';
import { BaixarAppButton } from './components/BaixarAppButton';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ListingCard } from './components/ListingCard';
import { ListingDetailModal } from './components/ListingDetailModal';
import { MarketingDiasLogo } from './components/MarketingDiasLogo';
import { MyListingsSection } from './components/MyListingsSection';
import { PublishModal } from './components/PublishModal';
import {
  ADMIN_EMAIL,
  ADMIN_WHATSAPP_LOCAL,
  ANGOLA_PROVINCES,
  buildAdminWhatsAppUrl,
  HERO_IMAGE_PATH,
  isAdminEmail,
  LISTING_CATEGORIES,
} from './constants/marketplace';
import { auth, googleProvider } from './firebase';
import { useOnlineStatus, usePWAInstall } from './hooks/usePWAInstall';
import {
  subscribeAllListingsAdmin,
  subscribeApprovedListings,
  subscribeMyListings,
} from './services/listings';
import { getSellerProfile, subscribeSellersAdmin } from './services/sellers';
import type { Listing, ListingCategory } from './types/listing';
import type { SellerAccount } from './types/seller';

type ActiveTab = 'explorar' | 'provincias' | 'meus-anuncios' | 'admin-login' | 'admin';

const OFFLINE_CACHE_KEY = 'md_cached_approved_listings_v1';

const CATEGORY_ICONS: Record<ListingCategory, LucideIcon> = {
  'Moda e acessórios': Watch,
  'Alimentos e Mercearia': ShoppingBasket,
  'Serviços técnicos': Wrench,
  'Negócios e empresas': Briefcase,
  'Roupas e calçados': Shirt,
  'Móveis e decoração': Armchair,
  'Materiais de Construção': Hammer,
  'Carros e viaturas': Car,
  'Imóveis e terrenos': Building2,
  'Agricultura e campos': Sprout,
  'Telemóveis e acessórios': Smartphone,
  'Computador e informática': Laptop,
  'Televisor e eletrónicas': Tv,
  'Empregos': UserCheck,
  'Outros': LayoutGrid,
};

function readCachedListings(): Listing[] {
  try {
    const raw = window.localStorage.getItem(OFFLINE_CACHE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed as Listing[];
  } catch {
    return [];
  }
}

function writeCachedListings(items: Listing[]) {
  try {
    const serializable = items.slice(0, 60).map((item) => ({
      ...item,
      createdAt: null,
      updatedAt: null,
    }));
    window.localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(serializable));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

function MarketplaceContent() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [currentSellerProfile, setCurrentSellerProfile] = useState<SellerAccount | null>(null);

  const [activeTab, setActiveTab] = useState<ActiveTab>('explorar');
  const [approvedListings, setApprovedListings] = useState<Listing[]>(() => readCachedListings());
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [adminListings, setAdminListings] = useState<Listing[]>([]);
  const [sellers, setSellers] = useState<SellerAccount[]>([]);

  const [loadingPublic, setLoadingPublic] = useState(() => readCachedListings().length === 0);
  const [firestoreError, setFirestoreError] = useState('');
  const [adminLoginError, setAdminLoginError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [selectedProvince, setSelectedProvince] = useState<string>('Todas');

  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [heroImageError, setHeroImageError] = useState(false);
  const [installBannerDismissed, setInstallBannerDismissed] = useState(false);

  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const isOnline = useOnlineStatus();

  const userIsAdmin = isAdminEmail(user?.email, user?.emailVerified);
  const isAuthorizedSeller = Boolean(currentSellerProfile && !currentSellerProfile.blocked);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);

      if (!currentUser) {
        setCurrentSellerProfile(null);
        return;
      }

      if (isAdminEmail(currentUser.email, currentUser.emailVerified)) {
        setCurrentSellerProfile(null);
        setAdminLoginError('');
        return;
      }

      try {
        const profile = await getSellerProfile(currentUser.uid);
        if (!profile) {
          await signOut(auth);
          setCurrentSellerProfile(null);
          return;
        }
        if (profile.blocked) {
          await signOut(auth);
          setCurrentSellerProfile(null);
          setToastMessage('A sua conta de vendedor foi bloqueada pelo Administrador.');
          return;
        }
        setCurrentSellerProfile(profile);
      } catch {
        setCurrentSellerProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const cached = readCachedListings();
    if (cached.length === 0) {
      setLoadingPublic(true);
    }
    const unsubscribe = subscribeApprovedListings(
      (items) => {
        setApprovedListings(items);
        writeCachedListings(items);
        setLoadingPublic(false);
        setFirestoreError('');
      },
      (err) => {
        setLoadingPublic(false);
        if (navigator.onLine) {
          setFirestoreError(err.message);
        }
      },
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!authReady || !user || (!userIsAdmin && !isAuthorizedSeller)) {
      setMyListings([]);
      return;
    }
    const unsubscribe = subscribeMyListings(
      user.uid,
      (items) => setMyListings(items),
      (err) => setFirestoreError(err.message),
    );
    return () => unsubscribe();
  }, [authReady, user, userIsAdmin, isAuthorizedSeller]);

  useEffect(() => {
    if (!authReady || !userIsAdmin) {
      setAdminListings([]);
      setSellers([]);
      return;
    }
    const unsubListings = subscribeAllListingsAdmin(
      (items) => setAdminListings(items),
      (err) => setFirestoreError(err.message),
    );
    const unsubSellers = subscribeSellersAdmin(
      (items) => setSellers(items),
      (err) => setFirestoreError(err.message),
    );
    return () => {
      unsubListings();
      unsubSellers();
    };
  }, [authReady, userIsAdmin]);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }
    const timer = window.setTimeout(() => setToastMessage(''), 5000);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const filteredListings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return approvedListings.filter((item) => {
      if (selectedCategory !== 'Todas' && item.category !== selectedCategory) {
        return false;
      }
      if (selectedProvince !== 'Todas' && item.province !== selectedProvince) {
        return false;
      }
      if (
        q &&
        !item.title.toLowerCase().includes(q) &&
        !item.description.toLowerCase().includes(q) &&
        !item.province.toLowerCase().includes(q) &&
        !item.category.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [approvedListings, searchQuery, selectedCategory, selectedProvince]);

  const countsByProvince = useMemo(() => {
    const map = new Map<string, number>();
    for (const prov of ANGOLA_PROVINCES) {
      map.set(prov, 0);
    }
    for (const item of approvedListings) {
      map.set(item.province, (map.get(item.province) ?? 0) + 1);
    }
    return map;
  }, [approvedListings]);

  const pendingAdminCount = useMemo(
    () => adminListings.filter((item) => item.status === 'pending').length,
    [adminListings],
  );

  async function handleGoogleAdminSignIn() {
    setAdminLoginError('');
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      if (!isAdminEmail(cred.user.email, cred.user.emailVerified)) {
        await signOut(auth);
        setAdminLoginError('Acesso negado, apenas o Administrador');
        return;
      }
      setAdminLoginError('');
      setActiveTab('admin');
      setToastMessage('Sessão de Administrador iniciada.');
    } catch (err) {
      setAdminLoginError(
        err instanceof Error ? err.message : 'Não foi possível concluir o login do Administrador.',
      );
    }
  }

  async function handleSellerSignIn(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      throw new Error('Preencha o email e a senha fornecidos pelo Administrador.');
    }

    try {
      const cred = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      if (isAdminEmail(cred.user.email, cred.user.emailVerified)) {
        setToastMessage('Sessão iniciada como Administrador.');
        return;
      }

      const profile = await getSellerProfile(cred.user.uid);
      if (!profile) {
        await signOut(auth);
        throw new Error('Conta de vendedor não autorizada. Solicite acesso ao Administrador.');
      }
      if (profile.blocked) {
        await signOut(auth);
        throw new Error('A sua conta de vendedor foi bloqueada pelo Administrador.');
      }
      setCurrentSellerProfile(profile);
      setToastMessage('Sessão de vendedor iniciada.');
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found'
      ) {
        throw new Error('Email ou senha de vendedor incorretos.');
      }
      if (code === 'auth/too-many-requests') {
        throw new Error('Muitas tentativas falhadas. Aguarde alguns minutos e tente novamente.');
      }
      if (code === 'auth/operation-not-allowed') {
        throw new Error('O método Email/Senha precisa estar ativo no Firebase Console.');
      }
      throw err instanceof Error ? err : new Error('Não foi possível iniciar sessão de vendedor.');
    }
  }

  async function handleSignOut() {
    try {
      await signOut(auth);
      setCurrentSellerProfile(null);
      if (activeTab === 'admin' || activeTab === 'admin-login') {
        setActiveTab('explorar');
      }
      setToastMessage('Sessão terminada.');
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : 'Erro ao sair da conta.');
    }
  }

  function handleOpenNewPublish() {
    setEditingListing(null);
    setPublishOpen(true);
  }

  function handleEditListing(listing: Listing) {
    setEditingListing(listing);
    setPublishOpen(true);
  }

  function handleOpenAdminPortal() {
    setAdminLoginError('');
    if (userIsAdmin) {
      setActiveTab('admin');
    } else {
      setActiveTab('admin-login');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleSelectProvince(province: string) {
    setSelectedProvince(province);
    setActiveTab('explorar');
    window.setTimeout(() => {
      document.getElementById('anuncios-disponiveis')?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }

  function navigateToSection(sectionId?: string) {
    setActiveTab('explorar');
    if (!sectionId) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    window.setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }

  function handleSelectCategoryCard(category: ListingCategory) {
    setSelectedCategory(category);
    setActiveTab('explorar');
    window.setTimeout(() => {
      document.getElementById('anuncios-disponiveis')?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }

  const adminMessageHref = buildAdminWhatsAppUrl(
    'Olá Administrador do Marketing Dias, gostaria de enviar uma mensagem.',
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* PWA Install Banner at the top */}
      {!isInstalled && !installBannerDismissed && (
        <div className="bg-[#08142B] text-white border-b border-[#1A315B]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-3">
            <p className="text-xs sm:text-sm font-medium text-slate-100 truncate">
              Baixe o App Marketing Dias para anunciar mais rápido
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <BaixarAppButton
                label="Instalar"
                variant="banner"
                isInstallable={isInstallable}
                isInstalled={isInstalled}
                isIOS={isIOS}
                onInstall={install}
              />
              <button
                type="button"
                onClick={() => setInstallBannerDismissed(true)}
                aria-label="Dispensar aviso de instalação"
                className="p-1 rounded-md text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3-Zone Top Bar */}
      <header className="sticky top-0 z-40 bg-[#0A1A33] border-b border-[#1A315B] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-3 sm:gap-6">
          {/* Zone 1: Brand Mark */}
          <button
            type="button"
            onClick={() => navigateToSection()}
            className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7A00] rounded-lg shrink-0"
            aria-label="Marketing Dias — Página inicial"
          >
            <MarketingDiasLogo variant="header" />
          </button>

          {/* Zone 2: Exact 4 Top Menu Buttons */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-200">
            <button
              type="button"
              onClick={() => navigateToSection()}
              className={`whitespace-nowrap shrink-0 cursor-pointer transition-colors hover:text-white ${
                activeTab === 'explorar'
                  ? 'text-white font-bold underline underline-offset-8 decoration-[#FF7A00] decoration-2'
                  : ''
              }`}
            >
              Página Inicial
            </button>

            <button
              type="button"
              onClick={() => navigateToSection('categorias-15')}
              className="whitespace-nowrap shrink-0 cursor-pointer transition-colors hover:text-[#FF7A00]"
            >
              Categorias
            </button>

            <button
              type="button"
              onClick={() => navigateToSection('anuncios-disponiveis')}
              className="whitespace-nowrap shrink-0 cursor-pointer transition-colors hover:text-[#FF7A00]"
            >
              Anúncios
            </button>

            <a
              href={adminMessageHref}
              target="_blank"
              rel="noopener noreferrer"
              className="whitespace-nowrap shrink-0 cursor-pointer transition-colors hover:text-[#FF7A00]"
            >
              Mensagem
            </a>
          </nav>

          {/* Zone 3: Fixed Baixar App + Anunciar Produto + Admin Access */}
          <div className="flex items-center gap-2 shrink-0">
            <BaixarAppButton
              label="Baixar App"
              variant="header"
              isInstallable={isInstallable}
              isInstalled={isInstalled}
              isIOS={isIOS}
              onInstall={install}
            />

            <button
              type="button"
              onClick={handleOpenNewPublish}
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#FF7A00] hover:bg-[#E56800] text-[#0A1A33] text-xs sm:text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Anunciar Produto</span>
            </button>

            <button
              type="button"
              onClick={handleOpenAdminPortal}
              title={userIsAdmin ? 'Painel do Administrador' : 'Login do Administrador'}
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'admin' || activeTab === 'admin-login'
                  ? 'border-[#FF7A00] text-[#FF7A00] bg-[#12284F]'
                  : 'border-slate-600/70 text-slate-200 hover:border-[#FF7A00] hover:text-white'
              }`}
            >
              {userIsAdmin ? <Shield className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>{userIsAdmin ? `Admin (${pendingAdminCount})` : 'Admin'}</span>
            </button>

            {user && (
              <button
                type="button"
                onClick={() => void handleSignOut()}
                aria-label="Terminar sessão"
                title="Sair"
                className="p-2 rounded-xl border border-slate-600/60 text-slate-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile/Tablet Compact Nav with exact 4 buttons */}
        <div className="lg:hidden border-t border-[#1A315B] px-4 py-2 flex items-center justify-between gap-4 overflow-x-auto text-xs font-semibold text-slate-200">
          <button
            type="button"
            onClick={() => navigateToSection()}
            className="whitespace-nowrap shrink-0 py-1 hover:text-white"
          >
            Página Inicial
          </button>
          <button
            type="button"
            onClick={() => navigateToSection('categorias-15')}
            className="whitespace-nowrap shrink-0 py-1 hover:text-[#FF7A00]"
          >
            Categorias
          </button>
          <button
            type="button"
            onClick={() => navigateToSection('anuncios-disponiveis')}
            className="whitespace-nowrap shrink-0 py-1 hover:text-[#FF7A00]"
          >
            Anúncios
          </button>
          <a
            href={adminMessageHref}
            target="_blank"
            rel="noopener noreferrer"
            className="whitespace-nowrap shrink-0 py-1 text-[#FF7A00]"
          >
            Mensagem
          </a>
        </div>
      </header>

      {/* Offline Status Banner */}
      {!isOnline && (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-2.5 rounded-xl flex items-center gap-2.5 text-xs font-medium">
            <WifiOff className="w-4 h-4 shrink-0 text-amber-700" />
            <span>
              Modo Offline — A página inicial e os últimos anúncios guardados continuam disponíveis sem internet.
            </span>
          </div>
        </div>
      )}

      {/* Non-blocking Toast Feedback */}
      {toastMessage && (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-[#0A1A33] text-white px-4 py-3 rounded-xl flex items-center justify-between gap-4 text-sm">
            <span>{toastMessage}</span>
            <button
              type="button"
              onClick={() => setToastMessage('')}
              aria-label="Fechar aviso"
              className="p-1 text-slate-300 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {firestoreError && isOnline && (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-xs">
            Não foi possível sincronizar alguns dados no momento. Tente atualizar a página.
          </div>
        </div>
      )}

      <main className="flex-1">
        {activeTab === 'explorar' && (
          <>
            {/* Storefront Hero (Blue Banner) */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 rounded-2xl overflow-hidden border border-slate-200 bg-[#0A1A33] items-stretch">
                <div className="lg:col-span-7 p-7 sm:p-10 lg:p-12 flex flex-col justify-between gap-8">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#FF7A00] mb-3">
                      Marketplace Nacional · 21 Províncias de Angola
                    </p>
                    <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-[1.1] text-balance">
                      Anúncios reais de norte a sul de Angola.
                    </h1>
                    <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
                      Publique o seu produto em segundos sem expor o seu telefone. Todas as compras e negociações passam diretamente pelo WhatsApp oficial do Administrador Marketing Dias.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <a
                      href={buildAdminWhatsAppUrl(
                        'Olá Administrador do Marketing Dias, gostaria de obter informações sobre compras ou vendas.',
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#FF7A00] hover:bg-[#E56800] text-[#0A1A33] text-sm font-bold transition-colors whitespace-nowrap"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Contactar Administrador ({ADMIN_WHATSAPP_LOCAL})</span>
                    </a>

                    <button
                      type="button"
                      onClick={handleOpenNewPublish}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <span>Anunciar Gratuitamente</span>
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-5 relative min-h-[240px] lg:min-h-full bg-[#12284F]">
                  {!heroImageError ? (
                    <img
                      src={HERO_IMAGE_PATH}
                      alt="Produtos e encomendas selecionadas do Marketing Dias em Angola"
                      referrerPolicy="no-referrer"
                      onError={() => setHeroImageError(true)}
                      className="w-full h-full lg:h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-8 text-center">
                      <MarketingDiasLogo variant="footer" />
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* 15 Categorias Grid right below the blue banner */}
            <section id="categorias-15" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0A1A33]">
                  15 Categorias
                </h2>
                {selectedCategory !== 'Todas' && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('Todas')}
                    className="text-xs font-semibold text-[#0A1A33] hover:text-[#FF7A00] transition-colors cursor-pointer"
                  >
                    Mostrar todas
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                {LISTING_CATEGORIES.map((category) => {
                  const Icon = CATEGORY_ICONS[category];
                  const isActive = selectedCategory === category;
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => handleSelectCategoryCard(category)}
                      className={`group rounded-xl border p-4 text-left transition-all duration-150 cursor-pointer flex flex-col justify-between gap-3 hover:-translate-y-0.5 ${
                        isActive
                          ? 'bg-[#0A1A33] border-[#0A1A33] text-white shadow-sm'
                          : 'bg-white border-slate-200 hover:border-[#0A1A33] text-slate-900'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                          isActive
                            ? 'bg-[#FF7A00] text-[#0A1A33]'
                            : 'bg-slate-100 text-[#0A1A33] group-hover:bg-[#0A1A33] group-hover:text-[#FF7A00]'
                        } transition-colors`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

                      <div>
                        <h3 className="font-display text-sm font-bold leading-snug">
                          {category}
                        </h3>
                        <p
                          className={`text-xs mt-1 tabular-nums ${
                            isActive ? 'text-slate-300' : 'text-slate-500'
                          }`}
                        >
                          4.000 oportunidades
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Search & Filter Toolbar + Real Listings */}
            <section id="anuncios-disponiveis" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 mb-8 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-6 relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Pesquisar produtos, marcas ou províncias..."
                      aria-label="Pesquisar anúncios"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:border-[#0A1A33]"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <select
                      value={selectedProvince}
                      onChange={(e) => setSelectedProvince(e.target.value)}
                      aria-label="Filtrar por província"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:border-[#0A1A33]"
                    >
                      <option value="Todas">Todas as 21 províncias</option>
                      {ANGOLA_PROVINCES.map((prov) => (
                        <option key={prov} value={prov}>
                          {prov}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-3">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      aria-label="Filtrar por categoria"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:border-[#0A1A33]"
                    >
                      <option value="Todas">Todas as categorias</option>
                      {LISTING_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0A1A33]">
                  Anúncios Disponíveis
                </h2>
                <span className="text-xs sm:text-sm font-medium text-slate-600 tabular-nums">
                  {filteredListings.length}{' '}
                  {filteredListings.length === 1 ? 'anúncio real' : 'anúncios reais'}
                </span>
              </div>

              {loadingPublic ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((slot) => (
                    <div
                      key={slot}
                      className="bg-white border border-slate-200 rounded-xl overflow-hidden animate-pulse"
                    >
                      <div className="aspect-[4/3] bg-slate-200" />
                      <div className="p-5 space-y-3">
                        <div className="h-3 w-1/2 bg-slate-200 rounded" />
                        <div className="h-5 w-3/4 bg-slate-200 rounded" />
                        <div className="h-6 w-1/3 bg-slate-200 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredListings.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
                  <h3 className="font-display text-lg font-bold text-slate-900 mb-2">
                    {approvedListings.length === 0
                      ? 'Ainda não há anúncios publicados no catálogo'
                      : 'Nenhum anúncio encontrado para esta seleção'}
                  </h3>
                  <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
                    {approvedListings.length === 0
                      ? 'Todos os anúncios são reais e armazenados no Firebase Firestore. Seja o primeiro a anunciar para as 21 províncias de Angola.'
                      : 'Experimente limpar os filtros de província ou categoria para ver todos os produtos disponíveis.'}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    {approvedListings.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedCategory('Todas');
                          setSelectedProvince('Todas');
                        }}
                        className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 cursor-pointer"
                      >
                        Limpar Filtros
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleOpenNewPublish}
                      className="px-6 py-2.5 rounded-xl bg-[#FF7A00] hover:bg-[#E56800] text-[#0A1A33] text-sm font-bold cursor-pointer"
                    >
                      Publicar Anúncio
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredListings.map((listing) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      onSelect={setSelectedListing}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {activeTab === 'provincias' && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="pb-6 border-b border-slate-200">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0A1A33]">
                Cobertura nas 21 Províncias de Angola
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Selecione uma província para ver os anúncios disponíveis ou contactar a nossa central para encomendas.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {ANGOLA_PROVINCES.map((prov) => {
                const count = countsByProvince.get(prov) ?? 0;
                return (
                  <button
                    key={prov}
                    type="button"
                    onClick={() => handleSelectProvince(prov)}
                    className="bg-white border border-slate-200 hover:border-[#0A1A33] rounded-xl p-5 text-left transition-all hover:-translate-y-0.5 cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2 font-display text-base font-bold text-[#0A1A33]">
                        <MapPin className="w-4 h-4 text-[#FF7A00] shrink-0" />
                        <span>{prov}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 tabular-nums">
                        {count} {count === 1 ? 'anúncio ativo' : 'anúncios ativos'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {activeTab === 'meus-anuncios' && (
          <MyListingsSection
            listings={myListings}
            isSignedIn={Boolean(user && (userIsAdmin || isAuthorizedSeller))}
            onOpenSellerLogin={handleOpenNewPublish}
            onOpenPublish={handleOpenNewPublish}
            onEditListing={handleEditListing}
            onNotify={setToastMessage}
          />
        )}

        {activeTab === 'admin-login' && !userIsAdmin && (
          <AdminLoginPage
            onGoogleAdminSignIn={handleGoogleAdminSignIn}
            onBack={() => setActiveTab('explorar')}
            externalError={adminLoginError}
          />
        )}

        {(activeTab === 'admin' || activeTab === 'admin-login') && userIsAdmin && user && (
          <AdminDashboard
            adminUser={user}
            listings={adminListings}
            sellers={sellers}
            onEditListing={handleEditListing}
            onNotify={setToastMessage}
          />
        )}
      </main>

      {/* Structural Footer */}
      <footer className="bg-[#0A1A33] text-slate-300 border-t border-[#1A315B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <MarketingDiasLogo variant="footer" />
            <div className="text-xs sm:text-sm text-slate-300 max-w-sm leading-relaxed">
              Plataforma de anúncios reais para as 21 províncias de Angola. Intermediação direta pelo Administrador único.
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-300">
            <BaixarAppButton
              label="Baixar App"
              variant="footer"
              isInstallable={isInstallable}
              isInstalled={isInstalled}
              isIOS={isIOS}
              onInstall={install}
            />

            <button
              type="button"
              onClick={() => {
                setActiveTab('provincias');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-white cursor-pointer"
            >
              21 Províncias
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('meus-anuncios');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-white cursor-pointer"
            >
              Meus Anúncios
            </button>
            <button
              type="button"
              onClick={handleOpenAdminPortal}
              className="inline-flex items-center gap-1 text-[#FF7A00] hover:underline cursor-pointer tabular-nums"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{userIsAdmin ? `Administração (${pendingAdminCount})` : 'Login Admin'}</span>
            </button>
            {user && (
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="hover:text-white cursor-pointer"
              >
                Sair
              </button>
            )}

            <a
              href={buildAdminWhatsAppUrl(
                'Olá Administrador do Marketing Dias, preciso de atendimento.',
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF7A00] hover:bg-[#E56800] text-[#0A1A33] text-xs sm:text-sm font-bold transition-colors whitespace-nowrap"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Contactar Administrador: {ADMIN_WHATSAPP_LOCAL}</span>
            </a>
          </div>
        </div>

        {/* Exact Bottom Footer Line */}
        <div className="border-t border-[#1A315B] bg-[#08142B]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-xs text-slate-300">
            Email: {ADMIN_EMAIL} | Telefone / WhatsApp do Administrador: {ADMIN_WHATSAPP_LOCAL} | © Marketing Dias - Venda em 21 províncias de Angola
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ListingDetailModal
        listing={selectedListing}
        onClose={() => setSelectedListing(null)}
      />

      <PublishModal
        isOpen={publishOpen}
        user={user}
        isAdmin={userIsAdmin}
        isAuthorizedSeller={isAuthorizedSeller}
        editingListing={editingListing}
        onClose={() => {
          setPublishOpen(false);
          setEditingListing(null);
        }}
        onSellerSignIn={handleSellerSignIn}
        onOpenAdminLogin={() => {
          setActiveTab('admin-login');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onSuccess={(msg) => setToastMessage(msg)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MarketplaceContent />
    </ErrorBoundary>
  );
}
