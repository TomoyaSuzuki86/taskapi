import type { InputHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function Input({ id, label, ...props }: InputProps) {
  const fallbackId = id ?? label.toLowerCase().replace(/\s+/g, '-');

  return (
    <label className="field" htmlFor={fallbackId}>
      <span className="field__label">{label}</span>
      <input className="field__input" id={fallbackId} {...props} />
    </label>
  );
}
