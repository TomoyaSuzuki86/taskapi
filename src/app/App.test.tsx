import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AppShell } from '@/app/AppShell';
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

describe('AppShell', () => {
  it('renders the application chrome', () => {
    const dataServices = createTestDataServices();
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
        <TestDataServicesProvider value={dataServices}>
          <RouterProvider router={router} />
        </TestDataServicesProvider>
      </TestAuthProvider>,
    );

    expect(screen.getByRole('heading', { name: 'タスク' })).toBeInTheDocument();
    expect(
      screen.getByRole('navigation', { name: 'メインナビゲーション' }),
    ).toBeInTheDocument();
    expect(screen.getByText('今日')).toBeInTheDocument();
  });

  it('shows an offline banner when the browser is offline', () => {
    const originalNavigator = window.navigator;
    vi.stubGlobal('navigator', {
      ...originalNavigator,
      onLine: false,
    });

    const dataServices = createTestDataServices();
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
        <TestDataServicesProvider value={dataServices}>
          <RouterProvider router={router} />
        </TestDataServicesProvider>
      </TestAuthProvider>,
    );

    expect(
      screen.getByText(
        /オフラインです。読み込み済みの画面は開けますが、作成や更新は接続が戻るまで保存されません。/i,
      ),
    ).toBeInTheDocument();

    vi.stubGlobal('navigator', originalNavigator);
  });
});
