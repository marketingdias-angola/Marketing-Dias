import type { Timestamp } from 'firebase/firestore';
import type { AngolaProvince } from './listing';

export interface VendorAccount {
  id: string;
  nome: string;
  loja: string;
  email: string;
  telefone: string;
  provincia: AngolaProvince;
  role: 'vendor';
  blocked: boolean;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface VendorRegisterInput {
  nome: string;
  loja: string;
  email: string;
  telefone: string;
  provincia: AngolaProvince;
  password: string;
  confirmPassword: string;
}

export const VENDOR_LIMITS = {
  NOME_MIN: 2,
  NOME_MAX: 80,
  LOJA_MIN: 2,
  LOJA_MAX: 80,
  EMAIL_MIN: 5,
  EMAIL_MAX: 120,
  TELEFONE_MIN: 6,
  TELEFONE_MAX: 25,
  PASSWORD_MIN: 6,
  PASSWORD_MAX: 64,
} as const;
