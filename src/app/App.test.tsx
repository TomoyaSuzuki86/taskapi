import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppShell } from '@/app/AppShell';
import { BootstrapHomePage } from '@/pages/BootstrapHomePage';

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

    render(<RouterProvider router={router} />);

    expect(screen.getByRole('heading', { name: 'Home' })).toBeInTheDocument();
    expect(
      screen.getByRole('navigation', { name: 'Primary' }),
    ).toBeInTheDocument();
  });
});
