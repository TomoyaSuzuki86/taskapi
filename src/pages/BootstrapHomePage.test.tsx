import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { AuthContextValue } from '@/features/auth/auth-context';
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
  it('shows the empty state when no projects exist', () => {
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

    expect(screen.getByText('プロジェクトがありません')).toBeInTheDocument();
  });

  it('creates a project through the repository layer', async () => {
    const user = userEvent.setup();
    const createProject = vi.fn(async () => 'proj-123');
    const router = createMemoryRouter(
      [
        { path: '/', element: <BootstrapHomePage /> },
        { path: '/projects/:projectId', element: <div>Project route</div> },
      ],
      { initialEntries: ['/'] },
    );

    render(
      <TestAuthProvider value={authenticatedValue}>
        <TestDataServicesProvider
          value={createTestDataServices({ createProject })}
        >
          <RouterProvider router={router} />
        </TestDataServicesProvider>
      </TestAuthProvider>,
    );

    await user.click(screen.getByRole('button', { name: '追加' }));
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText('プロジェクト名'), 'Launch plan');
    await user.type(screen.getByLabelText('説明（任意）'), 'Ship CRUD phase');
    await user.click(
      screen.getByRole('button', { name: 'プロジェクトを作成' }),
    );

    await waitFor(() => {
      expect(createProject).toHaveBeenCalledWith('user-1', {
        name: 'Launch plan',
        description: 'Ship CRUD phase',
      });
    });
  });

  it('restores a deleted project through the repository layer', async () => {
    const user = userEvent.setup();
    const restoreProject = vi.fn(async () => undefined);
    const router = createMemoryRouter(
      [{ path: '/', element: <BootstrapHomePage /> }],
      { initialEntries: ['/'] },
    );

    render(
      <TestAuthProvider value={authenticatedValue}>
        <TestDataServicesProvider
          value={createTestDataServices({
            deletedProjects: [
              {
                id: 'proj-deleted',
                ownerUid: 'user-1',
                name: 'Archived launch',
                description: 'Recently deleted',
                archived: false,
                deletedAt: '2026-03-08T00:00:00.000Z',
                createdAt: '2026-03-01T00:00:00.000Z',
                updatedAt: '2026-03-08T00:00:00.000Z',
              },
            ],
            restoreProject,
          })}
        >
          <RouterProvider router={router} />
        </TestDataServicesProvider>
      </TestAuthProvider>,
    );

    await user.click(screen.getByRole('button', { name: '復元' }));

    await waitFor(() => {
      expect(restoreProject).toHaveBeenCalledWith('user-1', 'proj-deleted');
    });
  });
});
