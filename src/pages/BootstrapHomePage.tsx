import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppBootstrapPanel } from '@/features/auth/components/AppBootstrapPanel';
import { ProjectListSkeleton } from '@/components/skeleton/ProjectListSkeleton';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const placeholderProjects = [
  {
    id: 'planning-hub',
    name: 'Planning hub',
    description:
      'Future project list cards will render here after auth and Firestore wiring.',
  },
  {
    id: 'writing-queue',
    name: 'Writing queue',
    description:
      'This placeholder exists only to stabilize layout and navigation during bootstrap.',
  },
];

export function BootstrapHomePage() {
  const [showSkeleton, setShowSkeleton] = useState(true);
  const projects = useMemo(() => placeholderProjects, []);

  return (
    <div className="stack stack--page">
      <AppBootstrapPanel />
      <Card>
        <div className="section-heading">
          <div>
            <p className="section-heading__eyebrow">Projects</p>
            <h2>Home shell</h2>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowSkeleton((value) => !value)}
          >
            {showSkeleton ? 'Show cards' : 'Show skeleton'}
          </Button>
        </div>
        <p className="muted-copy">
          Bootstrap keeps project management out of scope. This screen exists to
          prove the future home route, loading treatment, and responsive shell.
        </p>
      </Card>

      {showSkeleton ? (
        <ProjectListSkeleton />
      ) : (
        <div className="stack">
          {projects.map((project) => (
            <Card key={project.id}>
              <div className="stack stack--tight">
                <div className="section-heading section-heading--compact">
                  <div>
                    <h3>{project.name}</h3>
                    <p className="muted-copy">{project.description}</p>
                  </div>
                  <Button type="button" variant="ghost">
                    Placeholder
                  </Button>
                </div>
                <Link className="text-link" to={`/projects/${project.id}`}>
                  Open project shell
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
