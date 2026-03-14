import { AppHeader } from '@/components/layout/AppHeader';
import { AuthShellSkeleton } from '@/components/skeleton/AuthShellSkeleton';
import { Frame } from '@/components/layout/Frame';
import { ProjectCardSkeleton } from '@/features/projects/components/ProjectCardSkeleton';
import { Card } from '@/components/ui/Card';

export function AuthBootstrapScreen() {
  return (
    <Frame>
      <AppHeader
        title="読み込み中"
        subtitle="ログイン状態を確認しています"
        badgeLabel="認証確認"
      />
      <main className="app-shell__content">
        <div className="stack stack--page">
          <AuthShellSkeleton />
          <Card variant="muted">
            <div className="stack stack--tight">
              <p className="section-heading__eyebrow">Auth bootstrap</p>
              <h2>ホーム画面を準備しています</h2>
              <p className="muted-copy">
                Firebase
                のセッションを確認し、表示に必要な情報を読み込んでいます。
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
