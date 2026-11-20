import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { db, getSellerProvisionerAuth, handleFirestoreError, OperationType } from '../firebase';
import { SELLER_LIMITS, type SellerAccount } from '../types/seller';

function mapDocToSeller(id: string, data: Record<string, unknown>): SellerAccount {
  return {
    id,
    name: String(data.name ?? ''),
    email: String(data.email ?? ''),
    blocked: Boolean(data.blocked),
    createdBy: String(data.createdBy ?? ''),
    createdAt: (data.createdAt as SellerAccount['createdAt']) ?? null,
    updatedAt: (data.updatedAt as SellerAccount['updatedAt']) ?? null,
  };
}

export function subscribeSellersAdmin(
  onData: (sellers: SellerAccount[]) => void,
  onError: (err: Error) => void,
): Unsubscribe {
  const path = 'sellers';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items = snapshot.docs
        .map((d) => mapDocToSeller(d.id, d.data()))
        .sort((a, b) => {
          const aMs = a.createdAt?.toMillis() ?? Date.now();
          const bMs = b.createdAt?.toMillis() ?? Date.now();
          return bMs - aMs;
        });
      onData(items);
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

export async function getSellerProfile(uid: string): Promise<SellerAccount | null> {
  const path = `sellers/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'sellers', uid));
    if (!snap.exists()) {
      return null;
    }
    return mapDocToSeller(snap.id, snap.data());
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function createSellerAccount(
  params: { name: string; email: string; tempPassword: string },
  adminUser: User,
): Promise<string> {
  const name = params.name.trim();
  const email = params.email.trim().toLowerCase();
  const tempPassword = params.tempPassword;

  if (name.length < SELLER_LIMITS.NAME_MIN || name.length > SELLER_LIMITS.NAME_MAX) {
    throw new Error(
      `O nome do vendedor deve ter entre ${SELLER_LIMITS.NAME_MIN} e ${SELLER_LIMITS.NAME_MAX} caracteres.`,
    );
  }
  if (
    email.length < SELLER_LIMITS.EMAIL_MIN ||
    email.length > SELLER_LIMITS.EMAIL_MAX ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    throw new Error('Informe um email válido para o vendedor.');
  }
  if (
    tempPassword.length < SELLER_LIMITS.PASSWORD_MIN ||
    tempPassword.length > SELLER_LIMITS.PASSWORD_MAX
  ) {
    throw new Error(
      `A senha temporária deve ter entre ${SELLER_LIMITS.PASSWORD_MIN} e ${SELLER_LIMITS.PASSWORD_MAX} caracteres.`,
    );
  }

  const secondaryAuth = getSellerProvisionerAuth();
  let newUid = '';

  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, tempPassword);
    newUid = cred.user.uid;
    await signOut(secondaryAuth);
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code ?? '';
    if (code === 'auth/email-already-in-use') {
      throw new Error('Este email já possui uma conta registada.');
    }
    if (code === 'auth/operation-not-allowed') {
      throw new Error(
        'O método Email/Senha ainda precisa ser ativado no Firebase Console (Authentication > Sign-in method > Email/Password).',
      );
    }
    if (code === 'auth/weak-password') {
      throw new Error('A senha temporária deve ter pelo menos 6 caracteres.');
    }
    throw new Error(err instanceof Error ? err.message : 'Erro ao criar conta de autenticação do vendedor.');
  }

  const path = `sellers/${newUid}`;
  try {
    await setDoc(doc(db, 'sellers', newUid), {
      name,
      email,
      blocked: false,
      createdBy: adminUser.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return newUid;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function toggleSellerBlocked(sellerId: string, blocked: boolean): Promise<void> {
  const path = `sellers/${sellerId}`;
  try {
    await updateDoc(doc(db, 'sellers', sellerId), {
      blocked,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteSellerDoc(sellerId: string): Promise<void> {
  const path = `sellers/${sellerId}`;
  try {
    await deleteDoc(doc(db, 'sellers', sellerId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
