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

export function historyDocumentPath(uid: string, historyEntryId: string) {
  return `users/${uid}/history/${historyEntryId}`;
}
