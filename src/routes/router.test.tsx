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
import { HistoryPlaceholderPage } from '@/pages/HistoryPlaceholderPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ProjectDetailPlaceholderPage } from '@/pages/ProjectDetailPlaceholderPage';
import { SettingsPlaceholderPage } from '@/pages/SettingsPlaceholderPage';
import { TestAuthProvider } from '@/test/TestAuthProvider';

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
    ['/', 'Session active'],
    ['/projects/sample-project', 'sample-project'],
    ['/history', 'History shell'],
    ['/settings', 'Session settings'],
    ['/missing', 'Route not found'],
  ] as const)('renders %s', (entry, expectedText) => {
    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: <AppShell />,
          children: [
            { index: true, element: <BootstrapHomePage /> },
            {
              path: 'projects/:projectId',
              element: <ProjectDetailPlaceholderPage />,
            },
            { path: 'history', element: <HistoryPlaceholderPage /> },
            { path: 'settings', element: <SettingsPlaceholderPage /> },
            { path: '*', element: <NotFoundPage /> },
          ],
        },
      ],
      { initialEntries: [entry] },
    );

    render(
      <TestAuthProvider value={authenticatedValue}>
        <RouterProvider router={router} />
      </TestAuthProvider>,
    );

    expect(screen.getByText(expectedText)).toBeInTheDocument();
  });

  it('redirects signed-out users to login for protected routes', () => {
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
                  children: [
                    { path: 'history', element: <HistoryPlaceholderPage /> },
                  ],
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
        <RouterProvider router={router} />
      </TestAuthProvider>,
    );

    expect(
      screen.getByRole('heading', { name: 'Welcome' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Continue with Google' }),
    ).toBeInTheDocument();
  });
});
