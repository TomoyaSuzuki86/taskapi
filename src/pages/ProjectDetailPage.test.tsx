import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { AuthContextValue } from '@/features/auth/auth-context';
import { ProjectDetailPage } from '@/pages/ProjectDetailPage';
import { TestAuthProvider } from '@/test/TestAuthProvider';
import { createTestDataServices } from '@/test/createTestDataServices';
import { TestDataServicesProvider } from '@/test/TestDataServicesProvider';

const authenticatedValue: AuthContextValue = {
  status: 'authenticated',
  user: {
    uid: 'user-1',
    email: 'user@example.com',
    displayName: 'Taskapi User',
  },
  errorMessage: null,
  activeAction: null,
  isFirebaseConfigured: true,
  signInWithGoogle: async () => undefined,
  signOut: async () => undefined,
  clearError: () => undefined,
};

describe('ProjectDetailPage', () => {
  it('creates a task through the repository layer', async () => {
    const user = userEvent.setup();
    const createTask = vi.fn(async () => 'task-created');
    const router = createMemoryRouter(
      [{ path: '/projects/:projectId', element: <ProjectDetailPage /> }],
      { initialEntries: ['/projects/project-1'] },
    );

    render(
      <TestAuthProvider value={authenticatedValue}>
        <TestDataServicesProvider
          value={createTestDataServices({
            createTask,
            projects: [
              {
                id: 'project-1',
                ownerUid: 'user-1',
                name: 'Project one',
                description: 'Scoped to user-1',
                archived: false,
                deletedAt: null,
                createdAt: '2026-03-01T00:00:00.000Z',
                updatedAt: '2026-03-08T00:00:00.000Z',
              },
            ],
            tasksByProjectId: {
              'project-1': [],
            },
          })}
        >
          <RouterProvider router={router} />
        </TestDataServicesProvider>
      </TestAuthProvider>,
    );

    await user.click(screen.getByRole('button', { name: '追加' }));
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText('タスク名'), 'Write tests');
    await user.type(screen.getByLabelText('メモ（任意）'), 'Cover create flow');
    await user.selectOptions(screen.getByLabelText('ステータス'), 'doing');
    await user.type(screen.getByLabelText('期限（任意）'), '2026-03-15');
    await user.click(screen.getByRole('button', { name: 'タスクを追加' }));

    await waitFor(() => {
      expect(createTask).toHaveBeenCalledWith('user-1', 'project-1', {
        title: 'Write tests',
        notes: 'Cover create flow',
        status: 'doing',
        dueDate: '2026-03-15',
      });
    });
  });

  it('restores a deleted task through the repository layer', async () => {
    const user = userEvent.setup();
    const restoreTask = vi.fn(async () => undefined);
    const router = createMemoryRouter(
      [{ path: '/projects/:projectId', element: <ProjectDetailPage /> }],
      { initialEntries: ['/projects/project-1'] },
    );

    render(
      <TestAuthProvider value={authenticatedValue}>
        <TestDataServicesProvider
          value={createTestDataServices({
            projects: [
              {
                id: 'project-1',
                ownerUid: 'user-1',
                name: 'Project one',
                description: 'Scoped to user-1',
                archived: false,
                deletedAt: null,
                createdAt: '2026-03-01T00:00:00.000Z',
                updatedAt: '2026-03-08T00:00:00.000Z',
              },
            ],
            tasksByProjectId: {
              'project-1': [],
            },
            deletedTasksByProjectId: {
              'project-1': [
                {
                  id: 'task-deleted',
                  ownerUid: 'user-1',
                  projectId: 'project-1',
                  title: 'Deleted task',
                  notes: 'Recently deleted',
                  status: 'todo',
                  dueDate: null,
                  completedAt: null,
                  deletedAt: '2026-03-08T00:00:00.000Z',
                  createdAt: '2026-03-01T00:00:00.000Z',
                  updatedAt: '2026-03-08T00:00:00.000Z',
                },
              ],
            },
            restoreTask,
          })}
        >
          <RouterProvider router={router} />
        </TestDataServicesProvider>
      </TestAuthProvider>,
    );

    await user.click(screen.getByRole('button', { name: '復元' }));

    await waitFor(() => {
      expect(restoreTask).toHaveBeenCalledWith(
        'user-1',
        'project-1',
        'task-deleted',
      );
    });
  });
});
