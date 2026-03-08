import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { getFirebaseFirestore } from '@/lib/firebase/firestore';
import type { HistoryRepository } from '@/services/data-services';
import { mapHistoryRecord } from '@/services/firestore-records';

function historyCollectionPath(ownerUid: string) {
  return `users/${ownerUid}/history`;
}

export function createFirestoreHistoryRepository(): HistoryRepository {
  return {
    subscribeHistory(ownerUid, onNext, onError) {
      const firestore = getFirebaseFirestore();
      const historyRef = collection(firestore, historyCollectionPath(ownerUid));
      const historyQuery = query(historyRef, orderBy('createdAt', 'desc'));

      return onSnapshot(
        historyQuery,
        (snapshot) => {
          const entries = snapshot.docs.map((historyDocument) =>
            mapHistoryRecord(
              historyDocument.data({
                serverTimestamps: 'estimate',
              }) as Parameters<typeof mapHistoryRecord>[0],
            ),
          );

          onNext(entries);
        },
        onError,
      );
    },
  };
}
