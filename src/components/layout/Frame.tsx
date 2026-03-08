import type { PropsWithChildren } from 'react';

export function Frame({ children }: PropsWithChildren) {
  return <div className="app-frame">{children}</div>;
}
