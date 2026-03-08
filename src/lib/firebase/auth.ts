import {
  browserLocalPersistence,
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type Auth,
  type User,
} from 'firebase/auth';
import type { TaskapiUser } from '@/types/domain';
import { getFirebaseApp } from '@/lib/firebase/client';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

let persistencePromise: Promise<void> | null = null;

export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}

export async function ensureAuthPersistence() {
  if (!persistencePromise) {
    persistencePromise = setPersistence(
      getFirebaseAuth(),
      browserLocalPersistence,
    );
  }

  return persistencePromise;
}

export async function resolveRedirectSignIn() {
  return getRedirectResult(getFirebaseAuth());
}

export function subscribeToAuthState(
  onUserChanged: (user: TaskapiUser | null) => void,
  onError: (error: Error) => void,
) {
  return onAuthStateChanged(
    getFirebaseAuth(),
    (user) => onUserChanged(mapFirebaseUser(user)),
    onError,
  );
}

export async function signInWithGoogle() {
  await ensureAuthPersistence();

  try {
    await signInWithPopup(getFirebaseAuth(), googleProvider);
  } catch (error) {
    if (shouldFallbackToRedirect(error)) {
      await signInWithRedirect(getFirebaseAuth(), googleProvider);
      return;
    }

    throw error;
  }
}

export async function signOutFromGoogle() {
  await signOut(getFirebaseAuth());
}

export function getAuthErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return 'Authentication failed for an unknown reason.';
  }

  const code = 'code' in error ? String(error.code) : '';

  if (code === 'auth/popup-closed-by-user') {
    return 'Google sign-in was canceled before completion.';
  }

  if (code === 'auth/network-request-failed') {
    return 'Network connection failed during sign-in. Check connectivity and try again.';
  }

  if (code === 'auth/unauthorized-domain') {
    return 'This domain is not authorized for Firebase Authentication. Check Firebase Auth settings.';
  }

  if (code === 'auth/operation-not-allowed') {
    return 'Google sign-in is not enabled for this Firebase project.';
  }

  return error.message || 'Authentication failed. Please try again.';
}

function mapFirebaseUser(user: User | null): TaskapiUser | null {
  if (!user) {
    return null;
  }

  return {
    uid: user.uid,
    email: user.email ?? '',
    displayName: user.displayName,
  };
}

function shouldFallbackToRedirect(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const code = 'code' in error ? String(error.code) : '';

  return (
    code === 'auth/popup-blocked' ||
    code === 'auth/cancelled-popup-request' ||
    code === 'auth/operation-not-supported-in-this-environment'
  );
}
