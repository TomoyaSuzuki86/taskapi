import { useNetworkStatus } from '@/features/pwa/useNetworkStatus';

export function ConnectivityBanner() {
  const { isOffline } = useNetworkStatus();

  if (!isOffline) {
    return null;
  }

  return (
    <p className="connectivity-banner" role="status">
      Offline mode. Cached screens can still open, but syncing and saves are
      unavailable until the network returns.
    </p>
  );
}
