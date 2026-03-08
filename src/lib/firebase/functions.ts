import { getFunctions } from 'firebase/functions';
import { getFirebaseApp } from '@/lib/firebase/client';

const defaultFunctionsRegion = 'us-central1';

export function getFirebaseFunctions() {
  return getFunctions(
    getFirebaseApp(),
    import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION?.trim() ||
      defaultFunctionsRegion,
  );
}
