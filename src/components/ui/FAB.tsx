import type { ComponentPropsWithoutRef } from 'react';
import styles from './FAB.module.css';

export function FAB(props: ComponentPropsWithoutRef<'button'>) {
  return (
    <button className={styles.fab} {...props}>
      +
    </button>
  );
}
