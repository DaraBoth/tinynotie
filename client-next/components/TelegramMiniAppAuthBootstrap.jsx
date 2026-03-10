'use client';

import { useEffect, useRef } from 'react';
import { api } from '@/api/apiClient';
import { useAuthStore } from '@/store/authStore';

const TG_AUTH_PENDING_KEY = 'tg-miniapp-auth-pending';

const decodeMaybeEncoded = (value = '') => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
};

const readInitDataFromUrl = () => {
  if (typeof window === 'undefined') return '';

  const search = new URLSearchParams(window.location.search || '');
  const fromSearch = search.get('tgWebAppData');
  if (fromSearch) return decodeMaybeEncoded(fromSearch);

  const rawHash = String(window.location.hash || '').replace(/^#/, '');
  if (!rawHash) return '';

  const hashParams = new URLSearchParams(rawHash);
  const fromHash = hashParams.get('tgWebAppData');
  if (fromHash) return decodeMaybeEncoded(fromHash);

  return '';
};

const resolveInitData = () => {
  if (typeof window === 'undefined') return { tg: null, initData: '' };

  const tg = window?.['Telegram']?.WebApp || null;
  const fromTg = decodeMaybeEncoded(tg?.initData || '');
  if (fromTg) return { tg, initData: fromTg };

  const fromUrl = readInitDataFromUrl();
  return { tg, initData: fromUrl };
};

export function TelegramMiniAppAuthBootstrap() {
  const hasTriedRef = useRef(false);
  const setAuth = useAuthStore((state) => state.setAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const timerRef = useRef(null);

  useEffect(() => {
    if (hasTriedRef.current || isAuthenticated) return;

    if (typeof window === 'undefined') return;

    const maxAttempts = 12;
    const attemptIntervalMs = 250;

    const bootstrap = async (attempt = 1) => {
      if (hasTriedRef.current || isAuthenticated) return;

      const { tg, initData } = resolveInitData();

      // Let Telegram know UI is ready ASAP to avoid client-side timeout spinner.
      if (tg) {
        try {
          tg.ready();
          tg.expand();
        } catch {
          // Best-effort only.
        }
      }

      if (!initData) {
        if (attempt < maxAttempts) {
          timerRef.current = window.setTimeout(() => {
            bootstrap(attempt + 1);
          }, attemptIntervalMs);
        }
        return;
      }

      hasTriedRef.current = true;
      window.sessionStorage.setItem(TG_AUTH_PENDING_KEY, '1');

      try {
        const response = await api.telegramMiniAppLogin(initData, { timeout: 12000 });
        const data = response?.data || {};

        if (!data?.status || !data?.token) {
          window.sessionStorage.removeItem(TG_AUTH_PENDING_KEY);
          return;
        }

        setAuth(data.token, { usernm: data.usernm, _id: data._id });
        window.sessionStorage.removeItem(TG_AUTH_PENDING_KEY);
      } catch (error) {
        const msg = error?.response?.data?.message;
        const reason = error?.response?.data?.reason;
        if (msg) {
          console.warn('[Telegram Mini App] auth failed:', msg, reason || '');
        }
        window.sessionStorage.removeItem(TG_AUTH_PENDING_KEY);
      }
    };

    bootstrap();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(TG_AUTH_PENDING_KEY);
      }
    };
  }, [isAuthenticated, setAuth]);

  return null;
}
