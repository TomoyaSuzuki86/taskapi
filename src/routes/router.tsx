import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from '@/app/AppShell';
import {
  AuthRouteGate,
  PublicOnlyRoute,
  RequireAuth,
} from '@/features/auth/components/AuthRouteGate';
import { AuthEntryPage } from '@/pages/AuthEntryPage';
import { BootstrapHomePage } from '@/pages/BootstrapHomePage';
import { HistoryPage } from '@/pages/HistoryPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ProjectDetailPage } from '@/pages/ProjectDetailPage';
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
                element: <ProjectDetailPage />,
              },
              {
                path: 'history',
                element: <HistoryPage />,
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
