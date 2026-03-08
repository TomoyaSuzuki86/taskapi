import { useEffect, useMemo, useState } from 'react';
import type { Task, TaskCreateInput, TaskUpdateInput } from '@/types/domain';
import { useDataServices } from '@/services/useDataServices';
import type { AsyncState } from '@/features/projects/useProjects';

export function useTasks(ownerUid: string, projectId: string) {
  const { taskRepository } = useDataServices();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [deletedTasks, setDeletedTasks] = useState<Task[]>([]);
  const [status, setStatus] = useState<AsyncState>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    setStatus('loading');

    const unsubscribe = taskRepository.subscribeTasks(
      ownerUid,
      projectId,
      (nextTasks) => {
        setTasks(nextTasks);
        setStatus('ready');
        setErrorMessage(null);
      },
      (error) => {
        setStatus('error');
        setErrorMessage(error.message);
      },
    );

    return unsubscribe;
  }, [ownerUid, projectId, taskRepository]);

  useEffect(() => {
    const unsubscribe = taskRepository.subscribeDeletedTasks(
      ownerUid,
      projectId,
      (nextTasks) => {
        setDeletedTasks(nextTasks);
      },
      (error) => {
        setErrorMessage(error.message);
      },
    );

    return unsubscribe;
  }, [ownerUid, projectId, taskRepository]);

  return useMemo(
    () => ({
      tasks,
      deletedTasks,
      status,
      errorMessage,
      isCreating,
      busyTaskId,
      createTask: async (input: TaskCreateInput) => {
        setIsCreating(true);
        setErrorMessage(null);

        try {
          return await taskRepository.createTask(ownerUid, projectId, input);
        } catch (error) {
          setErrorMessage(toMessage(error));
          throw error;
        } finally {
          setIsCreating(false);
        }
      },
      updateTask: async (taskId: string, input: TaskUpdateInput) => {
        setBusyTaskId(taskId);
        setErrorMessage(null);

        try {
          await taskRepository.updateTask(ownerUid, projectId, taskId, input);
        } catch (error) {
          setErrorMessage(toMessage(error));
          throw error;
        } finally {
          setBusyTaskId(null);
        }
      },
      deleteTask: async (taskId: string) => {
        setBusyTaskId(taskId);
        setErrorMessage(null);

        try {
          await taskRepository.deleteTask(ownerUid, projectId, taskId);
        } catch (error) {
          setErrorMessage(toMessage(error));
          throw error;
        } finally {
          setBusyTaskId(null);
        }
      },
      restoreTask: async (taskId: string) => {
        setBusyTaskId(taskId);
        setErrorMessage(null);

        try {
          await taskRepository.restoreTask(ownerUid, projectId, taskId);
        } catch (error) {
          setErrorMessage(toMessage(error));
          throw error;
        } finally {
          setBusyTaskId(null);
        }
      },
    }),
    [
      busyTaskId,
      deletedTasks,
      errorMessage,
      isCreating,
      ownerUid,
      projectId,
      taskRepository,
      tasks,
      status,
    ],
  );
}

function toMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Firestore request failed.';
}
