import { Link } from 'react-router-dom';
import { AppHeader } from '@/components/layout/AppHeader';
import { Frame } from '@/components/layout/Frame';
import { Card } from '@/components/ui/Card';

type AuthErrorScreenProps = {
  message: string;
};

export function AuthErrorScreen({ message }: AuthErrorScreenProps) {
  return (
    <Frame>
      <AppHeader
        title="Auth error"
        subtitle="Firebase setup needs attention"
        badgeLabel="Blocked"
      />
      <main className="app-shell__content">
        <div className="stack stack--page">
          <Card>
            <p className="section-heading__eyebrow">Authentication</p>
            <h2>Session bootstrap could not start</h2>
            <p className="muted-copy">{message}</p>
            <p className="muted-copy">
              Check the Firebase environment variables and Authentication
              provider settings, then reload the app.
            </p>
            <Link className="text-link" to="/">
              Retry after configuration
            </Link>
          </Card>
        </div>
      </main>
    </Frame>
  );
}
