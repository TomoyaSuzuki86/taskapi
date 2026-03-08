import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import type { TaskCreateInput, TaskUpdateInput } from '@/types/domain';
import { getFirebaseFirestore } from '@/lib/firebase/firestore';
import type { TaskRepository } from '@/services/data-services';
import { createTaskapiWriteApi } from '@/services/taskapi-write-api';
import { mapTaskRecord } from '@/services/firestore-records';

function tasksCollectionPath(ownerUid: string, projectId: string) {
  return `users/${ownerUid}/projects/${projectId}/tasks`;
}

export function createFirestoreTaskRepository(): TaskRepository {
  const writeApi = createTaskapiWriteApi();

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
    async createTask(_ownerUid, projectId, input: TaskCreateInput) {
      const response = await writeApi.createTask({
        projectId,
        ...input,
      });
      return response.taskId;
    },
    async updateTask(_ownerUid, projectId, taskId, input: TaskUpdateInput) {
      await writeApi.updateTask({
        projectId,
        taskId,
        ...input,
      });
    },
    async deleteTask(_ownerUid, projectId, taskId) {
      await writeApi.deleteTask({ projectId, taskId });
    },
    async restoreTask(_ownerUid, projectId, taskId) {
      await writeApi.restoreTask({ projectId, taskId });
    },
  };
}
