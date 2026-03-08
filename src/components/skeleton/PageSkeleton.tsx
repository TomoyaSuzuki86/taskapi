import { SkeletonBlock } from '@/components/skeleton/SkeletonBlock';

export function PageSkeleton() {
  return (
    <div className="stack">
      <SkeletonBlock className="skeleton--title" />
      <SkeletonBlock className="skeleton--body" />
      <SkeletonBlock className="skeleton--body" />
      <div className="grid-list">
        <SkeletonBlock className="skeleton--card" />
        <SkeletonBlock className="skeleton--card" />
        <SkeletonBlock className="skeleton--card" />
      </div>
    </div>
  );
}
