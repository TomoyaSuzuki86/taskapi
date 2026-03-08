import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
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
                title: 'Write tests -> done',
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

    expect(screen.getByText('Recent activity')).toBeInTheDocument();
    expect(screen.getByText('Write tests -> done')).toBeInTheDocument();
    expect(screen.getByText('Project one')).toBeInTheDocument();
    expect(screen.getByText('status_change')).toBeInTheDocument();
    expect(screen.getByText('create')).toBeInTheDocument();
  });
});
