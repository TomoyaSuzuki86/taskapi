import type { PropsWithChildren } from 'react';
import styles from './Dialog.module.css';

type DialogProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
};

export function Dialog({
  isOpen,
  onClose,
  title,
  children,
}: PropsWithChildren<DialogProps>) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.dialog}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <div className={styles.header}>
          <h2 id="dialog-title" className={styles.title}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={styles.closeButton}
            aria-label="閉じる"
          >
            ×
          </button>
        </div>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
