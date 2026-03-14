import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/features/auth/useAuth';

export function SettingsPlaceholderPage() {
  const { activeAction, signOut, user } = useAuth();

  return (
    <div className="stack stack--page">
      <Card>
        <p className="section-heading__eyebrow">アカウント</p>
        <h2>利用中のアカウント</h2>
        <p className="muted-copy">
          ここでは現在のログイン情報を確認できます。詳細な設定機能はまだ対象外です。
        </p>
      </Card>
      <Card>
        <div className="stack">
          <Input label="表示名" value={user?.displayName ?? ''} disabled />
          <Input label="メールアドレス" value={user?.email ?? ''} disabled />
          <Button
            type="button"
            variant="secondary"
            onClick={() => void signOut()}
            disabled={activeAction === 'sign_out'}
          >
            {activeAction === 'sign_out' ? 'ログアウト中...' : 'ログアウト'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
