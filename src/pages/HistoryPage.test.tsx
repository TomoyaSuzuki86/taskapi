import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { AuthContextValue } from '@/features/auth/auth-context';
import { HistoryPage } from '@/pages/HistoryPage';
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

describe('HistoryPage', () => {
  it('renders recent history entries in reverse chronological order', () => {
    const router = createMemoryRouter(
      [{ path: '/history', element: <HistoryPage /> }],
      { initialEntries: ['/history'] },
    );

    render(
      <TestAuthProvider value={authenticatedValue}>
        <TestDataServicesProvider
          value={createTestDataServices({
            historyEntries: [
              {
                id: 'history-2',
                entityType: 'task',
                entityId: 'task-1',
                projectId: 'proj-1',
                action: 'status_change',
                title: 'Write tests',
                createdAt: '2026-03-12T00:00:00.000Z',
              },
              {
                id: 'history-1',
                entityType: 'project',
                entityId: 'proj-1',
                projectId: 'proj-1',
                action: 'create',
                title: 'Project one',
                createdAt: '2026-03-11T00:00:00.000Z',
              },
            ],
          })}
        >
          <RouterProvider router={router} />
        </TestDataServicesProvider>
      </TestAuthProvider>,
    );

    expect(screen.getByText('変更履歴')).toBeInTheDocument();
    expect(
      screen.getByText('タスク「Write tests」をステータス変更'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('プロジェクト「Project one」を作成'),
    ).toBeInTheDocument();
  });

  it('restores a deleted project through the existing project restore path', async () => {
    const user = userEvent.setup();
    const restoreProject = vi.fn(async () => undefined);
    const router = createMemoryRouter(
      [{ path: '/history', element: <HistoryPage /> }],
      { initialEntries: ['/history'] },
    );

    render(
      <TestAuthProvider value={authenticatedValue}>
        <TestDataServicesProvider
          value={createTestDataServices({
            restoreProject,
            historyEntries: [
              {
                id: 'history-delete-project',
                entityType: 'project',
                entityId: 'proj-1',
                projectId: 'proj-1',
                action: 'delete',
                title: 'Project one',
                createdAt: '2026-03-12T00:00:00.000Z',
              },
            ],
          })}
        >
          <RouterProvider router={router} />
        </TestDataServicesProvider>
      </TestAuthProvider>,
    );

    await user.click(screen.getByRole('button', { name: '復元' }));

    await waitFor(() => {
      expect(restoreProject).toHaveBeenCalledWith('user-1', 'proj-1');
    });
  });
});
