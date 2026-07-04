import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { seedDefaultWorkouts } from '@/lib/default-workouts';
import { auth, db } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';

type AuthContextValue = {
  /** undefined = état d'auth inconnu (chargement initial) */
  user: User | null | undefined;
  profile: UserProfile | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (displayName: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  // Profil Firestore en temps réel (XP, compteurs…).
  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    return onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (!snap.exists()) {
        // Compte sans profil (inscription interrompue avant l'écriture
        // Firestore) : on le recrée pour ne pas laisser l'app à moitié vide.
        setDoc(doc(db, 'users', user.uid), {
          displayName: user.displayName ?? 'Athlète',
          email: user.email ?? '',
          xp: 0,
          sessionsCompleted: 0,
          recordsCount: 0,
          createdAt: serverTimestamp(),
        }).catch((e) => console.warn('[GLU] Création du profil impossible', e));
        return;
      }
      setProfile(snap.data() as UserProfile);
    });
  }, [user]);

  async function signIn(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }

  async function signUp(displayName: string, email: string, password: string) {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    await updateProfile(cred.user, { displayName });
    await setDoc(doc(db, 'users', cred.user.uid), {
      displayName,
      email: email.trim(),
      xp: 0,
      sessionsCompleted: 0,
      recordsCount: 0,
      createdAt: serverTimestamp(),
    });
    // Le nouveau compte démarre avec des séances d'exemple prêtes à lancer.
    await seedDefaultWorkouts(cred.user.uid).catch((e) =>
      console.warn('[GLU] Séances par défaut non créées', e)
    );
  }

  async function signOut() {
    await firebaseSignOut(auth);
  }

  return (
    <AuthContext.Provider value={{ user, profile, signIn, signUp, signOut }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé sous <AuthProvider>');
  return ctx;
}
