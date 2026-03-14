import { Outlet, useLocation } from 'react-router-dom';
import { resolveShellRouteTitle } from '@/app/route-meta';
import { ConnectivityBanner } from '@/components/feedback/ConnectivityBanner';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { Frame } from '@/components/layout/Frame';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/useAuth';
import styles from './AppShell.module.css';

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
      <main className={styles.content}>
        <Outlet />
      </main>
      <BottomNav />
    </Frame>
  );
}
