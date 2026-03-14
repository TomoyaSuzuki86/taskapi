import type { PropsWithChildren } from 'react';
import styles from './EmptyState.module.css';

type EmptyStateProps = {
  title: string;
};

export function EmptyState({
  title,
  children,
}: PropsWithChildren<EmptyStateProps>) {
  return (
    <div className={styles.container}>
      <div className={styles.icon} aria-hidden="true">
        □
      </div>
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.description}>{children}</div>
    </div>
  );
}
