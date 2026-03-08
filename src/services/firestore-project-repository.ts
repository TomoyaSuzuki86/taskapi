import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import type { ProjectCreateInput, ProjectUpdateInput } from '@/types/domain';
import { getFirebaseFirestore } from '@/lib/firebase/firestore';
import type { ProjectRepository } from '@/services/data-services';
import { createTaskapiWriteApi } from '@/services/taskapi-write-api';
import { mapProjectRecord } from '@/services/firestore-records';

function projectsCollectionPath(ownerUid: string) {
  return `users/${ownerUid}/projects`;
}

function projectDocumentPath(ownerUid: string, projectId: string) {
  return `users/${ownerUid}/projects/${projectId}`;
}

export function createFirestoreProjectRepository(): ProjectRepository {
  const writeApi = createTaskapiWriteApi();

  return {
    subscribeProjects(ownerUid, onNext, onError) {
      const firestore = getFirebaseFirestore();
      const collectionRef = collection(
        firestore,
        projectsCollectionPath(ownerUid),
      );
      const projectsQuery = query(collectionRef, orderBy('updatedAt', 'desc'));

      return onSnapshot(
        projectsQuery,
        (snapshot) => {
          const projects = snapshot.docs
            .map((projectDocument) =>
              mapProjectRecord(
                projectDocument.data({
                  serverTimestamps: 'estimate',
                }) as Parameters<typeof mapProjectRecord>[0],
              ),
            )
            .filter((project) => project.deletedAt === null);

          onNext(projects);
        },
        onError,
      );
    },
    subscribeDeletedProjects(ownerUid, onNext, onError) {
      const firestore = getFirebaseFirestore();
      const collectionRef = collection(
        firestore,
        projectsCollectionPath(ownerUid),
      );
      const projectsQuery = query(collectionRef, orderBy('updatedAt', 'desc'));

      return onSnapshot(
        projectsQuery,
        (snapshot) => {
          const projects = snapshot.docs
            .map((projectDocument) =>
              mapProjectRecord(
                projectDocument.data({
                  serverTimestamps: 'estimate',
                }) as Parameters<typeof mapProjectRecord>[0],
              ),
            )
            .filter((project) => project.deletedAt !== null);

          onNext(projects);
        },
        onError,
      );
    },
    subscribeProject(ownerUid, projectId, onNext, onError) {
      const firestore = getFirebaseFirestore();
      const projectRef = doc(
        firestore,
        projectDocumentPath(ownerUid, projectId),
      );

      return onSnapshot(
        projectRef,
        (snapshot) => {
          if (!snapshot.exists()) {
            onNext(null);
            return;
          }

          const project = mapProjectRecord(
            snapshot.data({
              serverTimestamps: 'estimate',
            }) as Parameters<typeof mapProjectRecord>[0],
          );
          onNext(project.deletedAt ? null : project);
        },
        onError,
      );
    },
    async createProject(_ownerUid, input: ProjectCreateInput) {
      const response = await writeApi.createProject(input);
      return response.projectId;
    },
    async updateProject(_ownerUid, projectId, input: ProjectUpdateInput) {
      await writeApi.updateProject({
        projectId,
        ...input,
      });
    },
    async deleteProject(_ownerUid, projectId) {
      await writeApi.deleteProject({ projectId });
    },
    async restoreProject(_ownerUid, projectId) {
      await writeApi.restoreProject({ projectId });
    },
  };
}
