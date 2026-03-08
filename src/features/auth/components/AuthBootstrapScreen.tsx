import { AuthShellSkeleton } from '@/components/skeleton/AuthShellSkeleton';
import { AppHeader } from '@/components/layout/AppHeader';
import { Frame } from '@/components/layout/Frame';
import { Card } from '@/components/ui/Card';
import { ProjectListSkeleton } from '@/components/skeleton/ProjectListSkeleton';

export function AuthBootstrapScreen() {
  return (
    <Frame>
      <AppHeader
        title="Starting up"
        subtitle="Resolving your session"
        badgeLabel="Auth bootstrap"
      />
      <main className="app-shell__content">
        <div className="stack stack--page">
          <AuthShellSkeleton />
          <Card tone="muted">
            <div className="stack stack--tight">
              <p className="section-heading__eyebrow">Auth bootstrap</p>
              <h2>Preparing your home screen</h2>
              <p className="muted-copy">
                taskapi checks your Firebase session before rendering protected
                routes so the app does not flash the wrong state.
              </p>
            </div>
          </Card>
          <ProjectListSkeleton />
        </div>
      </main>
    </Frame>
  );
}
