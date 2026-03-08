import { useMemo, useState } from 'react';
import type { ProjectCreateInput, ProjectUpdateInput } from '@/types/domain';
import { useDataServices } from '@/services/useDataServices';

export function useProjectActions(ownerUid: string) {
  const { projectRepository } = useDataServices();
  const [busyProjectId, setBusyProjectId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  return useMemo(
    () => ({
      busyProjectId,
      isCreating,
      errorMessage,
      createProject: async (input: ProjectCreateInput) => {
        setIsCreating(true);
        setErrorMessage(null);

        try {
          return await projectRepository.createProject(ownerUid, input);
        } catch (error) {
          setErrorMessage(toMessage(error));
          throw error;
        } finally {
          setIsCreating(false);
        }
      },
      updateProject: async (projectId: string, input: ProjectUpdateInput) => {
        setBusyProjectId(projectId);
        setErrorMessage(null);

        try {
          await projectRepository.updateProject(ownerUid, projectId, input);
        } catch (error) {
          setErrorMessage(toMessage(error));
          throw error;
        } finally {
          setBusyProjectId(null);
        }
      },
      deleteProject: async (projectId: string) => {
        setBusyProjectId(projectId);
        setErrorMessage(null);

        try {
          await projectRepository.deleteProject(ownerUid, projectId);
        } catch (error) {
          setErrorMessage(toMessage(error));
          throw error;
        } finally {
          setBusyProjectId(null);
        }
      },
      restoreProject: async (projectId: string) => {
        setBusyProjectId(projectId);
        setErrorMessage(null);

        try {
          await projectRepository.restoreProject(ownerUid, projectId);
        } catch (error) {
          setErrorMessage(toMessage(error));
          throw error;
        } finally {
          setBusyProjectId(null);
        }
      },
    }),
    [busyProjectId, errorMessage, isCreating, ownerUid, projectRepository],
  );
}

function toMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Firestore request failed.';
}
