import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';

export function NotFoundPage() {
  return (
    <div className="stack stack--page">
      <Card>
        <p className="section-heading__eyebrow">404</p>
        <h2>ページが見つかりません</h2>
        <p className="muted-copy">
          指定された画面は存在しないか、利用できなくなっています。
        </p>
        <Link className="text-link" to="/">
          ホームへ戻る
        </Link>
      </Card>
    </div>
  );
}
