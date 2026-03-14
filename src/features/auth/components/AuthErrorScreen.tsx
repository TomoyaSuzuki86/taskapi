import { Link } from 'react-router-dom';
import { Frame } from '@/components/layout/Frame';
import { Card } from '@/components/ui/Card';

type AuthErrorScreenProps = {
  message: string;
};

export function AuthErrorScreen({ message }: AuthErrorScreenProps) {
  return (
    <Frame>
      <main className="app-shell__content">
        <div className="stack stack--page">
          <Card>
            <h2>ログイン状態を確認できませんでした</h2>
            <p className="muted-copy">{message}</p>
            <p className="muted-copy">
              Firebase の設定と Authentication を確認してから、再度開いてください。
            </p>
            <Link className="text-link" to="/">
              ログイン画面に戻る
            </Link>
          </Card>
        </div>
      </main>
    </Frame>
  );
}
