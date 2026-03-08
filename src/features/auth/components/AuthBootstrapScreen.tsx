import { AuthShellSkeleton } from '@/components/skeleton/AuthShellSkeleton';
import { AppHeader } from '@/components/layout/AppHeader';
import { Frame } from '@/components/layout/Frame';
import { Card } from '@/components/ui/Card';
import { ProjectListSkeleton } from '@/components/skeleton/ProjectListSkeleton';

export function AuthBootstrapScreen() {
  return (
    <Frame>
      <AppHeader
        title="起動中"
        subtitle="ログイン状態を確認しています"
        badgeLabel="認証確認"
      />
      <main className="app-shell__content">
        <div className="stack stack--page">
          <AuthShellSkeleton />
          <Card tone="muted">
            <div className="stack stack--tight">
              <p className="section-heading__eyebrow">Auth bootstrap</p>
              <h2>ホーム画面を準備しています</h2>
              <p className="muted-copy">
                保護された画面を開く前に Firebase
                のセッションを確認し、誤った表示状態が一瞬見えないようにしています。
              </p>
            </div>
          </Card>
          <ProjectListSkeleton />
        </div>
      </main>
    </Frame>
  );
}
