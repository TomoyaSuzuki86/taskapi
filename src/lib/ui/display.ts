import type { HistoryEntry, TaskStatus } from '@/types/domain';

export function formatTaskStatusLabel(status: TaskStatus) {
  switch (status) {
    case 'todo':
      return '未着手';
    case 'doing':
      return '進行中';
    case 'done':
      return '完了';
  }
}

export function formatProjectStateLabel(archived: boolean) {
  return archived ? 'アーカイブ' : '進行中';
}

export function formatHistoryEntityLabel(
  entityType: HistoryEntry['entityType'],
) {
  return entityType === 'project' ? 'プロジェクト' : 'タスク';
}

export function formatHistoryActionLabel(action: HistoryEntry['action']) {
  switch (action) {
    case 'create':
      return '作成';
    case 'update':
      return '更新';
    case 'delete':
      return '削除';
    case 'restore':
      return '復元';
    case 'status_change':
      return 'ステータス変更';
  }
}

export function formatDateLabel(value: string | null | undefined) {
  if (!value) {
    return '未設定';
  }

  return new Date(value).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatDateTimeLabel(value: string) {
  return new Date(value).toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
