type SkeletonBlockProps = {
  className?: string;
};

export function SkeletonBlock({ className = '' }: SkeletonBlockProps) {
  return <div className={`skeleton ${className}`.trim()} aria-hidden="true" />;
}
