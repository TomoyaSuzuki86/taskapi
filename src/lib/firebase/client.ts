import { FirebaseError, getApp, getApps, initializeApp } from 'firebase/app';
import { getFirebaseConfigOrThrow } from '@/lib/firebase/config';

let firebaseInitError: FirebaseError | Error | null = null;

export function getFirebaseApp() {
  if (getApps().length > 0) {
    return getApp();
  }

  try {
    return initializeApp(getFirebaseConfigOrThrow());
  } catch (error) {
    firebaseInitError =
      error instanceof Error
        ? error
        : new Error('Unknown Firebase initialization error.');
    throw firebaseInitError;
  }
}

export function getFirebaseInitializationError() {
  return firebaseInitError;
}
