import { Outlet, useLocation } from 'react-router-dom';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppNav } from '@/components/layout/AppNav';
import { Frame } from '@/components/layout/Frame';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/useAuth';

const routeTitles: Record<string, string> = {
  '/': 'Home',
  '/history': 'History',
  '/settings': 'Settings',
};

export function AppShell() {
  const location = useLocation();
  const { activeAction, signOut, user } = useAuth();
  const title = routeTitles[location.pathname] ?? 'Project';

  return (
    <Frame>
      <AppHeader
        title={title}
        subtitle={user?.email ?? 'Signed in with Google'}
        action={
          <Button
            type="button"
            variant="secondary"
            onClick={() => void signOut()}
            disabled={activeAction === 'sign_out'}
          >
            {activeAction === 'sign_out' ? 'Signing out...' : 'Sign out'}
          </Button>
        }
      />
      <main className="app-shell__content">
        <Outlet />
      </main>
      <AppNav />
    </Frame>
  );
}
