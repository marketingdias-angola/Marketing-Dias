import {
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { ANGOLA_PROVINCES, LISTING_CATEGORIES } from '../constants/marketplace';
import {
  LISTING_LIMITS,
  type AngolaProvince,
  type Listing,
  type ListingCategory,
  type ListingFormValues,
  type ListingStatus,
} from '../types/listing';

function mapDocToListing(id: string, data: Record<string, unknown>): Listing {
  const rawImages = Array.isArray(data.images)
    ? data.images.filter((item): item is string => typeof item === 'string' && item.length > 0)
    : typeof data.imageData === 'string' && data.imageData.length > 0
      ? [data.imageData]
      : [];

  const category = LISTING_CATEGORIES.includes(data.category as ListingCategory)
    ? (data.category as ListingCategory)
    : 'Outros';

  const province = ANGOLA_PROVINCES.includes(data.province as AngolaProvince)
    ? (data.province as AngolaProvince)
    : 'Luanda';

  return {
    id,
    title: String(data.title ?? ''),
    description: String(data.description ?? ''),
    price: Number(data.price ?? 0),
    category,
    province,
    images: rawImages.slice(0, LISTING_LIMITS.MAX_IMAGES),
    authorId: String(data.authorId ?? ''),
    status: (data.status as ListingStatus) ?? 'pending',
    createdAt: (data.createdAt as Listing['createdAt']) ?? null,
    updatedAt: (data.updatedAt as Listing['updatedAt']) ?? null,
  };
}

function sortNewestFirst(items: Listing[]): Listing[] {
  return [...items].sort((a, b) => {
    const aMs = a.createdAt?.toMillis() ?? Date.now();
    const bMs = b.createdAt?.toMillis() ?? Date.now();
    return bMs - aMs;
  });
}

export function validateListingForm(values: ListingFormValues): {
  title: string;
  description: string;
  price: number;
  category: Listing['category'];
  province: Listing['province'];
  images: string[];
} {
  const title = values.title.trim();
  const description = values.description.trim();
  const price = Number(values.price);
  const images = values.images.slice(0, LISTING_LIMITS.MAX_IMAGES);

  if (title.length < LISTING_LIMITS.TITLE_MIN || title.length > LISTING_LIMITS.TITLE_MAX) {
    throw new Error(
      `O título do negócio deve ter entre ${LISTING_LIMITS.TITLE_MIN} e ${LISTING_LIMITS.TITLE_MAX} caracteres.`,
    );
  }
  if (
    description.length < LISTING_LIMITS.DESCRIPTION_MIN ||
    description.length > LISTING_LIMITS.DESCRIPTION_MAX
  ) {
    throw new Error(
      `A descrição deve ter entre ${LISTING_LIMITS.DESCRIPTION_MIN} e ${LISTING_LIMITS.DESCRIPTION_MAX} caracteres.`,
    );
  }
  if (!Number.isFinite(price) || price < LISTING_LIMITS.PRICE_MIN || price > LISTING_LIMITS.PRICE_MAX) {
    throw new Error('Informe um preço válido em Kwanzas (mínimo 1 Kz).');
  }
  if (!LISTING_CATEGORIES.includes(values.category)) {
    throw new Error('Selecione uma das 15 categorias válidas.');
  }
  if (!ANGOLA_PROVINCES.includes(values.province)) {
    throw new Error('Selecione uma das 21 províncias de Angola.');
  }
  if (images.length > LISTING_LIMITS.MAX_IMAGES) {
    throw new Error(`Pode enviar no máximo ${LISTING_LIMITS.MAX_IMAGES} fotos por anúncio.`);
  }
  for (const img of images) {
    if (
      img.length > LISTING_LIMITS.IMAGE_ITEM_MAX_BYTES ||
      !/^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(img)
    ) {
      throw new Error('Uma das fotos selecionadas é inválida ou excede o tamanho permitido.');
    }
  }

  return {
    title,
    description,
    price: Math.round(price),
    category: values.category,
    province: values.province,
    images,
  };
}

function generateSafeListingId(): string {
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `md_${Date.now()}_${randomPart}`;
}

export function subscribeApprovedListings(
  onData: (listings: Listing[]) => void,
  onError: (err: Error) => void,
): Unsubscribe {
  const path = 'listings';
  const q = query(
    collection(db, path),
    where('status', '==', 'approved'),
    limit(LISTING_LIMITS.MAX_CATEGORY_LISTINGS),
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => mapDocToListing(d.id, d.data()));
      onData(sortNewestFirst(items));
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    },
  );
}

export function subscribeMyListings(
  uid: string,
  onData: (listings: Listing[]) => void,
  onError: (err: Error) => void,
): Unsubscribe {
  const path = 'listings';
  const q = query(
    collection(db, path),
    where('authorId', '==', uid),
    limit(LISTING_LIMITS.MAX_CATEGORY_LISTINGS),
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => mapDocToListing(d.id, d.data()));
      onData(sortNewestFirst(items));
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    },
  );
}

export function subscribeAllListingsAdmin(
  onData: (listings: Listing[]) => void,
  onError: (err: Error) => void,
): Unsubscribe {
  const path = 'listings';
  const q = query(collection(db, path), limit(LISTING_LIMITS.MAX_CATEGORY_LISTINGS));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => mapDocToListing(d.id, d.data()));
      onData(sortNewestFirst(items));
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    },
  );
}

export async function createListing(
  values: ListingFormValues,
  user: User,
  isAdmin: boolean,
): Promise<string> {
  if (!user || !LISTING_LIMITS.AUTHOR_ID_REGEX.test(user.uid)) {
    throw new Error('É necessário iniciar sessão como vendedor autorizado ou Administrador.');
  }

  const clean = validateListingForm(values);
  const listingId = generateSafeListingId();
  const path = `listings/${listingId}`;

  try {
    await setDoc(doc(db, 'listings', listingId), {
      ...clean,
      authorId: user.uid,
      status: isAdmin ? 'approved' : 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return listingId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateListingContent(
  listingId: string,
  values: ListingFormValues,
  currentStatus: ListingStatus,
  isAdmin: boolean,
): Promise<void> {
  const clean = validateListingForm(values);
  const path = `listings/${listingId}`;

  try {
    await updateDoc(doc(db, 'listings', listingId), {
      ...clean,
      status: isAdmin ? currentStatus : 'pending',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateListingStatus(
  listingId: string,
  status: ListingStatus,
): Promise<void> {
  const path = `listings/${listingId}`;
  try {
    await updateDoc(doc(db, 'listings', listingId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteListing(listingId: string): Promise<void> {
  const path = `listings/${listingId}`;
  try {
    await deleteDoc(doc(db, 'listings', listingId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
