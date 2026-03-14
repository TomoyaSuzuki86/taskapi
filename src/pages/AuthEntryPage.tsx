import { ConnectivityBanner } from '@/components/feedback/ConnectivityBanner';
import { AppHeader } from '@/components/layout/AppHeader';
import { Frame } from '@/components/layout/Frame';
import { LoginPage } from '@/pages/LoginPage';

export function AuthEntryPage() {
  return (
    <Frame>
      <AppHeader
        title="ようこそ"
        subtitle="Google アカウントでログインしてください"
        badgeLabel="未ログイン"
      />
      <ConnectivityBanner />
      <main className="app-shell__content">
        <LoginPage />
      </main>
    </Frame>
  );
}
