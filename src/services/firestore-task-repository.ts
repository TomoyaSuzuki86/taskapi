import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  writeBatch,
} from 'firebase/firestore';
import type { TaskCreateInput, TaskUpdateInput } from '@/types/domain';
import { getFirebaseFirestore } from '@/lib/firebase/firestore';
import type { TaskRepository } from '@/services/data-services';
import {
  buildTaskCreateRecord,
  buildTaskDeleteRecord,
  buildTaskRestoreRecord,
  buildTaskUpdateRecord,
  buildHistoryRecord,
  mapProjectRecord,
  mapTaskRecord,
} from '@/services/firestore-records';

function tasksCollectionPath(ownerUid: string, projectId: string) {
  return `users/${ownerUid}/projects/${projectId}/tasks`;
}

function taskDocumentPath(ownerUid: string, projectId: string, taskId: string) {
  return `users/${ownerUid}/projects/${projectId}/tasks/${taskId}`;
}

function projectDocumentPath(ownerUid: string, projectId: string) {
  return `users/${ownerUid}/projects/${projectId}`;
}

function historyCollectionPath(ownerUid: string) {
  return `users/${ownerUid}/history`;
}

export function createFirestoreTaskRepository(): TaskRepository {
  return {
    subscribeTasks(ownerUid, projectId, onNext, onError) {
      const firestore = getFirebaseFirestore();
      const collectionRef = collection(
        firestore,
        tasksCollectionPath(ownerUid, projectId),
      );
      const tasksQuery = query(collectionRef, orderBy('updatedAt', 'desc'));

      return onSnapshot(
        tasksQuery,
        (snapshot) => {
          const tasks = snapshot.docs
            .map((taskDocument) =>
              mapTaskRecord(
                taskDocument.data({
                  serverTimestamps: 'estimate',
                }) as Parameters<typeof mapTaskRecord>[0],
              ),
            )
            .filter((task) => task.deletedAt === null);

          onNext(tasks);
        },
        onError,
      );
    },
    subscribeDeletedTasks(ownerUid, projectId, onNext, onError) {
      const firestore = getFirebaseFirestore();
      const collectionRef = collection(
        firestore,
        tasksCollectionPath(ownerUid, projectId),
      );
      const tasksQuery = query(collectionRef, orderBy('updatedAt', 'desc'));

      return onSnapshot(
        tasksQuery,
        (snapshot) => {
          const tasks = snapshot.docs
            .map((taskDocument) =>
              mapTaskRecord(
                taskDocument.data({
                  serverTimestamps: 'estimate',
                }) as Parameters<typeof mapTaskRecord>[0],
              ),
            )
            .filter((task) => task.deletedAt !== null);

          onNext(tasks);
        },
        onError,
      );
    },
    async createTask(ownerUid, projectId, input: TaskCreateInput) {
      const firestore = getFirebaseFirestore();
      const taskRef = doc(
        collection(firestore, tasksCollectionPath(ownerUid, projectId)),
      );
      const historyRef = doc(
        collection(firestore, historyCollectionPath(ownerUid)),
      );
      const batch = writeBatch(firestore);

      batch.set(
        taskRef,
        buildTaskCreateRecord(ownerUid, projectId, taskRef.id, input),
      );
      batch.set(
        historyRef,
        buildHistoryRecord(
          historyRef.id,
          'create',
          input.title.trim(),
          'task',
          taskRef.id,
          projectId,
        ),
      );

      await batch.commit();
      return taskRef.id;
    },
    async updateTask(ownerUid, projectId, taskId, input: TaskUpdateInput) {
      const firestore = getFirebaseFirestore();
      const taskRef = doc(
        firestore,
        taskDocumentPath(ownerUid, projectId, taskId),
      );
      const taskSnapshot = await getDoc(taskRef);

      if (!taskSnapshot.exists()) {
        throw new Error(
          'Task could not be updated because it no longer exists.',
        );
      }

      const previousTask = mapTaskRecord(
        taskSnapshot.data({
          serverTimestamps: 'estimate',
        }) as Parameters<typeof mapTaskRecord>[0],
      );
      const historyRef = doc(
        collection(firestore, historyCollectionPath(ownerUid)),
      );
      const batch = writeBatch(firestore);

      batch.update(taskRef, buildTaskUpdateRecord(input));
      batch.set(
        historyRef,
        buildHistoryRecord(
          historyRef.id,
          'update',
          input.title.trim(),
          'task',
          taskId,
          projectId,
        ),
      );

      if (previousTask.status !== input.status) {
        const statusHistoryRef = doc(
          collection(firestore, historyCollectionPath(ownerUid)),
        );
        batch.set(
          statusHistoryRef,
          buildHistoryRecord(
            statusHistoryRef.id,
            'status_change',
            `${input.title.trim()} -> ${input.status}`,
            'task',
            taskId,
            projectId,
          ),
        );
      }

      await batch.commit();
    },
    async deleteTask(ownerUid, projectId, taskId) {
      const firestore = getFirebaseFirestore();
      const taskRef = doc(
        firestore,
        taskDocumentPath(ownerUid, projectId, taskId),
      );
      const taskSnapshot = await getDoc(taskRef);

      if (!taskSnapshot.exists()) {
        throw new Error(
          'Task could not be deleted because it no longer exists.',
        );
      }

      const task = mapTaskRecord(
        taskSnapshot.data({
          serverTimestamps: 'estimate',
        }) as Parameters<typeof mapTaskRecord>[0],
      );
      const historyRef = doc(
        collection(firestore, historyCollectionPath(ownerUid)),
      );
      const batch = writeBatch(firestore);

      batch.update(taskRef, buildTaskDeleteRecord());
      batch.set(
        historyRef,
        buildHistoryRecord(
          historyRef.id,
          'delete',
          task.title,
          'task',
          taskId,
          projectId,
        ),
      );

      await batch.commit();
    },
    async restoreTask(ownerUid, projectId, taskId) {
      const firestore = getFirebaseFirestore();
      const projectRef = doc(
        firestore,
        projectDocumentPath(ownerUid, projectId),
      );
      const taskRef = doc(
        firestore,
        taskDocumentPath(ownerUid, projectId, taskId),
      );
      const [projectSnapshot, taskSnapshot] = await Promise.all([
        getDoc(projectRef),
        getDoc(taskRef),
      ]);

      if (!projectSnapshot.exists()) {
        throw new Error('Parent project no longer exists.');
      }

      const project = mapProjectRecord(
        projectSnapshot.data({
          serverTimestamps: 'estimate',
        }) as Parameters<typeof mapProjectRecord>[0],
      );

      if (project.deletedAt) {
        throw new Error(
          'Restore the parent project before restoring its tasks.',
        );
      }

      if (!taskSnapshot.exists()) {
        throw new Error(
          'Task could not be restored because it no longer exists.',
        );
      }

      const task = mapTaskRecord(
        taskSnapshot.data({
          serverTimestamps: 'estimate',
        }) as Parameters<typeof mapTaskRecord>[0],
      );
      const historyRef = doc(
        collection(firestore, historyCollectionPath(ownerUid)),
      );
      const batch = writeBatch(firestore);

      batch.update(taskRef, buildTaskRestoreRecord());
      batch.set(
        historyRef,
        buildHistoryRecord(
          historyRef.id,
          'restore',
          task.title,
          'task',
          taskId,
          projectId,
        ),
      );

      await batch.commit();
    },
  };
}
