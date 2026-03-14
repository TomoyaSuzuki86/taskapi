import { useEffect, useMemo, useState } from 'react';
import type { Task } from '@/types/domain';
import type { AsyncState } from '@/features/projects/useProjects';
import { useDataServices } from '@/services/useDataServices';

export function useOwnedTasks(ownerUid: string, projectIds: string[]) {
  const { taskRepository } = useDataServices();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [status, setStatus] = useState<AsyncState>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const projectIdsKey = useMemo(
    () => [...projectIds].sort().join('|'),
    [projectIds],
  );

  useEffect(() => {
    const sortedProjectIds = [...projectIds].sort();

    if (sortedProjectIds.length === 0) {
      setTasks([]);
      setStatus('ready');
      setErrorMessage(null);
      return () => undefined;
    }

    setStatus('loading');
    setErrorMessage(null);

    const tasksByProjectId = new Map<string, Task[]>();
    const initializedProjectIds = new Set<string>();

    const updateTasks = () => {
      const nextTasks = sortedProjectIds.flatMap(
        (projectId) => tasksByProjectId.get(projectId) ?? [],
      );
      setTasks(nextTasks);
      if (initializedProjectIds.size === sortedProjectIds.length) {
        setStatus('ready');
      }
    };

    const unsubscribeList = sortedProjectIds.map((projectId) =>
      taskRepository.subscribeTasks(
        ownerUid,
        projectId,
        (nextTasks) => {
          tasksByProjectId.set(projectId, nextTasks);
          initializedProjectIds.add(projectId);
          updateTasks();
        },
        (error) => {
          setStatus('error');
          setErrorMessage(error.message);
        },
      ),
    );

    return () => {
      unsubscribeList.forEach((unsubscribe) => unsubscribe());
    };
  }, [ownerUid, projectIds, projectIdsKey, taskRepository]);

  return useMemo(
    () => ({
      tasks,
      status,
      errorMessage,
    }),
    [errorMessage, status, tasks],
  );
}
