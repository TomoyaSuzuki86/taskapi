import { Card } from '@/components/ui/Card';
import { SkeletonBlock } from '@/components/skeleton/SkeletonBlock';

export function ProjectListSkeleton() {
  return (
    <div className="stack">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index}>
          <div className="stack stack--tight">
            <SkeletonBlock className="skeleton--row-short" />
            <SkeletonBlock className="skeleton--row-long" />
          </div>
        </Card>
      ))}
    </div>
  );
}
