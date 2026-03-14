import { Card } from '@/components/ui/Card';
import { SkeletonBlock } from '@/components/skeleton/SkeletonBlock';

export function TaskCardSkeleton() {
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <SkeletonBlock
          style={{ width: '24px', height: '24px', borderRadius: '50%' }}
        />
        <SkeletonBlock className="skeleton--row-long" />
      </div>
      <SkeletonBlock
        className="skeleton--row-short"
        style={{ marginTop: '8px', marginLeft: '40px' }}
      />
    </Card>
  );
}
