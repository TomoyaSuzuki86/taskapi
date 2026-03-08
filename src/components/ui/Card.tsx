import type { PropsWithChildren } from 'react';

type CardProps = PropsWithChildren<{
  tone?: 'default' | 'muted';
}>;

export function Card({ children, tone = 'default' }: CardProps) {
  return <section className={`card card--${tone}`}>{children}</section>;
}
