import { describe, expect, it } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import {
  buildHistoryRecord,
  buildTaskUpdateRecord,
  mapHistoryRecord,
  mapProjectRecord,
  mapTaskRecord,
} from '@/services/firestore-records';

describe('firestore record helpers', () => {
  it('maps project records from Firestore data', () => {
    const project = mapProjectRecord({
      id: 'proj-1',
      ownerUid: 'user-1',
      name: 'Project one',
      description: null,
      archived: true,
      deletedAt: null,
      createdAt: Timestamp.fromDate(new Date('2026-03-10T00:00:00.000Z')),
      updatedAt: Timestamp.fromDate(new Date('2026-03-11T00:00:00.000Z')),
    });

    expect(project).toMatchObject({
      id: 'proj-1',
      archived: true,
      description: null,
    });
    expect(project.createdAt).toBe('2026-03-10T00:00:00.000Z');
  });

  it('maps task records from Firestore data', () => {
    const task = mapTaskRecord({
      id: 'task-1',
      ownerUid: 'user-1',
      projectId: 'proj-1',
      title: 'Task one',
      notes: 'Example notes',
      status: 'doing',
      dueDate: Timestamp.fromDate(new Date('2026-03-20T00:00:00.000Z')),
      completedAt: null,
      deletedAt: null,
      createdAt: Timestamp.fromDate(new Date('2026-03-10T00:00:00.000Z')),
      updatedAt: Timestamp.fromDate(new Date('2026-03-11T00:00:00.000Z')),
    });

    expect(task).toMatchObject({
      id: 'task-1',
      status: 'doing',
      notes: 'Example notes',
    });
    expect(task.dueDate).toBe('2026-03-20T00:00:00.000Z');
  });

  it('clears completedAt when a task is moved out of done', () => {
    const patch = buildTaskUpdateRecord({
      title: 'Task one',
      notes: '',
      status: 'todo',
      dueDate: '',
    });

    expect(patch.completedAt).toBeNull();
  });

  it('maps history records from Firestore data', () => {
    const entry = mapHistoryRecord({
      id: 'history-1',
      entityType: 'task',
      entityId: 'task-1',
      projectId: 'proj-1',
      action: 'restore',
      title: 'Task one',
      createdAt: Timestamp.fromDate(new Date('2026-03-12T00:00:00.000Z')),
    });

    expect(entry).toMatchObject({
      id: 'history-1',
      entityType: 'task',
      action: 'restore',
      title: 'Task one',
    });
    expect(entry.createdAt).toBe('2026-03-12T00:00:00.000Z');
  });

  it('builds history records with the expected metadata', () => {
    const record = buildHistoryRecord(
      'history-2',
      'status_change',
      'Task one -> done',
      'task',
      'task-1',
      'proj-1',
    );

    expect(record).toMatchObject({
      id: 'history-2',
      entityType: 'task',
      entityId: 'task-1',
      projectId: 'proj-1',
      action: 'status_change',
      title: 'Task one -> done',
    });
    expect(record.createdAt).toBeDefined();
  });
});
