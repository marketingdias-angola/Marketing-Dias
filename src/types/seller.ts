import type { Timestamp } from 'firebase/firestore';

export interface SellerAccount {
  id: string;
  name: string;
  email: string;
  blocked: boolean;
  createdBy: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export const SELLER_LIMITS = {
  NAME_MIN: 2,
  NAME_MAX: 60,
  EMAIL_MIN: 5,
  EMAIL_MAX: 120,
  PASSWORD_MIN: 6,
  PASSWORD_MAX: 64,
} as const;
