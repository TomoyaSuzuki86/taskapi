import { Outlet, useLocation } from 'react-router-dom';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppNav } from '@/components/layout/AppNav';
import { Frame } from '@/components/layout/Frame';
import { ConnectivityBanner } from '@/components/feedback/ConnectivityBanner';
import { Button } from '@/components/ui/Button';
import { resolveShellRouteTitle } from '@/app/route-meta';
import { useAuth } from '@/features/auth/useAuth';

export function AppShell() {
  const location = useLocation();
  const { activeAction, signOut, user } = useAuth();
  const title = resolveShellRouteTitle(location.pathname);

  return (
    <Frame>
      <AppHeader
        title={title}
        subtitle={user?.email ?? 'Google アカウントで利用中'}
        action={
          <Button
            type="button"
            variant="secondary"
            onClick={() => void signOut()}
            disabled={activeAction === 'sign_out'}
          >
            {activeAction === 'sign_out' ? 'ログアウト中...' : 'ログアウト'}
          </Button>
        }
      />
      <ConnectivityBanner />
      <main className="app-shell__content">
        <Outlet />
      </main>
      <AppNav />
    </Frame>
  );
}
