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
        title="認証エラー"
        subtitle="Firebase 設定を確認してください"
        badgeLabel="停止中"
      />
      <main className="app-shell__content">
        <div className="stack stack--page">
          <Card>
            <p className="section-heading__eyebrow">Authentication</p>
            <h2>ログイン状態の確認を開始できませんでした</h2>
            <p className="muted-copy">{message}</p>
            <p className="muted-copy">
              Firebase の環境変数と Authentication
              の設定を確認してから、アプリを再読み込みしてください。
            </p>
            <Link className="text-link" to="/">
              設定後に再試行
            </Link>
          </Card>
        </div>
      </main>
    </Frame>
  );
}
