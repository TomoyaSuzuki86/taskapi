import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { AuthContextValue } from '@/features/auth/auth-context';
import { STORAGE_PROJECT_ID } from '@/lib/tasks/storage-project';
import { BootstrapHomePage } from '@/pages/BootstrapHomePage';
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

describe('BootstrapHomePage', () => {
  it('shows compact empty sections when no tasks exist', () => {
    const router = createMemoryRouter(
      [{ path: '/', element: <BootstrapHomePage /> }],
      { initialEntries: ['/'] },
    );

    render(
      <TestAuthProvider value={authenticatedValue}>
        <TestDataServicesProvider value={createTestDataServices()}>
          <RouterProvider router={router} />
        </TestDataServicesProvider>
      </TestAuthProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Today' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Upcoming' })).toBeInTheDocument();
    expect(screen.getByText('No tasks for today.')).toBeInTheDocument();
  });

  it('creates a tagged task and stays on the home screen', async () => {
    const user = userEvent.setup();
    const createTask = vi.fn(async () => 'task-123');
    const router = createMemoryRouter(
      [{ path: '/', element: <BootstrapHomePage /> }],
      { initialEntries: ['/'] },
    );

    render(
      <TestAuthProvider value={authenticatedValue}>
        <TestDataServicesProvider
          value={createTestDataServices({ createTask })}
        >
          <RouterProvider router={router} />
        </TestDataServicesProvider>
      </TestAuthProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Create task' }));
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const dialog = screen.getByRole('dialog');
    const textboxes = within(dialog).getAllByRole('textbox');
    await user.type(textboxes[0]!, 'Launch plan');
    await user.type(textboxes[1]!, 'Ship CRUD phase');
    await user.type(textboxes[2]!, 'frontend, urgent');
    const dialogButtons = within(dialog).getAllByRole('button');
    await user.click(dialogButtons[dialogButtons.length - 1]!);

    await waitFor(() => {
      expect(createTask).toHaveBeenCalledWith('user-1', STORAGE_PROJECT_ID, {
        title: 'Launch plan',
        notes: 'Ship CRUD phase',
        tags: ['frontend', 'urgent'],
        status: 'todo',
        dueDate: '',
      });
    });

    expect(router.state.location.pathname).toBe('/');
  });

  it('updates a due-soon task from the home feed', async () => {
    const user = userEvent.setup();
    const updateTask = vi.fn(async () => undefined);
    const today = new Date();
    const dueDate = new Date(
      Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0),
    );
    const router = createMemoryRouter(
      [{ path: '/', element: <BootstrapHomePage /> }],
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
                  title: 'Write tests',
                  notes: 'Cover the home feed',
                  tags: [],
                  status: 'doing',
                  dueDate: dueDate.toISOString(),
                  completedAt: null,
                  deletedAt: null,
                  createdAt: '2026-03-10T00:00:00.000Z',
                  updatedAt: '2026-03-13T00:00:00.000Z',
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

    expect(screen.getByText('Write tests')).toBeInTheDocument();
    expect(screen.getAllByText('#Operations').length).toBeGreaterThan(0);

    await user.click(
      screen.getByRole('checkbox', {
        name: /Write tests/,
      }),
    );

    await waitFor(() => {
      expect(updateTask).toHaveBeenCalledWith('user-1', 'project-1', 'task-1', {
        title: 'Write tests',
        notes: 'Cover the home feed',
        tags: ['Operations'],
        status: 'done',
        dueDate: dueDate.toISOString().slice(0, 10),
      });
    });
  });
});
