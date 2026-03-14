import { Frame } from '@/components/layout/Frame';
import { AuthShellSkeleton } from '@/components/skeleton/AuthShellSkeleton';
import { Card } from '@/components/ui/Card';
import { ProjectCardSkeleton } from '@/features/projects/components/ProjectCardSkeleton';

export function AuthBootstrapScreen() {
  return (
    <Frame>
      <main className="app-shell__content">
        <div className="stack stack--page">
          <AuthShellSkeleton />
          <Card variant="muted">
            <div className="stack stack--tight">
              <h2>読み込み中</h2>
              <p className="muted-copy">
                ログイン状態とデータを確認しています。
              </p>
            </div>
          </Card>
          <div className="stack">
            <ProjectCardSkeleton />
            <ProjectCardSkeleton />
          </div>
        </div>
      </main>
    </Frame>
  );
}
