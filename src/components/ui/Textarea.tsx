import type { TextareaHTMLAttributes } from 'react';

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
};

export function Textarea({ id, label, ...props }: TextareaProps) {
  const fallbackId = id ?? label.toLowerCase().replace(/\s+/g, '-');

  return (
    <label className="field" htmlFor={fallbackId}>
      <span className="field__label">{label}</span>
      <textarea
        className="field__input field__textarea"
        id={fallbackId}
        {...props}
      />
    </label>
  );
}
