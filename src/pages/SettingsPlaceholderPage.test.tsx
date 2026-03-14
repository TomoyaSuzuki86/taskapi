import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { AuthContextValue } from '@/features/auth/auth-context';
import { SettingsPlaceholderPage } from '@/pages/SettingsPlaceholderPage';
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

describe('SettingsPlaceholderPage', () => {
  it('restores a deleted task from the settings restore section', async () => {
    const user = userEvent.setup();
    const restoreTask = vi.fn(async () => undefined);
    const router = createMemoryRouter(
      [{ path: '/settings', element: <SettingsPlaceholderPage /> }],
      { initialEntries: ['/settings'] },
    );

    render(
      <TestAuthProvider value={authenticatedValue}>
        <TestDataServicesProvider
          value={createTestDataServices({
            restoreTask,
            historyEntries: [
              {
                id: 'history-delete-task',
                entityType: 'task',
                entityId: 'task-1',
                projectId: 'proj-1',
                action: 'delete',
                title: 'Write tests',
                createdAt: '2026-03-12T00:00:00.000Z',
              },
            ],
          })}
        >
          <RouterProvider router={router} />
        </TestDataServicesProvider>
      </TestAuthProvider>,
    );

    expect(
      screen.getByRole('heading', { name: 'タスクの復元' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '復元' }));

    await waitFor(() => {
      expect(restoreTask).toHaveBeenCalledWith('user-1', 'proj-1', 'task-1');
    });
  });
});
