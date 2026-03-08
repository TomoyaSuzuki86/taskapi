import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppShell } from '@/app/AppShell';
import type { AuthContextValue } from '@/features/auth/auth-context';
import { BootstrapHomePage } from '@/pages/BootstrapHomePage';
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

describe('AppShell', () => {
  it('renders the application chrome', () => {
    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: <AppShell />,
          children: [{ index: true, element: <BootstrapHomePage /> }],
        },
      ],
      { initialEntries: ['/'] },
    );

    render(
      <TestAuthProvider value={authenticatedValue}>
        <RouterProvider router={router} />
      </TestAuthProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Home' })).toBeInTheDocument();
    expect(
      screen.getByRole('navigation', { name: 'Primary' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Sign out' }),
    ).toBeInTheDocument();
  });
});
