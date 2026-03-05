'use client';

import { Suspense, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2, Link2, MessageSquare, ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { SpaceSky } from '@/components/SpaceSky';
import { Loading } from '@/components/Loading';

export default function RegisterPage() {
  return (
    <Suspense fallback={<Loading />}>
      <RegisterGuide />
    </Suspense>
  );
}

function RegisterGuide() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const botUsername = useMemo(() => process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'TinyNotieBot', []);

  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      router.replace('/home');
    }
  }, [hasHydrated, isAuthenticated, router]);

  const openTelegramBot = () => {
    try {
      const link = `https://t.me/${botUsername}`;
      const popup = window.open(link, '_blank');
      if (!popup) window.location.href = link;
      toast.success('Opening TinyNotie Telegram bot...');
    } catch {
      toast.error('Failed to open Telegram bot');
    }
  };

  if (!hasHydrated) return <Loading text="Loading..." />;

  return (
    <main className="relative min-h-screen flex flex-col md:flex-row overflow-hidden bg-background">
      <SpaceSky />

      <div className="relative flex-[1.2] hidden md:flex flex-col justify-center px-12 lg:px-24 overflow-hidden border-r border-border/10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-blue-600/5 -z-10" />

        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 12, repeat: Infinity }}
          className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[120px] -z-10"
        />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-10 z-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-foreground/5 border border-foreground/10 text-foreground text-[10px] font-black uppercase tracking-[0.3em] backdrop-blur-md">
            <Zap className="h-3 w-3 text-blue-500 animate-pulse" /> Telegram Required
          </div>

          <div className="space-y-6">
            <h1 className="text-6xl lg:text-8xl font-black tracking-tighter leading-[0.85] uppercase italic text-foreground">
              Register <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-primary to-blue-500 bg-[length:200%_auto] animate-gradient">via Telegram</span>
            </h1>
            <p className="text-xl text-muted-foreground/60 font-medium leading-relaxed max-w-md italic border-l-2 border-primary/20 pl-6">
              For security, every TinyNotie account must be created and linked through Telegram bot.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 pt-4">
            {[
              { icon: ShieldCheck, label: 'Verified Identity' },
              { icon: Zap, label: 'Fast Onboarding' },
              { icon: MessageSquare, label: 'Bot Guided' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="flex items-center gap-3 px-6 py-4 rounded-3xl bg-foreground/[0.03] border border-foreground/5 backdrop-blur-xl"
              >
                <item.icon className="h-5 w-5 text-blue-500" />
                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">{item.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center px-8 lg:px-20 relative z-20 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-full max-w-[420px] space-y-10 py-12"
        >
          <div className="space-y-4">
            <Link href="/login" className="inline-flex items-center text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 hover:text-primary transition-colors group mb-4">
              <ArrowLeft className="mr-2 h-3 w-3 group-hover:-translate-x-1 transition-transform" /> Back to Login
            </Link>
            <h2 className="text-5xl font-black tracking-tighter uppercase italic text-foreground leading-none">
              Start in <br />
              <span className="text-primary tracking-normal">Telegram.</span>
            </h2>
          </div>

          <div className="rounded-2xl border border-border/30 bg-muted/20 p-5 space-y-3 text-sm text-muted-foreground">
            <p><span className="text-foreground font-semibold">1.</span> Open TinyNotie bot.</p>
            <p><span className="text-foreground font-semibold">2.</span> Send <span className="font-semibold">/register</span>.</p>
            <p><span className="text-foreground font-semibold">3.</span> Bot asks username, then password.</p>
            <p><span className="text-foreground font-semibold">4.</span> Return and login in app.</p>
          </div>

          <div className="space-y-4">
            <Button
              onClick={openTelegramBot}
              className="w-full h-14 bg-[#0088cc] hover:bg-[#0077b5] text-white rounded-2xl font-bold"
            >
              <Link2 className="mr-2 h-4 w-4" /> Open Telegram Bot
            </Button>

            <Button
              onClick={() => router.push('/login')}
              className="w-full h-14 rounded-2xl font-bold"
            >
              Go to Login
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Existing linked account? Use <span className="font-semibold">/reset_password</span> in Telegram if needed.
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-primary/30 bg-primary/10">
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Web registration is disabled by policy.
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
