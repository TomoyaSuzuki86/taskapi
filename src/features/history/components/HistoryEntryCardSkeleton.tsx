import { Card } from '@/components/ui/Card';
import { SkeletonBlock } from '@/components/skeleton/SkeletonBlock';

export function HistoryEntryCardSkeleton() {
  return (
    <Card>
      <SkeletonBlock className="skeleton--row-long" />
      <SkeletonBlock
        className="skeleton--row-short"
        style={{ marginTop: '8px' }}
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginTop: '16px',
        }}
      >
        <SkeletonBlock style={{ width: '80px', height: '36px' }} />
      </div>
    </Card>
  );
}
