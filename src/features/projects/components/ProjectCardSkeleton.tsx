import { Card } from '@/components/ui/Card';
import { SkeletonBlock } from '@/components/skeleton/SkeletonBlock';

export function ProjectCardSkeleton() {
  return (
    <Card>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <SkeletonBlock className="skeleton--row-long" />
        <SkeletonBlock style={{ width: '50px', height: '20px' }} />
      </div>
      <SkeletonBlock
        className="skeleton--row-short"
        style={{ marginTop: '8px' }}
      />
    </Card>
  );
}
