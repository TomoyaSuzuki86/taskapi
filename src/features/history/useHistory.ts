import { useEffect, useMemo, useState } from 'react';
import type { HistoryEntry } from '@/types/domain';
import { useDataServices } from '@/services/useDataServices';
import type { AsyncState } from '@/features/projects/useProjects';

export function useHistory(ownerUid: string) {
  const { historyRepository } = useDataServices();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [status, setStatus] = useState<AsyncState>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setStatus('loading');

    const unsubscribe = historyRepository.subscribeHistory(
      ownerUid,
      (nextEntries) => {
        setEntries(nextEntries);
        setStatus('ready');
        setErrorMessage(null);
      },
      (error) => {
        setStatus('error');
        setErrorMessage(error.message);
      },
    );

    return unsubscribe;
  }, [historyRepository, ownerUid]);

  return useMemo(
    () => ({
      entries,
      status,
      errorMessage,
    }),
    [entries, errorMessage, status],
  );
}
