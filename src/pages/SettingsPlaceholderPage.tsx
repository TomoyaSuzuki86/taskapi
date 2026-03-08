import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/features/auth/useAuth';

export function SettingsPlaceholderPage() {
  const { activeAction, signOut, user } = useAuth();

  return (
    <div className="stack stack--page">
      <Card>
        <p className="section-heading__eyebrow">Account</p>
        <h2>Session settings</h2>
        <p className="muted-copy">
          This phase only exposes authenticated session details and explicit
          logout. Full settings remain out of scope.
        </p>
      </Card>
      <Card>
        <div className="stack">
          <Input
            label="Display name"
            value={user?.displayName ?? ''}
            disabled
          />
          <Input label="Email" value={user?.email ?? ''} disabled />
          <Button
            type="button"
            variant="secondary"
            onClick={() => void signOut()}
            disabled={activeAction === 'sign_out'}
          >
            {activeAction === 'sign_out' ? 'Signing out...' : 'Sign out'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
