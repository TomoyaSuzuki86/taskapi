export const STORAGE_PROJECT_ID = '__taskapi_storage__';

export function isStorageProject(projectId: string) {
  return projectId === STORAGE_PROJECT_ID;
}
