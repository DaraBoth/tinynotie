'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

/**
 * Hook for protected pages.
 *
 * - Waits for the Zustand store to finish hydrating from localStorage before
 *   making any auth decisions (prevents false redirect on page refresh).
 * - If the store is hydrated and the user is NOT authenticated, redirects to
 *   `redirectTo` (default: '/login').
 * - The middleware.js handles the actual server-side redirect; this hook covers
 *   the brief CSR hydration gap on client-side navigation.
 *
 * @returns {{ hasHydrated: boolean, isAuthenticated: boolean, user: object|null }}
 */
export function useAuthGuard(redirectTo = '/login') {
  const router = useRouter();
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!hasHydrated) return; // wait — store is still reading localStorage
    if (!isAuthenticated) {
      router.push(redirectTo);
    }
  }, [hasHydrated, isAuthenticated, router, redirectTo]);

  return { hasHydrated, isAuthenticated, user };
}
