import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  writeBatch,
} from 'firebase/firestore';
import type { ProjectCreateInput, ProjectUpdateInput } from '@/types/domain';
import { getFirebaseFirestore } from '@/lib/firebase/firestore';
import type { ProjectRepository } from '@/services/data-services';
import {
  buildProjectCreateRecord,
  buildProjectDeleteRecord,
  buildProjectRestoreRecord,
  buildProjectUpdateRecord,
  buildTaskDeleteRecord,
  buildHistoryRecord,
  mapProjectRecord,
  mapTaskRecord,
} from '@/services/firestore-records';

function projectsCollectionPath(ownerUid: string) {
  return `users/${ownerUid}/projects`;
}

function projectDocumentPath(ownerUid: string, projectId: string) {
  return `users/${ownerUid}/projects/${projectId}`;
}

function tasksCollectionPath(ownerUid: string, projectId: string) {
  return `users/${ownerUid}/projects/${projectId}/tasks`;
}

function historyCollectionPath(ownerUid: string) {
  return `users/${ownerUid}/history`;
}

export function createFirestoreProjectRepository(): ProjectRepository {
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
    async createProject(ownerUid, input: ProjectCreateInput) {
      const firestore = getFirebaseFirestore();
      const projectRef = doc(
        collection(firestore, projectsCollectionPath(ownerUid)),
      );
      const historyRef = doc(
        collection(firestore, historyCollectionPath(ownerUid)),
      );
      const batch = writeBatch(firestore);

      batch.set(
        projectRef,
        buildProjectCreateRecord(ownerUid, projectRef.id, input),
      );
      batch.set(
        historyRef,
        buildHistoryRecord(
          historyRef.id,
          'create',
          input.name.trim(),
          'project',
          projectRef.id,
          projectRef.id,
        ),
      );

      await batch.commit();

      return projectRef.id;
    },
    async updateProject(ownerUid, projectId, input: ProjectUpdateInput) {
      const firestore = getFirebaseFirestore();
      const projectRef = doc(
        firestore,
        projectDocumentPath(ownerUid, projectId),
      );
      const historyRef = doc(
        collection(firestore, historyCollectionPath(ownerUid)),
      );
      const batch = writeBatch(firestore);

      batch.update(projectRef, buildProjectUpdateRecord(input));
      batch.set(
        historyRef,
        buildHistoryRecord(
          historyRef.id,
          'update',
          input.name.trim(),
          'project',
          projectId,
          projectId,
        ),
      );

      await batch.commit();
    },
    async deleteProject(ownerUid, projectId) {
      const firestore = getFirebaseFirestore();
      const batch = writeBatch(firestore);
      const projectRef = doc(
        firestore,
        projectDocumentPath(ownerUid, projectId),
      );
      const projectSnapshot = await getDoc(projectRef);
      const project = projectSnapshot.exists()
        ? mapProjectRecord(
            projectSnapshot.data({
              serverTimestamps: 'estimate',
            }) as Parameters<typeof mapProjectRecord>[0],
          )
        : null;
      const tasksRef = collection(
        firestore,
        tasksCollectionPath(ownerUid, projectId),
      );
      const tasksSnapshot = await getDocs(tasksRef);

      tasksSnapshot.docs.forEach((taskDocument) => {
        const task = mapTaskRecord(
          taskDocument.data({
            serverTimestamps: 'estimate',
          }) as Parameters<typeof mapTaskRecord>[0],
        );

        if (task.deletedAt) {
          return;
        }

        batch.update(taskDocument.ref, buildTaskDeleteRecord());
        const taskHistoryRef = doc(
          collection(firestore, historyCollectionPath(ownerUid)),
        );
        batch.set(
          taskHistoryRef,
          buildHistoryRecord(
            taskHistoryRef.id,
            'delete',
            task.title,
            'task',
            task.id,
            projectId,
          ),
        );
      });

      batch.update(projectRef, buildProjectDeleteRecord());
      const projectHistoryRef = doc(
        collection(firestore, historyCollectionPath(ownerUid)),
      );
      batch.set(
        projectHistoryRef,
        buildHistoryRecord(
          projectHistoryRef.id,
          'delete',
          project?.name ?? projectId,
          'project',
          projectId,
          projectId,
        ),
      );

      await batch.commit();
    },
    async restoreProject(ownerUid, projectId) {
      const firestore = getFirebaseFirestore();
      const projectRef = doc(
        firestore,
        projectDocumentPath(ownerUid, projectId),
      );
      const projectSnapshot = await getDoc(projectRef);

      if (!projectSnapshot.exists()) {
        throw new Error(
          'Project could not be restored because it no longer exists.',
        );
      }

      const project = mapProjectRecord(
        projectSnapshot.data({
          serverTimestamps: 'estimate',
        }) as Parameters<typeof mapProjectRecord>[0],
      );
      const historyRef = doc(
        collection(firestore, historyCollectionPath(ownerUid)),
      );
      const batch = writeBatch(firestore);

      batch.update(projectRef, buildProjectRestoreRecord());
      batch.set(
        historyRef,
        buildHistoryRecord(
          historyRef.id,
          'restore',
          project.name,
          'project',
          project.id,
          project.id,
        ),
      );

      await batch.commit();
    },
  };
}
