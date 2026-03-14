import type { PropsWithChildren } from 'react';
import styles from './Card.module.css';

type CardVariant = 'default' | 'muted';

interface CardProps {
  variant?: CardVariant;
}

export function Card({
  children,
  variant = 'default',
}: PropsWithChildren<CardProps>) {
  return (
    <section className={`${styles.card} ${styles[variant]}`}>
      {children}
    </section>
  );
}
