import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/useAuth';

export function LoginPage() {
  const { activeAction, clearError, errorMessage, signInWithGoogle } =
    useAuth();

  return (
    <div className="auth-entry">
      <Card tone="muted">
        <div className="stack stack--page">
          <div className="stack stack--tight">
            <p className="section-heading__eyebrow">Single-user task shell</p>
            <h2>Sign in to taskapi</h2>
            <p className="muted-copy">
              Use your Google account to open the same personal workspace across
              devices. Authentication is handled by Firebase Auth.
            </p>
          </div>

          <Button
            type="button"
            onClick={() => void signInWithGoogle()}
            disabled={activeAction === 'sign_in'}
          >
            {activeAction === 'sign_in'
              ? 'Signing in...'
              : 'Continue with Google'}
          </Button>

          {errorMessage ? (
            <div className="notice notice--error" role="alert">
              <div className="stack stack--tight">
                <strong>Sign-in failed</strong>
                <p className="muted-copy muted-copy--inverse">{errorMessage}</p>
                <button
                  className="text-link text-link--button"
                  type="button"
                  onClick={clearError}
                >
                  Dismiss
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </Card>

      <Card>
        <div className="stack stack--tight">
          <p className="section-heading__eyebrow">What this phase includes</p>
          <h3>Reliable auth, not product data yet</h3>
          <p className="muted-copy">
            This phase implements Google sign-in, session persistence, route
            protection, and logout. Project, task, and history data remain in
            later phases.
          </p>
        </div>
      </Card>
    </div>
  );
}
