import { Outlet } from 'react-router-dom';
import { ConnectivityBanner } from '@/components/feedback/ConnectivityBanner';
import { BottomNav } from '@/components/layout/BottomNav';
import { Frame } from '@/components/layout/Frame';
import styles from './AppShell.module.css';

export function AppShell() {
  return (
    <Frame>
      <ConnectivityBanner />
      <main className={styles.content}>
        <Outlet />
      </main>
      <BottomNav />
    </Frame>
  );
}
