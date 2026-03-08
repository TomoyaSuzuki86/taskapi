import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from '@/app/AppShell';
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

export const router = createBrowserRouter([
  {
    element: <AuthRouteGate />,
    children: [
      {
        element: <PublicOnlyRoute />,
        children: [
          {
            path: '/login',
            element: <AuthEntryPage />,
          },
        ],
      },
      {
        element: <RequireAuth />,
        children: [
          {
            path: '/',
            element: <AppShell />,
            children: [
              {
                index: true,
                element: <BootstrapHomePage />,
              },
              {
                path: 'projects/:projectId',
                element: <ProjectDetailPlaceholderPage />,
              },
              {
                path: 'history',
                element: <HistoryPlaceholderPage />,
              },
              {
                path: 'settings',
                element: <SettingsPlaceholderPage />,
              },
              {
                path: '*',
                element: <NotFoundPage />,
              },
            ],
          },
        ],
      },
    ],
  },
]);
