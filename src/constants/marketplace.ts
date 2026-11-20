import type { AngolaProvince, Listing, ListingCategory, ListingStatus } from '../types/listing';

export const ADMIN_EMAIL = 'domingosmeiodiajoao@gmail.com';
export const ADMIN_WHATSAPP_LOCAL = '943194189';
export const ADMIN_WHATSAPP_INTL = '244943194189';

export const HERO_IMAGE_PATH = '/src/assets/images/hero_angola_marketplace_1795163483361.jpg';
export const BRAND_LOGO_PATH = '/assets/aistudio/IMG-20261105-WA4864_bbfc24b7.jpg';

export const ANGOLA_PROVINCES: readonly AngolaProvince[] = [
  'Luanda',
  'Bengo',
  'Benguela',
  'Bié',
  'Cabinda',
  'Cuando',
  'Cubango',
  'Cuanza Norte',
  'Cuanza Sul',
  'Cunene',
  'Huambo',
  'Huíla',
  'Icolo e Bengo',
  'Lunda Norte',
  'Lunda Sul',
  'Malanje',
  'Moxico',
  'Moxico Leste',
  'Namibe',
  'Uíge',
  'Zaire',
] as const;

export const LISTING_CATEGORIES: readonly ListingCategory[] = [
  'Moda e acessórios',
  'Alimentos e Mercearia',
  'Serviços técnicos',
  'Negócios e empresas',
  'Roupas e calçados',
  'Móveis e decoração',
  'Materiais de Construção',
  'Carros e viaturas',
  'Imóveis e terrenos',
  'Agricultura e campos',
  'Telemóveis e acessórios',
  'Computador e informática',
  'Televisor e eletrónicas',
  'Empregos',
  'Outros',
] as const;

export const STATUS_LABELS: Record<ListingStatus, string> = {
  pending: 'Em análise',
  approved: 'Publicado',
  paused: 'Pausado',
  sold: 'Vendido',
};

export function formatKwanza(amount: number): string {
  return new Intl.NumberFormat('pt-AO', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(amount) + ' Kz';
}

export function buildAdminWhatsAppUrl(message: string): string {
  return `https://wa.me/${ADMIN_WHATSAPP_INTL}?text=${encodeURIComponent(message)}`;
}

export function buildListingWhatsAppUrl(listing: Listing, action: 'comprar' | 'contactar' | 'mensagem' = 'comprar'): string {
  const actionLabel =
    action === 'comprar'
      ? 'tenho interesse em comprar'
      : action === 'mensagem'
        ? 'gostaria de enviar uma mensagem sobre'
        : 'gostaria de contactar sobre';

  const message =
    `Olá Administrador do Marketing Dias, ${actionLabel} este anúncio:\n` +
    `• Produto: ${listing.title}\n` +
    `• Categoria: ${listing.category}\n` +
    `• Preço: ${formatKwanza(listing.price)}\n` +
    `• Província: ${listing.province}\n` +
    `• Código: ${listing.id}`;

  return buildAdminWhatsAppUrl(message);
}

export function isAdminEmail(email?: string | null, emailVerified?: boolean | null): boolean {
  return Boolean(emailVerified && email && email.toLowerCase() === ADMIN_EMAIL);
}

export async function compressImageFile(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Selecione um ficheiro de imagem válido (JPG, PNG ou WebP).');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem selecionada.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Formato de imagem não suportado.'));
      img.onload = () => {
        const maxWidth = 720;
        const maxHeight = 540;
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Erro ao processar imagem no navegador.'));
          return;
        }

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.72;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);

        while (dataUrl.length > 115000 && quality > 0.25) {
          quality -= 0.08;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        if (dataUrl.length > 118000) {
          reject(new Error('Uma das fotos é demasiado pesada. Escolha uma imagem mais leve.'));
          return;
        }

        resolve(dataUrl);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
