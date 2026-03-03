'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { SpaceSky } from '@/components/SpaceSky';
import { ArrowRight, Share2, Calculator, MessageSquare, Zap, Shield, Sparkles } from 'lucide-react';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

export default function WelcomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020205]">
      {/* Animated background */}
      <SpaceSky />

      {/* Glow Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 py-20 lg:py-32">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center max-w-5xl mx-auto mb-24"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-purple-300 mb-8 backdrop-blur-md"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Next-Gen Expense Management</span>
          </motion.div>

          <h1 className="text-6xl md:text-8xl font-black mb-8 tracking-tighter leading-none">
            <span className="text-white">Track. Split.</span><br />
            <span className="text-gradient-vibrant animate-gradient">Simplify Everything.</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
            TinyNotie is the ultimate AI-powered companion for group finances.
            No more manual spreadsheets, just smart tracking.
          </p>

          <div className="flex gap-6 justify-center flex-wrap">
            <Button asChild size="xl" className="h-16 px-10 text-lg rounded-2xl bg-white text-black hover:bg-white/90 group border-none shadow-[0_0_20px_rgba(255,255,255,0.3)]">
              <Link href="/login" className="flex items-center">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="xl" className="h-16 px-10 text-lg rounded-2xl glass-button text-white border-white/10">
              <Link href="/register">
                Join Now
              </Link>
            </Button>
          </div>
        </motion.div>

        {/* Bento Grid Features */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-6 gap-6 max-w-7xl mx-auto"
        >
          {/* Feature 1: Large */}
          <motion.div variants={item} className="md:col-span-3 glass-card p-10 flex flex-col justify-between group">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-8 border border-blue-500/30 group-hover:scale-110 transition-transform">
              <Share2 className="h-7 w-7 text-blue-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-3">Instant Bill Splitting</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Connect your group and split expenses instantly. We handle the math so you can focus on the trip.
              </p>
            </div>
          </motion.div>

          {/* Feature 2: Small */}
          <motion.div variants={item} className="md:col-span-3 glass-card p-10 flex flex-col justify-between group bg-gradient-to-br from-purple-500/5 to-transparent">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-8 border border-purple-500/30 group-hover:scale-110 transition-transform">
              <MessageSquare className="h-7 w-7 text-purple-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-3">AI Personal Assistant</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Just ask! "How much did we spend on coffee?" or "What's my balance?" in plain language.
              </p>
            </div>
          </motion.div>

          {/* Feature 3: Small */}
          <motion.div variants={item} className="md:col-span-2 glass-card p-8 group">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center mb-6 border border-amber-500/30 group-hover:rotate-12 transition-transform">
              <Calculator className="h-6 w-6 text-amber-400" />
            </div>
            <h4 className="text-xl font-bold text-white mb-2">Smart Math</h4>
            <p className="text-muted-foreground text-sm">
              Automatic currency conversions and debt simplification.
            </p>
          </motion.div>

          {/* Feature 4: Small */}
          <motion.div variants={item} className="md:col-span-2 glass-card p-8 group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-6 border border-emerald-500/30 group-hover:rotate-12 transition-transform">
              <Zap className="h-6 w-6 text-emerald-400" />
            </div>
            <h4 className="text-xl font-bold text-white mb-2">Real-time Sync</h4>
            <p className="text-muted-foreground text-sm">
              Updates across all devices instantly. Never miss a transaction.
            </p>
          </motion.div>

          {/* Feature 5: Small */}
          <motion.div variants={item} className="md:col-span-2 glass-card p-8 group">
            <div className="w-12 h-12 rounded-xl bg-sky-500/20 flex items-center justify-center mb-6 border border-sky-500/30 group-hover:rotate-12 transition-transform">
              <Shield className="h-6 w-6 text-sky-400" />
            </div>
            <h4 className="text-xl font-bold text-white mb-2">Private & Secure</h4>
            <p className="text-muted-foreground text-sm">
              Your financial data is encrypted and visible only to your group.
            </p>
          </motion.div>
        </motion.div>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mt-32 max-w-3xl mx-auto"
        >
          <div className="glass-card p-16 overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 relative z-10">Stop stressing over bills.</h2>
            <p className="text-muted-foreground text-lg mb-10 relative z-10">
              Join thousands of users who split expenses the smart way.
            </p>
            <Button asChild size="xl" className="h-16 px-12 text-lg rounded-2xl bg-white text-black hover:bg-white/90 border-none relative z-10 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
              <Link href="/register">Start Now — It's Free</Link>
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Footer Decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </main>
  );
}
