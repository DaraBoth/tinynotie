'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

export function TokenExpirationHandler() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const token = useAuthStore((state) => state.token);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const hasShownExpirationToast = useRef(false);

  useEffect(() => {
    // Wait for store to hydrate before checking token
    if (!hasHydrated) return;
    
    if (!token) {
      hasShownExpirationToast.current = false;
      return;
    }

    // Check token expiration
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const timeUntilExpiration = expirationTime - currentTime;

      console.log('[Auth] Token will expire in', Math.floor(timeUntilExpiration / 1000 / 60), 'minutes');

      if (timeUntilExpiration <= 0) {
        // Token already expired
        console.warn('[Auth] Token has expired');
        handleTokenExpiration();
        return;
      }

      // Set timeout to logout when token expires
      const timeoutId = setTimeout(() => {
        handleTokenExpiration();
      }, timeUntilExpiration);

      // Show warning 5 minutes before expiration
      const warningTime = timeUntilExpiration - 5 * 60 * 1000;
      if (warningTime > 0) {
        const warningTimeoutId = setTimeout(() => {
          toast.warning('Your session will expire in 5 minutes', {
            duration: 10000,
          });
        }, warningTime);

        return () => {
          clearTimeout(timeoutId);
          clearTimeout(warningTimeoutId);
        };
      }

      return () => clearTimeout(timeoutId);
    } catch (error) {
      console.error('[Auth] Error parsing token:', error);
      // Don't logout on parse error - might be a malformed token but still valid
      // handleTokenExpiration();
    }
  }, [token, hasHydrated]);

  const handleTokenExpiration = () => {
    if (hasShownExpirationToast.current) return;
    hasShownExpirationToast.current = true;
    
    logout();
    toast.error('Your session has expired. Please login again.');
    router.push('/login');
  };

  return null;
}
