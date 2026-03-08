import { AppHeader } from '@/components/layout/AppHeader';
import { ConnectivityBanner } from '@/components/feedback/ConnectivityBanner';
import { Frame } from '@/components/layout/Frame';
import { LoginPage } from '@/pages/LoginPage';

export function AuthEntryPage() {
  return (
    <Frame>
      <AppHeader
        title="Welcome"
        subtitle="Google sign-in required"
        badgeLabel="Signed out"
      />
      <ConnectivityBanner />
      <main className="app-shell__content">
        <LoginPage />
      </main>
    </Frame>
  );
}
