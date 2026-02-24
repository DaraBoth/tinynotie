'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

export function TokenExpirationHandler() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (!token) return;

    // Check token expiration
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const timeUntilExpiration = expirationTime - currentTime;

      if (timeUntilExpiration <= 0) {
        // Token already expired
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
      console.error('Error parsing token:', error);
      handleTokenExpiration();
    }
  }, [token]);

  const handleTokenExpiration = () => {
    logout();
    toast.error('Your session has expired. Please login again.');
    router.push('/login');
  };

  return null;
}
