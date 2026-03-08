import { Card } from '@/components/ui/Card';
import { SkeletonBlock } from '@/components/skeleton/SkeletonBlock';

export function AuthShellSkeleton() {
  return (
    <Card tone="muted">
      <div className="stack">
        <SkeletonBlock className="skeleton--title" />
        <SkeletonBlock className="skeleton--body" />
        <SkeletonBlock className="skeleton--button" />
      </div>
    </Card>
  );
}
