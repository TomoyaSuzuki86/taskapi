export const STORAGE_PROJECT_ID = '__taskapi_storage__';
export const STORAGE_PROJECT_NAME = '__storage__';

type StorageProjectRecord<TTimestamp> = {
  id: string;
  ownerUid: string;
  name: string;
  description: null;
  archived: false;
  deletedAt: null;
  createdAt: TTimestamp;
  updatedAt: TTimestamp;
  system: true;
};

export function isStorageProject(projectId: string) {
  return projectId === STORAGE_PROJECT_ID;
}

export function buildStorageProjectRecord<TTimestamp>(
  uid: string,
  timestamp: TTimestamp,
): StorageProjectRecord<TTimestamp> {
  return {
    id: STORAGE_PROJECT_ID,
    ownerUid: uid,
    name: STORAGE_PROJECT_NAME,
    description: null,
    archived: false,
    deletedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    system: true,
  };
}

export function buildStorageProjectRestorePatch<TTimestamp>(
  timestamp: TTimestamp,
) {
  return {
    deletedAt: null,
    archived: false,
    updatedAt: timestamp,
  };
}
