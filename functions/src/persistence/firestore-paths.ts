export function projectDocumentPath(uid: string, projectId: string) {
  return `users/${uid}/projects/${projectId}`;
}

export function projectsCollectionPath(uid: string) {
  return `users/${uid}/projects`;
}

export function taskDocumentPath(
  uid: string,
  projectId: string,
  taskId: string,
) {
  return `users/${uid}/projects/${projectId}/tasks/${taskId}`;
}

export function tasksCollectionPath(uid: string, projectId: string) {
  return `users/${uid}/projects/${projectId}/tasks`;
}

export function historyCollectionPath(uid: string) {
  return `users/${uid}/history`;
}

export function historyDocumentPath(uid: string, historyId: string) {
  return `users/${uid}/history/${historyId}`;
}
