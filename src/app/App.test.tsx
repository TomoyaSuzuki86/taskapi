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

    expect(
      screen.getByRole('heading', { name: 'ワークスペース' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('navigation', { name: 'メインナビゲーション' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'ログアウト' }),
    ).toBeInTheDocument();
    expect(screen.getByText('進行中のプロジェクト')).toBeInTheDocument();
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
        /オフラインです。保存済みの画面は開けますが、同期や更新は通信が戻るまで反映されません。/i,
      ),
    ).toBeInTheDocument();

    vi.stubGlobal('navigator', originalNavigator);
  });
});
