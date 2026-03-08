import { createContext } from 'react';
import type { TaskapiUser } from '@/types/domain';

export type AuthStatus =
  | 'loading'
  | 'authenticated'
  | 'unauthenticated'
  | 'error';
export type AuthAction = 'sign_in' | 'sign_out' | null;

export type AuthContextValue = {
  status: AuthStatus;
  user: TaskapiUser | null;
  errorMessage: string | null;
  activeAction: AuthAction;
  isFirebaseConfigured: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
