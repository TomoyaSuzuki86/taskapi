import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, connectAuthEmulator } from 'firebase/auth';
import {
  connectFunctionsEmulator,
  getFunctions,
  httpsCallable,
} from 'firebase/functions';

const app = initializeApp({
  apiKey: 'demo-api-key',
  authDomain: 'taskapi-489600.firebaseapp.com',
  projectId: 'taskapi-489600',
  appId: '1:638721477912:web:smoke-validation',
});

const auth = getAuth(app);
connectAuthEmulator(auth, 'http://127.0.0.1:9099', {
  disableWarnings: true,
});

await signInAnonymously(auth);

const functions = getFunctions(app, 'us-central1');
connectFunctionsEmulator(functions, '127.0.0.1', 5001);

async function call(name, payload) {
  const callable = httpsCallable(functions, name);
  const result = await callable(payload);
  return result.data;
}

const projectResult = await call('createProject', {
  name: 'Emulator Smoke Project',
  description: 'Pre-feature smoke validation',
});

assertSuccess(projectResult, 'createProject');
const projectId = projectResult.data.projectId;

const taskResult = await call('createTask', {
  projectId,
  title: 'Emulator Smoke Task',
  notes: 'Created by smoke validation',
  status: 'todo',
  dueDate: '',
});

assertSuccess(taskResult, 'createTask');
const taskId = taskResult.data.taskId;

const deleteResult = await call('deleteTask', {
  projectId,
  taskId,
});
assertSuccess(deleteResult, 'deleteTask');

const restoreResult = await call('restoreTask', {
  projectId,
  taskId,
});
assertSuccess(restoreResult, 'restoreTask');

const historyResult = await call('listHistory', {});
assertSuccess(historyResult, 'listHistory');

const relevantEntries = historyResult.data.entries.filter(
  (entry) => entry.projectId === projectId || entry.entityId === taskId,
);

const requiredActions = ['create', 'delete', 'restore'];
for (const action of requiredActions) {
  if (!relevantEntries.some((entry) => entry.action === action)) {
    throw new Error(`Smoke validation missing history action: ${action}`);
  }
}

console.log(
  JSON.stringify(
    {
      smoke: 'ok',
      uid: auth.currentUser?.uid ?? null,
      projectId,
      taskId,
      historyActions: relevantEntries.map((entry) => entry.action),
    },
    null,
    2,
  ),
);

function assertSuccess(result, name) {
  if (!result?.ok) {
    throw new Error(`${name} failed: ${JSON.stringify(result)}`);
  }
}
