import type { PropsWithChildren } from 'react';
import styles from './BottomSheet.module.css';

type BottomSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
};

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
}: PropsWithChildren<BottomSheetProps>) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.sheet}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bottom-sheet-title"
      >
        <div className={styles.header}>
          <h2 id="bottom-sheet-title" className={styles.title}>
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
