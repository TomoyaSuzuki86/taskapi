import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export function getAdminFirestore() {
  if (getApps().length === 0) {
    initializeApp();
  }

  return getFirestore();
}
