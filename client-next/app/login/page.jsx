'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Eye, EyeOff, LogIn, User, UserPlus, Zap, ArrowRight, Wallet, TrendingUp, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { api } from '@/api/apiClient';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SpaceSky } from '@/components/SpaceSky';
import { Loading } from '@/components/Loading';

export default function LoginPage() {
  return (
    <Suspense fallback={<Loading />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/home';
  const setAuth = useAuthStore((state) => state.setAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const [showPassword, setShowPassword] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [formData, setFormData] = useState({
    usernm: '',
    passwd: '',
  });

  // Redirect if already logged in
  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [hasHydrated, isAuthenticated, router, redirectTo]);

  const loginMutation = useMutation({
    mutationFn: (credentials) => api.login(credentials),
    onSuccess: (response) => {
      const { status, token, usernm, _id } = response.data;
      if (status) {
        setAuth(token, { usernm, _id });
        setIsRedirecting(true);
        toast.success('Welcome back!');
        router.replace(redirectTo);
      } else {
        toast.error('Login failed');
      }
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.usernm || !formData.passwd) {
      toast.error('Please fill in all fields');
      return;
    }
    loginMutation.mutate(formData);
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  if (!hasHydrated || loginMutation.isPending || isRedirecting) {
    return <Loading text={isRedirecting ? 'Redirecting...' : !hasHydrated ? 'Loading...' : 'Logging in...'} />;
  }

  return (
    <main className="relative min-h-screen flex flex-col md:flex-row overflow-hidden bg-background">
      <SpaceSky />

      {/* Visual / Brand Side */}
      <div className="relative flex-[1.2] hidden md:flex flex-col justify-center px-12 lg:px-24 overflow-hidden border-r border-border/10">
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-background to-purple-600/5 -z-10" />

        {/* Animated Orbs */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] -z-10"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.05, 0.1, 0.05] }}
          transition={{ duration: 15, repeat: Infinity, delay: 2 }}
          className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[100px] -z-10"
        />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-10 z-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-foreground/5 border border-foreground/10 text-foreground text-[10px] font-black uppercase tracking-[0.3em] backdrop-blur-md">
            <Zap className="h-3 w-3 text-primary animate-pulse" /> The Vault is Waiting
          </div>

          <div className="space-y-6">
            <h1 className="text-6xl lg:text-8xl font-black tracking-tighter leading-[0.85] uppercase italic text-foreground">
              Master <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-primary bg-[length:200%_auto] animate-gradient">Your Cash</span>
            </h1>
            <p className="text-xl text-muted-foreground/60 font-medium leading-relaxed max-w-md italic border-l-2 border-primary/20 pl-6">
              The elite way to track group spending, manage vaults, and conquer expenses with the squad.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 pt-4">
            {[
              { icon: Wallet, label: "Vaults" },
              { icon: TrendingUp, label: "Growth" },
              { icon: ShieldCheck, label: "Safety" },
              { icon: UserPlus, label: "Squads" }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + (i * 0.1) }}
                className="flex items-center gap-3 px-6 py-4 rounded-3xl bg-foreground/[0.03] border border-foreground/5 backdrop-blur-xl hover:bg-foreground/[0.05] hover:border-primary/20 transition-all cursor-default group"
              >
                <item.icon className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">{item.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Form Side */}
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
            <div className="h-1 w-12 bg-primary rounded-full mb-8" />
            <h2 className="text-5xl font-black tracking-tighter uppercase italic text-foreground leading-none">
              Welcome <br />
              <span className="text-primary tracking-normal">Back.</span>
            </h2>
            <p className="text-muted-foreground/60 font-bold text-sm uppercase tracking-widest italic">
              Access the command center.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              <div className="space-y-3 group/field">
                <Label htmlFor="usernm" className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50 group-focus-within/field:text-primary transition-colors px-1">
                  Agent Username
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
                  Security Code
                </Label>
                <div className="relative">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-focus-within/field:text-primary transition-colors">
                    <LogIn className="h-5 w-5" />
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
            </div>

            <Button
              type="submit"
              className="w-full h-16 rounded-[2rem] text-sm font-black uppercase tracking-[0.3em] shadow-2xl shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-1 active:translate-y-0.5 transition-all group overflow-hidden relative"
            >
              <span className="relative z-10 flex items-center justify-center gap-3">
                Authorize Access
                <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform" />
              </span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
            </Button>
          </form>

          {/* Social / Switch */}
          <div className="pt-8 space-y-8">
            <div className="relative pt-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/10" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-[0.4em] font-black italic">
                <span className="bg-background px-6 text-muted-foreground/40">New Recruits</span>
              </div>
            </div>

            <Link href="/register" className="block">
              <Button
                variant="outline"
                className="w-full h-16 border-2 border-border/20 bg-transparent rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] transition-all hover:bg-primary/5 hover:border-primary/40 hover:text-primary"
              >
                Request Credentials
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

function Label({ children, className, ...props }) {
  return (
    <label className={`text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground group-focus-within:text-primary transition-colors px-1 ${className}`} {...props}>
      {children}
    </label>
  );
}
