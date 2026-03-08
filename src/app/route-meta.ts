export const shellRouteMeta = [
  { to: '/', label: 'ホーム', title: 'ワークスペース' },
  { to: '/history', label: '履歴', title: '履歴' },
  { to: '/settings', label: '設定', title: '設定' },
] as const;

export function resolveShellRouteTitle(pathname: string) {
  return (
    shellRouteMeta.find((route) => route.to === pathname)?.title ??
    'プロジェクト'
  );
}
