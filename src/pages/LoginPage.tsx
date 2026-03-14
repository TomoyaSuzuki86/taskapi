import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/features/auth/useAuth';

export function LoginPage() {
  const { activeAction, clearError, errorMessage, signInWithGoogle } =
    useAuth();

  return (
    <div className="auth-entry">
      <Card variant="muted">
        <div className="stack stack--page auth-hero">
          <div className="stack stack--tight">
            <p className="section-heading__eyebrow">
              Single-user task workspace
            </p>
            <h2>個人タスクを静かに整える</h2>
            <p className="muted-copy">
              タスカピは、ひとりで使うためのシンプルなタスク管理アプリです。Google
              アカウントでログインすると、作成したプロジェクト、タスク、履歴を同じ状態で使えます。
            </p>
          </div>

          <div className="auth-hero__metrics">
            <div className="auth-metric">
              <strong>プロジェクト</strong>
              <span>必要な単位で整理</span>
            </div>
            <div className="auth-metric">
              <strong>タスク</strong>
              <span>未着手・進行中・完了で管理</span>
            </div>
            <div className="auth-metric">
              <strong>履歴</strong>
              <span>削除と復元もあとから確認</span>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => void signInWithGoogle()}
            disabled={activeAction === 'sign_in'}
          >
            {activeAction === 'sign_in' ? 'ログイン中...' : 'Googleでログイン'}
          </Button>

          {errorMessage ? (
            <div className="notice notice--error" role="alert">
              <div className="stack stack--tight">
                <strong>ログインに失敗しました</strong>
                <p className="muted-copy muted-copy--inverse">{errorMessage}</p>
                <button
                  className="text-link text-link--button"
                  type="button"
                  onClick={clearError}
                >
                  閉じる
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </Card>

      <Card>
        <div className="stack stack--tight">
          <p className="section-heading__eyebrow">このアプリでできること</p>
          <h3>落ち着いて使える個人用のタスク管理</h3>
          <p className="muted-copy">
            プロジェクト作成、タスク追加、履歴確認、削除からの復元までを一つの流れで扱えます。
            共同編集や担当者管理は含めず、個人利用に必要な範囲へ絞っています。
          </p>
        </div>
      </Card>
    </div>
  );
}
