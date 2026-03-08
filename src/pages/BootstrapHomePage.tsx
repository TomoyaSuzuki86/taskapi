import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/features/auth/useAuth';

export function BootstrapHomePage() {
  const { user } = useAuth();

  return (
    <div className="stack stack--page">
      <Card>
        <div className="section-heading">
          <div>
            <p className="section-heading__eyebrow">Authenticated home</p>
            <h2>Session active</h2>
          </div>
          <span className="pill pill--ready">Signed in</span>
        </div>
        <p className="muted-copy">
          Signed in as {user?.displayName ?? 'your Google account'}
          {user?.email ? ` (${user.email})` : ''}. Route protection and session
          persistence are now active.
        </p>
      </Card>
      <Card tone="muted">
        <div className="stack stack--tight">
          <p className="section-heading__eyebrow">Projects next</p>
          <h3>No project data loaded in this phase</h3>
          <p className="muted-copy">
            Project, task, and history reads remain out of scope for
            auth-session. The next phase should connect owner-scoped Firestore
            data to this authenticated shell.
          </p>
        </div>
      </Card>
      <Card>
        <div className="stack stack--tight">
          <p className="section-heading__eyebrow">Protected routes</p>
          <h3>Navigation stays inside the signed-in shell</h3>
          <Link className="text-link" to="/history">
            Open history placeholder
          </Link>
          <Link className="text-link" to="/projects/session-foundation">
            Open project detail placeholder
          </Link>
        </div>
      </Card>
    </div>
  );
}
