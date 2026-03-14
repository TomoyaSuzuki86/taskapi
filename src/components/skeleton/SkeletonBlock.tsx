import type { CSSProperties } from 'react';

type SkeletonBlockProps = {
  className?: string;
  style?: CSSProperties;
};

export function SkeletonBlock({ className = '', style }: SkeletonBlockProps) {
  return (
    <div
      className={`skeleton ${className}`.trim()}
      aria-hidden="true"
      style={style}
    />
  );
}
