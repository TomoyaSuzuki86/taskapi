import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ProjectListSkeleton } from '@/components/skeleton/ProjectListSkeleton';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useAuth } from '@/features/auth/useAuth';
import { useProjects } from '@/features/projects/useProjects';
import { formatDateLabel, formatProjectStateLabel } from '@/lib/ui/display';

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
        <div className="section-heading page-intro">
          <div>
            <p className="section-heading__eyebrow">Workspace overview</p>
            <h2>今日のワークスペース</h2>
            <p className="muted-copy">
              {user?.displayName ?? 'あなた'}
              の作業をプロジェクト単位で整理できます。
              必要なものだけを上から順に確認できる、静かなホーム画面です。
            </p>
          </div>
          <div className="dashboard-metrics">
            <span className="pill">{projects.length}件の進行中</span>
            <span className="pill">{deletedProjects.length}件の削除済み</span>
          </div>
        </div>
      </Card>

      <div className="dashboard-grid">
        <Card tone="muted">
          <div className="stack">
            <div className="section-heading">
              <div>
                <p className="section-heading__eyebrow">Create project</p>
                <h3>新しいプロジェクト</h3>
              </div>
            </div>
            <p className="muted-copy">
              まずは作業単位をひとつ作成します。詳細はあとからいつでも調整できます。
            </p>
            <Input
              label="プロジェクト名"
              value={draft.name}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
            />
            <Textarea
              label="説明"
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
              {isCreating ? '作成中...' : 'プロジェクトを作成'}
            </Button>
          </div>
        </Card>

        <div className="stack stack--page">
          <Card>
            <div className="section-heading">
              <div>
                <p className="section-heading__eyebrow">Projects</p>
                <h3>進行中のプロジェクト</h3>
              </div>
              <span className="pill">{projects.length}件</span>
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
                プロジェクト一覧を読み込めませんでした。
              </p>
            ) : projects.length === 0 ? (
              <div className="empty-state">
                <h3>まだプロジェクトがありません</h3>
                <p className="muted-copy">
                  最初のプロジェクトを作成して、作業の土台を作りましょう。
                </p>
              </div>
            ) : (
              <div className="workspace-list">
                {projects.map((project) => (
                  <Card key={project.id}>
                    <div className="workspace-row">
                      <div className="workspace-row__main">
                        <div className="workspace-row__topline">
                          <h3>{project.name}</h3>
                          <span
                            className={`pill ${project.archived ? 'pill--warning' : 'pill--ready'}`}
                          >
                            {formatProjectStateLabel(project.archived)}
                          </span>
                        </div>
                        <p className="muted-copy">
                          {project.description ?? '説明はまだありません。'}
                        </p>
                        <p className="workspace-row__meta">
                          最終更新 {formatDateLabel(project.updatedAt)}
                        </p>
                      </div>
                      <div className="button-row workspace-row__actions">
                        <Link
                          className="text-link"
                          to={`/projects/${project.id}`}
                        >
                          開く
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
                                  : 'プロジェクトの更新に失敗しました。',
                              );
                            })
                          }
                        >
                          {project.archived ? '再開' : 'アーカイブ'}
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={busyProjectId === project.id}
                          onClick={() => {
                            if (
                              !window.confirm(
                                'このプロジェクトを削除して、関連タスクを一覧から非表示にしますか？',
                              )
                            ) {
                              return;
                            }

                            void deleteProject(project.id).catch((error) => {
                              setLocalError(
                                error instanceof Error
                                  ? error.message
                                  : 'プロジェクトの削除に失敗しました。',
                              );
                            });
                          }}
                        >
                          削除
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
                <h3>削除済みプロジェクト</h3>
              </div>
              <span className="pill">{deletedProjects.length}件</span>
            </div>

            {deletedProjects.length === 0 ? (
              <div className="empty-state">
                <h3>削除済みプロジェクトはありません</h3>
                <p className="muted-copy">
                  削除したプロジェクトはここに残り、必要なときに復元できます。
                </p>
              </div>
            ) : (
              <div className="workspace-list">
                {deletedProjects.map((project) => (
                  <Card key={project.id}>
                    <div className="workspace-row">
                      <div className="workspace-row__main">
                        <h3>{project.name}</h3>
                        <p className="workspace-row__meta">
                          削除日 {formatDateLabel(project.deletedAt)}
                        </p>
                      </div>
                      <div className="button-row workspace-row__actions">
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={busyProjectId === project.id}
                          onClick={() =>
                            void restoreProject(project.id).catch((error) => {
                              setLocalError(
                                error instanceof Error
                                  ? error.message
                                  : 'プロジェクトの復元に失敗しました。',
                              );
                            })
                          }
                        >
                          復元
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
