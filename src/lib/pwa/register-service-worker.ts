import { registerSW } from 'virtual:pwa-register';

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  let hasReloaded = false;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hasReloaded) {
      return;
    }

    hasReloaded = true;
    window.location.reload();
  });

  const updateServiceWorker = registerSW({
    immediate: true,
    onNeedRefresh() {
      void updateServiceWorker(true);
    },
    onRegisteredSW(_workerUrl, registration) {
      void registration?.update();
    },
  });
}
