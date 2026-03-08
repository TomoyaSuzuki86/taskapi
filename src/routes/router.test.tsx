import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppShell } from '@/app/AppShell';
import { BootstrapHomePage } from '@/pages/BootstrapHomePage';
import { HistoryPlaceholderPage } from '@/pages/HistoryPlaceholderPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ProjectDetailPlaceholderPage } from '@/pages/ProjectDetailPlaceholderPage';
import { SettingsPlaceholderPage } from '@/pages/SettingsPlaceholderPage';

describe('bootstrap routes', () => {
  it.each([
    ['/', 'Home shell'],
    ['/projects/sample-project', 'sample-project'],
    ['/history', 'History shell'],
    ['/settings', 'Settings and auth placeholder'],
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

    render(<RouterProvider router={router} />);

    expect(screen.getByText(expectedText)).toBeInTheDocument();
  });
});
