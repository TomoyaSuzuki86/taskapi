import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import type { Project } from '@/services/contracts';
import styles from './ProjectCard.module.css';

type ProjectCardProps = {
  project: Project;
};

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link to={`/projects/${project.id}`} className={styles.link}>
      <Card>
        <div className={styles.header}>
          <h3 className={styles.title}>{project.name}</h3>
          <span className={styles.taskCount}>
            {project.archived ? 'アーカイブ' : '進行中'}
          </span>
        </div>
        {project.description ? (
          <p className={styles.description}>{project.description}</p>
        ) : null}
      </Card>
    </Link>
  );
}
