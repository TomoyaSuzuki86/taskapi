import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { AuthContextValue } from '@/features/auth/auth-context';
import { MitasPage } from '@/pages/MitasPage';
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

describe('MitasPage', () => {
  it('groups tasks by tag and opens the detail dialog', async () => {
    const user = userEvent.setup();
    const updateTask = vi.fn(async () => undefined);
    const today = new Date();
    const dueDate = new Date(
      Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0),
    );
    const router = createMemoryRouter(
      [{ path: '/', element: <MitasPage /> }],
      { initialEntries: ['/'] },
    );

    render(
      <TestAuthProvider value={authenticatedValue}>
        <TestDataServicesProvider
          value={createTestDataServices({
            projects: [
              {
                id: 'project-1',
                ownerUid: 'user-1',
                name: 'Operations',
                description: 'Daily work',
                archived: false,
                deletedAt: null,
                createdAt: '2026-03-01T00:00:00.000Z',
                updatedAt: '2026-03-12T00:00:00.000Z',
              },
            ],
            tasksByProjectId: {
              'project-1': [
                {
                  id: 'task-1',
                  ownerUid: 'user-1',
                  projectId: 'project-1',
                  title: 'Ship board',
                  notes: 'Tune the new task view',
                  tags: ['frontend'],
                  status: 'todo',
                  dueDate: dueDate.toISOString(),
                  completedAt: null,
                  deletedAt: null,
                  createdAt: '2026-03-10T00:00:00.000Z',
                  updatedAt: '2026-03-13T00:00:00.000Z',
                },
                {
                  id: 'task-2',
                  ownerUid: 'user-1',
                  projectId: 'project-1',
                  title: 'Review copy',
                  notes: '',
                  tags: ['frontend'],
                  status: 'done',
                  dueDate: dueDate.toISOString(),
                  completedAt: dueDate.toISOString(),
                  deletedAt: null,
                  createdAt: '2026-03-10T00:00:00.000Z',
                  updatedAt: '2026-03-14T00:00:00.000Z',
                },
              ],
            },
            updateTask,
          })}
        >
          <RouterProvider router={router} />
        </TestDataServicesProvider>
      </TestAuthProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Task board' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '#frontend' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Toggle Ship board' }));

    await waitFor(() => {
      expect(updateTask).toHaveBeenCalledWith('user-1', 'project-1', 'task-1', {
        title: 'Ship board',
        notes: 'Tune the new task view',
        tags: ['frontend'],
        status: 'done',
        dueDate: dueDate.toISOString().slice(0, 10),
      });
    });

    await user.click(screen.getByRole('button', { name: 'Ship board' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Tune the new task view')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Calendar' }));
    expect(
      screen.getByRole('heading', { name: /March|April|May|June|July|August|September|October|November|December|January|February/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: '#frontend' }),
    ).not.toBeInTheDocument();
  });
});
