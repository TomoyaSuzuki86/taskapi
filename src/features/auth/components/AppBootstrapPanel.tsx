import { AuthShellSkeleton } from '@/components/skeleton/AuthShellSkeleton';
import { Card } from '@/components/ui/Card';
import { getFirebaseConfigurationState } from '@/lib/firebase/config';

export function AppBootstrapPanel() {
  const firebaseState = getFirebaseConfigurationState();

  return (
    <div className="stack">
      <Card tone="muted">
        <div className="section-heading">
          <div>
            <p className="section-heading__eyebrow">Auth next</p>
            <h2>Bootstrap foundation</h2>
          </div>
          <span
            className={`pill ${firebaseState.isConfigured ? 'pill--ready' : 'pill--warning'}`}
          >
            {firebaseState.isConfigured ? 'Firebase ready' : 'Env needed'}
          </span>
        </div>
        <p className="muted-copy">
          Firebase auth and persisted login are intentionally deferred. The
          bootstrap phase only establishes the shell, loading states, and
          initialization boundary required for the next phase.
        </p>
      </Card>
      <AuthShellSkeleton />
    </div>
  );
}
