import { Card } from '@/components/ui/Card';
import { PageSkeleton } from '@/components/skeleton/PageSkeleton';

export function HistoryPlaceholderPage() {
  return (
    <div className="stack stack--page">
      <Card>
        <p className="section-heading__eyebrow">History route</p>
        <h2>History shell</h2>
        <p className="muted-copy">
          History retention and restore are hard requirements, but they are not
          implemented in bootstrap. This placeholder protects the route boundary
          and loading layout for the dedicated phase.
        </p>
      </Card>
      <PageSkeleton />
    </div>
  );
}
