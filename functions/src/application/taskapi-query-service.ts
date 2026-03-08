import type { Firestore } from 'firebase-admin/firestore';
import type {
  MutationResult,
  GetProjectQueryResult,
  ListDeletedProjectsQueryResult,
  ListDeletedTasksQueryResult,
  ListHistoryQueryResult,
  ListProjectsQueryResult,
  ListTasksQueryResult,
} from '../domain/taskapi-contracts';
import { success, toFailureResult } from '../domain/taskapi-contracts';
import {
  historyCollectionPath,
  projectDocumentPath,
  projectsCollectionPath,
  tasksCollectionPath,
} from '../persistence/firestore-paths';
import {
  mapHistoryRecord,
  mapProjectRecord,
  mapTaskRecord,
} from '../persistence/firestore-records';

export class TaskapiQueryService {
  constructor(private readonly firestore: Firestore) {}

  async listProjects(uid: string): Promise<ListProjectsQueryResult> {
    return this.execute(async () => {
      const snapshot = await this.firestore
        .collection(projectsCollectionPath(uid))
        .orderBy('updatedAt', 'desc')
        .get();

      const projects = snapshot.docs
        .map((projectDocument) => mapProjectRecord(projectDocument.data()))
        .filter((project) => project.deletedAt === null);

      return success({ projects });
    });
  }

  async getProject(
    uid: string,
    projectId: string,
  ): Promise<GetProjectQueryResult> {
    return this.execute(async () => {
      const snapshot = await this.firestore
        .doc(projectDocumentPath(uid, projectId))
        .get();

      if (!snapshot.exists) {
        return success({ project: null });
      }

      const project = mapProjectRecord(snapshot.data() ?? {});
      return success({ project: project.deletedAt ? null : project });
    });
  }

  async listTasks(
    uid: string,
    projectId: string,
  ): Promise<ListTasksQueryResult> {
    return this.execute(async () => {
      const snapshot = await this.firestore
        .collection(tasksCollectionPath(uid, projectId))
        .orderBy('updatedAt', 'desc')
        .get();

      const tasks = snapshot.docs
        .map((taskDocument) => mapTaskRecord(taskDocument.data()))
        .filter((task) => task.deletedAt === null);

      return success({ tasks });
    });
  }

  async listDeletedProjects(
    uid: string,
  ): Promise<ListDeletedProjectsQueryResult> {
    return this.execute(async () => {
      const snapshot = await this.firestore
        .collection(projectsCollectionPath(uid))
        .orderBy('updatedAt', 'desc')
        .get();

      const projects = snapshot.docs
        .map((projectDocument) => mapProjectRecord(projectDocument.data()))
        .filter((project) => project.deletedAt !== null);

      return success({ projects });
    });
  }

  async listDeletedTasks(
    uid: string,
    projectId: string,
  ): Promise<ListDeletedTasksQueryResult> {
    return this.execute(async () => {
      const snapshot = await this.firestore
        .collection(tasksCollectionPath(uid, projectId))
        .orderBy('updatedAt', 'desc')
        .get();

      const tasks = snapshot.docs
        .map((taskDocument) => mapTaskRecord(taskDocument.data()))
        .filter((task) => task.deletedAt !== null);

      return success({ tasks });
    });
  }

  async listHistory(uid: string): Promise<ListHistoryQueryResult> {
    return this.execute(async () => {
      const snapshot = await this.firestore
        .collection(historyCollectionPath(uid))
        .orderBy('createdAt', 'desc')
        .get();

      const entries = snapshot.docs.map((historyDocument) =>
        mapHistoryRecord(historyDocument.data()),
      );

      return success({ entries });
    });
  }

  private async execute<T>(
    run: () => Promise<MutationResult<T>>,
  ): Promise<MutationResult<T>> {
    try {
      return await run();
    } catch (error) {
      return toFailureResult<T>(error, 'The query failed unexpectedly.');
    }
  }
}
