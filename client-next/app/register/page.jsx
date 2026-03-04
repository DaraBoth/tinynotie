'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import {
  ArrowLeft,
  Send,
  LogIn,
  Copy,
  CheckCircle2,
  MessageSquare,
  KeyRound,
  Zap,
  Wallet,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  Info,
  Lock,
  UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { SpaceSky } from '@/components/SpaceSky';
import { Loading } from '@/components/Loading';

export default function RegisterPage() {
  return (
    <Suspense fallback={<Loading />}>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const [copiedCommand, setCopiedCommand] = useState(null);

  // Redirect if already logged in
  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      router.replace('/home');
    }
  }, [hasHydrated, isAuthenticated, router]);

  const copyToClipboard = (text, commandType) => {
    navigator.clipboard.writeText(text);
    setCopiedCommand(commandType);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  const steps = [
    {
      number: 1,
      icon: MessageSquare,
      label: 'Open Telegram Bot',
      description: 'Click the button below to start your journey with our bot',
      action: (
        <Button
          className="w-full h-12 bg-[#0088cc] hover:bg-[#0077b5] text-white rounded-2xl font-bold transition-all hover:scale-[1.02]"
          onClick={() => window.open('https://t.me/tinynotie_bot', '_blank')}
        >
          <Send className="mr-2 h-4 w-4" />
          Open @TinyNotie
        </Button>
      ),
    },
    {
      number: 2,
      icon: Send,
      label: 'Send Command',
      description: 'Send this command to the bot to create your account',
      action: (
        <div className="relative group">
          <div className="flex items-center gap-2 p-4 bg-muted/20 border border-border/40 rounded-2xl font-mono text-sm group-focus-within:border-primary/50 transition-all">
            <code className="flex-1 text-primary font-bold">/register</code>
            <button
              onClick={() => copyToClipboard('/register', 'register')}
              className="p-2 hover:bg-background/40 rounded-lg transition-colors"
            >
              {copiedCommand === 'register' ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>
      ),
    },
    {
      number: 3,
      icon: KeyRound,
      label: 'Set Password',
      description: 'Secure your account with a personal secret key',
      action: (
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-4 bg-muted/20 border border-border/40 rounded-2xl font-mono text-xs overflow-hidden">
            <code className="flex-1 text-primary font-bold truncate">/password YourNewPassword</code>
            <button
              onClick={() => copyToClipboard('/password YourNewPassword', 'password')}
              className="p-2 hover:bg-background/40 rounded-lg transition-colors shrink-0"
            >
              {copiedCommand === 'password' ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </div>
          <div className="flex items-start gap-2 p-3 bg-red-500/5 border border-red-500/10 rounded-xl">
            <Info className="h-3 w-3 text-red-500 mt-0.5 shrink-0" />
            <p className="text-[10px] text-red-500/80 font-medium">Use a strong password (min 6 chars) that you don't use elsewhere.</p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <main className="relative min-h-screen flex flex-col md:flex-row overflow-hidden bg-background">
      <SpaceSky />

      {/* Visual / Brand Side */}
      <div className="relative flex-[1.2] hidden md:flex flex-col justify-center px-12 lg:px-24 overflow-hidden border-r border-border/10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-blue-600/5 -z-10" />

        {/* Animated Orbs */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 12, repeat: Infinity }}
          className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[120px] -z-10"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.05, 0.1, 0.05] }}
          transition={{ duration: 18, repeat: Infinity, delay: 1 }}
          className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] -z-10"
        />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-10 z-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-foreground/5 border border-foreground/10 text-foreground text-[10px] font-black uppercase tracking-[0.3em] backdrop-blur-md">
            <UserPlus className="h-3 w-3 text-blue-500 animate-pulse" /> New Operation
          </div>

          <div className="space-y-6">
            <h1 className="text-6xl lg:text-8xl font-black tracking-tighter leading-[0.85] uppercase italic text-foreground">
              Join the <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-primary to-blue-500 bg-[length:200%_auto] animate-gradient">Elite Squad</span>
            </h1>
            <p className="text-xl text-muted-foreground/60 font-medium leading-relaxed max-w-md italic border-l-2 border-primary/20 pl-6">
              Create your identity in seconds via Telegram. The smartest financial move you'll make today.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 pt-4">
            {[
              { icon: MessageSquare, label: "Bot Ops" },
              { icon: ShieldCheck, label: "Verified" },
              { icon: Zap, label: "Instant" },
              { icon: Wallet, label: "Always Free" }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + (i * 0.1) }}
                className="flex items-center gap-3 px-6 py-4 rounded-3xl bg-foreground/[0.03] border border-foreground/5 backdrop-blur-xl hover:bg-foreground/[0.05] hover:border-primary/20 transition-all cursor-default group"
              >
                <item.icon className="h-5 w-5 text-blue-500 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">{item.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Steps Side */}
      <div className="flex-1 flex flex-col justify-center items-center px-8 lg:px-20 relative z-20 overflow-y-auto">
        <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px] md:hidden -z-10" />

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-full max-w-[400px] space-y-12 py-12"
        >
          {/* Header */}
          <div className="space-y-4">
            <Link href="/login" className="inline-flex items-center text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 hover:text-primary transition-colors group mb-4">
              <ArrowLeft className="mr-2 h-3 w-3 group-hover:-translate-x-1 transition-transform" /> Back to Base
            </Link>
            <div className="h-1 w-12 bg-primary rounded-full mb-8" />
            <h2 className="text-5xl font-black tracking-tighter uppercase italic text-foreground leading-none">
              Deploy <br />
              <span className="text-primary tracking-normal">Account.</span>
            </h2>
            <p className="text-muted-foreground/60 font-bold text-sm uppercase tracking-widest italic">
              Execute registration steps.
            </p>
          </div>

          {/* Steps List */}
          <div className="space-y-10">
            {steps.map((step, idx) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + (idx * 0.1) }}
                className="relative pl-12 group"
              >
                {/* Step Line */}
                {idx < steps.length - 1 && (
                  <div className="absolute left-[15px] top-10 bottom-[-30px] w-[2px] bg-border/20 group-hover:bg-primary/20 transition-colors" />
                )}

                {/* Step Number */}
                <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-foreground/5 border-2 border-border/20 flex items-center justify-center text-[10px] font-black group-hover:border-primary/40 group-hover:text-primary transition-all z-10">
                  {step.number}
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-foreground">{step.label}</h3>
                    <p className="text-[10px] text-muted-foreground/60 font-bold uppercase italic">{step.description}</p>
                  </div>
                  {step.action}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Footer Info */}
          <div className="pt-8 space-y-8">
            <div className="p-6 rounded-3xl bg-secondary/20 border border-primary/10 flex items-start gap-4">
              <Lock className="h-5 w-5 text-primary mt-1 shrink-0" />
              <p className="text-xs text-muted-foreground/80 leading-relaxed font-medium italic">
                Secure deployment via Telegram bot ensures encrypted identity linking. Your vaults remain private.
              </p>
            </div>

            <Link href="/login" className="block">
              <Button
                variant="outline"
                className="w-full h-16 border-2 border-border/20 bg-transparent rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all hover:bg-primary/5 hover:border-primary/40 hover:text-primary"
              >
                Already Authorized? Login
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
