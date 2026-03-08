import type { ReactNode } from 'react';

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  badgeLabel?: string;
};

export function AppHeader({
  action,
  badgeLabel,
  subtitle,
  title,
}: AppHeaderProps) {
  return (
    <header className="app-header">
      <div>
        <p className="app-header__eyebrow">タスカピ</p>
        <h1>{title}</h1>
        {subtitle ? <p className="app-header__subtitle">{subtitle}</p> : null}
      </div>
      {action ? (
        action
      ) : badgeLabel ? (
        <div className="app-header__status">{badgeLabel}</div>
      ) : null}
    </header>
  );
}
