'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle2,
  Link2,
  User,
  Lock,
  Zap,
  ShieldCheck,
  ArrowRight,
  UserPlus,
  MessageSquare,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SpaceSky } from '@/components/SpaceSky';
import { Loading } from '@/components/Loading';
import { api } from '@/api/apiClient';

export default function RegisterPage() {
  return (
    <Suspense fallback={<Loading />}>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const [showPassword, setShowPassword] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [telegramLinking, setTelegramLinking] = useState(false);
  const [telegramLinked, setTelegramLinked] = useState(false);
  const [formData, setFormData] = useState({
    usernm: '',
    passwd: '',
    confirmPasswd: '',
  });

  // Redirect if already logged in
  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      router.replace('/home');
    }
  }, [hasHydrated, isAuthenticated, router]);

  const registerMutation = useMutation({
    mutationFn: (payload) => api.register(payload),
    onSuccess: (response) => {
      const { status, token, _id, usernm, message } = response.data;
      if (status && token) {
        setAuth(token, { _id, usernm: usernm || formData.usernm });
        toast.success(message || 'Account created successfully!');
      } else {
        toast.error('Registration failed');
      }
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Registration failed');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const username = formData.usernm.trim().toLowerCase();
    const password = formData.passwd;

    if (!username || !password || !formData.confirmPasswd) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (password !== formData.confirmPasswd) {
      toast.error('Passwords do not match');
      return;
    }

    registerMutation.mutate({ usernm: username, passwd: password });
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleLinkTelegram = async () => {
    try {
      setTelegramLinking(true);
      const newWindow = window.open('', '_blank');
      const res = await api.getTelegramLink();
      if (res.data?.status && res.data?.link) {
        if (newWindow) {
          newWindow.location.href = res.data.link;
        } else {
          window.location.href = res.data.link;
        }
        setTelegramLinked(true);
        toast.success('Opening Telegram bot for linking...');
      } else {
        if (newWindow) newWindow.close();
        toast.error('Failed to generate Telegram link');
      }
    } catch (error) {
      toast.error('Failed to open Telegram linking');
    } finally {
      setTelegramLinking(false);
    }
  };

  if (!hasHydrated || registerMutation.isPending || isRedirecting) {
    return <Loading text={isRedirecting ? 'Redirecting...' : !hasHydrated ? 'Loading...' : 'Creating account...'} />;
  }

  const registered = isAuthenticated;

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
              Create account directly in-app, then optionally link Telegram in one tap.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 pt-4">
            {[
              { icon: User, label: "App Signup" },
              { icon: ShieldCheck, label: "Verified" },
              { icon: Zap, label: "Fast" },
              { icon: MessageSquare, label: "Telegram Optional" }
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
              Create <br />
              <span className="text-primary tracking-normal">Account.</span>
            </h2>
            <p className="text-muted-foreground/60 font-bold text-sm uppercase tracking-widest italic">
              Register in app. Link Telegram anytime.
            </p>
          </div>

          {/* Register Form */}
          {!registered ? (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-6">
                <div className="space-y-3 group/field">
                  <Label htmlFor="usernm" className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50 group-focus-within/field:text-primary transition-colors px-1">
                    Username
                  </Label>
                  <div className="relative">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-focus-within/field:text-primary transition-colors">
                      <User className="h-5 w-5" />
                    </div>
                    <Input
                      id="usernm"
                      name="usernm"
                      placeholder="USERNAME"
                      value={formData.usernm}
                      onChange={handleChange}
                      className="h-14 pl-10 bg-transparent border-0 border-b-2 border-border/20 rounded-none focus-visible:ring-0 focus:border-primary transition-all font-black tracking-tighter text-xl placeholder:text-muted-foreground/20 placeholder:italic"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3 group/field">
                  <Label htmlFor="passwd" className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50 group-focus-within/field:text-primary transition-colors px-1">
                    Password
                  </Label>
                  <div className="relative">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-focus-within/field:text-primary transition-colors">
                      <Lock className="h-5 w-5" />
                    </div>
                    <Input
                      id="passwd"
                      name="passwd"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.passwd}
                      onChange={handleChange}
                      className="h-14 pl-10 pr-12 bg-transparent border-0 border-b-2 border-border/20 rounded-none focus-visible:ring-0 focus:border-primary transition-all font-black tracking-tighter text-xl placeholder:text-muted-foreground/20"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 p-2 hover:text-primary transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-muted-foreground/40" />
                      ) : (
                        <Eye className="h-5 w-5 text-muted-foreground/40" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-3 group/field">
                  <Label htmlFor="confirmPasswd" className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50 group-focus-within/field:text-primary transition-colors px-1">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-focus-within/field:text-primary transition-colors">
                      <Lock className="h-5 w-5" />
                    </div>
                    <Input
                      id="confirmPasswd"
                      name="confirmPasswd"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.confirmPasswd}
                      onChange={handleChange}
                      className="h-14 pl-10 bg-transparent border-0 border-b-2 border-border/20 rounded-none focus-visible:ring-0 focus:border-primary transition-all font-black tracking-tighter text-xl placeholder:text-muted-foreground/20"
                      required
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-16 rounded-[2rem] text-sm font-black uppercase tracking-[0.3em] shadow-2xl shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-1 active:translate-y-0.5 transition-all group overflow-hidden relative"
              >
                <span className="relative z-10 flex items-center justify-center gap-3">
                  Create Account
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform" />
                </span>
              </Button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10">
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> Account created successfully.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Telegram linking is optional. You can do it now or later in group settings.
                </p>
              </div>

              <Button
                onClick={handleLinkTelegram}
                disabled={telegramLinking}
                className="w-full h-14 bg-[#0088cc] hover:bg-[#0077b5] text-white rounded-2xl font-bold"
              >
                <Link2 className="mr-2 h-4 w-4" />
                {telegramLinking ? 'Opening Telegram...' : telegramLinked ? 'Open Telegram Again' : 'Link Telegram (Optional)'}
              </Button>

              <Button
                variant="outline"
                className="w-full h-14 rounded-2xl"
                onClick={() => {
                  setIsRedirecting(true);
                  router.replace('/home');
                }}
              >
                Continue to App
              </Button>
            </div>
          )}

          {/* Footer Info */}
          <div className="pt-8 space-y-8">
            <div className="p-6 rounded-3xl bg-secondary/20 border border-primary/10 flex items-start gap-4">
              <Lock className="h-5 w-5 text-primary mt-1 shrink-0" />
              <p className="text-xs text-muted-foreground/80 leading-relaxed font-medium italic">
                Secure registration starts in-app. Telegram link is one-tap and optional.
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
