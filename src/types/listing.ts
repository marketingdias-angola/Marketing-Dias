import type { Timestamp } from 'firebase/firestore';

export type ListingStatus = 'pending' | 'approved' | 'paused' | 'sold';

export type ListingCategory =
  | 'Moda e acessórios'
  | 'Alimentos e Mercearia'
  | 'Serviços técnicos'
  | 'Negócios e empresas'
  | 'Roupas e calçados'
  | 'Móveis e decoração'
  | 'Materiais de Construção'
  | 'Carros e viaturas'
  | 'Imóveis e terrenos'
  | 'Agricultura e campos'
  | 'Telemóveis e acessórios'
  | 'Computador e informática'
  | 'Televisor e eletrónicas'
  | 'Empregos'
  | 'Outros';

export type AngolaProvince =
  | 'Luanda'
  | 'Bengo'
  | 'Benguela'
  | 'Bié'
  | 'Cabinda'
  | 'Cuando'
  | 'Cubango'
  | 'Cuanza Norte'
  | 'Cuanza Sul'
  | 'Cunene'
  | 'Huambo'
  | 'Huíla'
  | 'Icolo e Bengo'
  | 'Lunda Norte'
  | 'Lunda Sul'
  | 'Malanje'
  | 'Moxico'
  | 'Moxico Leste'
  | 'Namibe'
  | 'Uíge'
  | 'Zaire';

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: ListingCategory;
  province: AngolaProvince;
  images: string[];
  authorId: string;
  status: ListingStatus;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface ListingFormValues {
  title: string;
  description: string;
  price: string;
  category: ListingCategory;
  province: AngolaProvince;
  images: string[];
}

export const LISTING_LIMITS = {
  TITLE_MIN: 3,
  TITLE_MAX: 100,
  DESCRIPTION_MIN: 10,
  DESCRIPTION_MAX: 2000,
  PRICE_MIN: 1,
  PRICE_MAX: 1000000000,
  MAX_IMAGES: 10,
  IMAGE_ITEM_MAX_BYTES: 120000,
  PAGE_SIZE: 20,
  MAX_CATEGORY_LISTINGS: 4000,
  AUTHOR_ID_REGEX: /^[a-zA-Z0-9_-]+$/,
} as const;
