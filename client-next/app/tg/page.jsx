'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function TelegramMiniAppEntryPage() {
  const router = useRouter();
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (!hasHydrated) return;
    if (isAuthenticated) {
      router.replace('/home');
    }
  }, [hasHydrated, isAuthenticated, router]);

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-5">
      <div className="w-full max-w-sm rounded-2xl border border-border/40 bg-card/80 backdrop-blur-sm p-5 text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">TinyNotie Mini App</p>
        <h1 className="mt-2 text-lg font-bold">Connecting your Telegram session...</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Please wait a moment. If this screen stays here, ensure your Telegram account is registered with TinyNotie bot.
        </p>
      </div>
    </main>
  );
}
