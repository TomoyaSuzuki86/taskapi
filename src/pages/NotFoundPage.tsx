import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';

export function NotFoundPage() {
  return (
    <div className="stack stack--page">
      <Card>
        <p className="section-heading__eyebrow">404</p>
        <h2>Route not found</h2>
        <p className="muted-copy">
          The requested screen does not exist in the bootstrap shell.
        </p>
        <Link className="text-link" to="/">
          Return home
        </Link>
      </Card>
    </div>
  );
}
