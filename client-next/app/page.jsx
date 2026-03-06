'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { SpaceSky } from '@/components/SpaceSky';
import { useAuthStore } from '@/store/authStore';
import { Loading } from '@/components/Loading';
import { ArrowRight, Share2, Calculator, MessageSquare, Zap, Shield, Sparkles, TrendingUp, ChevronRight } from 'lucide-react';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const item = {
  hidden: { opacity: 0, scale: 0.8, y: 30 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 400, damping: 20 } },
};

export default function WelcomePage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);

  // Redirect to home if already logged in
  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      router.replace('/home');
    }
  }, [hasHydrated, isAuthenticated, router]);

  // Show loading while checking auth state
  if (!hasHydrated) {
    return <Loading text="Loading..." />;
  }

  // If authenticated, router will redirect, so show loading
  if (isAuthenticated) {
    return <Loading text="Redirecting..." />;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* Animated background */}
      <SpaceSky />

      {/* High-Intensity Glow Effects */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-[#f78fa7]/10 blur-[150px] rounded-full pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-[#ff0080]/10 blur-[150px] rounded-full pointer-events-none animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 py-20 lg:py-32">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "circOut" }}
          className="text-center max-w-6xl mx-auto mb-32"
        >
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 500, delay: 0.5 }}
            className="inline-flex items-center gap-3 px-5 py-2 rounded-2xl bg-primary/10 border-2 border-primary/20 text-xs font-black text-primary mb-10 backdrop-blur-2xl uppercase tracking-[0.3em] italic"
          >
            <Sparkles className="h-4 w-4" />
            <span>Vibe-Verified Finance</span>
          </motion.div>

          <h1 className="text-7xl md:text-[10rem] font-black mb-10 tracking-tighter leading-[0.8] uppercase italic">
            <span className="text-foreground">TRACK.</span><br />
            <span className="text-primary animate-pulse font-[900]">SLAY DEBTS.</span>
          </h1>

          <p className="text-2xl md:text-3xl text-muted-foreground mb-14 max-w-3xl mx-auto leading-none font-black uppercase italic tracking-tighter">
            TinyNotie is the ultimate AI-powered squad manager.
            Stop stressing, start splitting.
          </p>

          <div className="flex gap-8 justify-center flex-wrap">
            <Button asChild size="xl" className="h-20 px-14 text-2xl rounded-[2rem] bg-primary text-primary-foreground hover:scale-105 active:scale-95 transition-all font-black uppercase italic border-none shadow-[0_0_40px_rgba(var(--primary),0.4)] group">
              <Link href="/login" className="flex items-center">
                ENTER APP
                <ArrowRight className="ml-3 h-8 w-8 group-hover:translate-x-2 transition-transform" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="xl" className="h-20 px-14 text-2xl rounded-[2rem] glass-button text-foreground border-border hover:bg-muted active:scale-95 transition-all font-black uppercase italic">
              <Link href="/register">
                JOIN SQUAD
              </Link>
            </Button>
          </div>
        </motion.div>

        {/* GenZ Bento Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-12 gap-8 max-w-7xl mx-auto"
        >
          {/* Card 1: Hyper Splitting */}
          <motion.div variants={item} className="md:col-span-8 glass-card p-12 flex flex-col justify-between group h-[400px]">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-8 border-2 border-primary/30 group-hover:rotate-12 transition-transform shadow-[0_0_30px_rgba(var(--primary),0.2)]">
              <Share2 className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h3 className="text-4xl font-black text-foreground mb-4 uppercase italic tracking-tighter">Instant Squad Sync</h3>
              <p className="text-muted-foreground text-xl font-bold leading-tight max-w-lg">
                Connect your team & kill the math. We handle the split so you can enjoy the moment.
              </p>
            </div>
          </motion.div>

          {/* Card 2: AI Mojo */}
          <motion.div variants={item} className="md:col-span-4 glass-card p-12 flex flex-col justify-center items-center group bg-gradient-to-br from-[#8000ff]/20 to-transparent h-[400px] text-center">
            <div className="w-24 h-24 rounded-[2.5rem] bg-indigo-500/20 flex items-center justify-center mb-10 border-2 border-indigo-500/50 group-hover:scale-110 transition-transform shadow-[0_0_40px_rgba(99,102,241,0.3)]">
              <MessageSquare className="h-12 w-12 text-indigo-500" />
            </div>
            <h3 className="text-3xl font-black text-foreground mb-4 uppercase italic tracking-tighter">AI AGENT</h3>
            <p className="text-muted-foreground font-bold uppercase text-xs tracking-widest leading-relaxed">
              Simply ask: "Who's winning?" or "What's my status?" No caps required.
            </p>
          </motion.div>

          {/* Card 3: Mini Feature */}
          <motion.div variants={item} className="md:col-span-4 glass-card p-10 group hover:bg-[#ffff00]/5 transition-colors">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center mb-6 border border-amber-500/30 group-hover:-rotate-12 transition-transform">
              <Calculator className="h-8 w-8 text-amber-500" />
            </div>
            <h4 className="text-2xl font-black text-foreground mb-2 uppercase italic tracking-tighter">SMART MATH</h4>
            <p className="text-muted-foreground text-sm font-bold uppercase tracking-tight">
              Automatic FX & simplified transfers. No confusion ever.
            </p>
          </motion.div>

          {/* Card 4: Mini Feature */}
          <motion.div variants={item} className="md:col-span-4 glass-card p-10 group hover:bg-[#00ffff]/5 transition-colors">
            <div className="w-16 h-16 rounded-2xl bg-sky-500/20 flex items-center justify-center mb-6 border border-sky-500/30 group-hover:scale-90 transition-transform">
              <Zap className="h-8 w-8 text-sky-500" />
            </div>
            <h4 className="text-2xl font-black text-foreground mb-2 uppercase italic tracking-tighter">ULTRA SYNC</h4>
            <p className="text-muted-foreground text-sm font-bold uppercase tracking-tight">
              Updates everywhere, instantly. Faster than a DM.
            </p>
          </motion.div>

          {/* Card 5: Mini Feature */}
          <motion.div variants={item} className="md:col-span-4 glass-card p-10 group hover:bg-[#f78fa7]/5 transition-colors">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-6 border border-primary/30 group-hover:translate-x-2 transition-transform">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h4 className="text-2xl font-black text-foreground mb-2 uppercase italic tracking-tighter">VAULT SECURITY</h4>
            <p className="text-muted-foreground text-sm font-bold uppercase tracking-tight">
              End-to-end encrypted. Your data stays within the team.
            </p>
          </motion.div>
        </motion.div>

        {/* Final CTA: Extreme */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mt-40 max-w-5xl mx-auto"
        >
          <div className="glass-card p-20 overflow-hidden relative group text-center border-border/20">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-blue-500/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            <h2 className="text-6xl md:text-8xl font-black text-foreground mb-10 relative z-10 tracking-tighter uppercase italic leading-[0.8]">
              QUIT STRESSING.<br />START SPLITTING.
            </h2>
            <p className="text-muted-foreground text-2xl font-black uppercase italic mb-14 relative z-10 tracking-tighter">
              Join the future of team vibes and finances.
            </p>
            <Button asChild size="xl" className="h-24 px-16 text-3xl rounded-[2.5rem] bg-foreground text-background hover:scale-105 active:scale-95 border-none relative z-10 shadow-[0_0_50px_rgba(var(--foreground),0.2)] font-black uppercase italic">
              <Link href="/register" className="flex items-center gap-4">
                GET THE BAG <ChevronRight className="h-10 w-10" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Footer Edge */}
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-[#f78fa7]/50 to-transparent blur-sm" />
    </main>
  );
}
