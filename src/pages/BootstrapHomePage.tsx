import { useState } from 'react';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Button } from '@/components/ui/Button';
import { FAB } from '@/components/ui/FAB';
import { useAuth } from '@/features/auth/useAuth';
import { ProjectCard } from '@/features/projects/components/ProjectCard';
import { ProjectCardSkeleton } from '@/features/projects/components/ProjectCardSkeleton';
import { ProjectCreateSheet } from '@/features/projects/components/ProjectCreateSheet';
import { useProjects } from '@/features/projects/useProjects';
import styles from './BootstrapHomePage.module.css';

export function BootstrapHomePage() {
  const { user } = useAuth();
  const {
    projects,
    deletedProjects,
    restoreProject,
    busyProjectId,
    status,
    errorMessage,
  } = useProjects(user!.uid);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const renderProjects = () => {
    if (status === 'loading') {
      return (
        <>
          <ProjectCardSkeleton />
          <ProjectCardSkeleton />
          <ProjectCardSkeleton />
        </>
      );
    }

    if (status === 'error') {
      return (
        <div className={styles.notice}>
          <p>プロジェクトの読み込みに失敗しました。</p>
          <p>{errorMessage}</p>
        </div>
      );
    }

    if (projects.length === 0) {
      return (
        <EmptyState title="プロジェクトがありません">
          <p>最初のプロジェクトを作成して、タスク管理を始めましょう。</p>
        </EmptyState>
      );
    }

    return projects.map((project) => (
      <ProjectCard key={project.id} project={project} />
    ));
  };

  return (
    <>
      <div className={styles.container}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>進行中のプロジェクト</h2>
          <div className={styles.grid}>{renderProjects()}</div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>削除済みプロジェクト</h2>
          {deletedProjects.length === 0 ? (
            <EmptyState title="削除済みプロジェクトはありません">
              <p>
                削除したプロジェクトはここに残り、必要なときに復元できます。
              </p>
            </EmptyState>
          ) : (
            <div className={styles.deletedList}>
              {deletedProjects.map((project) => (
                <div key={project.id} className={styles.deletedItem}>
                  <div>
                    <h3>{project.name}</h3>
                    <p>
                      削除日:{' '}
                      {project.deletedAt
                        ? new Date(project.deletedAt).toLocaleDateString(
                            'ja-JP',
                          )
                        : '不明'}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={busyProjectId === project.id}
                    onClick={() => void restoreProject(project.id)}
                  >
                    復元
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
      <FAB aria-label="追加" onClick={() => setIsSheetOpen(true)} />
      <ProjectCreateSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
      />
    </>
  );
}
