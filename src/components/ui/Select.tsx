import type { ComponentPropsWithoutRef } from 'react';
import styles from './Select.module.css';

interface SelectProps extends ComponentPropsWithoutRef<'select'> {
  label: string;
  options: { value: string; label: string }[];
}

export function Select({ label, options, ...props }: SelectProps) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      <select className={styles.select} {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
