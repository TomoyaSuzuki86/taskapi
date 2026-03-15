import * as taskapiMutationUseCasesNamespace from '../../functions/src/application/taskapi-mutation-use-cases';
import * as taskapiQueryServiceNamespace from '../../functions/src/application/taskapi-query-service';
import { getAdminFirestore } from '../api/firebase-admin';
import { resolveTaskapiMcpUid } from './taskapi-mcp-config';
import { createTaskapiMcpServer } from './taskapi-mcp-server';

const taskapiMutationUseCasesModule =
  'default' in taskapiMutationUseCasesNamespace &&
  taskapiMutationUseCasesNamespace.default &&
  typeof taskapiMutationUseCasesNamespace.default === 'object'
    ? taskapiMutationUseCasesNamespace.default
    : taskapiMutationUseCasesNamespace;

const taskapiQueryServiceModule =
  'default' in taskapiQueryServiceNamespace &&
  taskapiQueryServiceNamespace.default &&
  typeof taskapiQueryServiceNamespace.default === 'object'
    ? taskapiQueryServiceNamespace.default
    : taskapiQueryServiceNamespace;

const { TaskapiMutationUseCases } = taskapiMutationUseCasesModule as {
  TaskapiMutationUseCases: typeof import('../../functions/src/application/taskapi-mutation-use-cases').TaskapiMutationUseCases;
};

const { TaskapiQueryService } = taskapiQueryServiceModule as {
  TaskapiQueryService: typeof import('../../functions/src/application/taskapi-query-service').TaskapiQueryService;
};

export function createTaskapiMcpRuntime(env: NodeJS.ProcessEnv = process.env) {
  return createTaskapiMcpRuntimeForUid(resolveTaskapiMcpUid(env));
}

export function createTaskapiMcpRuntimeForUid(uid: string) {
  const firestore = getAdminFirestore();

  return createTaskapiMcpServer({
    uid,
    mutationUseCases: new TaskapiMutationUseCases(firestore),
    queryService: new TaskapiQueryService(firestore),
  });
}
