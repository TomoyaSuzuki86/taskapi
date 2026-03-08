import { useEffect, useMemo, useState } from 'react';
import type { Project } from '@/types/domain';
import { useProjectActions } from '@/features/projects/useProjectActions';
import { useDataServices } from '@/services/useDataServices';

export type AsyncState = 'loading' | 'ready' | 'error';

export function useProjects(ownerUid: string) {
  const { projectRepository } = useDataServices();
  const actions = useProjectActions(ownerUid);
  const [projects, setProjects] = useState<Project[]>([]);
  const [deletedProjects, setDeletedProjects] = useState<Project[]>([]);
  const [status, setStatus] = useState<AsyncState>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setStatus('loading');

    const unsubscribe = projectRepository.subscribeProjects(
      ownerUid,
      (nextProjects) => {
        setProjects(nextProjects);
        setStatus('ready');
        setErrorMessage(null);
      },
      (error) => {
        setStatus('error');
        setErrorMessage(error.message);
      },
    );

    return unsubscribe;
  }, [ownerUid, projectRepository]);

  useEffect(() => {
    const unsubscribe = projectRepository.subscribeDeletedProjects(
      ownerUid,
      (nextProjects) => {
        setDeletedProjects(nextProjects);
      },
      (error) => {
        setErrorMessage(error.message);
      },
    );

    return unsubscribe;
  }, [ownerUid, projectRepository]);

  return useMemo(
    () => ({
      projects,
      deletedProjects,
      status,
      ...actions,
      errorMessage: errorMessage ?? actions.errorMessage,
    }),
    [actions, deletedProjects, errorMessage, projects, status],
  );
}
