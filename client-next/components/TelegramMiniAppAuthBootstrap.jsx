'use client';

import { useEffect, useRef } from 'react';
import { api } from '@/api/apiClient';
import { useAuthStore } from '@/store/authStore';

export function TelegramMiniAppAuthBootstrap() {
  const hasTriedRef = useRef(false);
  const setAuth = useAuthStore((state) => state.setAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (hasTriedRef.current || isAuthenticated) return;

    if (typeof window === 'undefined') return;
    const tg = window?.['Telegram']?.WebApp;
    const initData = tg?.initData || '';

    if (!tg || !initData) return;

    hasTriedRef.current = true;

    const bootstrap = async () => {
      try {
        const response = await api.telegramMiniAppLogin(initData);
        const data = response?.data || {};

        if (!data?.status || !data?.token) {
          return;
        }

        setAuth(data.token, { usernm: data.usernm, _id: data._id });

        try {
          tg.ready();
          tg.expand();
        } catch {
          // Non-blocking: WebApp methods are best-effort.
        }
      } catch (error) {
        const msg = error?.response?.data?.message;
        if (msg) {
          console.warn('[Telegram Mini App] auth failed:', msg);
        }
      }
    };

    bootstrap();
  }, [isAuthenticated, setAuth]);

  return null;
}
