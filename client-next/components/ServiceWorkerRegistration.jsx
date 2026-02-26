'use client';

import { useEffect } from 'react';

/**
 * Registers the service worker on mount (client-side only).
 * Renders nothing – purely a side-effect component.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              // A new version is available – you could show a toast here
              console.info('[SW] New version available. Refresh to update.');
            }
          });
        });
      } catch (err) {
        console.error('[SW] Registration failed:', err);
      }
    };

    // Delay registration until after page load to avoid competing with
    // critical resources during initial paint.
    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', register);
      return () => window.removeEventListener('load', register);
    }
  }, []);

  return null;
}
