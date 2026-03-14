import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppShell } from '@/app/AppShell';
import type { AuthContextValue } from '@/features/auth/auth-context';
import {
  AuthRouteGate,
  PublicOnlyRoute,
  RequireAuth,
} from '@/features/auth/components/AuthRouteGate';
import { AuthEntryPage } from '@/pages/AuthEntryPage';
import { BootstrapHomePage } from '@/pages/BootstrapHomePage';
import { HistoryPage } from '@/pages/HistoryPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
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

const unauthenticatedValue: AuthContextValue = {
  status: 'unauthenticated',
  user: null,
  errorMessage: null,
  activeAction: null,
  isFirebaseConfigured: true,
  signInWithGoogle: async () => undefined,
  signOut: async () => undefined,
  clearError: () => undefined,
};

describe('auth routes', () => {
  it.each([
    ['/', '今日'],
    ['/history', 'タスク履歴はありません'],
    ['/settings', 'タスクの復元'],
    ['/missing', 'ページが見つかりません'],
  ] as const)('renders %s', (entry, expectedText) => {
    const dataServices = createTestDataServices({
      projects: [
        {
          id: 'sample-project',
          ownerUid: 'user-1',
          name: 'legacy',
          description: 'Legacy storage',
          archived: false,
          deletedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      tasksByProjectId: {
        'sample-project': [],
      },
      historyEntries: [],
    });
    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: <AppShell />,
          children: [
            { index: true, element: <BootstrapHomePage /> },
            { path: 'history', element: <HistoryPage /> },
            { path: 'settings', element: <SettingsPlaceholderPage /> },
            { path: '*', element: <NotFoundPage /> },
          ],
        },
      ],
      { initialEntries: [entry] },
    );

    render(
      <TestAuthProvider value={authenticatedValue}>
        <TestDataServicesProvider value={dataServices}>
          <RouterProvider router={router} />
        </TestDataServicesProvider>
      </TestAuthProvider>,
    );

    expect(screen.getByText(expectedText)).toBeInTheDocument();
  });

  it('redirects signed-out users to login for protected routes', () => {
    const dataServices = createTestDataServices();
    const router = createMemoryRouter(
      [
        {
          element: <AuthRouteGate />,
          children: [
            {
              element: <PublicOnlyRoute />,
              children: [{ path: '/login', element: <AuthEntryPage /> }],
            },
            {
              element: <RequireAuth />,
              children: [
                {
                  path: '/',
                  element: <AppShell />,
                  children: [{ path: 'history', element: <HistoryPage /> }],
                },
              ],
            },
          ],
        },
      ],
      { initialEntries: ['/history'] },
    );

    render(
      <TestAuthProvider value={unauthenticatedValue}>
        <TestDataServicesProvider value={dataServices}>
          <RouterProvider router={router} />
        </TestDataServicesProvider>
      </TestAuthProvider>,
    );

    expect(
      screen.getByRole('heading', { name: 'ようこそ' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Googleでログイン' }),
    ).toBeInTheDocument();
  });
});
