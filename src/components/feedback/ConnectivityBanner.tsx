import { useNetworkStatus } from '@/features/pwa/useNetworkStatus';

export function ConnectivityBanner() {
  const { isOffline } = useNetworkStatus();

  if (!isOffline) {
    return null;
  }

  return (
    <p className="connectivity-banner" role="status">
      オフラインです。保存済みの画面は開けますが、同期や更新は通信が戻るまで反映されません。
    </p>
  );
}
