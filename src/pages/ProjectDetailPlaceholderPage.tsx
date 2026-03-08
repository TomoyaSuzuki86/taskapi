import { useParams } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { PageSkeleton } from '@/components/skeleton/PageSkeleton';

export function ProjectDetailPlaceholderPage() {
  const { projectId } = useParams();

  return (
    <div className="stack stack--page">
      <Card>
        <p className="section-heading__eyebrow">Project route</p>
        <h2>{projectId}</h2>
        <p className="muted-copy">
          Project CRUD, task lists, and data loading remain out of scope for
          bootstrap. This route exists so the router and layout can stabilize
          before feature work begins.
        </p>
      </Card>
      <PageSkeleton />
    </div>
  );
}
