import { Outlet, useLocation } from 'react-router-dom';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppNav } from '@/components/layout/AppNav';
import { Frame } from '@/components/layout/Frame';

const routeTitles: Record<string, string> = {
  '/': 'Home',
  '/history': 'History',
  '/settings': 'Settings',
};

export function AppShell() {
  const location = useLocation();
  const title = routeTitles[location.pathname] ?? 'Project';

  return (
    <Frame>
      <AppHeader title={title} />
      <main className="app-shell__content">
        <Outlet />
      </main>
      <AppNav />
    </Frame>
  );
}
