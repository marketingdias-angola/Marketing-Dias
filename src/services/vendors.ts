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
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { ANGOLA_PROVINCES } from '../constants/marketplace';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import type { AngolaProvince } from '../types/listing';
import { VENDOR_LIMITS, type VendorAccount, type VendorRegisterInput } from '../types/vendor';

function mapDocToVendor(id: string, data: Record<string, unknown>): VendorAccount {
  const provincia = ANGOLA_PROVINCES.includes(data.provincia as AngolaProvince)
    ? (data.provincia as AngolaProvince)
    : 'Luanda';

  return {
    id,
    nome: String(data.nome ?? ''),
    loja: String(data.loja ?? ''),
    email: String(data.email ?? ''),
    telefone: String(data.telefone ?? ''),
    provincia,
    role: 'vendor',
    blocked: Boolean(data.blocked),
    createdAt: (data.createdAt as VendorAccount['createdAt']) ?? null,
    updatedAt: (data.updatedAt as VendorAccount['updatedAt']) ?? null,
  };
}

export function validateVendorRegistration(input: VendorRegisterInput) {
  const nome = input.nome.trim();
  const loja = input.loja.trim();
  const email = input.email.trim().toLowerCase();
  const telefone = input.telefone.trim();
  const provincia = input.provincia;
  const password = input.password;
  const confirmPassword = input.confirmPassword;

  if (nome.length < VENDOR_LIMITS.NOME_MIN || nome.length > VENDOR_LIMITS.NOME_MAX) {
    throw new Error(
      `O nome completo deve ter entre ${VENDOR_LIMITS.NOME_MIN} e ${VENDOR_LIMITS.NOME_MAX} caracteres.`,
    );
  }
  if (loja.length < VENDOR_LIMITS.LOJA_MIN || loja.length > VENDOR_LIMITS.LOJA_MAX) {
    throw new Error(
      `O nome da loja ou vendedor deve ter entre ${VENDOR_LIMITS.LOJA_MIN} e ${VENDOR_LIMITS.LOJA_MAX} caracteres.`,
    );
  }
  if (
    email.length < VENDOR_LIMITS.EMAIL_MIN ||
    email.length > VENDOR_LIMITS.EMAIL_MAX ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    throw new Error('Informe um email válido.');
  }
  if (telefone.length < VENDOR_LIMITS.TELEFONE_MIN || telefone.length > VENDOR_LIMITS.TELEFONE_MAX) {
    throw new Error('Informe um telefone ou WhatsApp válido (ex: 943194189).');
  }
  if (!ANGOLA_PROVINCES.includes(provincia)) {
    throw new Error('Selecione uma das 21 províncias de Angola.');
  }
  if (password.length < VENDOR_LIMITS.PASSWORD_MIN || password.length > VENDOR_LIMITS.PASSWORD_MAX) {
    throw new Error(`A senha deve ter pelo menos ${VENDOR_LIMITS.PASSWORD_MIN} caracteres.`);
  }
  if (password !== confirmPassword) {
    throw new Error('As senhas não coincidem. Verifique e tente novamente.');
  }

  return {
    nome,
    loja,
    email,
    telefone,
    provincia,
    password,
  };
}

export async function registerVendorAccount(input: VendorRegisterInput): Promise<VendorAccount> {
  const clean = validateVendorRegistration(input);

  let uid = '';
  try {
    const cred = await createUserWithEmailAndPassword(auth, clean.email, clean.password);
    uid = cred.user.uid;
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code ?? '';
    if (code === 'auth/email-already-in-use') {
      throw new Error('Este email já tem uma conta criada. Use a aba ENTRAR.');
    }
    if (code === 'auth/invalid-email') {
      throw new Error('O endereço de email não é válido.');
    }
    if (code === 'auth/weak-password') {
      throw new Error('A senha deve ter pelo menos 6 caracteres.');
    }
    if (code === 'auth/operation-not-allowed') {
      throw new Error(
        'O registo com Email/Senha precisa ser ativado no Firebase Console (Authentication > Sign-in method > Email/Password).',
      );
    }
    if (code === 'auth/too-many-requests') {
      throw new Error('Muitas tentativas. Aguarde alguns instantes e tente novamente.');
    }
    throw new Error(err instanceof Error ? err.message : 'Não foi possível criar a sua conta.');
  }

  const path = `vendors/${uid}`;
  try {
    await setDoc(doc(db, 'vendors', uid), {
      nome: clean.nome,
      loja: clean.loja,
      email: clean.email,
      telefone: clean.telefone,
      provincia: clean.provincia,
      role: 'vendor',
      blocked: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return {
      id: uid,
      nome: clean.nome,
      loja: clean.loja,
      email: clean.email,
      telefone: clean.telefone,
      provincia: clean.provincia,
      role: 'vendor',
      blocked: false,
      createdAt: null,
      updatedAt: null,
    };
  } catch (error) {
    await signOut(auth).catch(() => undefined);
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function getVendorProfile(uid: string): Promise<VendorAccount | null> {
  const path = `vendors/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'vendors', uid));
    if (!snap.exists()) {
      return null;
    }
    return mapDocToVendor(snap.id, snap.data());
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function subscribeVendorsAdmin(
  onData: (vendors: VendorAccount[]) => void,
  onError: (err: Error) => void,
): Unsubscribe {
  const path = 'vendors';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items = snapshot.docs
        .map((d) => mapDocToVendor(d.id, d.data()))
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

export async function toggleVendorBlocked(vendorId: string, blocked: boolean): Promise<void> {
  const path = `vendors/${vendorId}`;
  try {
    await updateDoc(doc(db, 'vendors', vendorId), {
      blocked,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteVendorDoc(vendorId: string): Promise<void> {
  const path = `vendors/${vendorId}`;
  try {
    await deleteDoc(doc(db, 'vendors', vendorId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
