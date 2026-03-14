import { useNetworkStatus } from '@/features/pwa/useNetworkStatus';

export function ConnectivityBanner() {
  const { isOffline } = useNetworkStatus();

  if (!isOffline) {
    return null;
  }

  return (
    <p className="connectivity-banner" role="status">
      オフラインです。読み込み済みの画面は開けますが、作成や更新は接続が戻るまで保存されません。
    </p>
  );
}
