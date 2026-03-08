import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ProjectListSkeleton } from '@/components/skeleton/ProjectListSkeleton';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useAuth } from '@/features/auth/useAuth';
import { useProjects } from '@/features/projects/useProjects';

export function BootstrapHomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [draft, setDraft] = useState({
    name: '',
    description: '',
  });
  const [localError, setLocalError] = useState<string | null>(null);
  const {
    createProject,
    deletedProjects,
    deleteProject,
    busyProjectId,
    errorMessage,
    isCreating,
    projects,
    restoreProject,
    status,
    updateProject,
  } = useProjects(user!.uid);
  const canCreateProject = draft.name.trim().length > 0;

  return (
    <div className="stack stack--page">
      <Card>
        <div className="section-heading">
          <div>
            <p className="section-heading__eyebrow">Authenticated home</p>
            <h2>Session active</h2>
          </div>
          <span className="pill pill--ready">Signed in</span>
        </div>
        <p className="muted-copy">
          Signed in as {user?.displayName ?? 'your Google account'}
          {user?.email ? ` (${user.email})` : ''}. Route protection and session
          persistence are now active.
        </p>
      </Card>
      <Card tone="muted">
        <div className="stack">
          <div className="section-heading">
            <div>
              <p className="section-heading__eyebrow">Create project</p>
              <h3>New project</h3>
            </div>
          </div>
          <Input
            label="Project name"
            value={draft.name}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                name: event.target.value,
              }))
            }
          />
          <Textarea
            label="Description"
            rows={3}
            value={draft.description}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
          />
          <Button
            type="button"
            disabled={isCreating || !canCreateProject}
            onClick={() =>
              void createProject(draft)
                .then((projectId) => {
                  setDraft({ name: '', description: '' });
                  setLocalError(null);
                  navigate(`/projects/${projectId}`);
                })
                .catch((error) => {
                  setLocalError(
                    error instanceof Error
                      ? error.message
                      : 'Project creation failed.',
                  );
                })
            }
          >
            {isCreating ? 'Creating...' : 'Create project'}
          </Button>
        </div>
      </Card>

      <Card>
        <div className="section-heading">
          <div>
            <p className="section-heading__eyebrow">Projects</p>
            <h3>Your workspace</h3>
          </div>
          <span className="pill">{projects.length} projects</span>
        </div>

        {errorMessage || localError ? (
          <p className="notice-inline" role="alert">
            {errorMessage ?? localError}
          </p>
        ) : null}

        {status === 'loading' ? (
          <ProjectListSkeleton />
        ) : status === 'error' ? (
          <p className="muted-copy">
            Firestore project data could not be loaded right now.
          </p>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <h3>No projects yet</h3>
            <p className="muted-copy">
              Create your first project to start tracking tasks.
            </p>
          </div>
        ) : (
          <div className="stack">
            {projects.map((project) => (
              <Card key={project.id}>
                <div className="stack stack--tight">
                  <div className="section-heading section-heading--compact">
                    <div>
                      <h3>{project.name}</h3>
                      <p className="muted-copy">
                        {project.description ?? 'No description yet.'}
                      </p>
                    </div>
                    <span
                      className={`pill ${project.archived ? 'pill--warning' : 'pill--ready'}`}
                    >
                      {project.archived ? 'Archived' : 'Active'}
                    </span>
                  </div>
                  <div className="button-row">
                    <Link className="text-link" to={`/projects/${project.id}`}>
                      Open project
                    </Link>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={busyProjectId === project.id}
                      onClick={() =>
                        void updateProject(project.id, {
                          name: project.name,
                          description: project.description ?? '',
                          archived: !project.archived,
                        }).catch((error) => {
                          setLocalError(
                            error instanceof Error
                              ? error.message
                              : 'Project update failed.',
                          );
                        })
                      }
                    >
                      {project.archived ? 'Unarchive' : 'Archive'}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={busyProjectId === project.id}
                      onClick={() => {
                        if (
                          !window.confirm(
                            'Delete this project and hide all of its tasks?',
                          )
                        ) {
                          return;
                        }

                        void deleteProject(project.id).catch((error) => {
                          setLocalError(
                            error instanceof Error
                              ? error.message
                              : 'Project delete failed.',
                          );
                        });
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      <Card tone="muted">
        <div className="section-heading">
          <div>
            <p className="section-heading__eyebrow">Deleted items</p>
            <h3>Restore projects</h3>
          </div>
          <span className="pill">{deletedProjects.length} deleted</span>
        </div>

        {deletedProjects.length === 0 ? (
          <div className="empty-state">
            <h3>No deleted projects</h3>
            <p className="muted-copy">
              Deleted projects will appear here until they are restored.
            </p>
          </div>
        ) : (
          <div className="stack">
            {deletedProjects.map((project) => (
              <Card key={project.id}>
                <div className="stack stack--tight">
                  <div className="section-heading section-heading--compact">
                    <div>
                      <h3>{project.name}</h3>
                      <p className="muted-copy">
                        Deleted {project.deletedAt?.slice(0, 10)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={busyProjectId === project.id}
                      onClick={() =>
                        void restoreProject(project.id).catch((error) => {
                          setLocalError(
                            error instanceof Error
                              ? error.message
                              : 'Project restore failed.',
                          );
                        })
                      }
                    >
                      Restore
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
