import { useEffect, useMemo, useState } from 'react';
import type { Project } from '@/types/domain';
import { useDataServices } from '@/services/useDataServices';

export type RecordState = 'loading' | 'ready' | 'missing' | 'error';

export function useProject(ownerUid: string, projectId: string) {
  const { projectRepository } = useDataServices();
  const [project, setProject] = useState<Project | null>(null);
  const [status, setStatus] = useState<RecordState>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setStatus('loading');

    const unsubscribe = projectRepository.subscribeProject(
      ownerUid,
      projectId,
      (nextProject) => {
        setProject(nextProject);
        setStatus(nextProject ? 'ready' : 'missing');
        setErrorMessage(null);
      },
      (error) => {
        setStatus('error');
        setErrorMessage(error.message);
      },
    );

    return unsubscribe;
  }, [ownerUid, projectId, projectRepository]);

  return useMemo(
    () => ({
      project,
      status,
      errorMessage,
    }),
    [errorMessage, project, status],
  );
}
